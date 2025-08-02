import { VideoMetadata } from './types';

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract video metadata from YouTube URL
 */
export function extractVideoMetadata(url: string): VideoMetadata | null {
  const videoId = extractVideoId(url);
  if (!videoId) return null;

  return {
    videoId,
    videoUrl: url
  };
}

/**
 * Format duration from seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      (urlObj.hostname === 'youtu.be' && urlObj.pathname.length > 1) ||
      (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v'))
    );
  } catch (error) {
    return false;
  }
}

/**
 * Get current user ID from Supabase auth
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await (await import('../supabaseClient')).supabase.auth.getSession();
    return session?.user?.id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}
