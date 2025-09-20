import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get session_id from URL parameters
    const url = new URL(req.url)
    const session_id = url.searchParams.get('session_id')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id parameter is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify session belongs to user and get session type
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('id, user_id, session_type, session_metadata')
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

    // Get messages for the session first
    const { data: messages, error: messagesError } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('session_id', session_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch messages',
          details: messagesError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get attachments for all messages
    let attachmentsData = [];
    if (messages && messages.length > 0) {
      const messageIds = messages.map(msg => msg.id);
      const { data: attachments, error: attachmentsError } = await supabaseClient
        .from('chat_attachments')
        .select(`
          id,
          message_id,
          file_name,
          file_size,
          file_type,
          storage_path,
          attachment_type,
          metadata,
          created_at
        `)
        .in('message_id', messageIds)
        .eq('user_id', user.id)

      if (attachmentsError) {
        console.error('Error fetching attachments:', attachmentsError)
        // Continue without attachments rather than failing completely
        attachmentsData = [];
      } else {
        attachmentsData = attachments || [];
      }
    }

    // Process messages to include Cloudinary URLs for attachments and session-type specific data
    const processedMessages = messages?.map(message => {
      const processedMessage = { ...message };
      
      // Find attachments for this message
      const messageAttachments = attachmentsData.filter(att => att.message_id === message.id);
      
      if (messageAttachments && messageAttachments.length > 0) {
        // Process attachments to use Cloudinary URLs
        processedMessage.chat_attachments = messageAttachments.map(attachment => {
          let publicUrl = attachment.storage_path;
          
          // Check if we have a Cloudinary URL in metadata
          // Handle both cases where metadata might be a string or object
          try {
            let metadata = attachment.metadata;
            if (typeof metadata === 'string') {
              metadata = JSON.parse(metadata);
            }
            
            if (metadata && metadata.cloudinary_url) {
              publicUrl = metadata.cloudinary_url;
            }
          } catch (error) {
            console.log('Error parsing metadata for attachment:', attachment.id, error);
            // Continue with original storage_path if metadata parsing fails
          }
          
          if (!publicUrl && attachment.storage_path && attachment.storage_path.includes('cloudinary.com')) {
            // Already a Cloudinary URL
            publicUrl = attachment.storage_path;
          } else if (!publicUrl) {
            // Fallback to original storage path (for backward compatibility)
            console.log('Using fallback URL for attachment:', attachment.id);
            publicUrl = attachment.storage_path;
          }
          
          return {
            ...attachment,
            public_url: publicUrl,
            cloudinary_url: publicUrl
          };
        });
      } else {
        processedMessage.chat_attachments = [];
      }

      // Process metadata based on session type
      if (message.metadata) {
        try {
          let metadata = message.metadata;
          if (typeof metadata === 'string') {
            metadata = JSON.parse(metadata);
          }

          // Add session-type specific processing
          if (session.session_type === 'enhance') {
            // For enhance sessions, prioritize image data
            if (metadata.input_images) {
              processedMessage.input_images = metadata.input_images;
            }
            if (metadata.generated_images) {
              processedMessage.generated_images = metadata.generated_images;
            }
            if (metadata.prompt) {
              processedMessage.prompt = metadata.prompt;
            }
          } else if (session.session_type === 'video') {
            // For video sessions, include video-specific data
            if (metadata.input_images) {
              processedMessage.input_images = metadata.input_images;
            }
            if (metadata.generated_images) {
              processedMessage.generated_images = metadata.generated_images;
            }
            if (metadata.generated_video) {
              processedMessage.generated_video = metadata.generated_video;
            }
            if (metadata.prompt) {
              processedMessage.prompt = metadata.prompt;
            }
          } else {
            // For chat sessions, include all available data
            if (metadata.images) {
              processedMessage.images = metadata.images;
            }
            if (metadata.prompt) {
              processedMessage.prompt = metadata.prompt;
            }
            if (metadata.response) {
              processedMessage.response = metadata.response;
            }
          }

          // Always include common metadata
          processedMessage.session_type = session.session_type;
          processedMessage.processed_metadata = metadata;
        } catch (error) {
          console.error('Error processing message metadata:', error);
        }
      }
      
      return processedMessage;
    }) || [];

    // Get total count of messages for pagination
    const { count, error: countError } = await supabaseClient
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session_id)
      .eq('user_id', user.id)

    if (countError) {
      console.error('Error counting messages:', countError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          id: session.id,
          session_type: session.session_type,
          session_metadata: session.session_metadata
        },
        messages: processedMessages,
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: (count || 0) > offset + limit
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in get-session-messages function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})