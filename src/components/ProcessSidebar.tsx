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
import React, { useState, useEffect } from 'react'; // Added useState and useEffect

// Define a more specific type for the data prop
// This helps in accessing properties safely
interface SidebarData {
  // Properties from AsyncJobResponse (initial 202)
  processingId?: string;
  message?: string;       // Initial message or progress message
  progressEndpoint?: string;
  resultEndpoint?: string;
  originalUrl?: string; // Added for passing to progress/result pages

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

  const funnyWaitingMessages = [
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
  ];

  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(funnyWaitingMessages[0]);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Moved constant declarations before useEffect hooks that depend on them
  const isFinalData = data && !data.processingId && !data.progressEndpoint && data.status !== 'processing_initiated' && typeof data.progress === 'undefined';
  const isAsyncJobInitial = data && data.processingId && data.status === 'processing_initiated';
  const isPollingProgress = data && data.processingId && typeof data.progress === 'number' && data.status !== 'completed' && data.status !== 'failed' && data.status !== "result_error" && data.status !== "processing_failed";
  const isTranscriptRequest = title.toLowerCase().includes("transcript");

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
  }, [isLoading, data?.progress]); // Rerun effect if isLoading or progress status changes

  // Timer effect for AI transcript
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    const shouldRunTimer = isTranscriptRequest && (isPollingProgress || (isLoading && !data?.progress && !error));

    if (shouldRunTimer && timerStartTime === null) {
      setTimerStartTime(Date.now());
      setElapsedTime(0); // Reset elapsed time
    }

    if (shouldRunTimer && timerStartTime !== null) {
      timerInterval = setInterval(() => {
        setElapsedTime(Date.now() - timerStartTime);
      }, 1000);
    } else {
      // Stop timer if conditions are no longer met (e.g., process completed or failed)
      setTimerStartTime(null); // This will also stop new intervals from being created
      // Elapsed time will naturally stop updating here. We can keep the last value or reset.
      // For now, keep the last value until a new process starts.
    }

    return () => {
      clearInterval(timerInterval);
    };
  }, [isTranscriptRequest, isPollingProgress, isLoading, data?.progress, error, timerStartTime]);


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
      'mediaUrl', 'mediaType', 'fileName' // Exclude media player fields
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
        <div className="p-3 mx-1 mt-2 border border-yellow-500 bg-yellow-900/40 rounded-md text-yellow-100 text-xs"> {/* Changed text-yellow-200 to text-yellow-100 and increased bg opacity */}
          <div className="flex items-center space-x-2">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-300 flex-shrink-0" /> {/* Adjusted icon color slightly for better harmony */}
            <p>
              <strong>Important:</strong> Results displayed here are temporary. Please save your data (copy JSON, download files) as it will be lost when you close this panel or start a new process.
            </p>
          </div>
        </div>

        <ScrollArea className="flex-grow my-2 pr-6 space-y-4">
          {/* AI Transcript Warning */}
          {isTranscriptRequest && (isPollingProgress || (isLoading && !data?.progress && !error)) && (
            <div className="p-3 my-2 border border-blue-500 bg-blue-900/30 rounded-md text-blue-200 text-xs">
              <div className="flex items-center space-x-2">
                <InfoIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <p>
                  AI transcription can take some time depending on the video length. Please be patient.
                </p>
              </div>
              {timerStartTime !== null && (
                <div className="mt-2 text-center text-sm text-blue-300">
                  Elapsed Time: {formatTime(elapsedTime)}
                </div>
              )}
            </div>
          )}

          {isLoading && !data?.progress && ( // Show general loading spinner if no progress yet
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
              <p className="text-lg font-medium text-gray-100">{currentLoadingMessage}</p> {/* Changed text-gray-200 to text-gray-100 */}
              {/* Removed: <p className="text-sm text-gray-400">Please wait a moment...</p> */}
            </div>
          )}

          {error && (
            <div className="text-red-500 p-3 border border-red-600 bg-red-900/20 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                <p className="font-semibold">Error:</p>
              </div>
              <pre className="whitespace-pre-wrap text-sm mt-1">{error}</pre>
            </div>
          )}

          {/* Display for initial Async Job Response (202) */}
          {isAsyncJobInitial && data?.message && (
            <div className="p-4 rounded-md bg-slate-700 text-slate-100 shadow"> {/* New styling */}
              <div className="flex items-center space-x-2 mb-2">
                <InfoIcon className="h-5 w-5 text-blue-300 flex-shrink-0" /> {/* Adjusted icon color */}
                <p className="font-semibold">Processing Started</p>
              </div>
              <p className="text-sm">{data.message}</p>
            </div>
          )}

          {/* Media Player Section */}
          {data?.mediaUrl && data.mediaType && (
            <div className="p-4 bg-zinc-800 border border-slate-700 rounded-lg space-y-4 shadow-md"> {/* Changed bg-slate-800/60 to bg-zinc-800 */}
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
            <div className="space-y-3 p-4 rounded-md bg-slate-700 text-slate-100 shadow"> {/* New styling, increased space-y */}
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

          {/* Display JSON data using ReactJson viewer */}
          {/* This will show the final result, or the initial 202 object if not handled above */}
          {data && !error && hasJsonDataForViewer && (
             <div className="bg-gray-800 text-white p-3 rounded-md relative group border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-200"> {/* Changed text-gray-400 to text-gray-200 */}
                  {isFinalData ? "Final Result JSON" : "Response Data"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                  onClick={handleCopyJson}
                  title="Copy JSON"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <ReactJson
                src={jsonDataForViewer}
                theme="ocean"
                iconStyle="square"
                displayDataTypes={false}
                displayObjectSize={false}
                name={false}
                style={{ background: 'transparent', fontSize: '0.8rem' }}
                collapsed={1} // Collapse deeper levels
                enableClipboard={true} // Explicitly enable clipboard, though it's default
              />
            </div>
          )}

          {/* Display Endpoints if available (from initial 202 or progress) - MOVED TO BOTTOM */}
          {data && (data.progressEndpoint || data.resultEndpoint) && (
            <div className="mt-4 space-y-2 p-3 border border-gray-700 rounded-md bg-gray-800/50">
              <h4 className="font-semibold text-sm text-gray-100">API Endpoints:</h4>
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
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Sidebar Empty</h3>
              <p className="text-sm text-gray-400">
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
