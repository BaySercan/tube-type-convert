import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Import Progress component
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getProcessingProgress, getProcessingResult, ProgressResponse, TranscriptResponse } from '@/lib/videoApi'; // Import API functions and types

interface LocationState {
  videoUrl?: string;
  videoTitle?: string;
}

const ResultPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing...');
  const [jobResult, setJobResult] = useState<TranscriptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchProgress = async () => {
    if (!jobId) return;
    try {
      const data: ProgressResponse = await getProcessingProgress(jobId);
      setProgress(data.progress);
      setStatusMessage(data.status);

      if (data.status === 'completed' || data.status === 'failed' || data.progress === 100) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setIsLoading(false); // Stop general loading once progress polling is done
        if (data.status === 'completed' || data.progress === 100) { // Check for completion
          fetchResult();
        } else if (data.status === 'failed') {
          setError(`Job failed: ${data.status}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch job progress.');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsLoading(false);
    }
  };

  const fetchResult = async () => {
    if (!jobId) return;
    console.log('Fetching final result...');
    setIsLoading(true); // Indicate loading for the result fetching phase
    try {
      const resultData = await getProcessingResult(jobId);
      setJobResult(resultData);
      setStatusMessage('Result loaded successfully.');
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Failed to fetch result:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching the result.';
      // Check if the error message indicates that the result is not yet available
      if (errorMessage.includes("Result not yet available") || errorMessage.includes("still processing")) {
        // This case should ideally be handled by the progress polling,
        // but as a fallback, we inform the user.
        setStatusMessage("Processing is taking longer than expected. Still fetching result...");
        // Optionally, restart polling or wait longer before showing a hard error.
        // For now, we'll just show the message and let the user decide if they want to refresh.
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchProgress(); // Initial fetch
      intervalRef.current = setInterval(fetchProgress, 5000); // Poll every 5 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-800/30 backdrop-blur-xl border-gray-700/40 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-3">
              {isLoading && !jobResult && <Loader2 className="h-12 w-12 text-blue-400 animate-spin" />}
              {!isLoading && jobResult && <CheckCircle2 className="h-12 w-12 text-green-400" />}
              {!isLoading && error && <AlertCircle className="h-12 w-12 text-red-400" />}
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {jobResult ? 'Job Result' : 'Processing Job'}
            </CardTitle>
            <CardDescription className="text-gray-400 pt-1">
              Job ID: <span className="font-mono text-blue-300">{jobId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {state?.videoTitle && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-300">Video Title:</p>
                <p className="text-lg text-gray-100">{state.videoTitle}</p>
              </div>
            )}
            {state?.videoUrl && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-300">Original URL:</p>
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

            {!jobResult && (
              <div className="space-y-3 pt-4">
                <p className="text-center text-gray-300">{statusMessage}</p>
                <Progress value={progress} className="w-full bg-gray-700 h-2.5 [&>div]:bg-blue-500" />
                {isLoading && progress < 100 && (
                  <p className="text-xs text-center text-gray-500">
                    Please wait while we process your request. This might take a few moments.
                  </p>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4 bg-red-900/30 border-red-700/50 text-red-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {jobResult && !error && (
              <div className="pt-4 space-y-4">
                <h3 className="text-xl font-semibold text-gray-100 border-b border-gray-700 pb-2">Processed Data</h3>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Language:</p>
                  <p className="text-md text-gray-200">{jobResult.language}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-400">Transcript:</p>
                  <div className="max-h-60 overflow-y-auto p-3 bg-gray-900/50 rounded-md border border-gray-700/60">
                    <pre className="whitespace-pre-wrap text-sm text-gray-300">{jobResult.transcript || "No transcript available."}</pre>
                  </div>
                </div>

                {jobResult.ai_notes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-400">AI Notes:</p>
                    <div className="max-h-60 overflow-y-auto p-3 bg-gray-900/50 rounded-md border border-gray-700/60">
                      <pre className="whitespace-pre-wrap text-sm text-gray-300">{jobResult.ai_notes}</pre>
                    </div>
                  </div>
                )}
                 <p className="mt-6 text-xs text-center text-gray-500">
                  Processing completed on: {new Date().toLocaleString()}
                </p>
              </div>
            )}
             {!jobResult && !error && progress === 100 && !isLoading && (
                <div className="pt-4 text-center">
                    <p className="text-gray-300">Finalizing results... If this takes too long, the job might have completed with no specific output or an issue occurred post-processing.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ResultPage;
