import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Youtube, Download, FileText, Info, Music, Video, Zap, Sparkles, Loader2, ChevronsLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ProcessSidebar } from "@/components/ProcessSidebar";
import type { SidebarData as ProcessSidebarData } from "@/components/ProcessSidebar";
import * as videoApi from '@/lib/videoApi';
import { StillProcessingError } from '@/lib/videoApi';
import type { AsyncJobResponse, TranscriptResponse, ProgressResponse } from '@/lib/videoApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useVideoCache } from '@/hooks/useVideoCache';
import { ProcessedVideosService, UserVideoRequestsService } from '@/lib/db';
import { extractVideoId } from '@/lib/db/utils';


const Index = () => {
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');

  const [transcriptLang, setTranscriptLang] = useState('tr');
  const [transcriptSkipAI, setTranscriptSkipAI] = useState(false);
  const [aiModel, setAiModel] = useState('deepseek');
  const [infoType, setInfoType] = useState<'sum' | 'full'>('sum'); // Added state for info type

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarData, setSidebarData] = useState<ProcessSidebarData | null>(null);
  const [sidebarTitle, setSidebarTitle] = useState("Process Details");
  const [sidebarError, setErrorForSidebar] = useState<string | null>(null);
  const [showReopenButton, setShowReopenButton] = useState(true);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);

  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
  const [jobIdForResults, setJobIdForResults] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Use cache hook for current URL and selected output
  const { videoData: cachedVideoData, userHasRequested, isLoading: isCacheLoading, isRefreshing, error: cacheError, trackUserRequest, updateVideoWithRequest } = useVideoCache(url, selectedOutput as 'info' | 'transcript' | 'mp3' | 'mp4');

  const transcriptLanguages = [
    { value: 'tr', label: 'Turkish' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  const outputOptions = [
    { id: 'mp3', label: 'MP3 Audio', icon: Music, description: 'Extract audio as MP3' },
    { id: 'mp4', label: 'MP4 Video', icon: Video, description: 'Download video as MP4' },
    { id: 'transcript', label: 'AI Transcript', icon: FileText, description: 'Get AI-powered video transcript', isAI: true },
    { id: 'info', label: 'Video Info', icon: Info, description: 'Get video metadata' }
  ];

  useEffect(() => {
    if (selectedOutput !== 'transcript') {
      setTranscriptLang('tr');
      setTranscriptSkipAI(false);
      setAiModel('deepseek');
    }
  }, [selectedOutput]);

  const isValidYouTubeUrl = (url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return regex.test(url);
  };

  const openSidebarForAction = (title: string, data: ProcessSidebarData | null = null) => {
    setSidebarTitle(title);
    setSidebarData(data);
    setErrorForSidebar(null);
    setIsSidebarOpen(true);
  };

  const handleSidebarOpenChange = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
    if (!isOpen && activeBlobUrl) {
      URL.revokeObjectURL(activeBlobUrl);
      setActiveBlobUrl(null);
    }
  };

  const handleJobCanceled = (processingId: string) => {
    // Reset all processing states to beginning
    setCurrentProcessingId(null);
    setJobIdForResults(null);
    setSidebarData(null);
    setSidebarTitle("Process Details");
    setErrorForSidebar(null);
    
    // Clear all related queries
    queryClient.removeQueries({ queryKey: ['progress'] });
    queryClient.removeQueries({ queryKey: ['result'] });
    
    // Reset mutations
    infoMutation.reset();
    downloadFileMutation.reset();
    transcriptMutation.reset();
  };

  useEffect(() => {
    setShowReopenButton(!isSidebarOpen);
  }, [isSidebarOpen]);

  // For Video Info
  type InfoMutationArgs = { videoUrl: string; infoType: 'sum' | 'full' };
  const infoMutation = useMutation<videoApi.VideoInfo, Error, InfoMutationArgs>({
    mutationFn: async (args) => {
      return videoApi.getVideoInfo(args.videoUrl, args.infoType);
    },
    onSuccess: async (data, variables) => { // 'data' here is the full VideoInfo object
      setSidebarTitle(`Video Information (${variables.infoType === 'sum' ? 'Summary' : 'Full Details'})`);
      
      // Update database with new info result and metadata
      await updateVideoWithRequest({
        video_id: extractVideoId(variables.videoUrl),
        info_result: data as unknown as Record<string, unknown>,
        title: data.title,
        channel_id: data.channel_id,
        video_url: variables.videoUrl,
        language: 'en', // Default language for info
        thumbnail_url: data.thumbnail,
        duration: data.duration_string // Use duration_string as string
      });

      const displayData: ProcessSidebarData = {
        ...data, // Spread the API response
        originalUrl: variables.videoUrl,
        type: 'info', // Type is now directly 'info'
        status: 'completed', // Info requests are typically quick and 'completed'
        progress: 100,
        // processingId might not be relevant for info, unless we make one up
      };
      setSidebarData(displayData);
      setErrorForSidebar(null);
    },
    onError: (error, variables) => {
      setSidebarTitle("Error Fetching Info");
      setErrorForSidebar(error.message || "An unknown error occurred.");
      setSidebarData({
        originalUrl: variables.videoUrl,
        type: 'info', // Type is now directly 'info'
        status: 'failed'
      });
    },
  });

  type DownloadArgs = { url: string; format: 'mp3' | 'mp4' };

  const downloadFileMutation = useMutation<Blob, Error, DownloadArgs>({
    mutationFn: async (args) => {
      return args.format === 'mp3' ? videoApi.downloadMp3(args.url) : videoApi.downloadMp4(args.url);
    },
    onSuccess: async (blob, variables) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const videoIdMatch = variables.url.match(/[?&]v=([^&]+)/);
      const fileName = videoIdMatch ? `${videoIdMatch[1]}.${variables.format}` : `video.${variables.format}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
      setActiveBlobUrl(link.href);

      // Update database with download request
      await updateVideoWithRequest({
        video_id: extractVideoId(variables.url),
        title: fileName,
        video_url: variables.url
      });

      setSidebarTitle(`${variables.format.toUpperCase()} Ready`);
      setSidebarData({
        message: `${variables.format.toUpperCase()} is ready. Download has started. You can also play it here.`,
        fileName,
        mediaUrl: link.href,
        mediaType: variables.format === 'mp3' ? 'audio/mpeg' : 'video/mp4',
        originalUrl: variables.url,
      });
      setErrorForSidebar(null);
    },
    onError: async (error, variables) => {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
        setActiveBlobUrl(null);
      }
      setSidebarTitle(`Error Downloading ${variables.format.toUpperCase()}`);
      setErrorForSidebar(error.message || "An unknown error occurred.");
      setSidebarData({ originalUrl: variables.url });
    },
  });

  // Type guard to check if response is AsyncJobResponse (moved here)
  const isAsyncJobResponse = (response: unknown): response is AsyncJobResponse => {
    return typeof response === 'object' && response !== null && 'processingId' in response && typeof (response as AsyncJobResponse).processingId === 'string';
  };

  type TranscriptMutationArgs = {
    videoUrl: string;
    lang: string;
    skipAI: boolean;
    useDeepSeek: boolean;
  };

  const transcriptMutation = useMutation<TranscriptResponse | AsyncJobResponse, Error, TranscriptMutationArgs>({
    mutationFn: async (args) => {
      return videoApi.getVideoTranscript(args.videoUrl, args.lang, args.skipAI, args.useDeepSeek);
    },
    onSuccess: async (data, variables) => {
      setErrorForSidebar(null);
      setCurrentProcessingId(null);

      // Track user request for both async and direct responses
      await trackUserRequest();

      const baseSidebarData = {
        originalUrl: variables.videoUrl,
        requestedLang: variables.lang,
        requestedSkipAI: variables.skipAI,
        requestedAiModel: aiModel,
      };

      if (isAsyncJobResponse(data)) {
        setSidebarTitle("Transcript Processing Started");
        setSidebarData({
          ...baseSidebarData,
          ...data, // This includes processingId
          status: "queued", // Optimistically set to 'queued' or 'processing'
          type: 'transcript', // Ensure type is explicitly set
        });
        setCurrentProcessingId(data.processingId);
      } else {
        setSidebarTitle("Video Transcript");
        setSidebarData({ ...baseSidebarData, ...data, status: "final_result_displayed", progress: 100 });
        
        // Get video info first to extract thumbnail and duration
        try {
          const videoInfo = await videoApi.getVideoInfo(variables.videoUrl, 'sum');
          
          // Update database with transcript result and metadata
          await updateVideoWithRequest({
            video_id: extractVideoId(variables.videoUrl),
            transcript_result: data as unknown as Record<string, unknown>,
            title: data.title,
            channel_id: data.channel_id,
            video_url: variables.videoUrl,
            language: variables.lang,
            thumbnail_url: videoInfo.thumbnail,
            duration: videoInfo.duration_string // Use duration_string as string
          });

          console.log('✅ Transcript result saved to database successfully');
        } catch (infoError) {
          console.error('Error fetching video info for metadata:', infoError);
          // Still update with transcript result even if info fetch fails
          await updateVideoWithRequest({
            video_id: extractVideoId(variables.videoUrl),
            transcript_result: data as unknown as Record<string, unknown>,
            title: data.title,
            channel_id: data.channel_id,
            video_url: variables.videoUrl,
            language: variables.lang
          });

          console.log('✅ Transcript result saved to database (without metadata)');
        }
      }
    },
    onError: async (error, variables) => {
      setCurrentProcessingId(null);
      setSidebarTitle("Error Fetching Transcript");
      setErrorForSidebar(error.message || "An unknown error occurred.");
      setSidebarData({
        originalUrl: variables.videoUrl,
        requestedLang: variables.lang,
        requestedSkipAI: variables.skipAI,
        requestedAiModel: aiModel,
        status: "failed",
      });
    },
  });

  const { data: progressData, error: progressError } = useQuery<ProgressResponse | null, Error>({
    queryKey: ['progress', currentProcessingId],
    queryFn: async () => {
      if (!currentProcessingId) return null;
      const progress = await videoApi.getProcessingProgress(currentProcessingId);
      setSidebarData(prevData => ({ ...prevData, ...progress }));
      return progress;
    },
    enabled: !!currentProcessingId,
    refetchInterval: (query) => {
      const data = query.state.data as ProgressResponse | null;
      if (!currentProcessingId || (data && (data.status === 'completed' || data.status === 'failed' || data.progress === 100))) {
        return false;
      }
      return 5000;
    },
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (progressData && (progressData.status === 'completed' || progressData.status === 'failed' || progressData.progress === 100)) {
      queryClient.invalidateQueries({ queryKey: ['progress', currentProcessingId] });
      if (progressData.status === 'completed' || (progressData.status !== 'failed' && progressData.progress === 100)) {
        setSidebarTitle("Finalizing Result...");
        setSidebarData(prev => ({ ...prev, status: "finalizing" }));
        setJobIdForResults(currentProcessingId);
      } else {
        setSidebarTitle("Processing Failed");
        setErrorForSidebar(`Processing failed with status: ${progressData.status}`);
        setSidebarData(prevData => ({ ...prevData, status: "processing_failed" }));
      }
      setCurrentProcessingId(null);
    }
  }, [progressData, currentProcessingId, queryClient]);

  useEffect(() => {
    if (progressError) {
      setErrorForSidebar(progressError.message || "Error fetching progress.");
    }
  }, [progressError]);

  const { data: resultData, error: resultError } = useQuery<TranscriptResponse, Error>({
    queryKey: ['result', jobIdForResults],
    queryFn: async () => {
      if (!jobIdForResults) throw new Error("Job ID for result is missing.");
      setSidebarTitle("Fetching Final Result...");
      setSidebarData(prev => ({ ...prev, status: "fetching_result" }));
      return videoApi.getProcessingResult(jobIdForResults);
    },
    enabled: !!jobIdForResults,
    retry: (failureCount, error) => {
      if (error instanceof StillProcessingError) {
          return failureCount < 10;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex, error) => {
        if (error instanceof StillProcessingError) {
            return Math.min(attemptIndex * 2000, 10000);
        }
        return attemptIndex * 1000;
    },
  });

  useEffect(() => {
    if (resultData) {
      setSidebarData(prevData => ({
        ...prevData,
        ...resultData,
        status: "final_result_displayed",
        progress: 100,
        // Ensure processingId is kept to maintain timer display
        processingId: prevData?.processingId || (isAsyncJobResponse(resultData) ? resultData.processingId : undefined),
      }));
      setSidebarTitle("Transcript Result");
      setErrorForSidebar(null);
      setJobIdForResults(null);
      queryClient.invalidateQueries({ queryKey: ['result', jobIdForResults] });

      // Save transcript result to database for async job completion
      const saveTranscriptToDatabase = async () => {
        try {
          const videoId = extractVideoId(sidebarData?.originalUrl || '');
          if (!videoId) return;

          // Get video info first to extract thumbnail and duration
          try {
            const videoInfo = await videoApi.getVideoInfo(sidebarData?.originalUrl || '', 'sum');
            
            // Update database with transcript result and metadata
            await updateVideoWithRequest({
              video_id: videoId,
              transcript_result: resultData as unknown as Record<string, unknown>,
              title: resultData.title,
              channel_id: resultData.channel_id,
              video_url: sidebarData?.originalUrl,
              language: sidebarData?.requestedLang || 'en',
              thumbnail_url: videoInfo.thumbnail,
              duration: videoInfo.duration_string // Use duration_string as string
            });

            console.log('✅ Transcript result saved to database successfully');
          } catch (infoError) {
            console.error('Error fetching video info for metadata:', infoError);
            // Still update with transcript result even if info fetch fails
            await updateVideoWithRequest({
              video_id: videoId,
              transcript_result: resultData as unknown as Record<string, unknown>,
              title: resultData.title,
              channel_id: resultData.channel_id,
              video_url: sidebarData?.originalUrl,
              language: sidebarData?.requestedLang || 'en'
            });

            console.log('✅ Transcript result saved to database (without metadata)');
          }
        } catch (error) {
          console.error('Error saving transcript result to database:', error);
        }
      };

      // Save transcript result to database
      saveTranscriptToDatabase();
    }
  }, [resultData, jobIdForResults, queryClient, sidebarData, updateVideoWithRequest]);

  useEffect(() => {
    if (resultError) {
      setErrorForSidebar(resultError.message || "Failed to get final result.");
      setSidebarData(prevData => ({ ...prevData, status: "result_error" }));
    }
  }, [resultError]);

  const isProcessing = infoMutation.isPending || downloadFileMutation.isPending || transcriptMutation.isPending || !!currentProcessingId || !!jobIdForResults;
  const isSidebarLoading = isProcessing;

  const handleRefreshData = async () => {
    // Preserve the originalUrl and other important data, just show loading state
    setSidebarData(prevData => ({
      ...prevData,
      status: 'initiated',
      progress: 0,
      type: selectedOutput as ProcessSidebarData['type']
    }));
    setErrorForSidebar(null);
    
    // Track user request for refresh
    await trackUserRequest();

    // Make fresh API call
    openSidebarForAction(`Refreshing ${selectedOutput.toUpperCase()}...`);

    switch (selectedOutput) {
      case 'info':
        infoMutation.mutate({ videoUrl: url, infoType: infoType });
        break;
      case 'mp3':
        downloadFileMutation.mutate({ url, format: 'mp3' });
        break;
      case 'mp4':
        downloadFileMutation.mutate({ url, format: 'mp4' });
        break;
      case 'transcript':
        transcriptMutation.mutate({ videoUrl: url, lang: transcriptLang, skipAI: transcriptSkipAI, useDeepSeek: aiModel === 'deepseek' });
        break;
      default:
        toast({ title: "Error", description: "Invalid output type selected.", variant: "destructive" });
    }
  };

  const handleProcess = () => {
    setCurrentProcessingId(null);
    setJobIdForResults(null);
    queryClient.removeQueries({ queryKey: ['progress'] });
    queryClient.removeQueries({ queryKey: ['result'] });

    if (activeBlobUrl) {
      URL.revokeObjectURL(activeBlobUrl);
      setActiveBlobUrl(null);
    }

    // Clear cache errors when starting new processing
    if (cacheError) {
      // The cache error will be cleared by the useEffect in useVideoCache
    }

    if (!url.trim() || !isValidYouTubeUrl(url)) {
      toast({ title: "Invalid URL", description: "Please enter a valid YouTube URL", variant: "destructive" });
      return;
    }
    if (!selectedOutput) {
      toast({ title: "Output Type Required", description: "Please select an output type", variant: "destructive" });
      return;
    }

    // Check if we have cached data for info requests
    if (selectedOutput === 'info' && cachedVideoData?.info_result) {
      // Show cached data first
      setSidebarTitle(`Cached Video Information`);
      setSidebarData({
        originalUrl: url,
        type: 'info',
        status: 'completed',
        progress: 100,
        cachedVideoData: cachedVideoData,
        lastRequested: cachedVideoData.updated_at || cachedVideoData.created_at
      });
      setErrorForSidebar(null);
      setIsSidebarOpen(true);
      return; // Don't make API call, show cached data
    }

    // Check if we have cached data for transcript requests
    if (selectedOutput === 'transcript' && cachedVideoData?.transcript_result) {
      // Track user request and update database even for cached data
      const handleCachedTranscript = async () => {
        await trackUserRequest();
        await updateVideoWithRequest({
          video_id: extractVideoId(url),
          video_url: url
        });
      };
      handleCachedTranscript();

      // Show cached data first
      setSidebarTitle(`Cached Transcript`);
      setSidebarData({
        originalUrl: url,
        type: 'transcript',
        status: 'completed',
        progress: 100,
        cachedVideoData: cachedVideoData,
        lastRequested: cachedVideoData.updated_at || cachedVideoData.created_at
      });
      setErrorForSidebar(null);
      setIsSidebarOpen(true);
      return; // Don't make API call, show cached data
    }

    // No cached data or user wants fresh data, proceed with API call
    const initialData: ProcessSidebarData = {
      originalUrl: url,
      status: 'initiated',
      progress: 0,
      type: selectedOutput as ProcessSidebarData['type'] // Align with SidebarData['type'] more directly
    };
    openSidebarForAction(`Preparing ${selectedOutput.toUpperCase()}...`, initialData);

    // Clear any existing sidebar errors when starting new process
    setErrorForSidebar(null);

    // Track user request before making API call
    trackUserRequest();

    switch (selectedOutput) {
      case 'info':
        infoMutation.mutate({ videoUrl: url, infoType: infoType });
        break;
      case 'mp3':
        downloadFileMutation.mutate({ url, format: 'mp3' });
        break;
      case 'mp4':
        downloadFileMutation.mutate({ url, format: 'mp4' });
        break;
      case 'transcript':
        transcriptMutation.mutate({ videoUrl: url, lang: transcriptLang, skipAI: transcriptSkipAI, useDeepSeek: aiModel === 'deepseek' });
        break;
      default:
        toast({ title: "Error", description: "Invalid output type selected.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 overflow-hidden">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-40 left-1/2 w-60 h-60 bg-zinc-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
        </div>

        <Card className="w-full max-w-2xl bg-gray-800/20 backdrop-blur-lg border-gray-700/30 shadow-2xl relative z-10">
          <div className="p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-3 bg-red-500 rounded-full">
                  <Youtube className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-100">YouTube Converter</h1>
              </div>
              <p className="text-gray-300 text-lg">Convert YouTube videos to MP3, MP4, get AI generated transcripts or video info</p>
            </div>

            <div className="space-y-3">
              <label className="text-gray-200 font-medium block">YouTube URL</label>
              <Input type="url" placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)" value={url} onChange={(e) => setUrl(e.target.value)} disabled={isProcessing} className="bg-gray-800/30 border-gray-600/50 text-gray-100 placeholder:text-gray-400 h-12 text-lg backdrop-blur-sm focus:bg-gray-800/50 focus:border-gray-500 transition-all duration-300" />
            </div>

            <div className="space-y-4">
              <label className="text-gray-200 font-medium block">Choose Output Type</label>
              <div className="grid grid-cols-2 gap-4">
                {outputOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button key={option.id} onClick={() => !isProcessing && setSelectedOutput(option.id)} disabled={isProcessing} className={`p-4 rounded-lg border-2 transition-all duration-300 text-left group hover:scale-105 relative ${selectedOutput === option.id ? 'border-gray-400 bg-gray-700/40 shadow-lg shadow-gray-700/25' : 'border-gray-600/40 bg-gray-800/20 hover:border-gray-500/60 hover:bg-gray-700/30'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {option.isAI && <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-1 animate-pulse"><Sparkles className="w-4 h-4 text-white" /></div>}
                      <div className="flex flex-col items-center space-y-2 md:flex-row md:items-start md:space-y-0 md:space-x-3 text-center md:text-left">
                        <div className={`p-2 rounded-lg transition-colors ${selectedOutput === option.id ? 'bg-rose-600' : 'bg-rose-700/60 group-hover:bg-rose-600/80'}`}><IconComponent className="w-6 h-6 md:w-5 md:h-5 text-gray-100" /></div>
                        <div className="flex-1">
                          <div className="flex flex-col items-center md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-2">
                            <h3 className="text-gray-100 font-semibold break-words">{option.label}</h3>
                            {option.isAI && <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full font-medium">AI</span>}
                          </div>
                          <p className="text-gray-400 text-sm mt-1 break-words">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedOutput === 'transcript' && (
              <div className="space-y-6 p-6 bg-gray-800/30 border border-gray-700/40 rounded-lg shadow-md mt-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4 border-b border-gray-600/50 pb-3">AI Transcript Options</h3>
                <div className="space-y-2">
                  <Label htmlFor="transcript-lang" className="text-gray-300 font-medium">Language</Label>
                  <Select value={transcriptLang} onValueChange={setTranscriptLang} disabled={isProcessing}>
                    <SelectTrigger id="transcript-lang" className="w-full bg-gray-700/50 border-gray-600 text-gray-100 focus:bg-gray-700 focus:border-gray-500"><SelectValue placeholder="Select language" /></SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                      {transcriptLanguages.map(lang => <SelectItem key={lang.value} value={lang.value} className="hover:bg-gray-700 focus:bg-gray-700">{lang.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-3 pt-2">
                  <Checkbox id="skip-ai" checked={transcriptSkipAI} onCheckedChange={(checked) => setTranscriptSkipAI(checked as boolean)} disabled={isProcessing} className="border-gray-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 focus-visible:ring-blue-400" />
                  <Label htmlFor="skip-ai" className="text-gray-300 font-medium cursor-pointer">Skip AI Post-processing (Plain Transcript)</Label>
                </div>
                {!transcriptSkipAI && (
                  <div className="space-y-3 pt-4">
                    <Label className="text-gray-300 font-medium">Select AI Model</Label>
                    <RadioGroup value={aiModel} onValueChange={setAiModel} className="space-y-2" disabled={isProcessing}>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="deepseek" id="deepseek-model" className="border-gray-500 data-[state=checked]:border-purple-500 data-[state=checked]:text-purple-500 focus-visible:ring-purple-400"/>
                        <Label htmlFor="deepseek-model" className="text-gray-300 font-normal cursor-pointer">DeepSeek</Label>
                      </div>
                      <p className="text-xs text-gray-400 ml-7">Slower, but generally more stable and accurate results.</p>
                      <div className="flex items-center space-x-3 pt-2">
                        <RadioGroupItem value="qwen" id="qwen-model" className="border-gray-500 data-[state=checked]:border-teal-500 data-[state=checked]:text-teal-500 focus-visible:ring-teal-400"/>
                        <Label htmlFor="qwen-model" className="text-gray-300 font-normal cursor-pointer">Qwen</Label>
                      </div>
                      <p className="text-xs text-gray-400 ml-7">Faster, but can be less predictable for some content.</p>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}

            {selectedOutput === 'info' && (
              <div className="space-y-6 p-6 bg-gray-800/30 border border-gray-700/40 rounded-lg shadow-md mt-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4 border-b border-gray-600/50 pb-3">Video Info Options</h3>
                <div className="space-y-3 pt-4">
                  <Label className="text-gray-300 font-medium">Select Information Detail</Label>
                  <RadioGroup value={infoType} onValueChange={(value) => setInfoType(value as 'sum' | 'full')} className="space-y-2" disabled={isProcessing}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="sum" id="info-sum" className="border-gray-500 data-[state=checked]:border-green-500 data-[state=checked]:text-green-500 focus-visible:ring-green-400"/>
                      <Label htmlFor="info-sum" className="text-gray-300 font-normal cursor-pointer">Summary</Label>
                    </div>
                    <p className="text-xs text-gray-400 ml-7">Provides a concise summary of video metadata. (Default)</p>
                    <div className="flex items-center space-x-3 pt-2">
                      <RadioGroupItem value="full" id="info-full" className="border-gray-500 data-[state=checked]:border-yellow-500 data-[state=checked]:text-yellow-500 focus-visible:ring-yellow-400"/>
                      <Label htmlFor="info-full" className="text-gray-300 font-normal cursor-pointer">Full Details</Label>
                    </div>
                    <p className="text-xs text-gray-400 ml-7">Provides all available video metadata. Can be very large.</p>
                  </RadioGroup>
                </div>
              </div>
            )}

            <div className="relative pt-4">
              <Button onClick={handleProcess} disabled={isProcessing || !url || !selectedOutput} className="w-full h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-500 hover:via-purple-500 hover:to-blue-600 text-white font-bold text-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border-0 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="relative flex items-center justify-center space-x-3">
                  {isProcessing ? <><Loader2 className="h-6 w-6 animate-spin" /><span>Processing...</span></> : <><Zap className="w-7 h-7" /><span>Start Process</span><Zap className="w-7 h-7" /></>}
                </div>
              </Button>
              {isProcessing && <p className="text-yellow-400 text-xs text-center mt-3 animate-pulse">A process is currently ongoing. Please wait for it to complete before starting a new one.</p>}
            </div>
          </div>
        </Card>
      </div>

      <ProcessSidebar 
        isOpen={isSidebarOpen} 
        onOpenChange={handleSidebarOpenChange} 
        title={sidebarTitle} 
        data={{
          ...sidebarData,
          cachedVideoData,
          lastRequested: cachedVideoData?.updated_at || cachedVideoData?.created_at
        }} 
        isLoading={isSidebarLoading || isCacheLoading} 
        isRefreshing={isRefreshing}
        error={sidebarError || cacheError}
        onJobCanceled={handleJobCanceled}
        onRefreshData={handleRefreshData}
      />

      {showReopenButton && <Button onClick={() => setIsSidebarOpen(true)} className="fixed top-1/2 right-0 -translate-y-1/2 z-50 bg-slate-600 hover:bg-slate-500 text-white p-4 rounded-l-lg shadow-xl animate-pulse border-2 border-slate-400 h-32" title="Reopen Sidebar"><ChevronsLeft className="h-10 w-10" /></Button>}

      <div id="pricing" className="py-16 bg-gray-800/10 hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Pricing</h2>
          <p className="text-gray-300 text-lg mb-8">Detailed pricing information will be available here soon.</p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-700/30 border-gray-600/50 text-gray-100">
              <CardHeader><CardTitle>Free Tier</CardTitle><CardDescription className="text-gray-400">Basic access</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">$0<span className="text-sm text-gray-400">/month</span></p><ul className="mt-4 space-y-2 text-gray-300"><li>Feature 1</li><li>Feature 2</li></ul></CardContent>
            </Card>
            <Card className="bg-gray-700/30 border-gray-600/50 text-gray-100">
              <CardHeader><CardTitle>Pro Tier</CardTitle><CardDescription className="text-gray-400">More features</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">$10<span className="text-sm text-gray-400">/month</span></p><ul className="mt-4 space-y-2 text-gray-300"><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li></ul></CardContent>
            </Card>
            <Card className="bg-gray-700/30 border-gray-600/50 text-gray-100">
              <CardHeader><CardTitle>Enterprise Tier</CardTitle><CardDescription className="text-gray-400">Custom solutions</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">Contact Us</p><ul className="mt-4 space-y-2 text-gray-300"><li>All Pro Features</li><li>Dedicated Support</li></ul></CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
