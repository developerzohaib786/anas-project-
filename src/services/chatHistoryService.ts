import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  images?: UploadedImage[];
  videos?: UploadedVideo[];
  isGenerating?: boolean;
  metadata?: any;
}

export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  file?: File;
  size?: number;
  type?: string;
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
  // Create a new chat session
  static async createSession(title: string = 'New Chat'): Promise<ChatSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        title,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      messages: [],
      isCompleted: false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Get all chat sessions for the current user
  static async getSessions(): Promise<ChatSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        chat_messages (
          *,
          chat_attachments (*)
        )
      `)
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map(session => ({
      id: session.id,
      title: session.title,
      messages: session.chat_messages?.map((msg: any) => ({
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
      createdAt: new Date(session.created_at),
      updatedAt: new Date(session.updated_at),
    }));
  }

  // Save a message to a session
  static async saveMessage(
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

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

  // Upload file to Supabase storage
  static async uploadFile(
    file: File,
    type: 'image' | 'video',
    userId: string
  ): Promise<{ url: string; path: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      path: data.path,
    };
  }

  // Update session title
  static async updateSessionTitle(sessionId: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId);

    if (error) throw error;
  }

  // Delete a session
  static async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_archived: true })
      .eq('id', sessionId);

    if (error) throw error;
  }

  // Get a specific session with all messages
  static async getSession(sessionId: string): Promise<ChatSession | null> {
    const { data: { user } } = await supabase.auth.getUser();
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

  // Load messages for a specific session
  static async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

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
}