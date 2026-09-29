import Fishing from './game/Fishing';
import { useAuth } from './auth/useAuth';
import DrawingCanvas from './features/drawing/DrawingCanvas';
import DrawingPreview from './features/drawing/DrawingPreview';
import { useDrawing } from './features/drawing/useDrawing';

export default function App() {
  const { profile, loading } = useAuth();
  const { savedImage, isSaving, save } = useDrawing();

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
          <DrawingCanvas onSave={save} saving={isSaving} />

          {/* Display fetched image preview if it exists in SQLite */}
          {savedImage && <DrawingPreview src={savedImage} />}

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