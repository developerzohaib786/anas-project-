import { supabase } from '@/integrations/supabase/client';
import CloudinaryService from '@/services/cloudinaryService';
import VideoUploadService from '@/services/videoUploadService';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  images?: UploadedImage[];
  videos?: UploadedVideo[];
  isGenerating?: boolean;
  metadata?: any;
  // Enhanced fields for better prompt-response tracking
  conversation_context?: {
    prompt?: string;
    intent?: string;
    image_prompt?: string;
    model_used?: string;
    tokens_used?: number;
  };
  parent_message_id?: string;
}

export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  file?: File;
  size?: number;
  type?: string;
  // Enhanced fields for AI-generated images
  is_generated?: boolean;
  prompt_used?: string;
}

export interface UploadedVideo {
  id: string;
  name: string;
  url: string;
  file?: File;
  size?: number;
  type?: string;
  duration?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  session_type?: 'chat' | 'enhance' | 'video';
  session_metadata?: Record<string, any>;
  generatedImage?: string;
  generatedVideo?: string;
  currentPrompt?: string;
  uploadedImages?: UploadedImage[];
  inputValue?: string;
  videoMetadata?: {
    movement: string;
    sfx: string;
    size: string;
    isDemoVideo?: boolean;
    demoMessage?: string;
    generationId?: string;
  };
}

export class ChatHistoryService {
  // Create a new chat session with support for different session types
  static async createSession(
    title?: string, 
    user?: any, 
    sessionType: 'chat' | 'enhance' | 'video' = 'chat',
    sessionMetadata?: Record<string, any>
  ): Promise<ChatSession> {
    if (!user) throw new Error('User not authenticated');

    // Use the new create-session API function
    const response = await supabase.functions.invoke('create-session', {
      body: {
        title,
        session_type: sessionType,
        session_metadata: sessionMetadata
      }
    });

    if (response.error) {
      console.error('Error creating session:', response.error);
      throw new Error('Failed to create session');
    }

    const sessionData = response.data.session;
    
    return {
      id: sessionData.id,
      title: sessionData.title,
      messages: [],
      isCompleted: false,
      createdAt: new Date(sessionData.created_at),
      updatedAt: new Date(sessionData.updated_at),
      session_type: sessionData.session_type,
      session_metadata: sessionData.session_metadata,
    };
  }

  // Legacy method for backward compatibility
  static async createChatSession(title: string = 'New Chat', user?: any): Promise<ChatSession> {
    return this.createSession(title, user, 'chat');
  }

  // Create enhance session
  static async createEnhanceSession(title: string = 'New Enhancement Session', user?: any, metadata?: Record<string, any>): Promise<ChatSession> {
    return this.createSession(title, user, 'enhance', metadata);
  }

  // Create video session
  static async createVideoSession(title: string = 'New Video Session', user?: any, metadata?: Record<string, any>): Promise<ChatSession> {
    return this.createSession(title, user, 'video', metadata);
  }

  // Get all chat sessions for the current user
  static async getSessions(user?: any): Promise<ChatSession[]> {
    if (!user) return [];

    try {
      // Use the get-sessions API function which returns optimized session data
      const response = await supabase.functions.invoke('get-sessions', {
        body: {
          page: 1,
          limit: 50 // Get up to 50 sessions for the sidebar
        }
      });

      if (response.error) {
        console.error('Error fetching sessions:', response.error);
        throw new Error('Failed to fetch sessions');
      }

      const { sessions } = response.data;

      return sessions.map((session: any) => ({
        id: session.id,
        title: session.title,
        messages: [], // Don't load messages for sidebar - they'll be loaded when session is opened
        isCompleted: false,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        session_type: session.session_type || 'chat',
        session_metadata: session.session_metadata,
      }));
    } catch (error) {
      console.error('Failed to fetch sessions via API, falling back to direct query:', error);
      
      // Fallback to direct database query if API fails
      const { data, error: dbError } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at, updated_at, session_type, session_metadata')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (dbError) throw dbError;

      return data.map(session => ({
        id: session.id,
        title: session.title,
        messages: [], // Don't load messages for sidebar
        isCompleted: false,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
        session_type: session.session_type || 'chat',
        session_metadata: session.session_metadata,
      }));
    }
  }

