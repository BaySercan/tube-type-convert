import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, InfoIcon, AlertTriangleIcon, Download, Loader2, Youtube, FileText, Clock, BrainCircuit } from "lucide-react";
import JsonView from '@uiw/react-json-view';
import { darkTheme } from '@uiw/react-json-view/dark';
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getLanguageName } from "@/lib/utils";

export interface SidebarData {
  processingId?: string;
  message?: string;
  progressEndpoint?: string;
  resultEndpoint?: string;
  originalUrl?: string;
  requestedLang?: string;
  requestedSkipAI?: boolean;
  requestedAiModel?: string;
  status?: string;
  progress?: number;
  video_title?: string;
  lastUpdated?: string;
  mediaUrl?: string;
  fileName?: string;
  mediaType?: 'audio/mpeg' | 'video/mp4' | string;
  [key: string]: unknown;
}

interface ProcessSidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  data: SidebarData | null;
  isLoading?: boolean;
  error?: string | null;
}

const YouTubeEmbed = ({ url }: { url: string }) => {
  const videoId = useMemo(() => {
    try {
      const videoUrl = new URL(url);
      if (videoUrl.hostname === "youtu.be") return videoUrl.pathname.slice(1);
      if (videoUrl.hostname.includes("youtube.com")) return videoUrl.searchParams.get("v");
    } catch (e) { console.error("Invalid YouTube URL for embedding:", e); }
    return null;
  }, [url]);

  if (!videoId) return <div className="aspect-video w-full bg-black flex items-center justify-center text-white rounded-lg"><p>Invalid YouTube URL</p></div>;

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-700 shadow-lg">
      <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
    </div>
  );
};

