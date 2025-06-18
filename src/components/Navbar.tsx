import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // For user avatar
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // For dropdown
import { Youtube, User, FileText, DollarSign, LogOut, LogIn, UserCircle2 } from 'lucide-react'; // Added LogOut, LogIn, UserCircle2
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { supabase } from '@/lib/supabaseClient';

const Navbar = () => {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    // console.log('handleSignIn called'); // Remove this line
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Optional: Specify redirectTo if needed, though Supabase default is usually fine
        // redirectTo: `${window.location.origin}/auth/callback`
      },
    });
    if (error) {
      console.error("Error logging in with Google from Navbar:", error.message);
      // Consider showing a toast message to the user here as well
      // toast({ title: "Sign-In Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/'); // Navigate to home page after sign out
  };

  return (
    <nav className="w-full bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="p-2 bg-red-500 rounded-full">
            <Youtube className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-100">YouTube Converter</span>
        </Link>

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
          {user && ( // Only show Dashboard link if user is logged in
            <Link to="/dashboard" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              {/* Optionally add an icon e.g. <LayoutDashboard className="w-4 h-4" /> */}
              <span>Dashboard</span>
            </Link>
          )}
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-4" style={{ position: 'relative', zIndex: 50 }}>
          {isLoading ? (
            <div className="text-gray-300">Loading...</div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || 'User'} />
                    <AvatarFallback>
                      {user.email ? user.email.charAt(0).toUpperCase() : <UserCircle2 />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    {user.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem>Profile</DropdownMenuItem> */}
                {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleSignIn}
              className="bg-white text-gray-900 hover:bg-gray-100 font-medium"
            >
              <LogIn className="w-4 h-4 mr-2" /> {/* Changed icon to LogIn */}
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
