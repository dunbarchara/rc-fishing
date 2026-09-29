import { createContext } from 'react';
import type { Profile } from '../api/auth';

export interface AuthState {
  profile: Profile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthState>({ profile: null, loading: true });