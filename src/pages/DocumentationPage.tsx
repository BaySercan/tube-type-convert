import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Youtube, Music, Video, FileText, Info, Settings, Zap, HelpCircle, ChevronRight, Menu, X, ChevronsLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const documentationSections = [
  { id: 'introduction', title: '👋 Welcome!', icon: Zap },
  { id: 'getting-started', title: '🚀 Getting Started', icon: Youtube },
  { id: 'mp3-download', title: '🎵 MP3 Audio Download', icon: Music },
  { id: 'mp4-download', title: '🎬 MP4 Video Download', icon: Video },
  { id: 'ai-transcript', title: '📝 AI Transcript', icon: FileText },
  { id: 'video-info', title: 'ℹ️ Video Info', icon: Info },
  { id: 'process-sidebar', title: '📊 Understanding Results', icon: ChevronRight },
  { id: 'tips-tricks', title: '💡 Tips & Tricks', icon: HelpCircle },
];

const DocumentationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('introduction');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isMobile = useIsMobile();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Prioritize entry that is most visible if multiple are intersecting
            if (entry.intersectionRatio >= 0.5) { // Check if at least 50% is visible
              setActiveSection(entry.target.id);
            }
          }
        });
      },
      { rootMargin: '-20% 0px -35% 0px', threshold: [0.1, 0.5, 0.9] } // Adjust rootMargin and threshold
    );

    documentationSections.forEach((section) => {
      const element = contentRefs.current[section.id];
      if (element) observer.observe(element);
    });

    return () => {
      documentationSections.forEach((section) => {
        const element = contentRefs.current[section.id];
        if (element) observer.unobserve(element);
      });
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = contentRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // setActiveSection(id); // IntersectionObserver will handle this
      if (isMobile) setIsMobileSidebarOpen(false);
    }
  };

  const renderSidebar = () => (
    <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-800/50 backdrop-blur-md text-gray-200 p-4 border-r border-gray-700/30 shadow-lg transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0 z-40' : '-translate-x-full z-40'}`}>
      <ScrollArea className="h-full pr-3">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Contents</h3>
        <nav>
          <ul>
            {documentationSections.map((section) => (
              <li key={section.id} className="mb-1">
                <Button
                  variant="ghost"
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full justify-start items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200
                    ${activeSection === section.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md scale-105'
                      : 'hover:bg-gray-700/70 text-gray-300 hover:text-gray-100'
                    }`}
                >
                  <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`} />
                  <span>{section.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </ScrollArea>
    </aside>
  );


  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900 text-gray-100">
      <Navbar />

      {isMobile && (
         <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="fixed top-20 right-4 z-50 bg-gray-700/80 hover:bg-gray-600/90 border-gray-600 text-gray-100"
        >
          {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      <div className="flex flex-1 pt-16"> {/* pt-16 for Navbar height */}
        {!isMobile && renderSidebar()}
        {isMobile && isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        {isMobile && renderSidebar()} {/* Sidebar for mobile, controlled by isMobileSidebarOpen */}

        <main className={`flex-1 transition-all duration-300 ease-in-out ${isMobile ? 'p-4' : 'p-8 ml-64'}`}>
          <div className="max-w-4xl mx-auto space-y-12">

            {/* Introduction Section */}
            <div id="introduction" ref={(el) => (contentRefs.current['introduction'] = el)} className="pt-8"> {/* Added pt-8 for scroll spy margin */}
              <Card className="bg-gray-800/30 backdrop-blur-md border-gray-700/40 shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8">
                  <div className="flex items-center space-x-4">
                    <Zap className="w-12 h-12 text-white animate-pulse" />
                    <div>
                      <CardTitle className="text-4xl font-bold text-white">Welcome to the YouTube Multi-Tool!</CardTitle>
                      <CardDescription className="text-gray-200 text-lg mt-1">Your all-in-one solution for YouTube content.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-gray-300 space-y-4">
                  <p className="text-lg">
                    This platform empowers you to interact with YouTube videos like never before. Whether you need to grab an audio track, download a video for offline viewing, get a quick summary via AI transcripts, or simply fetch video details, we've got you covered.
                  </p>
                  <p>
                    Navigate through this guide using the sidebar to learn about each feature in detail. Let's unlock the full potential of YouTube content together!
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-12 bg-gray-700/50" />

            {/* Getting Started Section */}
            <div id="getting-started" ref={(el) => (contentRefs.current['getting-started'] = el)} className="pt-8">
              <Card className="bg-gray-800/20 backdrop-blur-sm border-gray-700/30">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Youtube className="w-8 h-8 text-red-500" />
                    <CardTitle className="text-2xl font-semibold text-gray-100">🚀 Getting Started: It's Simple!</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-gray-300 space-y-3">
                  <p>Using the tool is straightforward:</p>
                  <ol className="list-decimal list-inside space-y-2 pl-4">
                    <li><strong>Find a YouTube Video:</strong> Go to YouTube and find the video you're interested in.</li>
                    <li><strong>Copy the URL:</strong> Copy the full URL from your browser's address bar (e.g., <code>https://www.youtube.com/watch?v=your_video_id</code>) or the shortened URL (e.g. <code>https://youtu.be/your_video_id</code>).</li>
                    <li><strong>Paste the URL:</strong> Back on our platform, paste this URL into the designated "YouTube URL" input field on the main page.</li>
                    <li><strong>Choose an Output:</strong> Select what you want to do with the video (e.g., Download MP3, Get AI Transcript).</li>
                    <li><strong>Configure Options (if any):</strong> Some outputs, like AI Transcripts, have additional options (language, AI model). Set these as needed.</li>
                    <li><strong>Hit Process:</strong> Click the "Start Process" button and watch the magic happen!</li>
                  </ol>
                  <p className="mt-4 p-3 bg-gray-700/40 rounded-md border border-gray-600/50">
                    <Info className="inline w-5 h-5 mr-2 text-blue-400" />
                    Ensure the URL is correct and publicly accessible. Private or restricted videos may not work.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-12 bg-gray-700/50" />

            {/* MP3 Download Section */}
            <div id="mp3-download" ref={(el) => (contentRefs.current['mp3-download'] = el)} className="pt-8">
              <Card className="bg-gray-800/20 backdrop-blur-sm border-gray-700/30">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Music className="w-8 h-8 text-green-400" />
                    <CardTitle className="text-2xl font-semibold text-gray-100">🎵 MP3 Audio Download</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-gray-300 space-y-3">
                  <p>Want to listen to a lecture, podcast, or music track on the go? Convert YouTube videos to MP3 audio files easily.</p>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><strong>How it works:</strong> After pasting the YouTube URL, select the "MP3 Audio" option.</li>
                    <li><strong>Processing:</strong> Click "Start Process". The system will fetch the video and extract its audio track.</li>
                    <li><strong>Download:</strong> Once ready, the download will usually start automatically. The Process Sidebar will also provide a link or allow playback.</li>
                    <li><strong>Quality:</strong> We aim to provide the best available audio quality.</li>
                  </ul>
                   <p className="mt-4 p-3 bg-gray-700/40 rounded-md border border-gray-600/50">
                    <Zap className="inline w-5 h-5 mr-2 text-yellow-400" />
                    Perfect for creating your offline audio library!
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-12 bg-gray-700/50" />

            {/* MP4 Download Section */}
            <div id="mp4-download" ref={(el) => (contentRefs.current['mp4-download'] = el)} className="pt-8">
              <Card className="bg-gray-800/20 backdrop-blur-sm border-gray-700/30">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Video className="w-8 h-8 text-blue-400" />
                    <CardTitle className="text-2xl font-semibold text-gray-100">🎬 MP4 Video Download</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-gray-300 space-y-3">
                  <p>Need to save a video for offline viewing, presentations, or archival?</p>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><strong>How it works:</strong> Paste the YouTube URL and select the "MP4 Video" option.</li>
                    <li><strong>Processing:</strong> Click "Start Process". The video will be prepared for download.</li>
                    <li><strong>Download:</strong> The download should begin automatically. The Process Sidebar will confirm and might offer playback.</li>
                    <li><strong>Quality:</strong> The tool typically attempts to download a standard, good quality version of the video (e.g., 720p or best available if not specified).</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-12 bg-gray-700/50" />

            {/* AI Transcript Section */}
            <div id="ai-transcript" ref={(el) => (contentRefs.current['ai-transcript'] = el)} className="pt-8">
              <Card className="bg-gray-800/20 backdrop-blur-sm border-gray-700/30">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-purple-400" />
                    <CardTitle className="text-2xl font-semibold text-gray-100">📝 AI Transcript</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">Unlock insights from video content with powerful AI-driven transcriptions.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 text-gray-300 space-y-4">
                  <p>Get a written version of the video's audio content. This can include dialogue, narration, and more. Our AI enhances this by providing summarized notes and cleaner text.</p>

                  <h4 className="font-semibold text-lg text-gray-200 mt-4">How to Use:</h4>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>Select the "AI Transcript" option after pasting your URL.</li>
                    <li>Additional options will appear:</li>
                  </ul>

                  <div className="ml-8 space-y-3 mt-2">
                    <div className="p-3 bg-gray-700/30 rounded-md border border-gray-600/40">
                      <p><strong>Language:</strong> Choose the primary language spoken in the video. This helps the AI accurately transcribe the content. We support several languages (e.g., Turkish, English, Spanish).</p>
                    </div>
                    <div className="p-3 bg-gray-700/30 rounded-md border border-gray-600/40">
                      <p><strong>Skip AI Post-processing:</strong> Check this if you want a raw, direct transcript without our AI's summarization or cleaning. Useful for specific linguistic analysis or if you prefer less interpretation.</p>
                    </div>
                    <div className="p-3 bg-gray-700/30 rounded-md border border-gray-600/40">
                      <p><strong>Use DeepSeek Model:</strong> For potentially higher accuracy and more nuanced AI notes, keep this checked. Deselecting it might use a faster, alternative AI model if available, or it might have no effect if DeepSeek is the default/only advanced option. This option is ignored if "Skip AI" is checked.</p>
                    </div>
                  </div>

                  <p className="mt-4">
                    After configuring, click "Start Process". Transcription, especially with AI processing, can take some time. You'll see progress updates in the Process Sidebar.
                  </p>
                  <p className="mt-2 p-3 bg-yellow-700/20 rounded-md border border-yellow-600/40 text-yellow-300">
                    <Zap className="inline w-5 h-5 mr-2" />
                    AI transcripts can provide summaries, key topics, and a searchable text version of the video, making content much more accessible!
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-12 bg-gray-700/50" />

            {/* Video Info Section */}
            <div id="video-info" ref={(el) => (contentRefs.current['video-info'] = el)} className="pt-8">
              <Card className="bg-gray-800/20 backdrop-blur-sm border-gray-700/30">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Info className="w-8 h-8 text-teal-400" />
                    <CardTitle className="text-2xl font-semibold text-gray-100">ℹ️ Video Info</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-gray-300 space-y-3">
                  <p>Curious about a video's details? This option fetches publicly available metadata.</p>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><strong>How it works:</strong> Select "Video Info" after providing the URL.</li>
                    <li><strong>Information Displayed:</strong> The Process Sidebar will show details like:
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li>Video Title</li>
                            <li>Thumbnail Image URL</li>
                            <li>Video ID</li>
                            <li>Channel Name & ID</li>
                            <li>Upload Date</li>
                        </ul>
                    </li>
                    <li>This is a quick way to verify you have the right video or gather basic information for citation or records.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-12 bg-gray-700/50" />

            {/* Process Sidebar Section */}
            <div id="process-sidebar" ref={(el) => (contentRefs.current['process-sidebar'] = el)} className="pt-8">
              <Card className="bg-gray-800/20 backdrop-blur-sm border-gray-700/30">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <ChevronRight className="w-8 h-8 text-orange-400" />
                    <CardTitle className="text-2xl font-semibold text-gray-100">📊 Understanding Results: The Process Sidebar</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-gray-300 space-y-3">
                  <p>
                    Whenever you start a process, the <strong>Process Sidebar</strong> will appear on the right (or be accessible via a button). This is your command center for tracking what's happening:
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><strong>Loading States:</strong> Indicates when the tool is fetching data, processing your request, or waiting for the backend.</li>
                    <li><strong>Progress Updates:</strong> For longer tasks like AI transcription, you'll often see a progress percentage or status messages (e.g., "Processing initiated", "Fetching result").</li>
                    <li><strong>Results Display:</strong>
                        <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                            <li><strong>Downloads (MP3/MP4):</strong> May show a media player to preview or confirm the file, along with the filename. Downloads usually start automatically.</li>
                            <li><strong>AI Transcripts:</strong> Displays the transcript text, AI notes, language, and other relevant processing details.</li>
                            <li><strong>Video Info:</strong> Lists the fetched metadata.</li>
                        </ul>
                    </li>
                    <li><strong>Error Messages:</strong> If something goes wrong (e.g., invalid URL, API error, processing failure), the sidebar will display an error message to help you understand the issue.</li>
                    <li><strong>Reopen Button:</strong> If you close the sidebar, a button (often with <ChevronsLeft className="inline w-4 h-4" /> icon) will typically appear, allowing you to reopen it and view the last process details.</li>
                  </ul>
                  <p className="mt-4 p-3 bg-gray-700/40 rounded-md border border-gray-600/50">
                    Keep an eye on the sidebar for all feedback regarding your requests! It's designed to be informative and keep you updated every step of the way.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-12 bg-gray-700/50" />

            {/* Tips & Tricks Section */}
            <div id="tips-tricks" ref={(el) => (contentRefs.current['tips-tricks'] = el)} className="pt-8">
              <Card className="bg-gray-800/20 backdrop-blur-sm border-gray-700/30">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="w-8 h-8 text-yellow-400" />
                    <CardTitle className="text-2xl font-semibold text-gray-100">💡 Tips & Tricks</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-gray-300 space-y-3">
                  <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><strong>Valid URLs Only:</strong> Double-check your YouTube URL. Only public videos are supported. Playlists or channel URLs might not work for direct processing unless the backend API specifically supports them (this frontend primarily sends single video URLs).</li>
                    <li><strong>Patience for AI Transcripts:</strong> AI processing, especially with advanced models, can take a few minutes depending on video length and server load. The progress bar will keep you updated.</li>
                    <li><strong>Check Sidebar for Errors:</strong> If a process doesn't complete as expected, the Process Sidebar is the first place to look for error messages or clues.</li>
                    <li><strong>One Process at a Time:</strong> The UI is generally designed to handle one main conversion/processing task at a time to avoid confusion and excessive load. Wait for the current task to complete or show an error before starting a new one with different parameters.</li>
                    <li><strong>Browser Compatibility:</strong> For best performance, use a modern web browser (Chrome, Firefox, Edge, Safari).</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="py-8 text-center text-gray-400">
              <p>Happy YouTubing!</p>
            </div>

          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DocumentationPage;
