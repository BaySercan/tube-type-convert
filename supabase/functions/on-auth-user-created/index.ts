import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, User } from 'https://esm.sh/@supabase/supabase-js@2'

// IMPORTANT: These will be set in the Supabase Function's environment variables.
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface UserRecord extends User {
  raw_user_meta_data?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any; // Allow other properties
  };
}

// Defines the expected structure of the webhook payload from Supabase Auth.
// This is based on the documentation for database webhooks, which auth hooks resemble.
interface AuthWebhookPayload {
  type: 'INSERT'; // We are interested in 'INSERT' events on auth.users
  table: 'users'; // Specifically from the 'users' table in the 'auth' schema
  schema: 'auth';
  record: UserRecord; // The newly inserted user record
  old_record: null | UserRecord; // Should be null for INSERT events
}


serve(async (req) => {
  // Standard CORS headers. Adjust origin if more specific control is needed.
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Respond to OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = await req.json() as AuthWebhookPayload;
    // Ensure the payload is for an INSERT event in auth.users
    // Supabase Auth Hook for "User Created" fires on INSERT into auth.users
    if (payload.type !== 'INSERT' || payload.schema !== 'auth' || payload.table !== 'users') {
      console.warn('Received non-matching event:', payload);
      return new Response(JSON.stringify({ error: 'Event does not match expected auth.users INSERT' }), {
        status: 400, // Bad Request, as it's not the event we're designed to handle
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = payload.record;

    if (!user || !user.id || !user.email) {
      console.error('User data is missing or incomplete in payload.record:', user);
      return new Response(JSON.stringify({ error: 'User data is missing or incomplete' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: existingProfile, error: selectError } = await supabaseAdmin
      .from('users') // Assuming 'users' is in 'public' schema, which is default
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (selectError) {
      console.error('Error checking for existing profile:', selectError);
      return new Response(JSON.stringify({ error: 'Error checking for existing profile', details: selectError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (existingProfile) {
      console.log('Profile already exists for user:', user.id);
      return new Response(JSON.stringify({ message: 'Profile already exists' }), {
        status: 200, // Or 202 if we want to indicate accepted but no action taken
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract metadata. Google provider often stores this in raw_user_meta_data.
    // Adjust if your provider or custom claims place it elsewhere.
    const fullName = user.raw_user_meta_data?.full_name;
    const avatarUrl = user.raw_user_meta_data?.avatar_url;

    const { error: insertError } = await supabaseAdmin
      .from('users') // Again, assuming 'public.users'
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        // created_at has a default value of now() in the table schema
      });

    if (insertError) {
      console.error('Error inserting user profile:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create user profile', details: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully created profile for user:', user.id);
    return new Response(JSON.stringify({ message: 'User profile created successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    // Check if error is an instance of Error to access message property safely
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
