
import React from 'react';
import { Button } from "@/components/ui/button";
import { Youtube, User, FileText, DollarSign } from 'lucide-react';

const Navbar = () => {
  const handleSignIn = () => {
    // TODO: Implement Google auth when Supabase is connected
    console.log('Sign in clicked');
  };

  return (
    <nav className="w-full bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500 rounded-full">
            <Youtube className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-100">YouTube Converter</span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#docs" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
            <FileText className="w-4 h-4" />
            <span>Docs</span>
          </a>
          <a href="#pricing" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
            <DollarSign className="w-4 h-4" />
            <span>Pricing</span>
          </a>
        </div>

        {/* Sign In Button */}
        <Button
          onClick={handleSignIn}
          className="bg-white text-gray-900 hover:bg-gray-100 font-medium"
        >
          <User className="w-4 h-4 mr-2" />
          Sign In with Google
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
