import type { Profile } from '../api/profiles';

interface Props {
  profile: Profile;
  // The user's drawing (base64 data URL), shown as their avatar
  drawingSrc?: string | null;
  // bigger version
  large?: boolean;
}

export default function RCCard({ profile, drawingSrc, large = false }: Props) {
  // TODO !! /current and /profile/ return different objects (see .image and .image_path)
  console.log(profile);
  const box = large ? 'w-40 h-40' : 'w-20 h-20';
  return (
    <div
      className={`flex items-center gap-4 p-4 border-4 border-blue-400 bg-white shadow-sm ${large ? 'max-w-3xl' : 'max-w-lg'}`}
    >


      <div className="justify-items-start">
        <h3 className={`font-bold ${large ? 'text-3xl' : 'text-lg'}`}>{profile.first_name} {profile.last_name}</h3>
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
          className={`${box} border rounded bg-white object-contain`}
        />
      ) : (
        <div className={`${box} border rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs`}>
          No photo
        </div>
      )}
      {drawingSrc ? (
        <img
          src={drawingSrc}
          alt={`${profile.first_name}'s drawing`}
          className={`${box} border rounded bg-white object-contain`}
        />
      ) : (
        <div className={`${box} border rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs`}>
          No drawing
        </div>
      )}
    </div>
  );
}
