import { useState } from 'react';
import { authenticatedFetch } from '@/lib/apiClient';
import { ProgressResponse } from '@/lib/videoApi'; // Assuming this will hold the job state

const API_BASE_URL = import.meta.env.VITE_YOUTUBE_MULTI_API_URL || 'http://localhost:3500';

export interface CancelJobSuccessResponse {
  message: string;
  video_id?: string;
  video_title?: string;
  queue_position?: string;
}

export interface CancelJobErrorResponse {
  message: string;
  error?: string; // Original error message
}

interface UseCancelJobReturn {
  cancelJob: (jobId: string) => Promise<CancelJobSuccessResponse>;
  isLoading: boolean;
  error: CancelJobErrorResponse | null;
}

export const useCancelJob = (): UseCancelJobReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<CancelJobErrorResponse | null>(null);

  const cancelJob = async (jobId: string): Promise<CancelJobSuccessResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/cancel/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();

      if (response.ok) {
        // Successfully canceled
        // The API returns: message, video_id, video_title, queue_position
        return responseData as CancelJobSuccessResponse;
      } else {
        // Handle API errors (400, 404, etc.)
        let errorMessage = `Failed to cancel job: ${response.status}`;
        if (responseData && responseData.message) {
          errorMessage = responseData.message;
        } else if (response.status === 404) {
          errorMessage = "Job not found or already completed/canceled.";
        } else if (response.status === 400) {
          errorMessage = "Cancellation not possible for this job (it may be already completed or not cancelable).";
        }

        const errResponse: CancelJobErrorResponse = { message: errorMessage, error: responseData?.error || response.statusText };
        setError(errResponse);
        throw new Error(errorMessage);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred during cancellation.';
      const errResponse: CancelJobErrorResponse = { message: errorMessage, error: e instanceof Error ? e.stack : undefined };
      setError(errResponse);
      throw e; // Re-throw the error so the caller can handle it
    } finally {
      setIsLoading(false);
    }
  };

  return { cancelJob, isLoading, error };
};