export const ProcessSidebar: React.FC<ProcessSidebarProps> = ({ isOpen, onOpenChange, title, data, isLoading = false, error = null }) => {
  const funnyWaitingMessages = useMemo(() => ["Reticulating splines...", "Generating witty dialog...", "Spinning up the hamster..."], []);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(funnyWaitingMessages[0]);
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentProcessingIdRef = useRef<string | null>(null);

  const isTranscriptRequest = useMemo(() => !!data?.requestedLang, [data]);
  const isProcessFinished = useMemo(() => ['completed', 'failed', 'result_error', 'processing_failed', 'final_result_displayed', 'finalizing', 'fetching_result'].includes(data?.status || ""), [data?.status]);
  const isPollingProgress = useMemo(() => data?.processingId && typeof data.progress === 'number' && !isProcessFinished, [data]);

  const jsonDataForViewer = useMemo(() => data ? Object.fromEntries(Object.entries(data).filter(([key]) => !['processingId', 'message', 'progressEndpoint', 'resultEndpoint', 'status', 'progress', 'video_title', 'lastUpdated', 'mediaUrl', 'mediaType', 'fileName', 'requestedLang', 'requestedSkipAI', 'requestedAiModel', 'originalUrl'].includes(key))) : {}, [data]);
  const hasJsonDataForViewer = Object.keys(jsonDataForViewer).length > 0;
  
  useEffect(() => {
    let messageInterval: NodeJS.Timeout;
    if (isLoading && !isPollingProgress && !isProcessFinished) {
      messageInterval = setInterval(() => setCurrentLoadingMessage(funnyWaitingMessages[Math.floor(Math.random() * funnyWaitingMessages.length)]), 3000);
    }
    return () => clearInterval(messageInterval);
  }, [isLoading, isPollingProgress, isProcessFinished, funnyWaitingMessages]);

  // This is the single, definitive timer management effect.
  useEffect(() => {
    // Condition to reset: It's a new transcript job.
    if (isTranscriptRequest && data?.processingId && data.processingId !== currentProcessingIdRef.current) {
        currentProcessingIdRef.current = data.processingId;
        setElapsedTime(0);
        startTimeRef.current = null; // Will be set when timer starts
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    } else if (!isTranscriptRequest) {
      // If it's not a transcript request, ensure everything is reset.
      currentProcessingIdRef.current = null;
      startTimeRef.current = null;
      setElapsedTime(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    const shouldRunTimer = isTranscriptRequest && !isProcessFinished;

    if (shouldRunTimer) {
        if (intervalRef.current === null) { // Start timer only if it's not already running.
            startTimeRef.current = startTimeRef.current ?? Date.now();
            intervalRef.current = setInterval(() => {
                setElapsedTime(Date.now() - (startTimeRef.current ?? Date.now()));
            }, 1000);
        }
    } else { // If the timer should not be running.
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            // When the process finishes, do one last update to get the exact final time.
            if (isProcessFinished && startTimeRef.current) {
                setElapsedTime(Date.now() - startTimeRef.current);
            }
        }
    }

    // Final cleanup when the component unmounts
    return () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };
  }, [data?.processingId, isTranscriptRequest, isProcessFinished]);


  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleCopyJson = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(jsonDataForViewer, null, 2)).catch(err => console.error("Failed to copy: ", err));
    }
  };

  const renderCard = (title: string, Icon: React.ElementType, content: React.ReactNode, cardClassName?: string) => (
    <Card className={`bg-slate-800/60 border-slate-700 text-slate-200 shadow-lg ${cardClassName}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold flex items-center text-white">
          <Icon className="w-5 h-5 mr-3 text-cyan-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );

  const transcriptOptionsCard = data && (data.requestedLang || data.requestedSkipAI !== undefined) && (
    renderCard("Transcript Options", FileText, (
      <div className="space-y-1 text-sm text-slate-300">
        {data.requestedLang && <p><strong>Language:</strong> {getLanguageName(data.requestedLang)}</p>}
        {typeof data.requestedSkipAI !== 'undefined' && <p><strong>Skip AI:</strong> {data.requestedSkipAI ? 'Yes' : 'No'}</p>}
        {!data.requestedSkipAI && data.requestedAiModel && <p><strong>AI Model:</strong> {data.requestedAiModel.charAt(0).toUpperCase() + data.requestedAiModel.slice(1)}</p>}
      </div>
    ))
  );

  const processingStatusCard = data && (isTranscriptRequest || isProcessFinished) && (
    renderCard("Processing Status", Clock, (
      <div className="space-y-2">
        {data.video_title && <p className="text-sm"><strong>Video:</strong> {data.video_title}</p>}
        <p className="text-sm"><strong>Status:</strong> <span className={`font-semibold ${isProcessFinished ? 'text-green-400' : 'text-amber-400'}`}>{data.status}</span></p>
        <Progress value={isProcessFinished ? 100 : data.progress || 0} className="w-full h-3 bg-slate-700" />
        <p className="text-xs text-right text-slate-400">{isProcessFinished ? 100 : data.progress || 0}% complete</p>
      </div>
    ))
  );

  const elapsedTimeCard = isTranscriptRequest && data?.processingId && (
    renderCard(isProcessFinished ? "Total Time" : "Elapsed Time", Clock, <p className="text-2xl font-mono text-cyan-400 tracking-wider text-center">{formatTime(elapsedTime)}</p>, "items-center justify-center")
  );

  const apiLinksCard = data && (isTranscriptRequest || isProcessFinished) && (data.progressEndpoint || data.resultEndpoint) && (
    renderCard("API Links", ExternalLink, (
      <div className="space-y-1">
        {data.progressEndpoint && data.processingId && <Link to={`/progress/${data.processingId}`} state={{ videoUrl: data.originalUrl, videoTitle: data.video_title }} target="_blank" className="text-blue-400 hover:underline text-sm flex items-center">View Progress Page <ExternalLink className="inline-block ml-1 h-3 w-3" /></Link>}
        {data.resultEndpoint && data.processingId && <Link to={`/result/${data.processingId}`} state={{ videoUrl: data.originalUrl, videoTitle: data.video_title }} target="_blank" className="text-blue-400 hover:underline text-sm flex items-center">View Result Page <ExternalLink className="inline-block ml-1 h-3 w-3" /></Link>}
      </div>
    ))
  );

  const jsonResultCard = hasJsonDataForViewer && (
    renderCard("Result JSON", BrainCircuit, (
      <div className="relative rounded-md bg-slate-900/70 border border-slate-700 w-full overflow-hidden">
        <Button variant="ghost" size="icon" onClick={handleCopyJson} className="absolute top-2 right-2 text-slate-400 hover:text-white z-10" title="Copy JSON"><Copy className="h-4 w-4" /></Button>
        <JsonView value={jsonDataForViewer} displayObjectSize displayDataTypes enableClipboard={false} collapsed={false} style={{...darkTheme, padding: '1rem', paddingTop: '2.5rem'}} />
      </div>
    ))
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl w-[95vw] flex flex-col bg-slate-900 border-l border-slate-800 text-white">
        <SheetHeader className="px-6 py-4 border-b border-slate-800">
          <SheetTitle className="text-xl font-bold flex items-center text-white"><Youtube className="w-6 h-6 mr-3 text-red-500" /> {title}</SheetTitle>
          <SheetDescription className="text-slate-400">{error ? "An error occurred." : "Process details and results."}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-grow p-4">
          <div className="p-3 mb-4 w-full border border-red-600 bg-red-800/80 rounded-md text-red-100 text-xs">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-300 flex-shrink-0" />
              <p><strong>Important:</strong> Results are temporary. Please save your data as it will be lost on refresh.</p>
            </div>
          </div>

          {isTranscriptRequest && !isProcessFinished && (
            <div className="p-3 mb-4 border border-sky-600 bg-sky-900/60 rounded-md text-sky-100 text-xs shadow">
              <div className="flex items-center space-x-2">
                <InfoIcon className="h-5 w-5 text-sky-300 flex-shrink-0" />
                <p>AI transcription can take some time depending on the video length. Please be patient.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="space-y-4 lg:col-span-1">
              {data?.originalUrl && <YouTubeEmbed url={data.originalUrl} />}
              {isTranscriptRequest && transcriptOptionsCard}
            </div>
            
            {isTranscriptRequest && (
              <div className="space-y-4 lg:col-span-1">
                {processingStatusCard}
                {elapsedTimeCard}
                {apiLinksCard}
              </div>
            )}
            
            <div className="mt-4 space-y-4 lg:col-span-2">
              {!isTranscriptRequest && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transcriptOptionsCard}
                  {processingStatusCard}
                  {elapsedTimeCard}
                  {apiLinksCard}
                </div>
              )}
              {data?.mediaUrl && data.mediaType && renderCard("Media Preview", Download, (
                <div className="space-y-2">
                  {data.mediaType.startsWith('audio/') && <audio controls src={data.mediaUrl} className="w-full" />}
                  {data.mediaType.startsWith('video/') && <video controls src={data.mediaUrl} className="w-full rounded-md" style={{maxHeight: '300px'}} />}
                  {data.fileName && (
                    <>
                      <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-500" onClick={() => { const link = document.createElement('a'); link.href = data.mediaUrl!; link.download = data.fileName!; document.body.appendChild(link); link.click(); document.body.removeChild(link); }}><Download className="h-5 w-5 mr-2" /> Download {data.fileName}</Button>
                      <p className="text-xs text-gray-400 text-center mt-1">If your download didn't start, use this button.</p>
                    </>
                  )}
                </div>
              ))}
              {jsonResultCard}
            </div>
          </div>
          
          {isLoading && !isPollingProgress && !isProcessFinished && (
            <div className="flex flex-col items-center justify-center space-y-3 p-1">
              <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
              <p className="text-lg font-medium text-slate-300">{currentLoadingMessage}</p>
            </div>
          )}

          {error && renderCard("Error", AlertTriangleIcon, <pre className="whitespace-pre-wrap text-sm text-red-400 bg-red-900/30 p-3 rounded-md">{error}</pre>, "col-span-full")}
        </ScrollArea>

        <SheetFooter className="mt-auto px-6 py-4 border-t border-slate-800">
          <SheetClose asChild><Button variant="outline" className="bg-slate-700 border-slate-600 hover:bg-slate-600">Close</Button></SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