  // Save a message to a session using the new save-message Edge function
  static async saveMessage(
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
    user?: any
  ): Promise<ChatMessage> {
    if (!user) throw new Error('User not authenticated');

    try {
      // Prepare attachments data for legacy file uploads
      const attachments = [];
      
      // Handle image attachments that still have File objects (legacy support)
      if (message.images && message.images.length > 0) {
        for (const image of message.images) {
          if (image.file) {
            const uploadedImage = await this.uploadFile(image.file, 'image', user.id);
            attachments.push({
              file_name: image.name,
              file_type: image.file.type,
              file_size: image.file.size,
              storage_path: uploadedImage.url,
              attachment_type: 'image'
            });
          }
        }
      }

      // Handle video attachments that still have File objects (legacy support)
      if (message.videos && message.videos.length > 0) {
        for (const video of message.videos) {
          if (video.file) {
            const uploadedVideo = await this.uploadFile(video.file, 'video', user.id);
            attachments.push({
              file_name: video.name,
              file_type: video.file.type,
              file_size: video.file.size,
              storage_path: uploadedVideo.url,
              attachment_type: 'video'
            });
          }
        }
      }

      // Prepare images data - filter out images that have File objects (already handled above)
      const processedImages = message.images?.filter(img => !img.file) || [];

      // Use the save-message Edge function
      const response = await supabase.functions.invoke('save-message', {
        body: {
          session_id: sessionId,
          content: message.content,
          message_type: message.role, // Use role directly as message_type
          metadata: message.metadata || {},
          attachments: attachments,
          // Pass through enhanced fields if they exist
          ...(message.conversation_context && { conversation_context: message.conversation_context }),
          ...(message.parent_message_id && { parent_message_id: message.parent_message_id }),
          // Pass processed images (without File objects) to save-message function
          ...(processedImages.length > 0 && { images: processedImages })
        }
      });

      if (response.error) {
        console.error('Error saving message:', response.error);
        throw new Error('Failed to save message');
      }

      const savedMessage = response.data.message;
      const savedAttachments = response.data.attachments || [];

      // Map attachments back to the expected format
      const savedImages: UploadedImage[] = savedAttachments
        .filter((att: any) => att.file_type.startsWith('image/'))
        .map((att: any) => ({
          id: att.id,
          name: att.file_name,
          url: att.storage_path,
          size: att.file_size,
          type: att.file_type,
        }));

      const savedVideos: UploadedVideo[] = savedAttachments
        .filter((att: any) => att.file_type.startsWith('video/'))
        .map((att: any) => ({
          id: att.id,
          name: att.file_name,
          url: att.storage_path,
          size: att.file_size,
          type: att.file_type,
        }));

      return {
        id: savedMessage.id,
        content: savedMessage.content,
        role: savedMessage.role,
        timestamp: new Date(savedMessage.created_at),
        images: savedImages,
        videos: savedVideos,
        metadata: savedMessage.metadata,
      };
    } catch (error) {
      console.error('Failed to save message via API, falling back to direct database access:', error);
      
      // Fallback to direct database access if the Edge function fails
      return this.saveMessageDirect(sessionId, message, user);
    }
  }

  // Fallback method for direct database access
  private static async saveMessageDirect(
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
    user: any
  ): Promise<ChatMessage> {
    // Insert the message
    const { data: messageData, error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        content: message.content,
        role: message.role,
        message_type: 'text',
        metadata: message.metadata || {},
      })
      .select()
      .single();

    if (messageError) throw messageError;

