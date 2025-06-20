import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
// import { ProcessSidebar } from "@/components/ProcessSidebar"; // Moved to Index.tsx
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
// import * as videoApi from '@/lib/videoApi'; // Moved to Index.tsx
// import { useMutation, useQueryClient } from '@tanstack/react-query'; // Moved to Index.tsx

const DashboardPage = () => {
  const { user, customApiTokenError, isLoadingApiToken } = useAuth();
  const navigate = useNavigate();

  // Most state and logic related to video processing and sidebar have been moved to Index.tsx
  // This component will now be much simpler.

  // const [videoUrl, setVideoUrl] = useState(""); // Moved
  // const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Moved
  // const [sidebarData, setSidebarData] = useState<object | null>(null); // Moved
  // const [sidebarTitle, setSidebarTitle] = useState("Process Details"); // Moved
  // const [sidebarError, setErrorForSidebar] = useState<string | null>(null); // Moved

  // useEffect for logging sidebar state changes are no longer needed here.

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error);
    else navigate("/login");
  };

  // openSidebarForAction moved to Index.tsx
  // React Query Mutations (infoMutation, downloadFileMutation, transcriptMutation) moved to Index.tsx
  // Handler functions (handleGetInfo, handleDownload, handleGetTranscript) moved to Index.tsx
  // Loading states (isActionLoading, isFormDisabled, isSidebarLoading) moved or handled by Index.tsx

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </header>
      <main>
        <p className="text-lg mb-4">Welcome, <strong>{user?.email || 'Authenticated User'}</strong>!</p>

        <p className="text-gray-600">This is the Dashboard page.</p>
        <p className="text-gray-600 mt-2">Video processing tools have been integrated into the main page.</p>


        {isLoadingApiToken && (
          <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <p>Authenticating with API service...</p>
          </div>
        )}

        {customApiTokenError && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p><strong>API Authentication Error:</strong> {customApiTokenError}</p>
            <p>Some services may not be available. Please try signing out and signing back in. If the issue persists, contact support.</p>
          </div>
        )}

        {/* The video tools section has been removed as its functionality is now in Index.tsx */}
        {/*
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Video Tools</h2>
          ...
        </div>
        */}
      </main>

      {/* ProcessSidebar has been moved to Index.tsx */}
      {/*
      <ProcessSidebar
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        title={sidebarTitle}
        data={sidebarData}
        isLoading={isSidebarLoading}
        error={sidebarError}
      />
      */}
    </div>
  );
};

export default DashboardPage;
