import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';

const ProgressPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 text-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800/20 backdrop-blur-lg border-gray-700/30 shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Job Progress</h1>
          <p className="text-lg">
            Details for Job ID: <span className="font-mono text-blue-400">{jobId}</span>
          </p>
          <p className="mt-4 text-gray-300">
            This is a placeholder page for viewing the progress of an asynchronous job.
            Future enhancements will display detailed progress information here.
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ProgressPage;
