import { api, ApiError } from './client';

export interface Profile {
    id?: number;
    email?: string;
    first_name: string;
    last_name: string;
    pseudonym: string;
    batch: Batch;
    has_photo?: boolean;
    image?: string;
    image_path?: string;
}

export interface Batch {
    id: number;
    name: string;
}

export const getCurrentProfiles = () =>
  api<{ profiles: { id: number; first_name: string; last_name: string }[] }>('/api/profiles/current');

export async function getProfile(userId: string): Promise<Profile | undefined> {
    try {
    const data = await api<{ authenticated: boolean; profile?: Profile }>(`/api/profiles/${encodeURIComponent(userId)}`);
    return data.profile;
  } catch (err) {
    // 404 just means "no drawing yet"
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}