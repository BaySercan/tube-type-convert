
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Youtube, Download, FileText, Info, Music, Video } from 'lucide-react';

const Index = () => {
  const [url, setUrl] = useState('');
  const [selectedOutput, setSelectedOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const outputOptions = [
    { id: 'mp3', label: 'MP3 Audio', icon: Music, description: 'Extract audio as MP3' },
    { id: 'mp4', label: 'MP4 Video', icon: Video, description: 'Download video as MP4' },
    { id: 'transcript', label: 'Transcript', icon: FileText, description: 'Get video transcript' },
    { id: 'info', label: 'Video Info', icon: Info, description: 'Get video metadata' }
  ];

  const isValidYouTubeUrl = (url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return regex.test(url);
  };

  const handleProcess = () => {
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl relative z-10">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-3 bg-red-500 rounded-full">
                <Youtube className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">YouTube Converter</h1>
            </div>
            <p className="text-white/80 text-lg">Convert YouTube videos to MP3, MP4, get transcripts or video info</p>
          </div>

          {/* URL Input */}
          <div className="space-y-3">
            <label className="text-white font-medium block">YouTube URL</label>
            <Input
              type="url"
              placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50 h-12 text-lg backdrop-blur-sm focus:bg-white/20 transition-all duration-300"
            />
          </div>

          {/* Output Type Selection */}
          <div className="space-y-4">
            <label className="text-white font-medium block">Choose Output Type</label>
            <div className="grid grid-cols-2 gap-4">
              {outputOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOutput(option.id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 text-left group hover:scale-105 ${
                      selectedOutput === option.id
                        ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                        : 'border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg transition-colors ${
                        selectedOutput === option.id ? 'bg-blue-500' : 'bg-white/20 group-hover:bg-white/30'
                      }`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{option.label}</h3>
                        <p className="text-white/70 text-sm mt-1">{option.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={isProcessing}
            className="w-full h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Download className="w-6 h-6 mr-3" />
            {isProcessing ? 'Processing...' : 'Start Conversion'}
          </Button>

          {/* Status indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center space-x-3 p-4 bg-white/10 rounded-lg">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-white">Processing your request...</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Index;
