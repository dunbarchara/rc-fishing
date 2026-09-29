import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { getDrawing, saveDrawing } from '../../api/drawings';

export function useDrawing() {
  const { profile } = useAuth();

  // State for storing and showing the fetched drawing string
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Extract a unique identifier for the user profile
  const userId = profile ? String(profile.id ?? profile.email) : null;

  // Load the existing drawing once we know who the user is
  useEffect(() => {
    if (!userId) return;
    getDrawing(userId)
      .then(setSavedImage)
      .catch((err) => console.error('Failed to fetch existing drawing:', err));
  }, [userId]);

  const save = async (imageData: string) => {
    if (!userId) return;

    try {
      setIsSaving(true);
      await saveDrawing(userId, imageData);
      setSavedImage(imageData);
    } catch (err) {
      console.error('Error saving drawing:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return { savedImage, isSaving, save };
}