    // Handle image attachments
    const savedImages: UploadedImage[] = [];
    if (message.images && message.images.length > 0) {
      for (const image of message.images) {
        if (image.file) {
          const uploadedImage = await this.uploadFile(image.file, 'image', user.id);
          const { data: attachmentData, error: attachmentError } = await supabase
            .from('chat_attachments')
            .insert({
              message_id: messageData.id,
              user_id: user.id,
              file_name: image.name,
              file_type: image.file.type,
              file_size: image.file.size,
              storage_path: uploadedImage.url,
            })
            .select()
            .single();

          if (attachmentError) throw attachmentError;

          savedImages.push({
            id: attachmentData.id,
            name: image.name,
            url: uploadedImage.url,
            size: image.file.size,
            type: image.file.type,
          });
        }
      }
    }

    // Handle video attachments
    const savedVideos: UploadedVideo[] = [];
    if (message.videos && message.videos.length > 0) {
      for (const video of message.videos) {
        if (video.file) {
          const uploadedVideo = await this.uploadFile(video.file, 'video', user.id);
          const { data: attachmentData, error: attachmentError } = await supabase
            .from('chat_attachments')
            .insert({
              message_id: messageData.id,
              user_id: user.id,
              file_name: video.name,
              file_type: video.file.type,
              file_size: video.file.size,
              storage_path: uploadedVideo.url,
            })
            .select()
            .single();

          if (attachmentError) throw attachmentError;

          savedVideos.push({
            id: attachmentData.id,
            name: video.name,
            url: uploadedVideo.url,
            size: video.file.size,
            type: video.file.type,
          });
        }
      }
    }

