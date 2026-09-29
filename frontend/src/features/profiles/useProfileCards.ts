import { useState } from 'react';
import { getCurrentProfiles, getProfile } from '../../api/profiles';
import type { Profile } from '../../api/profiles';
import { getDrawing } from '../../api/drawings';

interface CardData {
  profile: Profile;
  drawing: string | null;
}

// Loads the profile + drawing for the first `limit` current recursers on demand
// by calling `load()` (e.g. from a button now, or a game win later)
export function useProfileCards(limit = 5) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      const { profiles } = await getCurrentProfiles();
      const results = await Promise.all(
        profiles.slice(0, limit).map(async ({ id }) => {
          const [p, drawing] = await Promise.all([
            getProfile(String(id)),
            getDrawing(String(id)),
          ]);
          return p ? { profile: p, drawing } : null;
        })
      );
      setCards(results.filter((c): c is CardData => c !== null));
    } catch (err) {
      console.error('Failed to load profile cards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { cards, isLoading, load };
}
