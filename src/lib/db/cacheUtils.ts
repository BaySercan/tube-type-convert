import { ProcessedVideo } from './types';

/**
 * Check if cached data is stale (older than specified hours)
 * @param lastUpdated - Last updated timestamp
 * @param maxAgeHours - Maximum age in hours before considered stale (default: 24 hours)
 */
export function isCacheStale(lastUpdated: string | undefined, maxAgeHours: number = 24): boolean {
  if (!lastUpdated) return true;
  
  const lastUpdate = new Date(lastUpdated);
  const now = new Date();
  const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  
  return diffHours > maxAgeHours;
}

/**
 * Format cache age for display
 * @param lastUpdated - Last updated timestamp
 */
export function formatCacheAge(lastUpdated: string | undefined): string {
  if (!lastUpdated) return 'Unknown';
  
  const lastUpdate = new Date(lastUpdated);
  const now = new Date();
  const diffMs = now.getTime() - lastUpdate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  
  if (diffHours < 1) {
    const minutes = Math.floor(diffMs / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffDays);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Get cache status information
 * @param videoData - Processed video data
 */
export function getCacheStatus(videoData: ProcessedVideo | null): {
  isStale: boolean;
  age: string;
  hasInfo: boolean;
  hasTranscript: boolean;
} {
  if (!videoData) {
    return {
      isStale: true,
      age: 'No cache',
      hasInfo: false,
      hasTranscript: false
    };
  }
  
  return {
    isStale: isCacheStale(videoData.updated_at),
    age: formatCacheAge(videoData.updated_at),
    hasInfo: !!videoData.info_result,
    hasTranscript: !!videoData.transcript_result
  };
}