    // Update session timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return {
      id: messageData.id,
      content: message.content,
      role: message.role,
      timestamp: new Date(messageData.created_at),
      images: savedImages,
      videos: savedVideos,
      metadata: message.metadata,
    };
  }

  // Upload file to Cloudinary storage
  static async uploadFile(
    file: File,
    type: 'image' | 'video',
    userId: string
  ): Promise<{ url: string; path: string }> {
    try {
      if (type === 'image') {
        const uploadedImage = await CloudinaryService.uploadFile(file, { id: userId } as any);
        return {
          url: uploadedImage.publicUrl,
          path: uploadedImage.id,
        };
      } else if (type === 'video') {
        const uploadedVideo = await VideoUploadService.uploadVideo(file, { id: userId } as any);
        return {
          url: uploadedVideo.publicUrl,
          path: uploadedVideo.id,
        };
      } else {
        throw new Error(`Unsupported file type: ${type}`);
      }
    } catch (error) {
      console.error(`Error uploading ${type} to Cloudinary:`, error);
      throw error;
    }
  }

  // Update session title
  static async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId);

    if (error) throw error;
  }



  // Get a specific session with all messages
  static async getSession(sessionId: string, user?: any): Promise<ChatSession | null> {
    if (!user) return null;

    const { data, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        chat_messages (
          *,
          chat_attachments (*)
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error) return null;

    return {
      id: data.id,
      title: data.title,
      messages: data.chat_messages?.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at),
        images: msg.chat_attachments
          ?.filter((att: any) => att.file_type.startsWith('image/'))
          ?.map((att: any) => ({
            id: att.id,
            name: att.file_name,
            url: att.storage_path,
            size: att.file_size,
            type: att.file_type,
          })) || [],
        videos: msg.chat_attachments
          ?.filter((att: any) => att.file_type.startsWith('video/'))
          ?.map((att: any) => ({
            id: att.id,
            name: att.file_name,
            url: att.storage_path,
            size: att.file_size,
            type: att.file_type,
          })) || [],
        metadata: msg.metadata,
      })) || [],
      isCompleted: false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Load messages for a specific session using the new get-session-messages Edge function
  static async getSessionMessages(sessionId: string, user?: any): Promise<ChatMessage[]> {
    if (!user) return [];

    try {
      // Use the get-session-messages Edge function with URL parameters
      const url = `get-session-messages?session_id=${encodeURIComponent(sessionId)}&limit=100&offset=0`;
      const response = await supabase.functions.invoke(url, {
        method: 'GET'
      });

      if (response.error) {
        console.error('Error loading session messages via API:', response.error);
        throw new Error('Failed to load messages via API');
      }

      const messages = response.data.messages || [];
      
      return messages.map((msg: any) => {
        // Get images from chat_attachments
        let images = msg.chat_attachments
          ?.filter((att: any) => att.attachment_type === 'image' || att.file_type.startsWith('image/'))
          ?.map((att: any) => {
            // Use Cloudinary URL if available, otherwise fallback to public URL generation
            let imageUrl = att.public_url || att.cloudinary_url;
            
            if (!imageUrl && att.storage_path) {
              // Fallback for backward compatibility
              if (att.storage_path.includes('cloudinary.com')) {
                imageUrl = att.storage_path;
              } else {
                // Generate Supabase public URL as last resort
                const { data: publicUrlData } = supabase.storage
                  .from('chat-attachments')
                  .getPublicUrl(att.storage_path);
                imageUrl = publicUrlData.publicUrl;
              }
            }
            
            return {
              id: att.id,
              name: att.file_name,
              url: imageUrl,
              size: att.file_size,
              type: att.file_type,
              is_generated: att.metadata?.is_generated || false,
              prompt_used: att.metadata?.prompt_used || null,
            };
          }) || [];

        // If no images from chat_attachments, check metadata for images
        if (images.length === 0 && msg.metadata?.images) {
          console.log('📸 Raw metadata structure:', JSON.stringify(msg.metadata, null, 2));
          console.log('📸 Processing images from metadata:', msg.metadata.images);
          console.log('📸 Metadata images type:', typeof msg.metadata.images, Array.isArray(msg.metadata.images));
          console.log('🔍 First image structure:', JSON.stringify(msg.metadata.images[0], null, 2));
          
          images = msg.metadata.images.map((img: any, index: number) => {
            console.log(`📸 Processing image ${index}:`, JSON.stringify(img, null, 2));
            
            // Handle different possible structures
            let imageUrl = '';
            
            if (typeof img === 'string') {
              imageUrl = img;
              console.log('📝 String image:', { imageUrl });
            } else if (img && typeof img === 'object') {
              // Check all possible URL properties
              imageUrl = img.url || img.src || img.image_url || img.cloudinaryUrl || img.finalUrl || '';
              console.log('📝 Object image properties:', {
                url: img.url,
                src: img.src,
                image_url: img.image_url,
                cloudinaryUrl: img.cloudinaryUrl,
                finalUrl: img.finalUrl,
                selectedUrl: imageUrl
              });
            }
            
            // Clean URL more carefully - handle spaces and backticks
             if (typeof imageUrl === 'string') {
               const originalUrl = imageUrl;
               // First trim whitespace
               imageUrl = imageUrl.trim();
               // Then remove backticks if they wrap the entire URL
               if (imageUrl.startsWith('`') && imageUrl.endsWith('`')) {
                 imageUrl = imageUrl.slice(1, -1).trim(); // Trim again after removing backticks
               }
               console.log('🧹 Cleaned URL:', { originalUrl, cleanedUrl: imageUrl });
             }
            
            const processedImage = {
              id: img.id || img.image_id || img.name || `metadata-img-${index}`,
              name: img.name || 'image',
              url: imageUrl,
              size: img.size || 0,
              type: img.type || 'image/jpeg',
              is_generated: img.is_generated || false,
              prompt_used: img.prompt_used || null,
            };
            
            console.log('🔧 Processing image:', {
              original: img.url || img,
              cleaned: imageUrl,
              final: processedImage
            });
            
            return processedImage;
          }).filter(img => img.url); // Only include images with valid URLs
          
          console.log('✅ Processed metadata images:', images);
        } else if (msg.metadata?.images) {
          console.log('⚠️ Metadata has images but chat_attachments also has images:', {
            attachments_count: images.length,
            metadata_images: msg.metadata.images
          });
        } else {
          console.log('❌ No images found in metadata or attachments for message:', msg.id);
        }

        return {
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.created_at),
          images,
          videos: msg.chat_attachments
            ?.filter((att: any) => att.attachment_type === 'video' || att.file_type.startsWith('video/'))
            ?.map((att: any) => {
              // Use Cloudinary URL if available, otherwise fallback to public URL generation
              let videoUrl = att.public_url || att.cloudinary_url;
              
              if (!videoUrl && att.storage_path) {
                // Fallback for backward compatibility
                if (att.storage_path.includes('cloudinary.com')) {
                  videoUrl = att.storage_path;
                } else {
                  // Generate Supabase public URL as last resort
                  const { data: publicUrlData } = supabase.storage
                    .from('chat-attachments')
                    .getPublicUrl(att.storage_path);
                  videoUrl = publicUrlData.publicUrl;
                }
              }
              
              return {
                id: att.id,
                name: att.file_name,
                url: videoUrl,
                size: att.file_size,
                type: att.file_type,
              };
            }) || [],
          metadata: msg.metadata,
        };
      });
    } catch (error) {
      console.error('Failed to load messages via API, falling back to direct database access:', error);
      
      // Fallback to direct database access
      return this.getSessionMessagesDirect(sessionId, user);
    }
  }

  // Fallback method for direct database access
  private static async getSessionMessagesDirect(sessionId: string, user: any): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        chat_attachments (*)
      `)
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading session messages:', error);
      return [];
    }

    return data.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      role: msg.role,
      timestamp: new Date(msg.created_at),
      images: msg.chat_attachments
        ?.filter((att: any) => att.file_type.startsWith('image/'))
        ?.map((att: any) => {
          // Convert storage_path to public URL
          const { data: publicUrlData } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(att.storage_path);
          
          return {
            id: att.id,
            name: att.file_name,
            url: publicUrlData.publicUrl,
            size: att.file_size,
            type: att.file_type,
          };
        }) || [],
      videos: msg.chat_attachments
        ?.filter((att: any) => att.file_type.startsWith('video/'))
        ?.map((att: any) => {
          // Convert storage_path to public URL
          const { data: publicUrlData } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(att.storage_path);
          
          return {
            id: att.id,
            name: att.file_name,
            url: publicUrlData.publicUrl,
            size: att.file_size,
            type: att.file_type,
          };
        }) || [],
      metadata: msg.metadata,
    }));
  }

  // Generate automatic title from first user message
  static generateSessionTitle(messages: ChatMessage[]): string {
    const userMessage = messages.find(m => m.role === "user");
    if (userMessage) {
      const words = userMessage.content.trim().split(' ');
      if (words.length <= 3) {
        return userMessage.content;
      }
      return words.slice(0, 3).join(' ') + '...';
    }
    return `Chat ${new Date().toLocaleDateString()}`;
  }

  // Get all sessions with statistics using the new Edge function
  static async getSessionsWithStats(page: number = 1, limit: number = 20): Promise<{
    sessions: Array<{
      id: string;
      title: string;
      created_at: string;
      updated_at: string;
      message_count: number;
      last_message_at: string | null;
      last_message_preview: string | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      // Build URL with query parameters
      const url = `get-sessions?page=${encodeURIComponent(page.toString())}&limit=${encodeURIComponent(limit.toString())}`;
      
      const { data, error } = await supabase.functions.invoke(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      throw error;
    }
  }

  // Delete a session using the new Edge function
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      // Build URL with session_id parameter
      const url = `delete-session?session_id=${encodeURIComponent(sessionId)}`;
      
      const { data, error } = await supabase.functions.invoke(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        console.error('Error deleting session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  }

  // Update/rename a session using the new Edge function
  static async updateSession(sessionId: string, title: string): Promise<{
    success: boolean;
    message: string;
    session: {
      id: string;
      title: string;
      created_at: string;
      updated_at: string;
    };
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('update-session', {
        body: {
          session_id: sessionId,
          title: title,
        }
      });

      if (error) {
        console.error('Error updating session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  }

  // Clear all sessions for the current user
  static async clearAllSessions(): Promise<void> {
    try {
      // First delete all messages for all user sessions
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        throw messagesError;
      }

      // Then delete all sessions for the user
      const { error: sessionsError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (sessionsError) {
        console.error('Error deleting sessions:', sessionsError);
        throw sessionsError;
      }

      console.log('All sessions cleared successfully');
    } catch (error) {
      console.error('Failed to clear all sessions:', error);
      throw error;
    }
  }
}