import { supabase } from './supabaseClient';

interface FetchOptions extends RequestInit {
  // We can add custom options if needed in the future
}

/**
 * A utility function to make authenticated fetch requests.
 * It automatically retrieves the Supabase session and adds the
 * JWT access token to the Authorization header.
 *
 * @param url The URL to fetch.
 * @param options Optional fetch options (method, body, etc.).
 * @returns A Promise that resolves to the fetch Response.
 */
export const authenticatedFetch = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);

  if (session?.access_token) {
    headers.append('Authorization', `Bearer ${session.access_token}`);
  } else {
    // Handle cases where there's no session (user not logged in)
    // Depending on the API, you might want to:
    // 1. Proceed without Authorization header (for public endpoints)
    // 2. Throw an error to prevent the call
    // 3. Redirect to login (though this should ideally be handled by ProtectedRoute or similar UI logic)
    console.warn('No active session. API call will be made without Authorization header.');
    // For now, we'll let it proceed, but in a real app, you might throw an error
    // if the endpoint strictly requires authentication.
    // Example: throw new Error("User not authenticated");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Optional: Basic error handling for 401 Unauthorized
  // More sophisticated error handling (like redirecting to login or trying to refresh token explicitly)
  // can be added here or in the calling code (e.g., react-query's onError).
  if (response.status === 401) {
    console.error('API request returned 401 Unauthorized. The token might be invalid or expired.');
    // Potentially trigger a sign out or redirect here if appropriate for your app's UX.
    // For example: await supabase.auth.signOut(); window.location.href = '/login';
  }

  return response;
};

// Example of how to use it with @tanstack/react-query (for demonstration)
// This would typically be in a file where you define your queries, e.g., src/hooks/useMyData.ts

/*
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '@/lib/apiClient';

type MyData = {
  id: string;
  name: string;
  // ... other properties
};

const fetchMyData = async (): Promise<MyData[]> => {
  // Replace with your actual API endpoint
  const response = await authenticatedFetch('/api/my-data'); // Assuming your API is on the same origin or proxied
  // Or full URL: const response = await authenticatedFetch('https://your-api.com/my-data');

  if (!response.ok) {
    // Handle non-2xx responses (e.g., 404, 500)
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.json();
};

export const useMyProtectedData = () => {
  return useQuery<MyData[], Error>({
    queryKey: ['myData'],
    queryFn: fetchMyData,
    // Options like `enabled: !!session` can be used if you get session from useAuth() here
  });
};
*/
