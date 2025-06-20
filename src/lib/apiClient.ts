import { supabase } from './supabaseClient';

// interface FetchOptions extends RequestInit { // Removed as it's currently empty
//   // We can add custom options if needed in the future
// }

/**
 * A utility function to make authenticated fetch requests.
 * It automatically retrieves the Supabase session and adds the
 * JWT access token to the Authorization header.
 *
 * @param url The URL to fetch.
 * @param options Optional fetch options (method, body, etc.).
 * @returns A Promise that resolves to the fetch Response.
 */
import { getCustomApiToken } from './apiTokenStore'; // Import the getter for our custom API token

// ... (supabase import might not be needed here anymore if only custom token is used)
// import { supabase } from './supabaseClient';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}, // Changed FetchOptions to RequestInit
  isRetry: boolean = false // Added isRetry flag
): Promise<Response> => {
  let customToken = getCustomApiToken(); // Get our custom API token

  if (!customToken && !isRetry) {
    // If token is initially missing, wait a bit for AuthContext to potentially fetch it.
    console.warn('[authenticatedFetch] Custom API Token is initially missing. Waiting 2s before retry...');
    await delay(2000); // Wait 2 seconds
    customToken = getCustomApiToken(); // Try fetching token again
  }

  if (!customToken) {
    // If still no token after initial wait (or if it's a retry and token is gone), throw error.
    console.error('[authenticatedFetch] Critical Error: No Custom API Token available. Cannot make authenticated request.');
    throw new Error('Authentication token for API is missing. Please try signing out and in again.');
  }

  const headers = new Headers(options.headers);
  headers.append('Authorization', `Bearer ${customToken}`);
  console.log(`[authenticatedFetch] ${isRetry ? '(Retry) ' : ''}Using Custom API Token for Authorization.`);

  console.log(`[authenticatedFetch] ${isRetry ? '(Retry) ' : ''}Requesting URL:`, url);
  // console.log('[authenticatedFetch] With options:', { ...options, headers: Object.fromEntries(headers.entries()) }); // Can be verbose

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
    });

    if (response.status === 401 && !isRetry) {
      console.warn('[authenticatedFetch] API request returned 401 Unauthorized. Attempting token refresh and retry...');
      // Wait for a short period to allow AuthContext to refresh the token via onAuthStateChange
      await delay(2500); // Wait 2.5 seconds (adjust as needed)
      // Retry the fetch once. The new call will re-fetch the token from the store.
      console.log('[authenticatedFetch] Retrying request after potential token refresh.');
      return authenticatedFetch(url, options, true); // Pass isRetry = true
    }

    if (response.status === 401 && isRetry) {
        console.error('[authenticatedFetch] (Retry) API request still returned 401. Giving up.');
        // Fall through to return the 401 response, or throw a specific error
    }
    return response;
  } catch (error) {
    console.error(`[authenticatedFetch] ${isRetry ? '(Retry) ' : ''}Fetch call failed:`, error);
    throw error; // Re-throw original error if fetch itself fails
  }
};
