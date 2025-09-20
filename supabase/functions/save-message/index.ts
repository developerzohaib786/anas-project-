import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME')
const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY')
const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET')

// Helper function to upload to Cloudinary
async function uploadToCloudinary(
  imageUrl: string,
  fileName: string
): Promise<{ success: boolean; url?: string; path?: string; fileSize?: number; error?: string }> {
  try {
    // Fetch the image data
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Create form data for Cloudinary upload
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('upload_preset', 'unsigned_preset'); // You need to set this in Cloudinary
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME!);
    
    // Upload to Cloudinary
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!uploadResponse.ok) {
      throw new Error(`Cloudinary upload failed: ${uploadResponse.statusText}`);
    }
    
    const result = await uploadResponse.json();
    
    return {
      success: true,
      url: result.secure_url,
      path: result.public_id,
      fileSize: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

interface SaveMessageRequest {
  sessionId?: string;
  session_id?: string;  // Support snake_case from frontend
  messageType?: 'user' | 'assistant';
  message_type?: 'user' | 'assistant';  // Support snake_case from frontend
  content: string;
  attachments?: any[];
  metadata?: any;
  images?: Array<{
    id: string;
    url: string;
    name: string;
    is_generated?: boolean;
    size?: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
    const { sessionId, session_id, messageType, message_type, content, attachments, metadata, images }: SaveMessageRequest = await req.json()

    // Normalize field names - support both camelCase and snake_case
    const normalizedSessionId = sessionId || session_id;
    const normalizedMessageType = messageType || message_type;

    // Validate required fields
    if (!normalizedSessionId || !normalizedMessageType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId/session_id, messageType/message_type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate message type
    if (!['user', 'assistant'].includes(normalizedMessageType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid message type. Must be "user" or "assistant"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify session belongs to user and get session type
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, user_id, session_type, session_metadata')
      .eq('id', normalizedSessionId)
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

    // Process images BEFORE saving the message to ensure Cloudinary URLs are stored
    let processedImages = images || [];
    
    if (images && images.length > 0) {
      console.log('Processing images before saving message:', images.length);
      
      processedImages = await Promise.all(images.map(async (image) => {
        try {
          let finalUrl = image.url;
          let cloudinaryPath = '';
          let fileSize = image.size || 0;

          // Check if it's a blob URL or data URL that needs uploading
          if (image.url.startsWith('blob:') || image.url.startsWith('data:')) {
            console.log('Uploading image to Cloudinary:', image.name);
            const uploadResult = await uploadToCloudinary(image.url, image.name);
            
            if (uploadResult.success) {
              finalUrl = uploadResult.url!;
              cloudinaryPath = uploadResult.path || '';
              fileSize = uploadResult.fileSize || 0;
              console.log('Image uploaded successfully:', finalUrl);
            } else {
              console.error('Failed to upload image:', uploadResult.error);
              // Use original URL as fallback
            }
          } else if (!image.url.includes('cloudinary.com')) {
            // If it's not a Cloudinary URL, try to re-upload it
            console.log('Re-uploading non-Cloudinary image:', image.name);
            try {
              const uploadResult = await uploadToCloudinary(image.url, image.name);
              if (uploadResult.success) {
                finalUrl = uploadResult.url!;
                cloudinaryPath = uploadResult.path || '';
                fileSize = uploadResult.fileSize || 0;
                console.log('Image re-uploaded successfully:', finalUrl);
              }
            } catch (reuploadError) {
              console.error('Failed to re-upload image:', reuploadError);
              // Continue with original URL
            }
          }

          return {
            ...image,
            url: finalUrl,
            cloudinaryPath,
            fileSize
          };
        } catch (error) {
          console.error('Error processing image:', error);
          return image; // Return original image if processing fails
        }
      }));
    }

    // Prepare enhanced metadata based on session type
    const enhancedMetadata = {
      ...metadata,
      // Always include the message content for easy access
      message_content: content,
      // Include message type for context
      message_type: normalizedMessageType,
      // Include session type for context
      session_type: session.session_type,
      // Add timestamp for tracking
      saved_at: new Date().toISOString()
    };

    // Handle session-type specific metadata
    if (session.session_type === 'enhance') {
      // For enhance sessions, focus on image processing and prompts
      if (normalizedMessageType === 'user') {
        enhancedMetadata.prompt = content;
        if (processedImages.length > 0) {
          enhancedMetadata.input_images = processedImages;
        }
      } else if (normalizedMessageType === 'assistant') {
        enhancedMetadata.response = content;
        if (processedImages.length > 0) {
          enhancedMetadata.generated_images = processedImages;
        }
      }
    } else if (session.session_type === 'video') {
      // For video sessions, handle video-specific metadata
      if (normalizedMessageType === 'user') {
        enhancedMetadata.prompt = content;
        if (processedImages.length > 0) {
          enhancedMetadata.input_images = processedImages;
        }
      } else if (normalizedMessageType === 'assistant') {
        enhancedMetadata.response = content;
        if (processedImages.length > 0) {
          enhancedMetadata.generated_images = processedImages;
        }
        // Video-specific metadata can be added here
        if (metadata?.video_url) {
          enhancedMetadata.generated_video = metadata.video_url;
        }
      }
    } else {
      // For chat sessions, store all content types
      if (normalizedMessageType === 'user') {
        enhancedMetadata.prompt = content;
      } else if (normalizedMessageType === 'assistant') {
        enhancedMetadata.response = content;
      }
      
      if (processedImages.length > 0) {
        enhancedMetadata.images = processedImages;
      }
    }

    // Save the message with processed Cloudinary URLs
    const { data: savedMessage, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: normalizedSessionId,
        message_type: normalizedMessageType,
        content,
        metadata: enhancedMetadata,
        user_id: user.id
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving message:', messageError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to save message',
          details: messageError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Message saved successfully with processed images:', savedMessage.id);

    // Create chat_attachments records for processed images
    const savedAttachments = [];
    
    if (processedImages && processedImages.length > 0) {
      console.log('Creating attachment records for processed images');
      
      for (const image of processedImages) {
        try {
          const { data: attachmentData, error: attachmentError } = await supabase
            .from('chat_attachments')
            .insert({
              message_id: savedMessage.id,
              file_name: image.name,
              file_url: image.url,
              file_type: 'image',
              file_size: image.fileSize || image.size || 0,
              storage_path: image.cloudinaryPath || image.url,
              user_id: user.id
            })
            .select()
            .single();

          if (attachmentError) {
            console.error('Error creating attachment record:', attachmentError);
          } else {
            savedAttachments.push(attachmentData);
          }
        } catch (error) {
          console.error('Error processing attachment:', error);
        }
      }
    }

    // Process traditional attachments array (videos, etc.)
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          let finalUrl = attachment.url;
          let storagePath = attachment.url;
          let actualFileSize = attachment.size || 0;

          // If this is a blob URL or data URL, upload to Cloudinary
          if (attachment.url.startsWith('blob:') || attachment.url.startsWith('data:')) {
            console.log('Uploading attachment to Cloudinary:', attachment.name);
            const uploadResult = await uploadToCloudinary(attachment.url, attachment.name);
            
            if (uploadResult.success) {
              finalUrl = uploadResult.url!;
              storagePath = uploadResult.path || '';
              actualFileSize = uploadResult.fileSize || 0;
              console.log('Attachment uploaded successfully:', finalUrl);
            } else {
              console.error('Failed to upload attachment:', uploadResult.error);
            }
          } else if (!attachment.url.includes('cloudinary.com')) {
            // If it's not already a Cloudinary URL, try to upload it
            console.log('Re-uploading existing attachment to Cloudinary:', attachment.name);
            try {
              const uploadResult = await uploadToCloudinary(attachment.url, attachment.name);
              if (uploadResult.success) {
                finalUrl = uploadResult.url!;
                storagePath = uploadResult.path || '';
                actualFileSize = uploadResult.fileSize || 0;
                console.log('Attachment re-uploaded successfully:', finalUrl);
              }
            } catch (reuploadError) {
              console.error('Failed to re-upload attachment:', reuploadError);
            }
          }

          // Create attachment record
          const { data: attachmentData, error: attachmentError } = await supabase
            .from('chat_attachments')
            .insert({
              message_id: savedMessage.id,
              file_name: attachment.name,
              file_url: finalUrl,
              file_type: attachment.type || 'unknown',
              file_size: actualFileSize,
              storage_path: storagePath,
              user_id: user.id
            })
            .select()
            .single();

          if (attachmentError) {
            console.error('Error creating attachment record:', attachmentError);
          } else {
            savedAttachments.push(attachmentData);
          }
        } catch (error) {
          console.error('Error processing attachment:', error);
        }
      }
    }

    // Update session's updated_at timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', normalizedSessionId);

    // Return success response with processed images containing Cloudinary URLs
    return new Response(
      JSON.stringify({
        success: true,
        message: {
          id: savedMessage.id,
          session_id: savedMessage.session_id,
          message_type: savedMessage.message_type,
          content: savedMessage.content,
          attachments: savedAttachments,
          metadata: {
            ...savedMessage.metadata,
            images: processedImages // Include processed images with Cloudinary URLs
          },
          created_at: savedMessage.created_at,
          updated_at: savedMessage.updated_at
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in save-message function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})