import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Youtube, Download, FileText, Info, Music, Video, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleProcess = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start a video conversion.",
        variant: "destructive",
        action: (
          <ToastAction altText="Sign In" onClick={() => navigate('/login')}>
            Sign In
          </ToastAction>
        ),
      });
      return;
    }

    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube URL",
        variant: "destructive"
      });
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    if (!selectedOutput) {
      toast({
        title: "Output Type Required",
        description: "Please select an output type",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Processing Started",
        description: `Converting to ${selectedOutput.toUpperCase()}...`,
      });
    }, 2000);
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
                      onClick={() => setSelectedOutput(option.id)}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 text-left group hover:scale-105 relative ${
                        selectedOutput === option.id
                          ? 'border-gray-400 bg-gray-700/40 shadow-lg shadow-gray-700/25'
                          : 'border-gray-600/40 bg-gray-800/20 hover:border-gray-500/60 hover:bg-gray-700/30'
                      }`}
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
                disabled={isProcessing}
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
                      <span>Start Conversion</span>
                      <Zap className="w-7 h-7" />
                    </>
                  )}
                </div>
              </Button>
            </div>

            {/* Status indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center space-x-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                <div className="w-6 h-6 border-2 border-gray-600/40 border-t-gray-300 rounded-full animate-spin"></div>
                <span className="text-gray-200">Processing your request...</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
