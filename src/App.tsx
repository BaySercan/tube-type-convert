import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage"; // Import LoginPage
import ProtectedRoute from "@/components/ProtectedRoute"; // Import ProtectedRoute
import DashboardPage from "@/pages/DashboardPage"; // Import DashboardPage (using DashboardPageWithAuth as default export)
import ProgressPage from "./pages/ProgressPage"; // Import ProgressPage
import ResultPage from "./pages/ResultPage"; // Import ResultPage

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} /> {/* Add LoginPage route */}
            <Route path="/progress/:jobId" element={<ProgressPage />} /> {/* Add ProgressPage route */}
            <Route path="/result/:jobId" element={<ResultPage />} /> {/* Add ResultPage route */}

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Add other protected routes here, e.g., <Route path="/profile" element={<ProfilePage />} /> */}
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
