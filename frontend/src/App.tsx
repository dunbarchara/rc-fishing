import Fishing from './game/Fishing';
import { useAuth } from './auth/useAuth';
import DrawingCanvas from './features/drawing/DrawingCanvas';
import DrawingPreview from './features/drawing/DrawingPreview';
import { useDrawing } from './features/drawing/useDrawing';
import RCCard from './components/RCCard';
// import { useProfileCards } from './features/profiles/useProfileCards';

export default function App() {
  const { profile, loading } = useAuth();
  const { savedImage, isSaving, save } = useDrawing();
  // const { cards, isLoading: isLoadingCards, load: loadCards } = useProfileCards();

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans">

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
          <Fishing />
          <DrawingCanvas onSave={save} saving={isSaving} />

          {/* Display fetched image preview if it exists in SQLite */}
          {savedImage && <DrawingPreview src={savedImage} />}
          {savedImage && <RCCard profile={profile} drawingSrc={savedImage} />}
          {/* <button
            onClick={loadCards}
            disabled={isLoadingCards}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1 rounded transition disabled:opacity-50"
          >
            {isLoadingCards ? 'Loading...' : 'Load more'}
          </button>
          {cards.map((c) => (
            <RCCard key={c.profile.id} profile={c.profile} drawingSrc={c.drawing} />
          ))} */}

          {/* <div className="mt-8">
            <h2 className="text-lg font-semibold text-green-700 mb-2">
              ✅ Authenticated as: {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-sm text-gray-600 mb-2">Raw API Response (`/api/v1/people/me`):</p>
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs font-mono">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div> */}
        </>
      )}
    </div>
  );
}