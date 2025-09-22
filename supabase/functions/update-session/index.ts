import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface UpdateSessionRequest {
  session_id: string
  title?: string
  generated_image?: string
  current_prompt?: string
  uploaded_images?: any[]
  input_value?: string
  is_completed?: boolean
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
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { 
      session_id, 
      title, 
      generated_image, 
      current_prompt, 
      uploaded_images, 
      input_value, 
      is_completed 
    }: UpdateSessionRequest = await req.json()

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (title !== undefined && (!title || title.trim().length === 0)) {
      return new Response(
        JSON.stringify({ error: 'title cannot be empty when provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // First, verify that the session belongs to the user
    const { data: existingSession, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('id, user_id, title')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !existingSession) {
      return new Response(
        JSON.stringify({ error: 'Session not found or access denied' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) {
      updateData.title = title.trim()
    }
    
    if (generated_image !== undefined) {
      updateData.generated_image = generated_image
    }
    
    if (current_prompt !== undefined) {
      updateData.current_prompt = current_prompt
    }
    
    if (uploaded_images !== undefined) {
      updateData.uploaded_images = uploaded_images
    }
    
    if (input_value !== undefined) {
      updateData.input_value = input_value
    }
    
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed
    }

    // Update the session
    const { data: updatedSession, error: updateError } = await supabaseClient
      .from('chat_sessions')
      .update(updateData)
      .eq('id', session_id)
      .eq('user_id', user.id)
      .select('id, title, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Error updating session:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update session' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Session updated successfully',
        session: updatedSession
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})