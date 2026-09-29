import type { Profile } from '../api/profiles';

interface Props {
  profile: Profile;
  // The user's drawing (base64 data URL), shown as their avatar
  drawingSrc?: string | null;
}

export default function RCCard({ profile, drawingSrc }: Props) {
    // TODO !! /current and /profile/ return different objects (see .image and .image_path)
        console.log(profile);
  return (
    <div className="flex items-center gap-4 p-4 max-w-lg border-2 border-gray-800 rounded-lg bg-white shadow-sm">


      <div className="justify-items-start">
        <h3 className="text-lg font-bold">Recurser Card</h3>
        <p className="text-sm text-gray-600">Name: {profile.first_name} {profile.last_name}</p>
        {
        /* COMMENT OUT FOR NOW, API RERTURN WEIRDNESS
        <p className="text-sm text-gray-600">Pseudonym: {profile.pseudonym}</p>
        <p className="text-sm text-gray-600">Batch: {profile.batch ? profile.batch.name : 'undefined'}</p>
        */}
        {/* TODO: more RC-specific fields (batch, location, etc.) once the profile route returns them */}
      </div>
      {profile.image || profile.image_path ? (
        <img
          src={profile.image ?? profile.image_path}
          alt={`${profile.first_name}'s photo`}
          className="w-20 h-20 border rounded bg-white object-contain"
        />
      ) : (
        <div className="w-20 h-20 border rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          No photo
        </div>
      )}
      {drawingSrc ? (
        <img
          src={drawingSrc}
          alt={`${profile.first_name}'s drawing`}
          className="w-20 h-20 border rounded bg-white object-contain"
        />
      ) : (
        <div className="w-20 h-20 border rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          No drawing
        </div>
      )}
    </div>
  );
}
