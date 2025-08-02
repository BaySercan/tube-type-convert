import { supabase } from '../supabaseClient';
import { ProcessedVideo } from './types';

export class ProcessedVideosService {
  /**
   * Upsert a processed video record
   * If video exists, increment the appropriate request counter
   * If video doesn't exist, create new record
   */
  static async upsertVideo(videoData: Partial<ProcessedVideo>, requestType: 'info' | 'info_requests' | 'transcript' | 'transcript_requests' | 'mp3' | 'mp3_requests' | 'mp4' | 'mp4_requests'): Promise<{ data: ProcessedVideo | null; error: Error | null }> {
    try {
      console.log('💾 Upserting video data:', { videoData, requestType });
      
      // Validate video_id
      if (!videoData.video_id) {
        console.error('❌ Video ID is required');
        return { data: null, error: new Error('Video ID is required') };
      }

      // First, try to find existing video
      console.log('🔍 Checking if video exists:', videoData.video_id);
      const { data: existingVideo, error: fetchError } = await supabase
        .from('processed_videos')
        .select('*')
        .eq('video_id', videoData.video_id)
        .single();

      console.log('📊 Database check result:', { existingVideo, fetchError });

      if (fetchError) {
        // Check if it's a "not found" error (expected for new videos)
        const isNotFoundError = fetchError.code === 'PGRST116' || 
                               fetchError.message?.includes('PGRST116') || 
                               fetchError.message?.includes('not found') || 
                               fetchError.message?.includes('no rows');
        
        if (!isNotFoundError) {
          // This is an actual error
          console.error('❌ Error fetching video:', fetchError);
          return { data: null, error: fetchError };
        }
        console.log('🆕 Video not found, will create new record');
        // For "not found" errors, we'll create a new record
      }

      if (existingVideo) {
        console.log('🔄 Video exists, updating with request type:', requestType);
        // Video exists, increment the appropriate counter
        const updateData: Partial<ProcessedVideo> = {
          updated_at: new Date().toISOString(),
        };

        // Increment the appropriate counter based on request type
        switch (requestType) {
          case 'info':
          case 'info_requests':
            updateData.info_requests = (existingVideo.info_requests || 0) + 1;
            console.log('📈 Incrementing info_requests to:', updateData.info_requests);
            break;
          case 'transcript':
          case 'transcript_requests':
            updateData.transcript_requests = (existingVideo.transcript_requests || 0) + 1;
            console.log('📈 Incrementing transcript_requests to:', updateData.transcript_requests);
            break;
          case 'mp3':
          case 'mp3_requests':
            updateData.mp3_requests = (existingVideo.mp3_requests || 0) + 1;
            console.log('📈 Incrementing mp3_requests to:', updateData.mp3_requests);
            break;
          case 'mp4':
          case 'mp4_requests':
            updateData.mp4_requests = (existingVideo.mp4_requests || 0) + 1;
            console.log('📈 Incrementing mp4_requests to:', updateData.mp4_requests);
            break;
        }

        // Update other fields if provided
        if (videoData.info_result !== undefined) {
          updateData.info_result = videoData.info_result;
          console.log('💾 Updating info_result');
        }
        if (videoData.transcript_result !== undefined) {
          updateData.transcript_result = videoData.transcript_result;
          console.log('💾 Updating transcript_result');
        }
        if (videoData.title) {
          updateData.title = videoData.title;
          console.log('💾 Updating title:', videoData.title);
        }
        if (videoData.channel_id) {
          updateData.channel_id = videoData.channel_id;
          console.log('💾 Updating channel_id:', videoData.channel_id);
        }
        if (videoData.language) {
          updateData.language = videoData.language;
          console.log('💾 Updating language:', videoData.language);
        }
        if (videoData.duration) {
          updateData.duration = videoData.duration;
          console.log('💾 Updating duration:', videoData.duration);
        }
        if (videoData.thumbnail_url) {
          updateData.thumbnail_url = videoData.thumbnail_url;
          console.log('💾 Updating thumbnail_url:', videoData.thumbnail_url);
        }
        if (videoData.video_url) {
          updateData.video_url = videoData.video_url;
          console.log('💾 Updating video_url:', videoData.video_url);
        }

        console.log('📤 Updating video with data:', updateData);
        const { data: updatedVideo, error: updateError } = await supabase
          .from('processed_videos')
          .update(updateData)
          .eq('video_id', videoData.video_id)
          .select()
          .single();

        console.log('📊 Update result:', { updatedVideo, updateError });

        if (updateError) {
          console.error('❌ Error updating video:', updateError);
          return { data: null, error: updateError };
        }

        console.log('✅ Video updated successfully');
        return { data: updatedVideo, error: null };
      } else {
        console.log('🆕 Video does not exist, creating new record');
        // Video doesn't exist, create new record
        const newVideoData: Partial<ProcessedVideo> = {
          ...videoData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Initialize counters based on request type
        newVideoData.info_requests = requestType === 'info' || requestType === 'info_requests' ? 1 : 0;
        newVideoData.transcript_requests = requestType === 'transcript' || requestType === 'transcript_requests' ? 1 : 0;
        newVideoData.mp3_requests = requestType === 'mp3' || requestType === 'mp3_requests' ? 1 : 0;
        newVideoData.mp4_requests = requestType === 'mp4' || requestType === 'mp4_requests' ? 1 : 0;

        console.log('📤 Inserting new video with data:', newVideoData);
        const { data: newVideo, error: insertError } = await supabase
          .from('processed_videos')
          .insert(newVideoData)
          .select()
          .single();

        console.log('📊 Insert result:', { newVideo, insertError });

        if (insertError) {
          console.error('❌ Error inserting video:', insertError);
          return { data: null, error: insertError };
        }

        console.log('✅ New video created successfully');
        return { data: newVideo, error: null };
      }
    } catch (error) {
      console.error('Unexpected error in upsertVideo:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a processed video by video_id
   */
  static async getVideoByVideoId(videoId: string): Promise<{ data: ProcessedVideo | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('processed_videos')
        .select('*')
        .eq('video_id', videoId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update video with info result
   */
  static async updateWithInfoResult(videoId: string, infoResult: Record<string, unknown>): Promise<{ data: ProcessedVideo | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('processed_videos')
        .update({
          info_result: infoResult,
          updated_at: new Date().toISOString()
        })
        .eq('video_id', videoId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update video with transcript result
   */
  static async updateWithTranscriptResult(videoId: string, transcriptResult: Record<string, unknown>): Promise<{ data: ProcessedVideo | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('processed_videos')
        .update({
          transcript_result: transcriptResult,
          updated_at: new Date().toISOString()
        })
        .eq('video_id', videoId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}
