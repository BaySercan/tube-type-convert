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
import { getCustomApiToken } from './apiTokenStore'; // Import the getter for our custom API token

// ... (supabase import might not be needed here anymore if only custom token is used)
// import { supabase } from './supabaseClient';


export const authenticatedFetch = async (
  url: string,
  options: FetchOptions = {}
): Promise<Response> => {
  const customToken = getCustomApiToken(); // Get our custom API token

  const headers = new Headers(options.headers);

  if (customToken) {
    headers.append('Authorization', `Bearer ${customToken}`);
    console.log('[authenticatedFetch] Using Custom API Token for Authorization.');
  } else {
    // This means the token exchange hasn't happened or failed.
    // For your API (which expects its own JWT), proceeding without it will likely result in a 401/403.
    console.warn('[authenticatedFetch] No Custom API Token available. Request will likely be unauthorized by the target API.');
    // Optionally, you could throw an error here to prevent the call:
    // throw new Error('Custom API token is not available. Cannot make authenticated request.');
  }

  console.log('[authenticatedFetch] Requesting URL:', url);
  console.log('[authenticatedFetch] With options:', { ...options, headers: Object.fromEntries(headers.entries()) });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
    });

    if (response.status === 401) {
      console.error('[authenticatedFetch] API request returned 401 Unauthorized. The token might be invalid or expired.');
    }
    return response;
  } catch (error) {
    console.error('[authenticatedFetch] Fetch call failed:', error);
    throw error;
  }
};
