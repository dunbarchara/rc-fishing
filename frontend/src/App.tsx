import { useEffect, useState, useRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import type { ReactSketchCanvasRef } from 'react-sketch-canvas';

export default function App() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Create a reference to interact with the canvas (exporting, clearing, etc.)
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

  const handleExport = async () => {
    // Exports a Base64 PNG string you can send to your Express backend
    const exportData = await canvasRef.current?.exportImage('png');
    console.log(exportData); 
  };

  useEffect(() => {
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

      {/* Show a loading state while fetching */}
      {loading ? (
        <p className="text-gray-500">Checking auth status...</p>
      ) : !profile ? (
        <a
          href="/api/auth/login"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          Login with Recurse Center
        </a>
      ) : (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
            <h1>Draw Something</h1>

            {/* The wrapper enforces the square shape and disables native mobile scrolling */}
            <div style={{ 
                width: '100%', 
                maxWidth: '400px', 
                aspectRatio: '1 / 1', 
                touchAction: 'none' 
            }}>
                <ReactSketchCanvas
                ref={canvasRef}
                style={{ border: '2px solid #333', borderRadius: '8px' }}
                width="100%"
                height="100%"
                strokeWidth={4}
                strokeColor="#000000"
                canvasColor="#ffffff"
                />
            </div>

            {/* Basic controls */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={() => canvasRef.current?.clearCanvas()}>
                Clear
                </button>
                <button onClick={() => canvasRef.current?.undo()}>
                Undo
                </button>
                <button onClick={handleExport}>
                Log Image Data
                </button>
            </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-green-700 mb-2">
            ✅ Authenticated as: {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-sm text-gray-600 mb-2">Raw API Response (`/api/v1/people/me`):</p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs font-mono">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
        </>
      )}
    </div>
  );
}