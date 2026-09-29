import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();

// Use the port provided by Disco/environment, or fallback to 3002 for local dev
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
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