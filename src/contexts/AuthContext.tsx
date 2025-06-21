import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct
import { setCustomApiToken as storeTokenInGlobalStore, getCustomApiToken as retrieveTokenFromGlobalStore } from '@/lib/apiTokenStore'; // Corrected import

const API_BASE_URL = import.meta.env.VITE_YOUTUBE_MULTI_API_URL || 'http://localhost:3500';

export type UserProfile = {
  id: string; // UUID
  full_name: string | null;
  avatar_url: string | null;
  email?: string; // email is good to have for display, though id is the key
  created_at?: string; // TIMESTAMPTZ
  // Add any other fields from your public.users table you want in the context
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null; // Add this
  isLoading: boolean; // True if initial Supabase session is loading
  isLoadingProfile: boolean; // True if Supabase user profile is loading
  isLoadingApiToken: boolean; // True if exchanging Supabase token for custom API token
  customApiToken: string | null; // The JWT for your custom API
  customApiTokenError: string | null; // Error message from token exchange failure
  signOut: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  // exchangeToken: () => Promise<void>; // Might be called internally or exposed if needed
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [customApiToken, setCustomApiToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial Supabase session
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingApiToken, setIsLoadingApiToken] = useState(false);
  const [customApiTokenError, setCustomApiTokenError] = useState<string | null>(null);

  const exchangeSupabaseTokenForApiToken = async (supabaseAccessToken: string): Promise<void> => {
    if (!supabaseAccessToken) {
      setCustomApiTokenError("Supabase access token not available for exchange."); // Should not happen if called correctly
      return;
    }
    console.log('[AuthContext] Attempting to exchange Supabase token for custom API token.');
    setIsLoadingApiToken(true);
    setCustomApiToken(null);
    storeTokenInGlobalStore(null); // Clear from global store when attempting
    setCustomApiTokenError(null); // Clear previous errors

    try {
      const response = await fetch(`${API_BASE_URL}/auth/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ supabaseAccessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[AuthContext] Token exchange failed:', data.error || response.statusText);
        throw new Error(data.error || `Token exchange failed with status ${response.status}`);
      }

// ... (inside AuthProvider)
// ...
      if (data.apiToken) {
        setCustomApiToken(data.apiToken);
        storeTokenInGlobalStore(data.apiToken);
        console.log('[AuthContext] Custom API token received and stored in context and global store.');
        setCustomApiTokenError(null); // Clear any previous error on success
        // Optionally, schedule a refresh based on data.expiresIn if needed
      } else {
        const errorMsg = 'Token exchange response missing apiToken.';
        console.error(`[AuthContext] ${errorMsg}`);
        setCustomApiTokenError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: unknown) {
      let message = 'An unknown error occurred during token exchange.';
      if (error instanceof Error) {
        message = error.message;
      }
      console.error('[AuthContext] Error during token exchange:', message);
      setCustomApiToken(null);
      storeTokenInGlobalStore(null);
      setCustomApiTokenError(message);
    } finally {
      setIsLoadingApiToken(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    if (!userId) {
      setUserProfile(null);
      return;
    }
    setIsLoadingProfile(true);
    try {
      const { data, error, status } = await supabase
        .from('users') // Ensure this is your public users table
        .select(`id, full_name, avatar_url, email, created_at`) // Adjust fields as needed
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406 can happen if no row is found, which is fine.
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
      } else if (data) {
        setUserProfile(data as UserProfile);
      } else {
        // No data and no error (or 406), means profile doesn't exist yet.
        // This is possible if the edge function hasn't run yet or if there was an issue.
        console.log('No user profile found for user:', userId);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Catastrophic error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    console.log('[AuthContext] useEffect Mounting. Initializing...');
    // Initial session check
    setIsLoading(true);
    console.log('[AuthContext] Initial getSession() call - setIsLoading(true)');

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      console.log('[AuthContext] Initial getSession() success. Session:', initialSession);
      setSession(initialSession);
      const initialUser = initialSession?.user ?? null;
      setUser(initialUser);
      console.log('[AuthContext] Initial user set:', initialUser?.id);

      if (initialUser && initialSession?.access_token) {
        console.log('[AuthContext] Initial user and Supabase session found. Fetching profile and exchanging token.');
        fetchUserProfile(initialUser.id); // Not awaited, for profile UI
        exchangeSupabaseTokenForApiToken(initialSession.access_token); // Not awaited, for API access
      } else {
        console.log('[AuthContext] No initial Supabase user/session. Clearing profile and custom token.');
        setUserProfile(null);
        setCustomApiToken(null);
      }
      setIsLoading(false);
      console.log('[AuthContext] Initial getSession() processed - setIsLoading(false)');
    }).catch((error) => {
      console.error('[AuthContext] Initial getSession() error:', error);
      setIsLoading(false);
      setCustomApiToken(null);
      storeTokenInGlobalStore(null);
      setCustomApiTokenError('Failed to initialize session.'); // Set error here
      console.log('[AuthContext] Initial getSession() error - setIsLoading(false)');
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('[AuthContext] onAuthStateChange triggered. Event:', _event, 'New Session:', newSession);
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        console.log('[AuthContext] onAuthStateChange - user set:', currentUser?.id);

        if (currentUser && newSession?.access_token) {
          console.log('[AuthContext] onAuthStateChange - User signed in/session updated. Fetching profile and exchanging token.');
          fetchUserProfile(currentUser.id); // Fire-and-forget for profile UI update
          // Await token exchange if other critical operations depend on it immediately.
          // For now, let it update the context when it completes.
          exchangeSupabaseTokenForApiToken(newSession.access_token);
        } else if (!currentUser) {
          // This handles SIGNED_OUT or cases where session becomes null (e.g. token revoked server-side)
          console.log('[AuthContext] onAuthStateChange - User is null (e.g., signed out). Clearing profile and custom API token.');
          setUserProfile(null);
          setCustomApiToken(null);
          storeTokenInGlobalStore(null);
          setCustomApiTokenError(null); // Clear token exchange error
        }

        if (_event === 'INITIAL_SESSION' || _event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
          // SIGNED_OUT also means loading is done, user is null.
          // INITIAL_SESSION is often the first event on load if a session exists.
          // SIGNED_IN is the event after a login action.
          setIsLoading(false);
          console.log(`[AuthContext] onAuthStateChange event '${_event}', setting isLoading to false.`);
        }
        console.log('[AuthContext] onAuthStateChange processing complete for user:', currentUser?.id);
      }
    );

    return () => {
      console.log('[AuthContext] useEffect Cleanup. Unsubscribing auth listener.');
      // `authListener` here is the `data` part of AuthSubscription, so it's `{ subscription: Subscription }`
      if (authListener && authListener.subscription && typeof authListener.subscription.unsubscribe === 'function') {
        authListener.subscription.unsubscribe();
        console.log('[AuthContext] Successfully unsubscribed from auth state changes.');
      } else {
        console.warn('[AuthContext] Could not unsubscribe from auth state changes, structure unexpected or listener null.', authListener);
      }
    };
  }, []); // fetchUserProfile is stable, no need to add to deps

  const wrappedSignOut = async () => {
    await supabase.auth.signOut();
    // Auth listener will eventually set user and session to null.
    // Explicitly clear profile here for immediate UI update if desired,
    // though onAuthStateChange should also handle clearing it.
    setUserProfile(null);
    setCustomApiToken(null);
    storeTokenInGlobalStore(null);
    setCustomApiTokenError(null); // Clear token exchange error
    // No need to manually set user/session to null, authListener handles it.
  };

  const value = {
    session,
    user,
    userProfile,
    customApiToken,
    customApiTokenError, // Expose the error state
    isLoading,
    isLoadingProfile,
    isLoadingApiToken,
    signOut: wrappedSignOut,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
