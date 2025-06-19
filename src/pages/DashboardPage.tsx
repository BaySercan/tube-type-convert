import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from "react"; // Added useEffect
import { Button } from "@/components/ui/button";
import { ProcessSidebar } from "@/components/ProcessSidebar";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import * as videoApi from '@/lib/videoApi';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Import useMutation

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // const queryClient = useQueryClient(); // If needed for cache invalidation

  const [videoUrl, setVideoUrl] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarData, setSidebarData] = useState<object | null>(null); // Retain for sidebar direct data
  const [sidebarTitle, setSidebarTitle] = useState("Process Details");
  // isLoading and error will now primarily come from useMutation states

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error);
    else navigate("/login");
  };

  // Unified sidebar opening logic, independent of API call state management
  const openSidebarForAction = (title: string) => {
    console.log('[DashboardPage] openSidebarForAction called. Title:', title);
    setSidebarTitle(title);
    setSidebarData(null); // Clear previous data
    setErrorForSidebar(null); // Clear previous error
    setIsSidebarOpen(true);
    console.log('[DashboardPage] setIsSidebarOpen(true) - state should be updated.');
  };

  // Specific state for sidebar error, to distinguish from mutation.error
  const [sidebarError, setErrorForSidebar] = useState<string | null>(null);


  // --- React Query Mutations ---

  const infoMutation = useMutation<videoApi.VideoInfo, Error, string>({
    mutationFn: (url: string) => videoApi.getVideoInfo(url),
    onSuccess: (data) => {
      console.log('[DashboardPage] Info Mutation onSuccess:', data);
      setSidebarTitle("Video Information");
      setSidebarData(data);
      setErrorForSidebar(null);
    },
    onError: (error) => {
      console.error('[DashboardPage] Info Mutation onError:', error);
      setSidebarTitle("Error Fetching Info");
      setErrorForSidebar(error.message || "An unknown error occurred.");
      setSidebarData(null);
    },
  });

  const handleGetInfo = () => {
    if (!videoUrl) {
      alert("Please enter a video URL.");
      return;
    }
    openSidebarForAction("Fetching Video Info...");
    infoMutation.mutate(videoUrl);
  };

  // isLoading for the form/buttons will be a composite of all mutation loading states
  const isActionLoading = infoMutation.isPending; // Will add other mutations later

  // This useEffect is to manage the global isLoading state for the sidebar display if needed
  // but ProcessSidebar now takes its own isLoading prop directly from mutation.isPending
  // We also need a way to show loading *in the sidebar* when a mutation is pending.
  // The `ProcessSidebar`'s `isLoading` prop will now be driven by individual mutation `isPending` states.

  type DownloadArgs = { url: string; format: 'mp3' | 'mp4' };

  const downloadFileMutation = useMutation<Blob, Error, DownloadArgs>({
    mutationFn: (args: DownloadArgs) =>
      args.format === 'mp3'
        ? videoApi.downloadMp3(args.url)
        : videoApi.downloadMp4(args.url),
    onSuccess: (blob, variables) => {
      console.log(`[DashboardPage] Download ${variables.format.toUpperCase()} Mutation onSuccess`);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const videoIdMatch = variables.url.match(/[?&]v=([^&]+)/);
      const fileName = videoIdMatch
        ? `${videoIdMatch[1]}.${variables.format}`
        : `video.${variables.format}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setSidebarTitle(`${variables.format.toUpperCase()} Download Started`);
      setSidebarData({
        message: `${variables.format.toUpperCase()} download should begin shortly. Check your browser downloads.`,
        fileName,
      });
      setErrorForSidebar(null);
    },
    onError: (error, variables) => {
      console.error(`[DashboardPage] Download ${variables.format.toUpperCase()} Mutation onError:`, error);
      setSidebarTitle(`Error Downloading ${variables.format.toUpperCase()}`);
      setErrorForSidebar(error.message || "An unknown error occurred.");
      setSidebarData(null);
    },
  });

  const handleDownload = (format: 'mp3' | 'mp4') => {
    if (!videoUrl) {
      alert("Please enter a video URL.");
      return;
    }
    openSidebarForAction(`Preparing ${format.toUpperCase()} Download...`);
    downloadFileMutation.mutate({ url: videoUrl, format });
  };

  const transcriptMutation = useMutation<videoApi.TranscriptResponse, Error, string>({
    mutationFn: (url: string) => videoApi.getVideoTranscript(url), // Default lang, skipAI, useDeepSeek
    onSuccess: (data) => {
      console.log('[DashboardPage] Transcript Mutation onSuccess:', data);
      setSidebarTitle("Video Transcript");
      setSidebarData(data);
      setErrorForSidebar(null);
      // TODO: Check if data indicates a job ID for polling, if so, initiate polling.
      // if (data.jobId && !data.transcript) { startPolling(data.jobId); }
    },
    onError: (error) => {
      console.error('[DashboardPage] Transcript Mutation onError:', error);
      setSidebarTitle("Error Fetching Transcript");
      setErrorForSidebar(error.message || "An unknown error occurred.");
      setSidebarData(null);
    },
  });

  const handleGetTranscript = () => {
    if (!videoUrl) {
      alert("Please enter a video URL.");
      return;
    }
    openSidebarForAction("Fetching Transcript...");
    transcriptMutation.mutate(videoUrl);
  };

  // Composite loading state for disabling form elements
  const isFormDisabled = infoMutation.isPending || downloadFileMutation.isPending || transcriptMutation.isPending;

  // Determine sidebar loading state based on which mutation is active (if any)
  // This is a simplification; a more complex UI might show different loading for different actions.
  const isSidebarLoading = infoMutation.isPending || downloadFileMutation.isPending || transcriptMutation.isPending;


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
                disabled={isFormDisabled}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleGetInfo} disabled={isFormDisabled || !videoUrl}>Get Info</Button>
              <Button onClick={() => handleDownload('mp3')} disabled={isFormDisabled || !videoUrl}>Download MP3</Button>
              <Button onClick={() => handleDownload('mp4')} disabled={isFormDisabled || !videoUrl}>Download MP4</Button>
              <Button onClick={handleGetTranscript} disabled={isFormDisabled || !videoUrl}>Get Transcript</Button>
            </div>
          </div>
        </div>
      </main>

      <ProcessSidebar
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        title={sidebarTitle}
        data={sidebarData}
        isLoading={isSidebarLoading}
        error={sidebarError} // Use the dedicated sidebarError state
      />
      {/* Removed console.log from here to fix ReactNode error */}
    </div>
  );
};

export default DashboardPage;
