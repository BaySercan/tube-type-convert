import { supabase } from '../supabaseClient';
import { UserVideoRequest } from './types';

export class UserVideoRequestsService {
  /**
   * Create a new user video request record
   * Returns success if record already exists (due to UNIQUE constraint)
   */
  static async createUserRequest(requestData: Omit<UserVideoRequest, 'id' | 'created_at'>): Promise<{ data: UserVideoRequest | null; error: Error | null }> {
    try {
      // Validate required fields
      if (!requestData.video_id || !requestData.user_id || !requestData.request_type) {
        return { data: null, error: new Error('video_id, user_id, and request_type are required') };
      }

      const { data, error } = await supabase
        .from('user_video_requests')
        .insert({
          ...requestData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      const errorObj = error as Error & { code?: string; message?: string };
      // Check if it's a duplicate key error (UNIQUE constraint violation)
      const isDuplicateError = errorObj?.code === '23505' || 
                              errorObj?.message?.includes('duplicate key') ||
                              errorObj?.message?.includes('UNIQUE constraint');
      
      if (isDuplicateError) {
        // Record already exists, which is fine - return success
        return { data: null, error: null };
      }
      
      console.error('Error creating user request:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if a user has already requested a specific video type
   */
  static async hasUserRequestedVideo(userId: string, videoId: string, requestType: 'info' | 'transcript' | 'mp3' | 'mp4'): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_video_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .eq('request_type', requestType)
        .limit(1);

      if (error) {
        console.error('Error checking user request:', error);
        return false;
      }

      return data.length > 0;
    } catch (error) {
      console.error('Error checking user request:', error);
      return false;
    }
  }

  /**
   * Get all requests for a specific user
   */
  static async getUserRequests(userId: string): Promise<{ data: UserVideoRequest[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_video_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get all requests for a specific video
   */
  static async getVideoRequests(videoId: string): Promise<{ data: UserVideoRequest[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('user_video_requests')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get request statistics for a video
   */
  static async getVideoRequestStats(videoId: string): Promise<{ 
    totalRequests: number;
    uniqueUsers: number;
    requestTypes: Record<string, number>;
  } | null> {
    try {
      // Get total requests
      const { count: totalRequests, error: countError } = await supabase
        .from('user_video_requests')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

      if (countError) return null;

      // Get unique users
      const { count: uniqueUsers, error: userError } = await supabase
        .from('user_video_requests')
        .select('user_id', { count: 'exact', head: true })
        .eq('video_id', videoId)
        .neq('user_id', null);

      if (userError) return null;

      // Get request type distribution
      const { data: requestTypesData, error: typeError } = await supabase
        .from('user_video_requests')
        .select('request_type')
        .eq('video_id', videoId);

      if (typeError) return null;

      const requestTypes: Record<string, number> = {};
      requestTypesData.forEach(item => {
        requestTypes[item.request_type] = (requestTypes[item.request_type] || 0) + 1;
      });

      return {
        totalRequests: totalRequests || 0,
        uniqueUsers: uniqueUsers || 0,
        requestTypes
      };
    } catch (error) {
      console.error('Error getting video request stats:', error);
      return null;
    }
  }
}
