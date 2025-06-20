import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Import Progress component
import { ExternalLink } from 'lucide-react';

interface LocationState {
  videoUrl?: string;
  videoTitle?: string;
}

const ProgressPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  // Placeholder progress value
  const progressValue = 66; // Example: 66%

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-800/30 backdrop-blur-xl border-gray-700/40 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">Job Progress</CardTitle>
            <CardDescription className="text-gray-400 pt-1">
              Tracking status for Job ID: <span className="font-mono text-blue-300">{jobId}</span>
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

            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium text-gray-300">Current Progress (Illustrative):</p>
              <Progress value={progressValue} className="w-full h-5" /> {/* Using the enhanced progress bar */}
              <p className="text-right text-sm text-gray-400">{progressValue}%</p>
            </div>

            <p className="mt-6 text-xs text-center text-gray-500">
              This page provides a snapshot of the job status. For real-time updates, please refer to the application sidebar if the process was initiated there. Full data will be available upon completion.
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ProgressPage;
