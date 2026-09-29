import { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState<string>('Connecting to backend...');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
  // Uses Vite's local proxy to avoid CORS completely
  fetch('/api/health')
    .then((res) => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then((data) => {
      setStatus(data.message);
    })
    .catch((err) => {
      console.error('Fetch error:', err);
      setStatus('Failed to connect to backend!');
      setError(true);
    });
}, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white font-sans p-4">
      <h1 className="text-4xl font-bold mb-4">Recurser Fishing Game</h1>
      
      <div className={`px-6 py-4 rounded-lg border ${error ? 'bg-red-900/50 border-red-500' : 'bg-emerald-900/50 border-emerald-500'}`}>
        <p className="text-sm uppercase tracking-wide opacity-75">Backend Connection Status</p>
        <p className="text-xl font-semibold mt-1">{status}</p>
      </div>
    </div>
  );
}