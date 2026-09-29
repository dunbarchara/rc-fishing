import { useEffect, useState, useRef } from 'react';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import type { ReactSketchCanvasRef } from 'react-sketch-canvas';
import Fishing from './game/Fishing';
import { useAuth } from './auth/useAuth';
import { getDrawing, saveDrawing } from './api/drawings';

export default function App() {
  const { profile, loading } = useAuth();

  // State for storing and showing the fetched drawing string
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reference to interact with the canvas
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

  // Extract a unique identifier for the user profile
  const userId = profile ? String(profile.id ?? profile.email) : null;

  // Load the existing drawing once we know who the user is
  useEffect(() => {
    if (!userId) return;
    getDrawing(userId)
      .then(setSavedImage)
      .catch((err) => console.error('Failed to fetch existing drawing:', err));
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;

    try {
      setIsSaving(true);

      // Export drawing from canvas as Base64 string
      const imageData = await canvasRef.current?.exportImage('png');
      if (!imageData) return;

      await saveDrawing(userId, imageData);
      setSavedImage(imageData);
    } catch (err) {
      console.error('Error saving drawing:', err);
    } finally {
      setIsSaving(false);
    }
  };

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
            <h2 className="text-xl font-bold mb-2">Draw Something</h2>

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

            {/* Controls */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => canvasRef.current?.clearCanvas()}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              >
                Clear
              </button>
              <button 
                onClick={() => canvasRef.current?.undo()}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              >
                Undo
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1 rounded transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save & Fetch Drawing'}
              </button>
            </div>
          </div>

          {/* Display fetched image preview if it exists in SQLite */}
          {savedImage && (
            <div className="my-6 p-4 border rounded bg-gray-50 text-center">
              <h3 className="font-semibold text-gray-800 mb-2">
                Saved Drawing (Fetched from SQLite Backend):
              </h3>
              <img 
                src={savedImage} 
                alt="Saved user drawing" 
                className="w-48 h-48 mx-auto border rounded bg-white shadow-sm object-contain"
              />
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-green-700 mb-2">
              ✅ Authenticated as: {profile.first_name} {profile.last_name}
            </h2>
            <Fishing />
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