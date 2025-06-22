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
import { Copy, ExternalLink, InfoIcon, AlertTriangleIcon, Download, Loader2 } from "lucide-react";
import ReactJson from 'react-json-view';
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom"; // Import Link
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo

// Define a more specific type for the data prop
// This helps in accessing properties safely
export interface SidebarData { // Added export keyword
  // Properties from AsyncJobResponse (initial 202)
  processingId?: string;
  message?: string;       // Initial message or progress message
  progressEndpoint?: string;
  resultEndpoint?: string;
  originalUrl?: string; // Added for passing to progress/result pages

  // Transcript request parameters (to be displayed if present)
  requestedLang?: string;
  requestedSkipAI?: boolean;
  requestedUseDeepSeek?: boolean;

  // Properties from ProgressResponse (polling)
  status?: string;        // e.g., "processing", "completed", "failed"
  progress?: number;      // Percentage 0-100
  video_title?: string;
  lastUpdated?: string;

  // Properties for media playback
  mediaUrl?: string;
  mediaType?: 'audio/mpeg' | 'video/mp4' | string;
  fileName?: string; // For download link

  // Can also hold the final TranscriptResponse or other direct results
  // For simplicity, ReactJson will handle arbitrary other properties.
  // We'll try to render specific UI for the above, and fallback to ReactJson for the rest.
  [key: string]: any; // Allow other properties for the final JSON data
}

interface ProcessSidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  data: SidebarData | null; // Updated data type
  isLoading?: boolean;
  error?: string | null;
}

