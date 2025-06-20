import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExternalLink, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2

interface LocationState {
  videoUrl?: string;
  videoTitle?: string;
}

const ResultPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-gray-800/30 backdrop-blur-xl border-gray-700/40 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-3">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Job Result</CardTitle>
            <CardDescription className="text-gray-400 pt-1">
              Showing results for Job ID: <span className="font-mono text-blue-300">{jobId}</span>
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

            <div className="pt-4 text-center">
              <p className="text-gray-300">
                This is a placeholder for the actual job result content.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Future enhancements will populate this area with the processed data (e.g., transcript, links to files, etc.).
              </p>
            </div>
             <p className="mt-6 text-xs text-center text-gray-500">
              For real-time updates or to initiate new processes, please use the main application interface.
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ResultPage;
