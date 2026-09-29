import { api, ApiError } from './client';

interface DrawingResponse {
  success: boolean;
  imageData: string;
}

export async function getDrawing(userId: string): Promise<string | null> {
  try {
    const data = await api<DrawingResponse>(`/api/drawings/${encodeURIComponent(userId)}`);
    return data.imageData;
  } catch (err) {
    // 404 just means "no drawing yet"
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function saveDrawing(userId: string, imageData: string): Promise<void> {
  await api<{ success: boolean }>('/api/drawings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, imageData }),
  });
}