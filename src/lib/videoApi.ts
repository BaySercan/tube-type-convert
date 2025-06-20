import { authenticatedFetch } from './apiClient';

const API_BASE_URL = 'http://localhost:3500'; // Or your production URL

// Types based on openapi.yaml - consider generating these for more complex APIs

export interface VideoInfo { // Added export
  title: string;
  thumbnail: string;
  video_id: string;
  channel_id: string;
  channel_name: string;
  post_date: string;
}

export interface TranscriptResponse { // Added export
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

export interface AsyncJobResponse { // New type for 202 response
  processingId: string;
  message: string;
  progressEndpoint: string;
  resultEndpoint: string;
  // Optional: include original request details if helpful
  // originalUrl?: string;
  // operationType?: 'transcript' | 'mp3' | 'mp4';
}

export interface ProgressResponse { // Added export
  id: string; // This is the processingId
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
): Promise<TranscriptResponse | AsyncJobResponse> => { // Return type updated
  const params = new URLSearchParams({
    url: videoUrl,
    lang,
    skipAI: String(skipAI),
    useDeepSeek: String(useDeepSeek),
  });
  const response = await authenticatedFetch(`${API_BASE_URL}/transcript?${params.toString()}`);

  // If response is 202 Accepted, it's an async job
  if (response.status === 202) {
    console.log('[videoApi] getVideoTranscript received 202, processing async job response.');
    return response.json() as Promise<AsyncJobResponse>;
  }

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }

  // Otherwise, it's a direct transcript response (e.g., from cache or quick processing)
  console.log('[videoApi] getVideoTranscript received direct response (not 202).');
  return response.json() as Promise<TranscriptResponse>;
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
  // The API spec for /result/{jobId} says:
  // 200 OK: returns the full result (e.g. TranscriptResponse)
  // 202 Accepted: returns a ProgressResponse if still processing
  // 404 Not Found: if job ID doesn't exist
  if (response.status === 202) {
    // It's still processing, the body will be ProgressResponse
    // We could throw a specific error or return a type indicating it's not ready
    const progressData = await response.json() as ProgressResponse;
    // For the purpose of getProcessingResult, a 202 means the *final* result isn't ready.
    // Throw an error that can be caught by the polling logic to continue polling.
    throw new Error(`Result not yet available. Status: ${progressData.status}, Progress: ${progressData.progress}%`);
  }
  // If it's 200 OK, it should be the final result (e.g. TranscriptResponse)
  return response.json(); // Assuming it's TranscriptResponse or a similar structure for other job types
};
