import { api } from "./client";
import { type Profile } from "./profiles";

export const getMe = () =>
  api<{ authenticated: boolean; profile?: Profile }>('/api/auth/me');