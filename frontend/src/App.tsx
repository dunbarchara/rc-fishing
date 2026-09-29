import { useEffect, useState } from 'react';

export default function App() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch profile on load
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setProfile(data.profile);
        }
      })
      .catch((err) => console.error('Failed to load profile:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">RC Fishing Game - Auth Proof Concept</h1>

      {!profile ? (
        <a
          href="/api/auth/login"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          Login with Recurse Center
        </a>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-green-700 mb-2">
            ✅ Authenticated as: {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-sm text-gray-600 mb-2">Raw API Response (`/api/v1/people/me`):</p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs font-mono">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}