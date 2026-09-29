import { useState } from 'react';
import { getCurrentProfiles, getProfile } from '../../api/profiles';
import type { Profile } from '../../api/profiles';
import { getDrawing } from '../../api/drawings';

export interface CardData {
  profile: Profile;
  drawing: string | null;
}

// Loads the profile + drawing for one random current recurser on demand
// by calling `load()` (e.g. from a button now, or a game win later)
export function useProfileCards() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      const { profiles } = await getCurrentProfiles();
      if (profiles.length === 0) return setCards([]);
      const { id } = profiles[Math.floor(Math.random() * profiles.length)];
      const [profile, drawing] = await Promise.all([
        getProfile(String(id)),
        getDrawing(String(id)),
      ]);
      setCards(profile ? [{ profile, drawing }] : []);
    } catch (err) {
      console.error('Failed to load profile cards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { cards, isLoading, load };
}
