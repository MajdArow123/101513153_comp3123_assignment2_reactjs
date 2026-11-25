// Builds the full URL of an employee's profile picture.
// The backend stores a relative path like "/uploads/<uuid>.png"; the image itself is
// served by the backend, so we put the backend origin in front of it.
import { API_URL } from '../api/axiosClient';

// Shown when an employee has no picture (or the picture can't be loaded).
export const PLACEHOLDER_AVATAR = '/placeholder-avatar.svg';

export function getImageUrl(profilePicture) {
  // Only accept the path format our backend creates, never an arbitrary URL.
  if (typeof profilePicture !== 'string' || !profilePicture.startsWith('/uploads/')) {
    return null;
  }
  return `${API_URL}${profilePicture}`;
}
