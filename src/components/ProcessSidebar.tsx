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
import { Copy, ExternalLink, InfoIcon, AlertTriangleIcon } from "lucide-react"; // Added ExternalLink, InfoIcon, AlertTriangleIcon
import ReactJson from 'react-json-view';
import { Progress } from "@/components/ui/progress"; // For displaying progress bar

// Define a more specific type for the data prop
// This helps in accessing properties safely
interface SidebarData {
  // Properties from AsyncJobResponse (initial 202)
  processingId?: string;
  message?: string;       // Initial message or progress message
  progressEndpoint?: string;
  resultEndpoint?: string;

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

  const isFinalData = data && !data.processingId && !data.progressEndpoint && data.status !== 'processing_initiated' && typeof data.progress === 'undefined';
  const isAsyncJobInitial = data && data.processingId && data.status === 'processing_initiated';
  const isPollingProgress = data && data.processingId && typeof data.progress === 'number' && data.status !== 'completed' && data.status !== 'failed' && data.status !== "result_error" && data.status !== "processing_failed";

  // Data specifically for ReactJson (filtering out our custom polling/status fields if they are mixed)
  const jsonDataForViewer = data ? Object.fromEntries(
    Object.entries(data).filter(([key]) => ![
      'processingId', 'message', 'progressEndpoint', 'resultEndpoint',
      'status', 'progress', 'video_title', 'lastUpdated',
      'mediaUrl', 'mediaType', 'fileName' // Exclude media player fields
    ].includes(key))
  ) : {};
  const hasJsonDataForViewer = Object.keys(jsonDataForViewer).length > 0;


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {isLoading && !data?.progress ? "Processing your request..." : (error ? "An error occurred." : "View the process details below.")}
            {data?.lastUpdated && <span className="text-xs block text-gray-400">Last updated: {data.lastUpdated}</span>}
          </SheetDescription>
        </SheetHeader>

        {/* Warning Message */}
        <div className="p-3 mx-1 mt-2 border border-yellow-500 bg-yellow-900/30 rounded-md text-yellow-300 text-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <p>
              <strong>Important:</strong> Results displayed here are temporary. Please save your data (copy JSON, download files) as it will be lost when you close this panel or start a new process.
            </p>
          </div>
        </div>

        <ScrollArea className="flex-grow my-2 pr-6 space-y-4">
          {isLoading && !data?.progress && ( // Show general loading spinner if no progress yet
            <div className="flex items-center justify-center h-full">
              <p>Loading...</p>
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
            <div className="p-3 border border-blue-600 bg-blue-900/20 rounded-md">
              <div className="flex items-center space-x-2">
                <InfoIcon className="h-5 w-5 text-blue-400" />
                <p className="font-semibold">Processing Started</p>
              </div>
              <p className="text-sm mt-1">{data.message}</p>
            </div>
          )}

          {/* Media Player Section */}
          {data?.mediaUrl && data.mediaType && (
            <div className="p-3 border border-gray-700 rounded-md space-y-3">
              <h4 className="font-semibold text-sm text-gray-300">Media Preview:</h4>
              {data.mediaType.startsWith('audio/') && (
                <audio controls src={data.mediaUrl} className="w-full">
                  Your browser does not support the audio element.
                </audio>
              )}
              {data.mediaType.startsWith('video/') && (
                <video controls src={data.mediaUrl} className="w-full rounded" style={{maxHeight: '300px'}}>
                  Your browser does not support the video tag.
                </video>
              )}
              {data.fileName && (
                 <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = data.mediaUrl!;
                      link.download = data.fileName!;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    Download {data.fileName}
                  </Button>
              )}
            </div>
          )}

          {/* Display for Polling Progress */}
          {isPollingProgress && data && (
            <div className="space-y-2 p-3 border border-gray-700 rounded-md">
              {data.video_title && <p className="text-sm font-medium">Video: {data.video_title}</p>}
              <p className="text-sm">Status: <span className="font-semibold">{data.status}</span></p>
              {typeof data.progress === 'number' && (
                <>
                  <Progress value={data.progress} className="w-full h-3" />
                  <p className="text-sm text-right">{data.progress}% complete</p>
                </>
              )}
            </div>
          )}

          {/* Display Endpoints if available (from initial 202 or progress) */}
          {data && (data.progressEndpoint || data.resultEndpoint) && (
            <div className="space-y-2 p-3 border border-gray-700 rounded-md">
              <h4 className="font-semibold text-sm text-gray-300">API Endpoints:</h4>
              {data.progressEndpoint && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-400 hover:text-blue-300 text-xs"
                    onClick={() => window.open(data.progressEndpoint, '_blank')}
                  >
                    View Progress Endpoint <ExternalLink className="inline-block ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
              {data.resultEndpoint && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-400 hover:text-blue-300 text-xs"
                    onClick={() => window.open(data.resultEndpoint, '_blank')}
                  >
                    View Result Endpoint <ExternalLink className="inline-block ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Display JSON data using ReactJson viewer */}
          {/* This will show the final result, or the initial 202 object if not handled above */}
          {data && !error && hasJsonDataForViewer && (
             <div className="bg-gray-800 text-white p-3 rounded-md relative group border border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-400">
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
              />
            </div>
          )}

          {!isLoading && !error && !data && (
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
