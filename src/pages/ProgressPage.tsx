import React, { useEffect } from 'react';
import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as videoApi from '@/lib/videoApi';

interface LocationState {
  videoUrl?: string;
  videoTitle?: string;
}

const ProgressPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();
  const state = location.state as LocationState | null;

  const { data: progressData, error: progressError, isLoading: isProgressQueryLoading, refetch } = useQuery({
    queryKey: ['jobProgress', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      return videoApi.getProcessingProgress(jobId);
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as videoApi.ProgressResponse | null;
      if (data && (data.status === 'completed' || data.status === 'failed' || data.progress === 100)) {
        return false; // Stop polling if complete or failed
      }
      return 5000; // Poll every 5 seconds
    },
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    // If the job completes, invalidate the query to stop polling if refetchInterval logic doesn't catch it.
    if (progressData?.status === 'completed' || progressData?.status === 'failed') {
      queryClient.invalidateQueries({ queryKey: ['jobProgress', jobId] });
    }
  }, [progressData, jobId, queryClient]);

  const currentProgress = progressData?.progress ?? 0;
  const currentStatus = progressData?.status ?? 'Fetching status...';
  const displayVideoTitle = state?.videoTitle || progressData?.video_title || 'N/A';

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
                  <p className="text-sm font-medium text-gray-300">Status:</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    progressData.status === 'completed' ? 'bg-green-600 text-green-100' :
                    progressData.status === 'failed' ? 'bg-red-600 text-red-100' :
                    'bg-sky-600 text-sky-100'
                  }`}>
                    {progressData.status}
                  </span>
                </div>
                <Progress value={currentProgress} className="w-full h-5" />
                <p className="text-right text-sm text-gray-400">{currentProgress}% complete</p>
              </div>
            )}

            {progressData?.status === 'completed' && (
              <div className="text-center pt-4">
                 <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                <p className="text-green-300">Processing complete!</p>
                <RouterLink
                  to={`/result/${jobId}`}
                  state={{ videoUrl: state?.videoUrl || progressData?.video_id, videoTitle: displayVideoTitle }}
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
              </div>
            )}

            <p className="mt-6 text-xs text-center text-gray-500">
              This page provides live updates for the job.
              {progressData?.status !== 'completed' && progressData?.status !== 'failed' && " For other operations, please refer to the main application."}
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ProgressPage;
