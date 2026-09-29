import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getMe } from '../api/auth';
import type { Profile } from '../api/auth';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((data) => {
        if (data.authenticated && data.profile) setProfile(data.profile);
      })
      .catch((err) => console.error('Failed to load profile:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}