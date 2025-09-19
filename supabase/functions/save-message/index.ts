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
  // New fields for enhanced prompt-response tracking
  parent_message_id?: string; // Link responses to their prompts
  conversation_context?: {
    prompt?: string; // Original user prompt for AI responses
    intent?: string; // AI intent (generate, ask, etc.)
    image_prompt?: string; // Generated image prompt
    model_used?: string; // AI model used for response
    tokens_used?: number; // Token count for the response
  };
  images?: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    is_generated?: boolean; // Flag for AI-generated images
    prompt_used?: string; // Prompt used to generate the image
  }>;
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
      metadata = {},
      parent_message_id,
      conversation_context = {},
      images = []
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

    // Prepare enhanced metadata with conversation context
    const enhancedMetadata = {
      ...metadata,
      ...(conversation_context && Object.keys(conversation_context).length > 0 && {
        conversation_context
      }),
      ...(parent_message_id && { parent_message_id }),
      ...(images.length > 0 && { images })
    };

    // Save the message first
    const { data: message, error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id,
        user_id: user.id,
        message_type,
        content: content || null,
        attachments,
        metadata: enhancedMetadata
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

    // Process and store images if provided
    const savedAttachments = [];
    
    // Handle images from the images array (enhanced format)
    if (images && images.length > 0) {
      for (const image of images) {
        try {
          // For AI-generated images, we might already have a URL
          // For user uploads, we need to ensure they're stored properly
          let finalUrl = image.url;
          let storagePath = image.url;

          // If this is a blob URL or temporary URL, we need to handle it differently
          if (image.url.startsWith('blob:') || image.url.startsWith('data:')) {
            // This would require additional handling for blob/data URLs
            // For now, we'll log this case and continue
            console.log('Warning: Blob/Data URL detected, may need additional processing:', image.url);
          }

          // Create attachment record
          const { data: attachmentData, error: attachmentError } = await supabaseClient
            .from('chat_attachments')
            .insert({
              message_id: message.id,
              user_id: user.id,
              file_name: image.name,
              file_type: image.type,
              file_size: image.size,
              storage_path: storagePath,
              attachment_type: 'image',
              metadata: {
                is_generated: image.is_generated || false,
                prompt_used: image.prompt_used || null,
                original_id: image.id
              }
            })
            .select()
            .single();

          if (attachmentError) {
            console.error('Error saving image attachment:', attachmentError);
            // Continue with other images even if one fails
            continue;
          }

          savedAttachments.push({
            id: attachmentData.id,
            file_name: attachmentData.file_name,
            file_type: attachmentData.file_type,
            file_size: attachmentData.file_size,
            storage_path: attachmentData.storage_path,
            attachment_type: attachmentData.attachment_type,
            metadata: attachmentData.metadata
          });

        } catch (imageError) {
          console.error('Error processing image:', imageError);
          // Continue with other images
          continue;
        }
      }
    }

    // Handle traditional attachments array
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          const { data: attachmentData, error: attachmentError } = await supabaseClient
            .from('chat_attachments')
            .insert({
              message_id: message.id,
              user_id: user.id,
              file_name: attachment.filename || 'unknown',
              file_type: attachment.metadata?.type || 'unknown',
              file_size: attachment.size || 0,
              storage_path: attachment.url,
              attachment_type: attachment.type,
              metadata: attachment.metadata || {}
            })
            .select()
            .single();

          if (attachmentError) {
            console.error('Error saving attachment:', attachmentError);
            continue;
          }

          savedAttachments.push({
            id: attachmentData.id,
            file_name: attachmentData.file_name,
            file_type: attachmentData.file_type,
            file_size: attachmentData.file_size,
            storage_path: attachmentData.storage_path,
            attachment_type: attachmentData.attachment_type,
            metadata: attachmentData.metadata
          });

        } catch (attachmentError) {
          console.error('Error processing attachment:', attachmentError);
          continue;
        }
      }
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
          attachments: savedAttachments, // Return the saved attachments with proper IDs
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