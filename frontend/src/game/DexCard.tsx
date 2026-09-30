import { useState } from 'react';
import type { Profile } from '../api/profiles';

export default function DexCard({ profile, drawingSrc }: { profile: Profile; drawingSrc?: string | null }) {
    const photo = profile.image ?? profile.image_path;
    const number = profile.id ? String(profile.id).padStart(3, '0') : '???';
    // read the date once
    const [caught] = useState(() => new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

    return (
        <div className="w-[14em] p-[0.3em] rounded-[0.5em] border-[0.2em] border-[#6e4a2f] bg-[#a8774f] font-pixel text-[#3b2a1c] shadow-xl">
            <div className="flex justify-between px-[0.1em] pb-[0.2em] text-[#fce1c0] text-[0.7em]">
                <span>No. {number}</span>
            </div>

            <div className="relative aspect-square rounded-[0.25em] border-[0.25em] border-[#6e4a2f] bg-[#3fa7b5]">
                {drawingSrc ? (
                    <img
                        src={drawingSrc}
                        alt={`${profile.first_name}'s drawing`}
                        className="w-full h-full object-contain"
                        // also pixelated?
                        style={{ imageRendering: 'pixelated' }}
                    />
                ) : (
                    <p className="h-full flex items-center justify-center text-[#fce1c0]">no drawing yet</p>
                )}
            </div>

            <div className="flex gap-[0.4em] mt-[0.5em] px-[0.3em] py-[0.3em] rounded-[0.25em] bg-[#f2d49b]">
                {photo && (
                    <img
                        src={photo}
                        alt={`${profile.first_name}'s photo`}
                        className="w-[3.5em] h-[3.5em] rounded-[0.25em] border-[0.12em] border-[#fce1c0] object-cover"
                    />
                )}
                <div className='flex flex-col justify-start content-end'>
                    <p className="text-[0.95em] text-left">
                        {profile.first_name} {profile.last_name}
                    </p>
                    <p className='text-[0.7em] text-left'>caught on {caught}</p>
                </div>

            </div>
        </div>
    );
}
