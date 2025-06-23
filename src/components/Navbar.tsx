import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // For user avatar
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // For dropdown
import { Youtube, User, FileText, DollarSign, LogOut, LogIn, UserCircle2, Chrome, Loader2, Menu } from 'lucide-react'; // Added Menu, Chrome, Loader2
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { supabase } from '@/lib/supabaseClient';

const Navbar = () => {
  const { user, signOut, isLoading, session } = useAuth(); // Added session for logging
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  console.log('[Navbar] Rendering. isLoading:', isLoading, 'User:', user?.id, 'Session:', session?.access_token ? 'exists' : 'null');

  const handleSignIn = async () => {
    setIsSigningIn(true);
    // console.log('handleSignIn called'); // Remove this line
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Optional: Specify redirectTo if needed, though Supabase default is usually fine
        // redirectTo: `${window.location.origin}/auth/callback`
      },
    });
    if (error) {
      setIsSigningIn(false);
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
    <nav className="w-full bg-gray-900/80 border-b border-gray-700/30 px-6 py-4 z-30 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="p-2 bg-red-500 rounded-full">
            <Youtube className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-100">YouTube Converter</span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/documentation" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
            <FileText className="w-4 h-4" />
            <span>Docs</span>
          </Link>
          <Link to="/#pricing" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
            <DollarSign className="w-4 h-4" />
            <span>Pricing</span>
          </Link>
        </div>

        {/* Auth Section & Hamburger (Mobile) */}
        <div className="flex items-center space-x-4">
          {/* Hamburger Icon (Mobile) */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="h-6 w-6 text-gray-300" />
            </Button>
          </div>

          {/* Auth Section (Desktop) */}
          <div
            className="hidden md:flex" // Auth content is flex, spacing handled by parent or internal elements
            style={{ position: 'relative', zIndex: 50, pointerEvents: 'auto' }}
          >
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
              disabled={isSigningIn}
              style={{ pointerEvents: 'auto' }} // Corrected this line
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in with Google...
                </>
              ) : (
                <>
                  <Chrome className="w-4 h-4 mr-2" />
                  Sign in with Google
                </>
              )}
            </Button>
          )}
          </div>
        </div>
      </div>

      {/* Mobile Menu (Dropdown) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-900/95 border-t border-gray-700/30">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/documentation"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700/50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              Docs
            </Link>
            <Link
              to="/#pricing"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700/50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <DollarSign className="inline-block w-4 h-4 mr-2" />
              Pricing
            </Link>
          </div>
          {/* Mobile Auth Section */}
          <div className="pt-4 pb-3 border-t border-gray-700/50">
            {isLoading ? (
              <div className="px-3 py-2 text-gray-400">Loading user...</div>
            ) : user ? (
              <div className="px-2 space-y-1">
                <div className="flex items-center px-3 py-2">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || 'User'} />
                    <AvatarFallback>
                      {user.email ? user.email.charAt(0).toUpperCase() : <UserCircle2 />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-base font-medium leading-none text-white">
                      {user.user_metadata?.full_name || user.email}
                    </div>
                    {user.email && <div className="text-sm font-medium leading-none text-gray-400">{user.email}</div>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700/50"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="px-2">
                <Button
                  onClick={() => {
                    handleSignIn();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-white text-gray-900 hover:bg-gray-100 font-medium"
                  disabled={isSigningIn}
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Chrome className="w-4 h-4 mr-2" />
                      Sign in with Google
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
