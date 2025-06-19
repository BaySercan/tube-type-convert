import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct

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
  isLoading: boolean;
  isLoadingProfile: boolean; // For profile loading state
  signOut: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>; // Add this
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initial loading for session
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

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

      if (initialUser) {
        console.log('[AuthContext] Initial user found, calling fetchUserProfile (not awaiting).');
        fetchUserProfile(initialUser.id);
      } else {
        console.log('[AuthContext] No initial user, setUserProfile(null).');
        setUserProfile(null);
      }
      setIsLoading(false);
      console.log('[AuthContext] Initial getSession() processed - setIsLoading(false)');
    }).catch((error) => {
      console.error('[AuthContext] Initial getSession() error:', error);
      setIsLoading(false);
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

        if (currentUser) {
          console.log('[AuthContext] onAuthStateChange - user found, attempting to fetchUserProfile (awaiting).');
          try {
            await fetchUserProfile(currentUser.id);
            console.log('[AuthContext] onAuthStateChange - fetchUserProfile successful.');
          } catch (profileError) {
            console.error('[AuthContext] onAuthStateChange - error during fetchUserProfile:', profileError);
            // Decide if setUserProfile(null) is appropriate here or if existing profile (if any) should be kept.
            // For now, let's clear it if fetching fails to avoid stale profile data.
            setUserProfile(null);
          }
        } else {
          console.log('[AuthContext] onAuthStateChange - no user, setUserProfile(null).');
          setUserProfile(null); // Clear profile if no user (logout)
        }
        // isLoading should not be managed here for onAuthStateChange events after initial load.
        console.log('[AuthContext] onAuthStateChange processing complete for user:', currentUser?.id);
      }
    );

    return () => {
      console.log('[AuthContext] useEffect Cleanup. Unsubscribing auth listener.');
      authListener?.unsubscribe();
    };
  }, []); // fetchUserProfile is stable, no need to add to deps

  const wrappedSignOut = async () => {
    await supabase.auth.signOut();
    // Auth listener will eventually set user and session to null.
    // Explicitly clear profile here for immediate UI update if desired,
    // though onAuthStateChange should also handle clearing it.
    setUserProfile(null);
    // No need to manually set user/session to null, authListener handles it.
  };

  const value = {
    session,
    user,
    userProfile,
    isLoading,
    isLoadingProfile,
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
