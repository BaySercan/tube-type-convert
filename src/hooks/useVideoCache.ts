import { useState, useEffect } from 'react';
import { ProcessedVideosService, UserVideoRequestsService, ProcessedVideo, isCacheStale } from '@/lib/db';
import { extractVideoId } from '@/lib/db/utils';
import { useAuth } from '@/contexts/AuthContext';

interface VideoCacheResult {
  videoData: ProcessedVideo | null;
  userHasRequested: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshVideoData: () => Promise<void>;
  trackUserRequest: () => Promise<void>;
  updateVideoWithRequest: (updateData: Partial<ProcessedVideo>) => Promise<void>;
}

/**
 * Hook to check video cache and manage user requests
 * @param videoUrl - YouTube video URL
 * @param requestType - Type of request (info, transcript, mp3, mp4)
 */
export const useVideoCache = (videoUrl: string, requestType: 'info' | 'transcript' | 'mp3' | 'mp4'): VideoCacheResult => {
  const { user } = useAuth();
  const [videoData, setVideoData] = useState<ProcessedVideo | null>(null);
  const [userHasRequested, setUserHasRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoId = extractVideoId(videoUrl);

  /**
   * Check cache and user request status
   */
  const checkCache = async () => {
    console.log('🔍 Checking cache for video:', { videoId, requestType, userId: user?.id });
    
    if (!videoId || !user?.id) {
      console.log('❌ No videoId or userId, setting null data');
      setVideoData(null);
      setUserHasRequested(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if video exists in cache
      console.log('🔄 Fetching video data from database...');
      const { data: cachedVideo, error: videoError } = await ProcessedVideosService.getVideoByVideoId(videoId);
      
      console.log('📊 Database response:', { cachedVideo, videoError });
      
      // If we have data, it means the video exists in cache
      if (cachedVideo) {
        console.log('✅ Found cached video data');
        setVideoData(cachedVideo);
      } else if (videoError) {
        // Check if it's a "not found" error (expected for first-time requests)
        const errorObj = videoError as Error & { code?: string };
        const isNotFoundError = errorObj.message && (
          errorObj.message.includes('PGRST116') || 
          errorObj.message.includes('not found') || 
          errorObj.message.includes('no rows') ||
          errorObj.message.includes('404') ||
          errorObj.code === 'PGRST116'
        );
        
        if (!isNotFoundError) {
          // This is an actual error that should be logged but not shown to user
          console.error('❌ Error checking video cache (actual error):', videoError);
        } else {
          console.log('🆕 Video not found in cache (first-time request)');
        }
        // For "not found" errors, we just continue with null data (first-time request)
        setVideoData(null);
      } else {
        // No data and no error means first-time request
        console.log('🆕 No cached data found (first-time request)');
        setVideoData(null);
      }

      // Check if user has already requested this video type
      console.log('👤 Checking if user has requested this video type...');
      const hasRequested = await UserVideoRequestsService.hasUserRequestedVideo(user.id, videoId, requestType);
      console.log('📊 User request check result:', hasRequested);
      setUserHasRequested(hasRequested);
    } catch (err) {
      // Don't show cache errors for first-time requests - this is normal
      // Check if it's a "not found" error
      const errorObj = err as Error & { code?: string };
      const isNotFoundError = errorObj?.message && (
        errorObj.message.includes('not found') || 
        errorObj.message.includes('no rows') || 
        errorObj.message.includes('PGRST116') ||
        errorObj.message.includes('404') ||
        errorObj.code === 'PGRST116'
      );
      
      if (!isNotFoundError) {
        // This is an actual error that should be logged but not shown to user
        console.error('❌ Cache check error (actual error):', err);
      } else {
        console.log('🆕 Cache check: video not found (expected for new videos)');
      }
      setVideoData(null);
      setUserHasRequested(false);
    } finally {
      console.log('🏁 Cache check completed');
      setIsLoading(false);
    }
  };

  /**
   * Refresh video data from database
   */
  const refreshVideoData = async () => {
    if (!videoId) return;

    setIsRefreshing(true);
    setError(null);
    try {
      const { data: refreshedVideo, error: videoError } = await ProcessedVideosService.getVideoByVideoId(videoId);
      
      if (videoError) {
        console.error('Error refreshing video data:', videoError);
        setError('Failed to refresh video data');
        return;
      }

      setVideoData(refreshedVideo);
    } catch (err) {
      console.error('Error refreshing video data:', err);
      setError('Failed to refresh video data');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Track user request in database
   */
  const trackUserRequest = async () => {
    if (!videoId || !user?.id) return;

    try {
      const { error: requestError } = await UserVideoRequestsService.createUserRequest({
        video_id: videoId,
        user_id: user.id,
        request_type: requestType
      });

      if (requestError) {
        console.error('Error tracking user request:', requestError);
        // Don't throw error here as this is supplementary tracking
      }
    } catch (err) {
      console.error('Error tracking user request:', err);
      // Don't throw error here as this is supplementary tracking
    }
  };

  /**
   * Update video data and increment request counter
   */
  const updateVideoWithRequest = async (updateData: Partial<ProcessedVideo>) => {
    if (!videoId) return;

    try {
      const { data: updatedVideo, error: updateError } = await ProcessedVideosService.upsertVideo(
        { ...updateData, video_id: videoId },
        requestType
      );

      if (updateError) {
        console.error('Error updating video with request:', updateError);
        setError('Failed to update video data');
        return;
      }

      setVideoData(updatedVideo);
    } catch (err) {
      console.error('Error updating video with request:', err);
      setError('Failed to update video data');
    }
  };

  // Check cache when video URL or request type changes
  useEffect(() => {
    if (videoUrl && requestType) {
      checkCache();
    }
  }, [videoUrl, requestType, user?.id]);

  return {
    videoData,
    userHasRequested,
    isLoading,
    isRefreshing,
    error,
    refreshVideoData,
    trackUserRequest,
    updateVideoWithRequest
  };
};
