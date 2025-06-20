import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Youtube, Download, FileText, Info, Music, Video, Zap, Sparkles, Loader2, ChevronsLeft } from 'lucide-react'; // Added ChevronsLeft
// import { useNavigate } from 'react-router-dom'; // Already imported in Dashboard, might not be needed here if not navigating from Index for these actions
import { supabase } from '@/lib/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Imports from DashboardPage
import { ProcessSidebar } from "@/components/ProcessSidebar";
import * as videoApi from '@/lib/videoApi';
import type { AsyncJobResponse, TranscriptResponse } from '@/lib/videoApi'; // Import types
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; // Added useQuery


const Index = () => {
  const { user } = useAuth();
  // const navigate = useNavigate(); // Keep if navigation is needed, e.g., after logout
  const [url, setUrl] = useState(''); // Renamed from videoUrl for consistency with existing Index.tsx state
  const [selectedOutput, setSelectedOutput] = useState('');
  // const [isProcessing, setIsProcessing] = useState(false); // Will be replaced by mutation loading states

  // State for ProcessSidebar (from DashboardPage)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarData, setSidebarData] = useState<object | null>(null); // This will hold various data structures
  const [sidebarTitle, setSidebarTitle] = useState("Process Details");
  const [sidebarError, setErrorForSidebar] = useState<string | null>(null);
  const [showReopenButton, setShowReopenButton] = useState(false); // For the "handsome ear"
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null); // To manage blob URL for media player

  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
  // We'll use React Query's refetchInterval for polling progress

  // queryClient can be useful for cache invalidation or refetching, uncomment if needed
  const queryClient = useQueryClient();


  const outputOptions = [
    { id: 'mp3', label: 'MP3 Audio', icon: Music, description: 'Extract audio as MP3' },
    { id: 'mp4', label: 'MP4 Video', icon: Video, description: 'Download video as MP4' },
    { id: 'transcript', label: 'AI Transcript', icon: FileText, description: 'Get AI-powered video transcript', isAI: true },
    { id: 'info', label: 'Video Info', icon: Info, description: 'Get video metadata' }
  ];

  const isValidYouTubeUrl = (url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return regex.test(url);
  };

  // Unified sidebar opening logic (from DashboardPage)
  const openSidebarForAction = (title: string) => {
    console.log('[IndexPage] openSidebarForAction called. Title:', title);
    setSidebarTitle(title);
    setSidebarData(null); // Clear previous data
    setErrorForSidebar(null); // Clear previous error
    setShowReopenButton(false); // Hide reopen button when sidebar opens for a new action
    setIsSidebarOpen(true);
    console.log('[IndexPage] setIsSidebarOpen(true) - state should be updated.');
  };

  const handleSidebarOpenChange = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
    if (!isOpen) {
      if (sidebarData || sidebarError) {
        setShowReopenButton(true); // Show button if sidebar is closed and has content
      }
      if (activeBlobUrl) {
        console.log('[IndexPage] Sidebar closed, revoking active blob URL:', activeBlobUrl);
        URL.revokeObjectURL(activeBlobUrl);
        setActiveBlobUrl(null);
      }
    } else { // Sidebar is opening
      setShowReopenButton(false); // Hide button if sidebar is open
    }
  };

  // --- React Query Mutations (from DashboardPage) ---

  const infoMutation = useMutation<videoApi.VideoInfo, Error, string>({
    mutationFn: (videoUrl: string) => {
      console.log('[IndexPage] infoMutation.mutationFn called with url:', videoUrl);
      return videoApi.getVideoInfo(videoUrl);
    },
    onSuccess: (data) => {
      console.log('[IndexPage] Info Mutation onSuccess. Data:', data);
      setSidebarTitle("Video Information");
      setSidebarData(data);
      setErrorForSidebar(null);
      console.log('[IndexPage] Info Mutation onSuccess - sidebar state updated.');
    },
    onError: (error) => {
      console.error('[IndexPage] Info Mutation onError. Error:', error);
      setSidebarTitle("Error Fetching Info");
      setErrorForSidebar(error.message || "An unknown error occurred.");
      setSidebarData(null);
      console.log('[IndexPage] Info Mutation onError - sidebar state updated for error.');
    },
  });

  type DownloadArgs = { url: string; format: 'mp3' | 'mp4' };

  const downloadFileMutation = useMutation<Blob, Error, DownloadArgs>({
    mutationFn: (args: DownloadArgs) => {
      console.log('[IndexPage] downloadFileMutation.mutationFn called with args:', args);
      return args.format === 'mp3'
        ? videoApi.downloadMp3(args.url)
        : videoApi.downloadMp4(args.url);
    },
    onSuccess: (blob, variables) => {
      console.log(`[IndexPage] Download ${variables.format.toUpperCase()} Mutation onSuccess`);
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
      // URL.revokeObjectURL(link.href); // Don't revoke immediately, keep for player

      // Revoke previous blob URL if one exists
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
        console.log('[IndexPage] Revoked previous active blob URL:', activeBlobUrl);
      }
      setActiveBlobUrl(link.href); // Store the new blob URL

      setSidebarTitle(`${variables.format.toUpperCase()} Ready`);
      setSidebarData({
        message: `${variables.format.toUpperCase()} is ready. Download has started. You can also play it here.`,
        fileName,
        mediaUrl: link.href, // Pass the blob URL to the sidebar
        mediaType: variables.format === 'mp3' ? 'audio/mpeg' : 'video/mp4',
      });
      setErrorForSidebar(null);
    },
    onError: (error, variables) => {
      if (activeBlobUrl) { // Clean up blob URL on error too
        URL.revokeObjectURL(activeBlobUrl);
        setActiveBlobUrl(null);
      }
      console.error(`[IndexPage] Download ${variables.format.toUpperCase()} Mutation onError:`, error);
      setSidebarTitle(`Error Downloading ${variables.format.toUpperCase()}`);
      setErrorForSidebar(error.message || "An unknown error occurred.");
      setSidebarData(null);
    },
  });

  // Type guard to check if response is AsyncJobResponse
  function isAsyncJobResponse(response: any): response is AsyncJobResponse {
    return response && typeof response.processingId === 'string';
  }

  const transcriptMutation = useMutation<TranscriptResponse | AsyncJobResponse, Error, string>({
    mutationFn: (videoUrl: string) => {
      console.log('[IndexPage] transcriptMutation.mutationFn called with url:', videoUrl);
      return videoApi.getVideoTranscript(videoUrl);
    },
    onSuccess: (data) => {
      console.log('[IndexPage] Transcript Mutation onSuccess:', data);
      setErrorForSidebar(null);
      setCurrentProcessingId(null); // Clear any previous processing ID

      if (isAsyncJobResponse(data)) {
        setSidebarTitle("Transcript Processing Started");
        setSidebarData({ // Store the async job details
          message: data.message,
          processingId: data.processingId,
          progressEndpoint: data.progressEndpoint,
          resultEndpoint: data.resultEndpoint,
          status: "processing_initiated", // Custom status
        });
        setCurrentProcessingId(data.processingId); // Start polling for this ID
        console.log(`[IndexPage] Transcript is async. Processing ID: ${data.processingId}`);
      } else {
        // Direct response (TranscriptResponse)
        setSidebarTitle("Video Transcript");
        setSidebarData(data); // This is the final transcript
        console.log('[IndexPage] Transcript received directly.');
      }
    },
    onError: (error) => {
      console.error('[IndexPage] Transcript Mutation onError:', error);
      setCurrentProcessingId(null); // Stop polling on error
      setSidebarTitle("Error Fetching Transcript");
      setErrorForSidebar(error.message || "An unknown error occurred.");
      setSidebarData(null);
    },
  });

  // Composite loading state for disabling form elements / showing processing
  // isProcessing should be true if any mutation is pending OR if we are actively polling.
  const isAnyMutationPending = infoMutation.isPending || downloadFileMutation.isPending || transcriptMutation.isPending;
  const isPollingActive = !!currentProcessingId;

  const isProcessing = isAnyMutationPending || isPollingActive;
  // Sidebar loading should be true if a mutation is pending, or if polling is active and we don't have final data yet.
  // The 'sidebarData' might already show "processing..." from the AsyncJobResponse,
  // so isSidebarLoading might primarily reflect the initial mutation call.
  // Let's refine this: sidebar should show its own loading state based on what it's displaying.
  // ProcessSidebar already has an isLoading prop. We need to pass it correctly.
  // If currentProcessingId is set, and we don't have a final result, it's loading.
  // If a mutation is pending, it's loading.

  const { data: progressData, error: progressError, isLoading: isProgressLoading, refetch: refetchProgress } = useQuery({
    queryKey: ['progress', currentProcessingId],
    queryFn: async () => {
      if (!currentProcessingId) return null;
      console.log(`[IndexPage] Polling progress for ${currentProcessingId}`);
      try {
        const progress = await videoApi.getProcessingProgress(currentProcessingId);
        setSidebarData(prevData => ({
          ...(typeof prevData === 'object' ? prevData : {}), // Preserve existing sidebar data (like endpoints)
          status: progress.status,
          progress: progress.progress,
          video_title: progress.video_title, // Add video title if available
          lastUpdated: new Date().toLocaleTimeString(),
          message: `Status: ${progress.status}, Progress: ${progress.progress}%`,
        }));
        setErrorForSidebar(null);

        if (progress.status === 'completed' || progress.status === 'failed' || progress.progress === 100) {
          console.log(`[IndexPage] Progress complete or failed for ${currentProcessingId}. Status: ${progress.status}`);
          setCurrentProcessingId(null); // Stop polling progress
          queryClient.invalidateQueries({ queryKey: ['progress', currentProcessingId] }); // Stop this query

          if (progress.status === 'completed' || progress.progress === 100) {
            // Fetch final result
            setSidebarTitle("Fetching Final Result...");
            // Consider using a mutation for fetching result for better loading/error states
            videoApi.getProcessingResult(progress.id)
              .then(result => {
                setSidebarTitle("Transcript Result");
                setSidebarData(result); // This should be the TranscriptResponse
                setErrorForSidebar(null);
              })
              .catch(err => {
                console.error(`[IndexPage] Error fetching result for ${progress.id}:`, err);
                setSidebarTitle("Error Fetching Result");
                setErrorForSidebar(err.message || "Failed to get final result.");
                setSidebarData(prevData => ({
                    ...(typeof prevData === 'object' ? prevData : {}),
                    status: "result_error",
                }));
              });
          } else { // Failed status
             setSidebarTitle("Processing Failed");
             setErrorForSidebar(`Processing failed with status: ${progress.status}`);
             setSidebarData(prevData => ({
                ...(typeof prevData === 'object' ? prevData : {}),
                status: "processing_failed",
                message: `Error: Processing failed. Status: ${progress.status}`,
             }));
          }
        }
        return progress;
      } catch (err: any) {
        console.error(`[IndexPage] Error polling progress for ${currentProcessingId}:`, err);
        setErrorForSidebar(err.message || "Error fetching progress.");
        // Optionally stop polling on certain errors
        // setCurrentProcessingId(null);
        // queryClient.invalidateQueries({ queryKey: ['progress', currentProcessingId] });
        throw err; // Re-throw to let React Query handle it
      }
    },
    enabled: !!currentProcessingId, // Only run query if currentProcessingId is set
    refetchInterval: (query) => { // Custom refetch interval logic
      if (!currentProcessingId) return false; // Stop polling if no ID
      const data = query.state.data as videoApi.ProgressResponse | null;
      if (data && (data.status === 'completed' || data.status === 'failed' || data.progress === 100)) {
        return false; // Stop polling if complete, failed, or 100%
      }
      return 5000; // Poll every 5 seconds
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false, // Avoid refetching just on window focus if polling
  });

  useEffect(() => {
    if (progressError) {
      console.error("[IndexPage] Progress polling error:", progressError);
      // setErrorForSidebar(progressError.message || "Error fetching progress.");
      // Decide if we should stop polling on error. For now, React Query will retry.
    }
  }, [progressError]);

  // Effect to cleanup blob URL on component unmount or when currentProcessingId changes (new process)
  useEffect(() => {
    return () => {
      if (activeBlobUrl) {
        console.log('[IndexPage] Unmounting or new process, revoking active blob URL:', activeBlobUrl);
        URL.revokeObjectURL(activeBlobUrl);
        setActiveBlobUrl(null);
      }
    };
  }, []); // Empty dependency array means this runs on mount and cleans up on unmount

  const isSidebarLoading = isAnyMutationPending || (isPollingActive && isProgressLoading) || (isPollingActive && !sidebarData);


  const handleProcess = () => {
    // Clear previous polling state if a new process is started
    setCurrentProcessingId(null);
    queryClient.removeQueries({ queryKey: ['progress'] }); // Clear old progress queries

    // Revoke any existing blob URL when a new process starts
    if (activeBlobUrl) {
      console.log('[IndexPage] New process started, revoking active blob URL:', activeBlobUrl);
      URL.revokeObjectURL(activeBlobUrl);
      setActiveBlobUrl(null);
    }

    // The duplicated if (!user) block was removed from here.
    // The first if (!user) block starting around line 313 is the correct one.

    if (!url.trim()) {
      toast({ title: "URL Required", description: "Please enter a YouTube URL", variant: "destructive" });
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      toast({ title: "Invalid URL", description: "Please enter a valid YouTube URL", variant: "destructive" });
      return;
    }

    if (!selectedOutput) {
      toast({ title: "Output Type Required", description: "Please select an output type", variant: "destructive" });
      return;
    }

    // Trigger the appropriate mutation based on selectedOutput
    switch (selectedOutput) {
      case 'info':
        openSidebarForAction("Fetching Video Information...");
        infoMutation.mutate(url);
        break;
      case 'mp3':
        openSidebarForAction("Preparing MP3 Download...");
        downloadFileMutation.mutate({ url, format: 'mp3' });
        break;
      case 'mp4':
        openSidebarForAction("Preparing MP4 Download...");
        downloadFileMutation.mutate({ url, format: 'mp4' });
        break;
      case 'transcript':
        openSidebarForAction("Fetching Transcript...");
        transcriptMutation.mutate(url);
        break;
      default:
        console.error("Unknown output type:", selectedOutput);
        toast({ title: "Error", description: "Invalid output type selected.", variant: "destructive" });
        return;
    }
    
    // No longer using a generic toast for "Processing Started" here,
    // as sidebar will show detailed status.
    // The individual mutation's onSuccess/onError will handle specific feedback.
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-40 left-1/2 w-60 h-60 bg-zinc-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
        </div>

        <Card className="w-full max-w-2xl bg-gray-800/20 backdrop-blur-lg border-gray-700/30 shadow-2xl relative z-10">
          <div className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-3 bg-red-500 rounded-full">
                  <Youtube className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-100">YouTube Converter</h1>
              </div>
              <p className="text-gray-300 text-lg">Convert YouTube videos to MP3, MP4, get transcripts or video info</p>
            </div>

            {/* URL Input */}
            <div className="space-y-3">
              <label className="text-gray-200 font-medium block">YouTube URL</label>
              <Input
                type="url"
                placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isProcessing} // Disable input while processing
                className="bg-gray-800/30 border-gray-600/50 text-gray-100 placeholder:text-gray-400 h-12 text-lg backdrop-blur-sm focus:bg-gray-800/50 focus:border-gray-500 transition-all duration-300"
              />
            </div>

            {/* Output Type Selection */}
            <div className="space-y-4">
              <label className="text-gray-200 font-medium block">Choose Output Type</label>
              <div className="grid grid-cols-2 gap-4">
                {outputOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => !isProcessing && setSelectedOutput(option.id)} // Disable selection while processing
                      disabled={isProcessing} // Disable button while processing
                      className={`p-4 rounded-lg border-2 transition-all duration-300 text-left group hover:scale-105 relative ${
                        selectedOutput === option.id
                          ? 'border-gray-400 bg-gray-700/40 shadow-lg shadow-gray-700/25'
                          : 'border-gray-600/40 bg-gray-800/20 hover:border-gray-500/60 hover:bg-gray-700/30'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {option.isAI && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-1 animate-pulse">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg transition-colors ${
                          selectedOutput === option.id ? 'bg-gray-600' : 'bg-gray-700/60 group-hover:bg-gray-600/80'
                        }`}>
                          <IconComponent className="w-5 h-5 text-gray-100" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-gray-100 font-semibold">{option.label}</h3>
                            {option.isAI && (
                              <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full font-medium">
                                AI
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mt-1">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Process Button */}
            <div className="relative">
              <Button
                onClick={handleProcess}
                disabled={isProcessing || !url || !selectedOutput} // Disable if processing, or no URL/output selected
                className="w-full h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-500 hover:via-purple-500 hover:to-blue-600 text-white font-bold text-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-0 relative overflow-hidden group"
              >
                {/* Animated background shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                
                <div className="relative flex items-center justify-center space-x-3">
                  {isProcessing ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-7 h-7" />
                      <span>Process Request</span>
                      <Zap className="w-7 h-7" />
                    </>
                  )}
                </div>
              </Button>
              {isProcessing && (
                <p className="text-yellow-400 text-xs text-center mt-3 animate-pulse">
                  A process is currently ongoing. Please wait for it to complete before starting a new one.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ProcessSidebar
        isOpen={isSidebarOpen}
        onOpenChange={handleSidebarOpenChange} // Use the new handler
        title={sidebarTitle}
        data={sidebarData} // sidebarData will now contain progress info too
        isLoading={isSidebarLoading}
        error={sidebarError}
      />

      {showReopenButton && (
        <Button
          onClick={() => {
            setIsSidebarOpen(true);
            setShowReopenButton(false); // Hide button once sidebar is reopened
          }}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-l-md shadow-lg"
          title="Reopen Sidebar"
        >
          <ChevronsLeft className="h-6 w-6" />
        </Button>
      )}

      <Footer />
    </div>
  );
};

export default Index;
