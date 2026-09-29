import { api } from "./client";

export interface Profile { id?: number; email?: string; first_name: string; last_name: string }
export const getMe = () =>
  api<{ authenticated: boolean; profile?: Profile }>('/api/auth/me');