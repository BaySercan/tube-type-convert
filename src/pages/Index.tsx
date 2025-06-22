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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// Imports from DashboardPage
import { ProcessSidebar } from "@/components/ProcessSidebar";
import type { SidebarData as ProcessSidebarData } from "@/components/ProcessSidebar"; // Import SidebarData type
import * as videoApi from '@/lib/videoApi';
import { StillProcessingError } from '@/lib/videoApi'; // Import the custom error
import type { AsyncJobResponse, TranscriptResponse, ProgressResponse } from '@/lib/videoApi'; // Import types
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; // Added useQuery


const Index = () => {
  const { user } = useAuth();
  // const navigate = useNavigate(); // Keep if navigation is needed, e.g., after logout
  const [url, setUrl] = useState(''); // Renamed from videoUrl for consistency with existing Index.tsx state
  const [selectedOutput, setSelectedOutput] = useState('');
  // const [isProcessing, setIsProcessing] = useState(false); // Will be replaced by mutation loading states

  // State for AI Transcript options
  const [transcriptLang, setTranscriptLang] = useState('tr');
  const [transcriptSkipAI, setTranscriptSkipAI] = useState(false);
  const [transcriptUseDeepSeek, setTranscriptUseDeepSeek] = useState(true);

  // State for ProcessSidebar (from DashboardPage)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarData, setSidebarData] = useState<ProcessSidebarData | null>(null); // Use imported ProcessSidebarData
  const [sidebarTitle, setSidebarTitle] = useState("Process Details");
  const [sidebarError, setErrorForSidebar] = useState<string | null>(null);
  const [showReopenButton, setShowReopenButton] = useState(true); // Initialize to true, as sidebar is initially closed
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null); // To manage blob URL for media player

  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
  // We'll use React Query's refetchInterval for polling progress

  // queryClient can be useful for cache invalidation or refetching, uncomment if needed
  const queryClient = useQueryClient();

  const transcriptLanguages = [
    { value: 'tr', label: 'Turkish' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    // Add more languages as needed
  ];

  const outputOptions = [
    { id: 'mp3', label: 'MP3 Audio', icon: Music, description: 'Extract audio as MP3' },
    { id: 'mp4', label: 'MP4 Video', icon: Video, description: 'Download video as MP4' },
    { id: 'transcript', label: 'AI Transcript', icon: FileText, description: 'Get AI-powered video transcript', isAI: true },
    { id: 'info', label: 'Video Info', icon: Info, description: 'Get video metadata' }
  ];

  // Effect to reset transcript options when selectedOutput changes
  useEffect(() => {
    if (selectedOutput !== 'transcript') {
      setTranscriptLang('tr');
      setTranscriptSkipAI(false);
      setTranscriptUseDeepSeek(true);
    }
  }, [selectedOutput]);

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
    // setShowReopenButton(false); // No longer needed here, managed by useEffect
    setIsSidebarOpen(true);
    console.log('[IndexPage] setIsSidebarOpen(true) - state should be updated.');
  };

  const handleSidebarOpenChange = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
    // setShowReopenButton(!isOpen); // Simplified logic, but useEffect is better for direct state->state updates

    // Still need to handle activeBlobUrl revocation when sidebar closes
    if (!isOpen && activeBlobUrl) {
      console.log('[IndexPage] Sidebar closed, revoking active blob URL:', activeBlobUrl);
      URL.revokeObjectURL(activeBlobUrl);
      setActiveBlobUrl(null);
    }
  };

  // Effect to manage the reopen button visibility based on sidebar state
  useEffect(() => {
    setShowReopenButton(!isSidebarOpen);
  }, [isSidebarOpen]);

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
  function isAsyncJobResponse(response: unknown): response is AsyncJobResponse {
    // Check if response is an object and has processingId property
    return typeof response === 'object' && response !== null && 'processingId' in response && typeof (response as AsyncJobResponse).processingId === 'string';
  }

  // Define type for transcript mutation arguments
  type TranscriptMutationArgs = {
    videoUrl: string;
    lang: string;
    skipAI: boolean;
    useDeepSeek: boolean;
  };

  const transcriptMutation = useMutation<
    TranscriptResponse | AsyncJobResponse,
    Error,
    TranscriptMutationArgs
  >({
    mutationFn: (args: TranscriptMutationArgs) => {
      console.log('[IndexPage] transcriptMutation.mutationFn called with args:', args);
      return videoApi.getVideoTranscript(args.videoUrl, args.lang, args.skipAI, args.useDeepSeek);
    },
    onSuccess: (data, variables) => { // Added variables here
      console.log('[IndexPage] Transcript Mutation onSuccess:', data);
      setErrorForSidebar(null);
      setCurrentProcessingId(null); // Clear any previous processing ID

      // Include used parameters in sidebarData
      const baseSidebarData = {
        originalUrl: variables.videoUrl,
        requestedLang: variables.lang,
        requestedSkipAI: variables.skipAI,
        requestedUseDeepSeek: variables.useDeepSeek,
      };

      if (isAsyncJobResponse(data)) {
        setSidebarTitle("Transcript Processing Started");
        setSidebarData({
          ...baseSidebarData,
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
        setSidebarData({ ...baseSidebarData, ...data });
        console.log('[IndexPage] Transcript received directly.');
      }
    },
    onError: (error, variables) => { // Added variables here
      console.error('[IndexPage] Transcript Mutation onError:', error);
      setCurrentProcessingId(null); // Stop polling on error
      setSidebarTitle("Error Fetching Transcript");
      setErrorForSidebar(error.message || "An unknown error occurred.");
      // Also include parameters in sidebarData on error, so user knows what failed
      setSidebarData({
        originalUrl: variables.videoUrl,
        requestedLang: variables.lang,
        requestedSkipAI: variables.skipAI,
        requestedUseDeepSeek: variables.useDeepSeek,
      });
    },
  });

  // Composite loading state for disabling form elements / showing processing
  // isProcessing should be true if any mutation is pending OR if we are actively polling.
  const isAnyMutationPending = infoMutation.isPending || downloadFileMutation.isPending || transcriptMutation.isPending;
  const isPollingActive = !!currentProcessingId;
  const [jobIdForResults, setJobIdForResults] = useState<string | null>(null);


  // --- Query for Polling Progress ---
  const { data: progressData, error: progressError, isLoading: isProgressLoading } = useQuery<ProgressResponse | null, Error>({
    queryKey: ['progress', currentProcessingId],
    queryFn: async () => {
      if (!currentProcessingId) return null;
      console.log(`[IndexPage] Polling progress for ${currentProcessingId}`);
      const progress = await videoApi.getProcessingProgress(currentProcessingId);
      setSidebarData(prevData => ({
        ...prevData, // Spread existing data first
        status: progress.status,
        progress: progress.progress,
        video_title: progress.video_title,
        lastUpdated: new Date().toLocaleTimeString(),
        message: `Status: ${progress.status}, Progress: ${progress.progress}%`,
        jobId: progress.id, // Ensure jobId is in sidebarData for result query
        // originalUrl will be preserved if already in prevData, or set initially when transcriptMutation runs
        originalUrl: prevData?.originalUrl || url, // Ensure originalUrl is maintained or set
      }));
      setErrorForSidebar(null);

      if (progress.status === 'completed' || progress.status === 'failed' || progress.progress === 100) {
        console.log(`[IndexPage] Progress for ${currentProcessingId} is ${progress.status} at ${progress.progress}%.`);
        // Stop this progress query
        queryClient.invalidateQueries({ queryKey: ['progress', currentProcessingId] });

        if (progress.status === 'completed' || (progress.status !== 'failed' && progress.progress === 100)) {
          setSidebarTitle("Finalizing Result...");
          setSidebarData(prev => ({ ...prev, status: "finalizing", message: "Progress complete. Fetching final result..."}));
          setJobIdForResults(currentProcessingId); // Enable result query
        } else { // Failed status from progress
          setSidebarTitle("Processing Failed");
          setErrorForSidebar(`Processing failed with status: ${progress.status}`);
          setSidebarData(prevData => ({
            ...(typeof prevData === 'object' ? prevData : {}),
            status: "processing_failed",
            message: `Error: Processing failed. Status: ${progress.status}`,
          }));
        }
        setCurrentProcessingId(null); // Clear currentProcessingId to stop this query's refetch interval
      }
      return progress;
    },
    enabled: !!currentProcessingId,
    refetchInterval: (query) => {
      // Check if query.state.data exists and is of type ProgressResponse
      const data = query.state.data as ProgressResponse | null;
      if (!currentProcessingId || (data && (data.status === 'completed' || data.status === 'failed' || data.progress === 100))) {
        return false; // Stop polling
      }
      return 5000; // Poll every 5 seconds
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    // onError callback removed, will be handled by useEffect
  });

  useEffect(() => {
    if (progressError) {
      console.error(`[IndexPage] Error polling progress for ${currentProcessingId}:`, progressError);
      setErrorForSidebar(progressError.message || "Error fetching progress.");
      // Consider stopping polling on certain errors by setCurrentProcessingId(null)
    }
  }, [progressError, currentProcessingId]);

  // --- Query for Fetching Final Result ---
  const { data: resultData, error: resultError, isLoading: isResultLoading, isFetching: isResultFetching } = useQuery<TranscriptResponse, Error>({
    queryKey: ['result', jobIdForResults],
    queryFn: async () => {
      if (!jobIdForResults) throw new Error("Job ID for result is missing.");
      console.log(`[IndexPage] Fetching result for ${jobIdForResults}`);
      setSidebarTitle("Fetching Final Result...");
      setSidebarData(prev => ({ ...prev, status: "fetching_result", message: "Fetching final result details..."}));
      return videoApi.getProcessingResult(jobIdForResults);
    },
    enabled: !!jobIdForResults,
    retry: (failureCount, error) => {
      if (error instanceof StillProcessingError) {
        console.log(`[IndexPage] Result for ${jobIdForResults} still processing (Attempt ${failureCount + 1}). Status: ${error.status}, Progress: ${error.progress}. Retrying...`);
        setSidebarData(prev => ({
          ...prev,
          status: error.status || "finalizing_still",
          progress: error.progress,
          message: `Result finalization is taking a bit longer. Status: ${error.status}, Progress: ${error.progress}%. Waiting...`,
        }));
        return failureCount < 5; // Retry up to 5 times for StillProcessingError
      }
      return failureCount < 2; // Default retry for other errors (e.g., network issues)
    },
    retryDelay: (attemptIndex, error) => {
        if (error instanceof StillProcessingError) {
            return Math.min(attemptIndex * 2000, 10000); // e.g., 0s, 2s, 4s, 6s, 8s, up to 10s
        }
        return attemptIndex * 1000; // Standard backoff for other errors
    },
    // onSuccess and onError callbacks removed, will be handled by useEffect
  });

  useEffect(() => {
    if (resultData) {
      // console.log(`[IndexPage] Result fetched successfully for ${jobIdForResults}. Raw data:`, JSON.parse(JSON.stringify(resultData)));
      const finalResultData: ProcessSidebarData = {
        success: resultData.success,
        title: resultData.title,
        language: resultData.language,
        transcript: resultData.transcript,
        ai_notes: resultData.ai_notes,
        isProcessed: resultData.isProcessed,
        processor: resultData.processor,
        video_id: resultData.video_id,
        channel_id: resultData.channel_id,
        channel_name: resultData.channel_name,
        post_date: resultData.post_date,
        status: "final_result_displayed",
      };
      // console.log('[IndexPage] Setting cleaned finalResultData to sidebar:', JSON.parse(JSON.stringify(finalResultData)));
      setSidebarTitle("Transcript Result");
      setSidebarData(finalResultData);
      setErrorForSidebar(null);
      setJobIdForResults(null);
      if (jobIdForResults) { // Ensure jobIdForResults is not null before invalidating
        queryClient.invalidateQueries({ queryKey: ['result', jobIdForResults] });
      }
    }
  }, [resultData, jobIdForResults, queryClient]);

  useEffect(() => {
    if (resultError) {
      console.error(`[IndexPage] Error fetching result for ${jobIdForResults}:`, resultError);
      if (!(resultError instanceof StillProcessingError)) {
        setSidebarTitle("Error Fetching Result");
        setErrorForSidebar(resultError.message || "Failed to get final result.");
        setSidebarData(prevData => ({
          ...(typeof prevData === 'object' ? prevData : {}),
          status: "result_error",
          message: `Failed to retrieve result: ${resultError.message}`,
        }));
      } else {
        setSidebarTitle("Error Fetching Result");
        setErrorForSidebar(`Result not available after multiple retries. Last status: ${resultError.status}, Progress: ${resultError.progress}%`);
        setSidebarData(prevData => ({
          ...(typeof prevData === 'object' ? prevData : {}),
          status: "result_error_timeout",
          message: `Result not available after multiple retries. Last status: ${resultError.status}, Progress: ${resultError.progress}%`,
        }));
      }
      // setJobIdForResults(null); // Optionally clear to stop further attempts on final error
    }
  }, [resultError, jobIdForResults]);


  const isProcessing = isAnyMutationPending || isPollingActive || isResultLoading || isResultFetching;
  // More refined sidebar loading state
  const isSidebarLoading =
    infoMutation.isPending ||
    downloadFileMutation.isPending ||
    transcriptMutation.isPending ||
    (isPollingActive && isProgressLoading && !progressData) || // Loading progress initially
    (!!jobIdForResults && (isResultLoading || isResultFetching) && !resultData); // Loading result initially or during retries


  useEffect(() => {
    // This effect is primarily for cleaning up blob URLs.
    // Error display for progress and result queries is handled by their respective onError callbacks.
    return () => {
      if (activeBlobUrl) {
        console.log('[IndexPage] Unmounting or new process, revoking active blob URL:', activeBlobUrl);
        URL.revokeObjectURL(activeBlobUrl);
        // setActiveBlobUrl(null); // Avoid setting state in cleanup if it causes loops; primary setActiveBlobUrl(null) calls are elsewhere
      }
    };
  }, [activeBlobUrl]); // Added activeBlobUrl to dependency array

  const handleProcess = () => {
    // Clear previous polling/result states if a new process is started
    setCurrentProcessingId(null);
    setJobIdForResults(null);
    queryClient.removeQueries({ queryKey: ['progress'] });
    queryClient.removeQueries({ queryKey: ['result'] });

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
        transcriptMutation.mutate({
          videoUrl: url,
          lang: transcriptLang,
          skipAI: transcriptSkipAI,
          useDeepSeek: transcriptUseDeepSeek,
        });
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
              <p className="text-gray-300 text-lg">Convert YouTube videos to MP3, MP4, get AI generated transcripts or video info</p>
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
                      onClick={() => {
                        if (!isProcessing) {
                          setSelectedOutput(option.id);
                        }
                      }}
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
                          selectedOutput === option.id ? 'bg-rose-600' : 'bg-rose-700/60 group-hover:bg-rose-600/80'
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

            {/* AI Transcript Options */}
            {selectedOutput === 'transcript' && (
              <div className="space-y-6 p-6 bg-gray-800/30 border border-gray-700/40 rounded-lg shadow-md mt-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4 border-b border-gray-600/50 pb-3">AI Transcript Options</h3>

                {/* Language Selection */}
                <div className="space-y-2">
                  <Label htmlFor="transcript-lang" className="text-gray-300 font-medium">Language</Label>
                  <Select
                    value={transcriptLang}
                    onValueChange={setTranscriptLang}
                    disabled={isProcessing}
                  >
                    <SelectTrigger id="transcript-lang" className="w-full bg-gray-700/50 border-gray-600 text-gray-100 focus:bg-gray-700 focus:border-gray-500">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                      {transcriptLanguages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value} className="hover:bg-gray-700 focus:bg-gray-700">
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Skip AI Checkbox */}
                <div className="flex items-center space-x-3 pt-2">
                  <Checkbox
                    id="skip-ai"
                    checked={transcriptSkipAI}
                    onCheckedChange={(checked) => setTranscriptSkipAI(checked as boolean)}
                    disabled={isProcessing}
                    className="border-gray-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 focus-visible:ring-blue-400"
                  />
                  <Label htmlFor="skip-ai" className="text-gray-300 font-medium cursor-pointer">
                    Skip AI Post-processing (Plain Transcript)
                  </Label>
                </div>

                {/* Use DeepSeek Checkbox */}
                <div className="flex items-center space-x-3 pt-2">
                  <Checkbox
                    id="use-deepseek"
                    checked={transcriptUseDeepSeek}
                    onCheckedChange={(checked) => setTranscriptUseDeepSeek(checked as boolean)}
                    disabled={isProcessing}
                    className="border-gray-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 focus-visible:ring-purple-400"
                  />
                  <Label htmlFor="use-deepseek" className="text-gray-300 font-medium cursor-pointer">
                    Use DeepSeek Model (Advanced AI)
                  </Label>
                </div>
                 <p className="text-xs text-gray-400 mt-2">
                    Note: DeepSeek typically provides higher quality results but may take longer. Deselecting it might use a faster, alternative model if available. If "Skip AI" is checked, this option has no effect.
                  </p>
              </div>
            )}

            {/* Process Button */}
            <div className="relative pt-4"> {/* Added pt-4 for spacing if AI options are shown */}
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
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-7 h-7" />
                      <span>Start Process</span>
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
            // setShowReopenButton(false); // Logic changed: button visibility now tied to isSidebarOpen state directly via useEffect
          }}
          className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-slate-600 hover:bg-slate-500 text-white p-4 rounded-l-lg shadow-xl animate-pulse border-2 border-slate-400 h-32" // Added h-32 for increased height
          title="Reopen Sidebar"
        >
          <ChevronsLeft className="h-10 w-10" /> {/* Increased icon size further */}
        </Button>
      )}

      <Footer />
    </div>
  );
};

export default Index;
