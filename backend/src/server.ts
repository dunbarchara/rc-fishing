import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

// Dynamically resolve .env path based on where the command is executed from
const envPath = fs.existsSync(path.resolve(process.cwd(), '.env')) 
  ? path.resolve(process.cwd(), '.env')       // Used in Docker / Root
  : path.resolve(process.cwd(), '../.env');   // Used in local Monorepo dev

dotenv.config({ path: envPath });

// Extend session type to hold RC access token
declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
  }
}

const app = express();

// Use the port provided by Disco/environment, or fallback to 3002 for local dev
const PORT = process.env.PORT || 3002;

// Trust the Disco reverse proxy so secure cookies aren't dropped
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize SQLite database (creates 'rcfishing.db' file in the same folder)
const db = new Database('rcfishing.db');

// Create the table. We use user_id as the Primary Key so each user has one drawing.
db.exec(`
  CREATE TABLE IF NOT EXISTS recurser_drawings (
    user_id TEXT PRIMARY KEY,
    image_data TEXT NOT NULL
  )
`);

// Initialize Session Middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'rc-fishing-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2 // 2 hours (matches RC Token expiration)
    }
  })
);

// ==========================================
// RC OAUTH API ROUTES
// ==========================================
const RC_CLIENT_ID = process.env.RC_CLIENT_ID || '';
const RC_CLIENT_SECRET = process.env.RC_CLIENT_SECRET || '';
const RC_REDIRECT_URI = process.env.RC_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

// 1. Redirect to RC Login
app.get('/api/auth/login', (req, res) => {
  const authUrl = new URL('https://www.recurse.com/oauth/authorize');
  authUrl.searchParams.append('client_id', RC_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', RC_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  res.redirect(authUrl.toString());
});

// 2. Handle RC Callback & Store Token
app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code as string;
  
  if (!code) {
    return res.status(400).send('No authorization code provided');
  }

  try {
    const tokenRes = await fetch('https://www.recurse.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: RC_CLIENT_ID,
        client_secret: RC_CLIENT_SECRET,
        redirect_uri: RC_REDIRECT_URI,
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    const data = await tokenRes.json();
    
    if (!tokenRes.ok) {
      console.error('OAuth Token Error:', data);
      return res.status(400).json(data);
    }

    // Save token in the user's session
    req.session.accessToken = data.access_token;

    // Redirect back to the frontend application
    res.redirect('/');
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).send('Authentication failed');
  }
});

// 3. Get Authenticated Profile
app.get('/api/auth/me', async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ authenticated: false, error: 'Not logged in' });
  }

  try {
    const profileRes = await fetch('https://www.recurse.com/api/v1/people/me', {
      headers: { Authorization: `Bearer ${req.session.accessToken}` },
    });

    if (!profileRes.ok) {
      return res.status(profileRes.status).json({ error: 'Failed to fetch profile' });
    }

    const profileData = await profileRes.json();
    res.json({ authenticated: true, profile: profileData });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current profiles (id, first_name, last_name)
app.get('/api/profiles/current', async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ authenticated: false, error: 'Not logged in' });
  }

  try {
    const limit = 50;
    let offset = 0;
    let hasMore = true;
    const profiles: Array<{ id: number; first_name: string; last_name: string }> = [];

    while (hasMore) {
      const response = await fetch(
        `https://www.recurse.com/api/v1/profiles?scope=current&limit=${limit}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${req.session.accessToken}` },
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch profiles' });
      }

      const pageData: Array<{ id: number; first_name: string; last_name: string }> = await response.json();

      // Extract only id, first_name, and last_name
      for (const person of pageData) {
        profiles.push({
          id: person.id,
          first_name: person.first_name,
          last_name: person.last_name,
        });
      }

      // Stop fetching if fewer results than the limit were returned
      if (pageData.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    res.json({ profiles });
  } catch (err) {
    console.error('Directory fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET: Specific user profile (must stay below /api/profiles/current, or ":userId" matches "current")
app.get('/api/profiles/:userId', async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ authenticated: false, error: 'Not logged in' });
  }

  const { userId } = req.params;

  try {
    const profileRes = await fetch(`https://www.recurse.com/api/v1/profiles/${userId}`, {
      headers: { Authorization: `Bearer ${req.session.accessToken}` },
    });

    if (!profileRes.ok) {
      return res.status(profileRes.status).json({ error: 'Failed to fetch profile' });
    }

    const profileData = await profileRes.json();
    res.json({ authenticated: true, profile: profileData });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ==========================================







// ==========================================
// RC DRAWINGS API ROUTES
// ==========================================

interface UserDrawingRow {
  user_id: string;
  image_data: string;
}

// POST: Save or update a user's drawing
app.post('/api/drawings', (req, res) => {
  const { userId, imageData } = req.body;

  if (!userId || !imageData) {
    return res.status(400).json({ error: 'Missing userId or imageData' });
  }

  try {
    // INSERT OR REPLACE acts as an upsert. 
    // If the userId exists, it overwrites their old drawing.
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO recurser_drawings (user_id, image_data) VALUES (?, ?)'
    );
    stmt.run(userId, imageData);
    
    res.json({ success: true, message: 'Drawing saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save drawing' });
  }
});

// GET: Fetch a user's drawing
app.get('/api/drawings/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const stmt = db.prepare('SELECT image_data FROM recurser_drawings WHERE user_id = ?');
    const row = stmt.get(userId) as UserDrawingRow | undefined;

    if (!row) {
      return res.status(404).json({ error: 'No drawing found for this user' });
    }

    res.json({ success: true, imageData: row.image_data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch drawing' });
  }
});








// Existing API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is hooked up!' });
});

// Production Static Serving
const frontendDistPath = path.join(process.cwd(), 'frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // Works across Express 4/5 & path-to-regexp 0.1/6/7/8/10
  app.get('/*path', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});