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
import { Copy } from "lucide-react";
import ReactJson from 'react-json-view'; // Using the installed library

interface ProcessSidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  data: object | null; // The JSON data to display
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

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2))
        .then(() => {
          // Maybe show a toast notification for success
          console.log("JSON copied to clipboard");
        })
        .catch(err => {
          // Maybe show a toast for error
          console.error("Failed to copy JSON: ", err);
        });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {isLoading ? "Processing your request..." : (error ? "An error occurred." : "View the process result below.")}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-grow my-4 pr-6">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <p>Loading...</p> {/* Replace with a spinner or skeleton later if desired */}
            </div>
          )}
          {error && !isLoading && (
            <div className="text-red-500 p-4 border border-red-500 rounded-md">
              <p><strong>Error:</strong></p>
              <pre className="whitespace-pre-wrap">{error}</pre>
            </div>
          )}
          {data && !isLoading && !error && (
            <div className="bg-gray-900 text-white p-4 rounded-md relative group">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
                title="Copy JSON"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <ReactJson
                src={typeof data === 'string' ? JSON.parse(data) : data} // Ensure src is an object
                theme="ocean" // Or any other theme you prefer
                iconStyle="square"
                displayDataTypes={false}
                displayObjectSize={false}
                name={false} // Hides the root "root" key
                style={{ background: 'transparent' }}
                collapsed={2} // Collapse levels deeper than 2
              />
            </div>
          )}
          {!isLoading && !error && !data && (
             <div className="flex items-center justify-center h-full">
              <p>No data to display yet.</p>
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
