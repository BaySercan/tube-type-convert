import React, { useEffect, useCallback } from 'react';
import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button'; // Import Button
import { useToast } from '@/components/ui/use-toast'; // Import useToast
import { ExternalLink, AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react'; // Import XCircle for cancel icon
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as videoApi from '@/lib/videoApi';
import { useCancelJob } from '@/hooks/useCancelJob'; // Import useCancelJob

interface LocationState {
  videoUrl?: string;
  videoTitle?: string;
  jobType?: videoApi.JobType; // To know the type of job for display or logic
}

const ProgressPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const state = location.state as LocationState | null;

  const { cancelJob, isLoading: isCanceling } = useCancelJob();

  const { data: progressData, error: progressError, isLoading: isProgressQueryLoading, refetch } = useQuery({
    queryKey: ['jobProgress', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      // Fetch progress and merge type from location state if available
      const data = await videoApi.getProcessingProgress(jobId);
      if (data && state?.jobType) {
        // Augment with jobType from navigation state if not already present
        // This assumes the /progress endpoint doesn't return 'type'
        if (!data.type) {
          (data as videoApi.ProgressResponse).type = state.jobType;
        }
      }
      return data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as videoApi.ProgressResponse | null;
      if (data && (data.status === 'completed' || data.status === 'failed' || data.status === 'canceled' || data.progress === 100)) {
        return false; // Stop polling if complete, failed, or canceled
      }
      return 5000; // Poll every 5 seconds
    },
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (progressData?.status === 'completed' || progressData?.status === 'failed' || progressData?.status === 'canceled') {
      queryClient.invalidateQueries({ queryKey: ['jobProgress', jobId] });
    }
  }, [progressData, jobId, queryClient]);

  const handleCancelJob = useCallback(async () => {
    if (!jobId) return;

    try {
      const result = await cancelJob(jobId);

      // Manually update the query cache to include queue_position and set status to canceled
      queryClient.setQueryData(['jobProgress', jobId], (oldData: videoApi.ProgressResponse | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            status: 'canceled' as videoApi.JobStatus, // Assert type
            queue_position: result.queue_position, // Add queue_position from cancel response
            // video_title and video_id from cancel response can also update here if they are more accurate
            video_title: result.video_title || oldData.video_title,
            video_id: result.video_id || oldData.video_id,
          };
        }
        // If there's no oldData, it's less ideal, but we can construct a minimal one.
        // This case should be rare if the page is loaded with a job.
        return {
          id: jobId,
          status: 'canceled' as videoApi.JobStatus,
          progress: progressData?.progress ?? 0, // keep last known progress
          video_title: result.video_title || progressData?.video_title || 'N/A',
          video_id: result.video_id || progressData?.video_id || '',
          createdAt: progressData?.createdAt || new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          type: progressData?.type || state?.jobType,
          queue_position: result.queue_position,
        };
      });

      toast({
        title: "Job Cancellation",
        description: `${result.message}. Title: ${result.video_title || progressData?.video_title || 'N/A'}. ${result.queue_position || ''}`,
        variant: "default",
      });

      // Optionally, still refetch to confirm server state, though UI should update instantly from setQueryData
      // refetch();
      // We might not need refetch() immediately as setQueryData updates the UI.
      // Polling is stopped by 'canceled' status, so this ensures the data is immediately consistent.
      // If refetch() is desired, ensure it doesn't overwrite queue_position if /progress endpoint doesn't return it.
      // For now, relying on setQueryData for immediate effect and consistent display of queue_position.

    } catch (error: any) {
      toast({
        title: "Cancellation Error",
        description: error.message || "Could not cancel the job.",
        variant: "destructive",
      });
    }
  }, [jobId, cancelJob, toast, refetch]);

  const currentProgress = progressData?.progress ?? 0;
  // const currentStatus = progressData?.status ?? 'Fetching status...'; // Not directly used, status styling is inline
  const displayVideoTitle = state?.videoTitle || progressData?.video_title || 'N/A';

  const isCancelable = progressData && (progressData.status === 'queued' || progressData.status === 'processing');

  // Styling for different statuses
  let statusBadgeColor = 'bg-sky-600 text-sky-100'; // Default for processing/queued
  let statusIcon = <Loader2 className="h-5 w-5 text-sky-400 animate-spin" />;

  if (progressData?.status === 'completed') {
    statusBadgeColor = 'bg-green-600 text-green-100';
    statusIcon = <CheckCircle2 className="h-5 w-5 text-green-400" />;
  } else if (progressData?.status === 'failed') {
    statusBadgeColor = 'bg-red-600 text-red-100';
    statusIcon = <AlertTriangle className="h-5 w-5 text-red-400" />;
  } else if (progressData?.status === 'canceled') {
    statusBadgeColor = 'bg-gray-500 text-gray-100';
    statusIcon = <XCircle className="h-5 w-5 text-gray-400" />;
  }


  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-800/30 backdrop-blur-xl border-gray-700/40 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Job Progress</CardTitle>
            <CardDescription className="text-gray-400 pt-1">
              Tracking status for Job ID: <span className="font-mono text-blue-300 break-all">{jobId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-300">Video Title:</p>
              <p className="text-lg text-gray-100">{displayVideoTitle}</p>
            </div>

            {state?.videoUrl && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-300">Requested URL:</p>
                <a
                  href={state.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all flex items-center"
                >
                  {state.videoUrl} <ExternalLink className="inline-block ml-1.5 h-4 w-4 flex-shrink-0" />
                </a>
              </div>
            )}

            {isProgressQueryLoading && !progressData && (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-gray-300">Fetching latest progress...</p>
              </div>
            )}

            {progressError && (
              <div className="p-3 my-2 border border-red-600 bg-red-900/30 rounded-md text-red-200 text-sm">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p>Error fetching progress: {progressError.message}</p>
                </div>
              </div>
            )}

            {!isProgressQueryLoading && progressData && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    {statusIcon}
                    <p className="text-sm font-medium text-gray-300">Status:</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeColor}`}>
                    {progressData.status}
                  </span>
                </div>
                <Progress
                  value={progressData.status === 'canceled' ? currentProgress : currentProgress} // Keep progress for canceled or set to 0/100
                  className={`w-full h-5 ${progressData.status === 'canceled' ? 'opacity-50' : ''}`}
                />
                <p className="text-right text-sm text-gray-400">
                  {progressData.status === 'canceled' ? `Canceled at ${currentProgress}%` : `${currentProgress}% complete`}
                </p>
              </div>
            )}

            {isCancelable && (
              <Button
                onClick={handleCancelJob}
                disabled={isCanceling || !jobId}
                variant="destructive"
                className="w-full mt-4"
              >
                {isCanceling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Cancel Processing
              </Button>
            )}

            {progressData?.status === 'completed' && (
              <div className="text-center pt-4">
                 <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                <p className="text-green-300">Processing complete!</p>
                <RouterLink
                  to={`/result/${jobId}`}
                  state={{ videoUrl: state?.videoUrl || progressData?.video_id, videoTitle: displayVideoTitle, jobType: progressData?.type }}
                  className="mt-2 inline-block text-blue-400 hover:underline"
                >
                  View Result
                </RouterLink>
              </div>
            )}
            {progressData?.status === 'failed' && (
              <div className="text-center pt-4">
                <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                <p className="text-red-300">Processing failed.</p>
                {/* Optional: Add a retry button or link back */}
              </div>
            )}
            {progressData?.status === 'canceled' && (
              <div className="text-center pt-4">
                <XCircle className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-300">Processing canceled.</p>
                {progressData.queue_position && <p className="text-sm text-gray-400">{progressData.queue_position}</p>}
              </div>
            )}

            <p className="mt-6 text-xs text-center text-gray-500">
              This page provides live updates for the job.
              {progressData?.status !== 'completed' && progressData?.status !== 'failed' && progressData?.status !== 'canceled' && " For other operations, please refer to the main application."}
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ProgressPage;
