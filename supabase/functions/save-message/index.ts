import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SaveMessageRequest {
  session_id: string;
  message_type: 'user' | 'assistant' | 'system';
  content?: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    filename?: string;
    size?: number;
    metadata?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('Authentication failed:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: userError?.message || 'No user found'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { 
      session_id, 
      message_type, 
      content, 
      attachments = [], 
      metadata = {} 
    }: SaveMessageRequest = await req.json()

    // Validate required fields
    if (!session_id || !message_type) {
      return new Response(
        JSON.stringify({ error: 'session_id and message_type are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate message_type
    if (!['user', 'assistant', 'system'].includes(message_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid message_type. Must be one of: user, assistant, system' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify that the session belongs to the user
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('id, user_id')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Save the message
    const { data: message, error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id,
        user_id: user.id,
        message_type,
        content: content || null,
        attachments,
        metadata
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error saving message:', messageError)
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update session's updated_at timestamp
    await supabaseClient
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id)

    return new Response(
      JSON.stringify({
        success: true,
        message: {
          id: message.id,
          session_id: message.session_id,
          message_type: message.message_type,
          content: message.content,
          attachments: message.attachments,
          metadata: message.metadata,
          created_at: message.created_at,
          updated_at: message.updated_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in save-message function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})