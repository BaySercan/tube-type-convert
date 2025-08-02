export interface ProcessedVideo {
  id?: string;
  video_id: string;
  channel_id?: string;
  language?: string;
  title?: string;
  video_url: string;
  info_result?: Record<string, unknown> | null;
  transcript_result?: Record<string, unknown> | null;
  info_requests: number;
  transcript_requests: number;
  mp3_requests: number;
  mp4_requests: number;
  created_at?: string;
  updated_at?: string;
  duration?: string;
  thumbnail_url?: string;
}

export interface UserVideoRequest {
  id?: string;
  video_id: string;
  user_id?: string;
  request_type: 'info' | 'transcript' | 'mp3' | 'mp4';
  created_at?: string;
}

export interface VideoMetadata {
  videoId: string;
  channelId?: string;
  title?: string;
  duration?: number;
  thumbnailUrl?: string;
  language?: string;
  videoUrl: string;
}

export type RequestType = 'info' | 'transcript' | 'mp3' | 'mp4';

// Type for updating video with request data
export interface UpdateVideoData {
  video_id: string;
  channel_id?: string;
  language?: string;
  title?: string;
  video_url: string;
  info_result?: Record<string, unknown>;
  transcript_result?: Record<string, unknown>;
  [key: string]: unknown;
}
