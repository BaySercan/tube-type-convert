import { authenticatedFetch } from './apiClient';

const API_BASE_URL = 'http://localhost:3500'; // Or your production URL

// Types based on openapi.yaml - consider generating these for more complex APIs

interface VideoInfo {
  title: string;
  thumbnail: string;
  video_id: string;
  channel_id: string;
  channel_name: string;
  post_date: string;
}

interface TranscriptResponse {
  success: boolean;
  title: string;
  language: string;
  transcript: string;
  ai_notes: string;
  isProcessed: boolean;
  processor: string;
  video_id: string;
  channel_id: string;
  channel_name: string;
  post_date: string;
}

interface ProgressResponse {
  id: string;
  status: string;
  progress: number;
  video_id: string;
  video_title: string;
  createdAt: string; // date-time
  lastUpdated: string; // date-time
}

interface ResultResponse extends TranscriptResponse {
  // Assuming result is similar to transcript response for now
  // This might need adjustment based on actual API behavior for different job types
}

interface ErrorResponse {
  message: string;
  // Add other potential error fields
}

export const getVideoInfo = async (videoUrl: string): Promise<VideoInfo> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/info?url=${encodeURIComponent(videoUrl)}`);
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.json();
};

export const downloadMp3 = async (videoUrl: string): Promise<Blob> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/mp3?url=${encodeURIComponent(videoUrl)}`);
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  // For file downloads, the response body is the file itself (Blob)
  return response.blob();
};

export const downloadMp4 = async (videoUrl: string): Promise<Blob> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/mp4?url=${encodeURIComponent(videoUrl)}`);
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.blob();
};

export const getVideoTranscript = async (
  videoUrl: string,
  lang: string = 'tr',
  skipAI: boolean = false,
  useDeepSeek: boolean = true
): Promise<TranscriptResponse> => {
  const params = new URLSearchParams({
    url: videoUrl,
    lang,
    skipAI: String(skipAI),
    useDeepSeek: String(useDeepSeek),
  });
  const response = await authenticatedFetch(`${API_BASE_URL}/transcript?${params.toString()}`);
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.json();
};

export const getProcessingProgress = async (jobId: string): Promise<ProgressResponse> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/progress/${jobId}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Processing ID ${jobId} not found.`);
    }
    const errorData: ErrorResponse = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.json();
};

export const getProcessingResult = async (jobId: string): Promise<ResultResponse> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/result/${jobId}`);
  if (!response.ok) {
     if (response.status === 404) {
      throw new Error(`Result for Processing ID ${jobId} not found.`);
    }
    // Handle 202 Accepted separately if needed, or let the caller inspect the status code
    // For now, we assume 202 will also be an error for this function expecting a final result.
    const errorData: ErrorResponse = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  // If the response status is 202, it means processing is not complete.
  // The API spec says it returns a specific JSON body for 202.
  // We might want to handle this differently, e.g., by returning a specific type or throwing a custom error.
  if (response.status === 202) {
    const progressData = await response.json();
    // You could throw a custom error or return a specific object indicating it's still processing
    throw new Error(`Processing not complete: ${progressData.status} - ${progressData.progress}%`);
  }
  return response.json();
};