export const ProcessSidebar: React.FC<ProcessSidebarProps> = ({
  isOpen,
  onOpenChange,
  title,
  data,
  isLoading = false,
  error = null,
}) => {
  // useEffect(() => { // Debug log removed
  //   console.log('[ProcessSidebar] Props received:', { isOpen, title, data: JSON.parse(JSON.stringify(data)), isLoading, error });
  // }, [isOpen, title, data, isLoading, error]);

  const funnyWaitingMessages = useMemo(() => [
    "Reticulating splines...",
    "Generating witty dialog...",
    "Swapping time and space...",
    "Spinning up the hamster...",
    "Shoveling coal into the server...",
    "Programming the flux capacitor...",
    "Realigning the dilithium crystals...",
    "Definitely not mining crypto...",
    "Almost there, maybe...",
    "Still faster than a fax machine!",
    "Hold on, our AI is composing a sonnet about your request.",
    "Are we there yet?",
    "Just counting to infinity, be right with you.",
    "Warming up the tubes...",
    "Polishing the pixels...",
  ], []);

  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(funnyWaitingMessages[0]);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Moved constant declarations before useEffect hooks that depend on them
  const isFinalData = data && !data.processingId && !data.progressEndpoint && data.status !== 'processing_initiated' && typeof data.progress === 'undefined';
  const isAsyncJobInitial = data && data.processingId && data.status === 'processing_initiated';
  const isPollingProgress = data && data.processingId && typeof data.progress === 'number' && data.status !== 'completed' && data.status !== 'failed' && data.status !== "result_error" && data.status !== "processing_failed" && data.status !== "final_result_displayed";
  const isTranscriptRequest = title.toLowerCase().includes("transcript");

  // Log conditional variables
  // useEffect(() => { // Debug log removed
  //   const currentData = JSON.parse(JSON.stringify(data));
  //   console.log('[ProcessSidebar] Conditional states:', {
  //     data: currentData,
  //     isFinalData,
  //     isAsyncJobInitial,
  //     isPollingProgress,
  //     isTranscriptRequest,
  //     isLoading,
  //     hasJsonDataForViewer: Object.keys(jsonDataForViewer).length > 0, // Re-evaluate for logging context
  //     title
  //   });
  // }, [data, isLoading, title, isFinalData, isAsyncJobInitial, isPollingProgress, isTranscriptRequest]); // jsonDataForViewer is not stable, so re-evaluate its check

  useEffect(() => {
    let messageInterval: NodeJS.Timeout;
    if (isLoading && !data?.progress) { // Only cycle if it's the initial loading state for funny messages
      setCurrentLoadingMessage(funnyWaitingMessages[Math.floor(Math.random() * funnyWaitingMessages.length)]);
      messageInterval = setInterval(() => {
        setCurrentLoadingMessage(funnyWaitingMessages[Math.floor(Math.random() * funnyWaitingMessages.length)]);
      }, 3000);
    }
    return () => {
      clearInterval(messageInterval);
    };
  }, [isLoading, data?.progress, funnyWaitingMessages]); // Rerun effect if isLoading or progress status changes

  // Timer effect for AI transcript
  useEffect(() => {
    console.log('[TimerEffect] Running. Deps:', { isTranscriptRequest, isPollingProgress, isLoading, dataStatus: data?.status, dataProgress: data?.progress, error, timerStartTime, elapsedTime });
    let timerInterval: NodeJS.Timeout;
    const shouldRunTimer = isTranscriptRequest && (isPollingProgress || (isLoading && !data?.progress && !error));
    console.log('[TimerEffect] shouldRunTimer:', shouldRunTimer);

    if (shouldRunTimer && timerStartTime === null) {
      console.log('[TimerEffect] Starting timer.');
      setTimerStartTime(Date.now());
      setElapsedTime(0); // Reset elapsed time
    }

    if (shouldRunTimer && timerStartTime !== null) {
      console.log('[TimerEffect] Setting up interval. Current elapsedTime:', elapsedTime);
      timerInterval = setInterval(() => {
        setElapsedTime(prevElapsedTime => Date.now() - timerStartTime);
      }, 1000);
    } else if (!shouldRunTimer && timerStartTime !== null) {
      // If timer was running but should now stop
      console.log('[TimerEffect] Stopping timer because shouldRunTimer is false.');
      // setTimerStartTime(null); // Keep timerStartTime to display final time until new process
                               // Or set to null if timer should disappear completely. Let's try keeping it for now.
                               // If a new transcript process starts, the (shouldRunTimer && timerStartTime === null) condition will reset it.
    }


    return () => {
      console.log('[TimerEffect] Cleanup: Clearing interval.');
      clearInterval(timerInterval);
    };
  }, [isTranscriptRequest, isPollingProgress, isLoading, data?.status, data?.progress, error, timerStartTime, elapsedTime]); // Added elapsedTime


  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleCopyJson = () => {
    if (data) {
      // Only copy the parts that are actual JSON results, not our UI state properties
      const dataToCopy = { ...data };
      delete dataToCopy.processingId;
      delete dataToCopy.message;
      delete dataToCopy.progressEndpoint;
      delete dataToCopy.resultEndpoint;
      delete dataToCopy.status;
      delete dataToCopy.progress;
      delete dataToCopy.video_title;
      delete dataToCopy.lastUpdated;

      navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2))
        .then(() => console.log("Filtered JSON copied to clipboard"))
        .catch(err => console.error("Failed to copy filtered JSON: ", err));
    }
  };

  // Data specifically for ReactJson (filtering out our custom polling/status fields if they are mixed)
  const jsonDataForViewer = data ? Object.fromEntries(
    Object.entries(data).filter(([key]) => ![
      'processingId', 'message', 'progressEndpoint', 'resultEndpoint',
      'status', 'progress', 'video_title', 'lastUpdated',
      'mediaUrl', 'mediaType', 'fileName', // Exclude media player fields
      'requestedLang', 'requestedSkipAI', 'requestedUseDeepSeek', 'originalUrl' // Exclude request params as they are displayed separately
    ].includes(key))
  ) : {};
  const hasJsonDataForViewer = Object.keys(jsonDataForViewer).length > 0;

  // Determine if the sidebar is opened without any specific content to show initially
  // This happens if isOpen, but no data, no error, and not in a loading state that would soon populate data.
  // The `isLoading` prop passed from Index.tsx reflects mutations pending or polling active.
  // If `isLoading` is true, we expect content or an error soon.
  // If `isLoading` is false, and there's no data/error, then it's truly "empty" on open.
  const showEmptyStateMessage = isOpen && !data && !error && !isLoading;


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-[90vw] flex flex-col"> {/* Changed sm:max-w-lg to sm:max-w-2xl */}
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {error ? "An error occurred." : "View the process details below."} {/* Removed top loading indicator */}
            {/* The funny loading message and spinner are now only in the main content area */}
            {data?.lastUpdated && <span className="text-xs block text-gray-400">Last updated: {data.lastUpdated}</span>}
          </SheetDescription>
        </SheetHeader>

        {/* Warning Message */}
        <div className="p-3 mb-4 w-full border border-red-600 bg-red-800/80 rounded-md text-red-100 text-xs"> {/* Changed to red theme for higher alert, adjusted margins/width */}
          <div className="flex items-center space-x-2">
            <AlertTriangleIcon className="h-5 w-5 text-red-300 flex-shrink-0" /> {/* Icon to match red theme */}
            <p>
              <strong>Important:</strong> Results displayed here are temporary. Please save your data (copy JSON, download files) as it will be lost when you close this panel or start a new process.
            </p>
          </div>
        </div>

        <ScrollArea className="flex-grow pr-6">
          {/* AI Transcript Warning */}
          {isTranscriptRequest && (isPollingProgress || (isLoading && !data?.progress && !error)) && (
            <div className="p-3 border border-sky-600 bg-sky-900/60 rounded-md text-sky-100 text-xs shadow w-full mb-4"> {/* Changed to sky theme, removed my-2, added w-full */}
              <div className="flex items-center space-x-2">
                <InfoIcon className="h-5 w-5 text-sky-300 flex-shrink-0" /> {/* Icon to match sky theme */}
                <p>
                  AI transcription can take some time depending on the video length. Please be patient.
                </p>
              </div>
            </div>
          )}

          {/* Display Transcript Request Parameters */}
          {isTranscriptRequest && data && (typeof data.requestedLang !== 'undefined' || typeof data.requestedSkipAI !== 'undefined' || typeof data.requestedUseDeepSeek !== 'undefined') && (
            <div className="p-4 rounded-md bg-slate-700/80 text-slate-100 shadow-md w-full mb-4 border border-slate-600">
              <h4 className="font-semibold text-base text-slate-100 mb-3 pb-2 border-b border-slate-600">
                Transcript Request Options
              </h4>
              <div className="space-y-2 text-sm">
                {typeof data.requestedLang !== 'undefined' && (
                  <p><strong>Language:</strong> <span className="text-slate-300">{data.requestedLang}</span></p>
                )}
                {typeof data.requestedSkipAI !== 'undefined' && (
                  <p><strong>Skip AI Post-processing:</strong> <span className="text-slate-300">{data.requestedSkipAI ? 'Yes' : 'No'}</span></p>
                )}
                {typeof data.requestedUseDeepSeek !== 'undefined' && (
                  <p><strong>Use DeepSeek Model:</strong> <span className="text-slate-300">{data.requestedUseDeepSeek ? 'Yes' : 'No'}</span></p>
                )}
              </div>
            </div>
          )}

          {/* ReactJson viewer for any other data that isn't specifically handled above */}
          {hasJsonDataForViewer && !isPollingProgress && !data?.mediaUrl && ( // Conditionally render if there's data and it's not progress or media
            <div className="relative rounded-md bg-slate-800/60 border border-slate-700 shadow w-full mb-4 overflow-hidden"> {/* Added relative positioning */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyJson}
                className="absolute top-2 right-2 text-slate-300 hover:text-slate-100 hover:bg-slate-700 z-10" // Positioned copy button
                title="Copy JSON"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <ReactJson
                src={jsonDataForViewer}
                theme="ocean" // Or your preferred theme
                name={null} // Setting to null or false to remove the root "root" name
                iconStyle="circle"
                displayObjectSize={true}
                displayDataTypes={true}
                enableClipboard={false} // Disable built-in copy feature as it's not working reliably
                style={{ padding: '1rem', paddingTop: '2.5rem', backgroundColor: 'black' }} // Added paddingTop to avoid overlap with copy button
              />
            </div>
          )}

          {/* Timer Display - Placed outside the AI warning, but still conditional on transcript request & timer having started */}
          {isTranscriptRequest && timerStartTime !== null && (
            <div className="p-3 bg-slate-700 rounded-md text-center shadow w-full mb-4"> {/* Removed my-3, added w-full */}
              <p className="text-xs text-slate-300 mb-1">Elapsed Time</p>
              <p className="text-2xl font-mono text-cyan-400 tracking-wider">
                {formatTime(elapsedTime)}
              </p>
            </div>
          )}

          {isLoading && !data?.progress && ( // Show general loading spinner if no progress yet
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-center w-full mb-4"> {/* Added w-full (though flex might handle it) */}
              <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
              <p className="text-lg font-medium text-gray-700">{currentLoadingMessage}</p> {/* Changed text-white to text-slate-300 for better contrast as requested */}
              {/* Removed: <p className="text-sm text-gray-400">Please wait a moment...</p> */}
            </div>
          )}

          {error && (
            <div className="text-red-500 p-3 border border-red-600 bg-red-900/20 rounded-md w-full mb-4"> {/* Added w-full */}
              <div className="flex items-center space-x-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                <p className="font-semibold">Error:</p>
              </div>
              <pre className="whitespace-pre-wrap text-sm mt-1">{error}</pre>
            </div>
          )}

          {/* Display for initial Async Job Response (202) */}
          {isAsyncJobInitial && data?.message && (
            <div className="p-4 rounded-md bg-slate-700 text-slate-100 shadow w-full mb-4"> {/* New styling, added w-full */}
              <div className="flex items-center space-x-2 mb-2">
                <InfoIcon className="h-5 w-5 text-blue-300 flex-shrink-0" /> {/* Adjusted icon color */}
                <p className="font-semibold">Processing Started</p>
              </div>
              <p className="text-sm">{data.message}</p>
            </div>
          )}

          {/* Media Player Section */}
          {data?.mediaUrl && data.mediaType && (
            <div className="p-4 bg-zinc-800 border border-slate-700 rounded-lg space-y-4 shadow-md w-full mb-4"> {/* Changed bg-slate-800/60 to bg-zinc-800, added w-full */}
              <h4 className="font-semibold text-base text-gray-100">Media Preview:</h4> {/* Increased text size */}
              {data.mediaType.startsWith('audio/') && (
                <audio controls src={data.mediaUrl} className="w-full border border-slate-600 rounded-md"> {/* Added border to audio player */}
                  Your browser does not support the audio element.
                </audio>
              )}
              {data.mediaType.startsWith('video/') && (
                <video controls src={data.mediaUrl} className="w-full rounded-md border border-slate-600" style={{maxHeight: '300px'}}> {/* Added border to video player */}
                  Your browser does not support the video tag.
                </video>
              )}
              {data.fileName && (
                 <Button
                    variant="default" // Changed to default, assuming it's more prominent
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center space-x-2" // Enhanced button styling
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = data.mediaUrl!;
                      link.download = data.fileName!;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="h-5 w-5 mr-2" /> {/* Added Download icon */}
                    <span>Download {data.fileName}</span>
                  </Button>
              )}
              <p className="text-xs text-gray-400 text-center mt-2">
                If the download didn't start automatically, click the button above.
              </p>
            </div>
          )}

          {/* Display for Polling Progress */}
          {isPollingProgress && data && (
            <div className="space-y-3 p-4 rounded-md bg-slate-700 text-slate-100 shadow w-full mb-4"> {/* New styling, increased space-y, added w-full */}
              {data.video_title && <p className="text-sm font-medium">Video: <span className="font-normal text-slate-300">{data.video_title}</span></p>}
              <p className="text-sm font-medium">Status: <span className="font-semibold text-amber-400">{data.status}</span></p> {/* Status color changed */}
              {typeof data.progress === 'number' && (
                <>
                  <Progress value={data.progress} className="w-full h-5" /> {/* Increased height from h-3 to h-5 */}
                  <p className="text-sm text-right text-slate-300">{data.progress}% complete</p>
                </>
              )}
            </div>
          )}

          {/* Display Endpoints if available (from initial 202 or progress) - MOVED TO BOTTOM */}
          {data && (data.progressEndpoint || data.resultEndpoint) && (
            <div className="space-y-2 p-4 rounded-md bg-slate-700 text-slate-100 shadow w-full mb-4"> {/* Changed styling, consistent with other cards, removed mt-4, added w-full */}
              <h4 className="font-semibold text-base text-slate-100 mb-2">API Endpoints:</h4> {/* Increased text size and margin */}
              {data.progressEndpoint && data.processingId && (
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/progress/${data.processingId}`}
                    state={{ videoUrl: data.originalUrl, videoTitle: data.video_title }} // Pass relevant data
                    target="_blank"
                    className="p-0 h-auto text-blue-400 hover:text-blue-300 text-xs inline-flex items-center hover:underline"
                  >
                    View Progress Page <ExternalLink className="inline-block ml-1 h-3 w-3" />
                  </Link>
                </div>
              )}
              {data.resultEndpoint && data.processingId && (
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/result/${data.processingId}`}
                    state={{ videoUrl: data.originalUrl, videoTitle: data.video_title }} // Pass relevant data
                    target="_blank"
                    className="p-0 h-auto text-blue-400 hover:text-blue-300 text-xs inline-flex items-center hover:underline"
                  >
                    View Result Page <ExternalLink className="inline-block ml-1 h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {showEmptyStateMessage && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <InfoIcon className="h-12 w-12 text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Sidebar Empty</h3> {/* text-gray-200 to text-gray-100 */}
              <p className="text-sm text-gray-300"> {/* text-gray-400 to text-gray-300 */}
                Start a process from the main page to see details and results here.
              </p>
            </div>
          )}

          {/* Fallback for "No data to display yet" if it's not loading, no error, but also not the initial empty state (e.g. data was cleared) */}
          {!isLoading && !error && !data && !showEmptyStateMessage && (
             <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">No data to display yet.</p>
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="mt-auto pt-4 border-t border-gray-700">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
