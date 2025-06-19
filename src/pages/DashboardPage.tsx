import { useAuth } from '@/contexts/AuthContext';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProcessSidebar } from "@/components/ProcessSidebar";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import * as videoApi from '@/lib/videoApi'; // Import API functions

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [videoUrl, setVideoUrl] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarData, setSidebarData] = useState<object | null>(null);
  const [sidebarTitle, setSidebarTitle] = useState("Process Details");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error);
    else navigate("/login");
  };

  const openSidebar = (title: string) => {
    setSidebarTitle(title);
    setIsLoading(true);
    setError(null);
    setSidebarData(null);
    setIsSidebarOpen(true);
  };

  const updateSidebarWithData = (title: string, data: object) => {
    setSidebarTitle(title);
    setSidebarData(data);
    setIsLoading(false);
    setError(null);
  };

  const updateSidebarWithError = (title: string, errorMessage: string) => {
    setSidebarTitle(title);
    setError(errorMessage);
    setIsLoading(false);
    setSidebarData(null);
  };

  const handleGetInfo = async () => {
    if (!videoUrl) {
      alert("Please enter a video URL.");
      return;
    }
    openSidebar("Fetching Video Info...");
    try {
      const data = await videoApi.getVideoInfo(videoUrl);
      updateSidebarWithData("Video Information", data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        updateSidebarWithError("Error Fetching Info", err.message);
      } else {
        updateSidebarWithError("Error Fetching Info", "An unknown error occurred.");
      }
    }
  };

  const handleDownload = async (format: 'mp3' | 'mp4') => {
    if (!videoUrl) {
      alert("Please enter a video URL.");
      return;
    }
    // Sidebar can show a "Preparing download..." message
    openSidebar(`Preparing ${format.toUpperCase()} Download...`);
    try {
      const blob = format === 'mp3'
        ? await videoApi.downloadMp3(videoUrl)
        : await videoApi.downloadMp4(videoUrl);

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      // Try to get filename from API response headers if available, or generate one
      // For simplicity, using a generic name here.
      // A more robust solution would involve parsing Content-Disposition header.
      const videoIdMatch = videoUrl.match(/[?&]v=([^&]+)/);
      const fileName = videoIdMatch ? `${videoIdMatch[1]}.${format}` : `video.${format}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Clean up

      updateSidebarWithData(`${format.toUpperCase()} Download Started`, {
        message: `${format.toUpperCase()} download should begin shortly. Check your browser downloads.`,
        fileName,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        updateSidebarWithError(`Error Downloading ${format.toUpperCase()}`, err.message);
      } else {
        updateSidebarWithError(`Error Downloading ${format.toUpperCase()}`, "An unknown error occurred.");
      }
    }
  };

  const handleGetTranscript = async () => {
    if (!videoUrl) {
      alert("Please enter a video URL.");
      return;
    }
    openSidebar("Fetching Transcript...");
    try {
      // Assuming /transcript might return a job ID or direct data
      // For now, let's assume it returns data directly or an error
      // Polling logic for /progress and /result would be added here if API always returns job ID first
      const data = await videoApi.getVideoTranscript(videoUrl);
      updateSidebarWithData("Video Transcript", data);
      // TODO: Implement polling if 'data' indicates a job ID
      // e.g., if (data.jobId) { pollProgress(data.jobId); }
    } catch (err: unknown) {
      if (err instanceof Error) {
        updateSidebarWithError("Error Fetching Transcript", err.message);
      } else {
        updateSidebarWithError("Error Fetching Transcript", "An unknown error occurred.");
      }
    }
  };

  // Basic polling function example (if needed)
  // const pollProgress = async (jobId: string) => {
  //   try {
  //     setSidebarTitle(`Processing Transcript (Job: ${jobId})...`);
  //     const progress = await videoApi.getProcessingProgress(jobId);
  //     setSidebarData(progress); // Show progress object
  //     if (progress.status === 'completed' || progress.status === 'failed') {
  //       const result = await videoApi.getProcessingResult(jobId);
  //       updateSidebarWithData("Transcript Result", result);
  //     } else if (progress.status === 'processing' || progress.status === 'pending') {
  //       setTimeout(() => pollProgress(jobId), 5000); // Poll every 5 seconds
  //     }
  //   } catch (err: any) {
  //     updateSidebarWithError("Error During Processing", err.message);
  //   }
  // };


  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          {/* Test buttons can be removed or kept for debugging */}
          {/* <Button onClick={() => openSidebar("Test Data")} variant="secondary">Test Sidebar (Data)</Button> */}
          {/* <Button onClick={() => updateSidebarWithError("Test Error", "A test error occurred.")} variant="destructive">Test Sidebar (Error)</Button> */}
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </header>
      <main>
        <p className="text-lg">Welcome, <strong>{user?.email || 'Authenticated User'}</strong>!</p>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Video Tools</h2>
          <div className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                YouTube Video URL
              </label>
              <input
                type="text"
                name="videoUrl"
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                disabled={isLoading}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleGetInfo} disabled={isLoading || !videoUrl}>Get Info</Button>
              <Button onClick={() => handleDownload('mp3')} disabled={isLoading || !videoUrl}>Download MP3</Button>
              <Button onClick={() => handleDownload('mp4')} disabled={isLoading || !videoUrl}>Download MP4</Button>
              <Button onClick={handleGetTranscript} disabled={isLoading || !videoUrl}>Get Transcript</Button>
            </div>
          </div>
        </div>
      </main>

      <ProcessSidebar
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        title={sidebarTitle}
        data={sidebarData}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default DashboardPage;
