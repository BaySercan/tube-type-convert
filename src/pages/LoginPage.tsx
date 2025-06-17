import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ChromeIcon } from "lucide-react"; // Using ChromeIcon as a stand-in for Google icon

const LoginPage = () => {
  const { session, isLoading } = useAuth();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // You can add redirectTo here if needed, e.g.,
        // redirectTo: window.location.origin + '/auth/callback',
        // But Supabase handles it well by default by redirecting to the current page.
      },
    });
    if (error) {
      console.error("Error logging in with Google:", error.message);
      // You might want to show a toast notification here
    }
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (session) {
    // If user is already logged in, redirect to home or dashboard
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>Login</h1>
      <p>Please sign in to continue.</p>
      <Button onClick={handleGoogleLogin} variant="outline">
        <ChromeIcon className="mr-2 h-4 w-4" /> {/* Using Chrome icon, replace if a specific Google icon is available or add one */}
        Sign in with Google
      </Button>
    </div>
  );
};

export default LoginPage;
