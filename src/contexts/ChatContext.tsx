import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatHistoryService, ChatSession, ChatMessage } from '@/services/chatHistoryService';
import { useAuth } from './AuthContext';

// Re-export types for backward compatibility
export type { ChatSession, ChatMessage } from '@/services/chatHistoryService';

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  createSession: (title?: string) => Promise<string>;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  setCurrentSession: (sessionId: string | null) => void;
  getCurrentSession: () => ChatSession | null;
  clearAllSessions: () => void;
  saveMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<ChatMessage>;
  loadSessions: () => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<ChatMessage[]>;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

const MAX_SESSIONS = 50; // Limit to prevent storage bloat

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load sessions from API
  const loadSessions = useCallback(async () => {
    if (!user?.id || isLoading) {
      console.log('🚫 Skipping loadSessions:', { hasUserId: !!user?.id, isLoading });
      return;
    }
    
    console.log('🚀 Starting loadSessions for user:', user.id);
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('❌ No access token available');
        setIsLoading(false);
        return;
      }

      console.log('📡 Making API call to get-sessions...');
      const response = await fetch('https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/get-sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 API Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`Failed to load sessions: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 API Response data:', data);
      
      // Transform API sessions - don't initialize with empty messages if they might already exist
      const sessionsWithMessages = (data.sessions || []).map((session: any) => ({
        ...session,
        messages: session.messages || [], // Use existing messages or empty array
        updatedAt: new Date(session.updated_at),
        createdAt: new Date(session.created_at)
      }));
      
      console.log('✅ Sessions loaded successfully:', sessionsWithMessages.length);
      setSessions(sessionsWithMessages);
    } catch (error) {
      console.error('❌ Error loading sessions:', error);
      setSessions([]); // Set empty array on error instead of using local fallback
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isLoading]);

  // Load user and sessions when user changes
  useEffect(() => {
    console.log('🔄 ChatContext useEffect triggered', { 
      hasUser: !!user, 
      userId: user?.id, 
      currentUserId,
      sessionsCount: sessions.length,
      isLoading 
    });
    
    if (user?.id) {
      // Only load sessions if we don't have them yet or if user ID changed
      if (!currentUserId || currentUserId !== user.id) {
        console.log('📡 Loading sessions for user:', user.id);
        setCurrentUserId(user.id);
        loadSessions();
      } else {
        console.log('✅ Sessions already loaded for user:', user.id);
      }
    } else {
      console.log('🚫 No user ID, clearing sessions');
      setCurrentUserId(null);
      setSessions([]);
      setCurrentSessionId(null);
    }
  }, [user?.id, loadSessions, currentUserId, isLoading]); // Add dependencies to ensure proper triggering

  // Create a new session
  const createSession = async (title?: string): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title || 'New Chat',
          session_type: 'chat',
          session_metadata: {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const data = await response.json();
      const newSession = {
        id: data.session.id,
        title: data.session.title,
        messages: [],
        isCompleted: false,
        createdAt: new Date(data.session.created_at),
        updatedAt: new Date(data.session.updated_at),
        session_type: data.session.session_type,
        session_metadata: data.session.session_metadata,
      };

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      return newSession.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error; // Don't create local fallback, only use API
    }
  };

  // Save a message to a session
  const saveMessage = async (
    sessionId: string, 
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/save-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          message_type: message.role,
          content: message.content,
          attachments: message.videos || [],
          metadata: message.metadata || {},
          images: message.images || []
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save message: ${response.statusText}`);
      }

      const data = await response.json();
      const savedMessage: ChatMessage = {
        id: data.message.id,
        content: message.content,
        role: message.role,
        timestamp: new Date(data.message.created_at),
        images: message.images,
        videos: message.videos,
        metadata: message.metadata,
      };
      
      // Update local state
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                messages: [...session.messages, savedMessage],
                updatedAt: new Date()
              }
            : session
        )
      );

      return savedMessage;
    } catch (error) {
      console.error('Failed to save message:', error);
      
      // Fallback to local storage
      const localMessage: ChatMessage = {
        id: Date.now().toString(),
        content: message.content,
        role: message.role,
        timestamp: new Date(),
        images: message.images,
        videos: message.videos,
        metadata: message.metadata,
      };

      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                messages: [...session.messages, localMessage],
                updatedAt: new Date()
              }
            : session
        )
      );

      return localMessage;
    }
  };

  const updateSession = useCallback(async (sessionId: string, updates: Partial<ChatSession>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/update-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          title: updates.title
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.statusText}`);
      }

      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates, updatedAt: new Date() }
          : session
      ));
    } catch (error) {
      console.error('Error updating session:', error);
      throw error; // Don't update local state if API fails
    }
  }, []); // Remove user?.access_token dependency to prevent infinite loops

  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(`https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/delete-session?session_id=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`);
      }

      // Update local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // If we deleted the current session, clear it
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error; // Don't update local state if API fails
    }
  };

  const renameSession = (sessionId: string, newTitle: string) => {
    return updateSession(sessionId, { title: newTitle });
  };

  // Load messages for a specific session
  const loadSessionMessages = useCallback(async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('❌ No access token available for loadSessionMessages');
        throw new Error('No access token available');
      }

      // console.log('🔍 Loading messages for session:', sessionId);
      // console.log('📡 Making API call to get-session-messages...');
      const response = await fetch(`https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/get-session-messages?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // console.log('📊 get-session-messages API Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ get-session-messages API Error:', response.status, errorText);
        throw new Error(`Failed to load session messages: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 get-session-messages API Response:', data);
      
      // The API returns { success: true, session: {...}, messages: [...] }
      const messages = data.messages || [];
      // console.log('✅ Loaded messages count:', messages.length);
      return messages;
    } catch (error) {
      console.error('❌ Error loading session messages:', error);
      return [];
    }
  }, []);

  const setCurrentSession = useCallback(async (sessionId: string | null) => {
    console.log('🎯 setCurrentSession called with:', sessionId);
    setCurrentSessionId(sessionId);
    
    // If switching to a session, always try to load its messages
    if (sessionId) {
      const session = sessions.find(s => s.id === sessionId);
      // console.log('🔄 Switching to session:', sessionId, 'Found session:', !!session, 'Current messages count:', session?.messages?.length || 0);
      
      // Always load messages for the session, regardless of current message count
      // This ensures we get the latest messages from the server
      if (session) {
        try {
          // console.log("📡 Loading messages for session:", sessionId);
          const messages = await loadSessionMessages(sessionId);
          // console.log("✅ Loaded messages:", messages.length);
          
          // Update the session with loaded messages
          setSessions(prev => prev.map(s => 
            s.id === sessionId 
              ? { ...s, messages: messages.map(msg => ({
                  id: msg.id,
                  content: msg.content,
                  role: msg.role, // Use role field from database (user/assistant)
                  timestamp: new Date(msg.created_at || msg.timestamp),
                  // Extract images from metadata.images array (new structure)
                  images: msg.metadata?.images?.map(img => ({
                    id: img.id,
                    url: img.url,
                    name: img.name || 'image',
                    alt: img.name || 'image'
                  })) || 
                  // Fallback to chat_attachments for backward compatibility
                  msg.chat_attachments?.filter(att => att.file_type?.startsWith('image/'))?.map(att => {
                    // Use public_url or cloudinary_url from API response first
                    let imageUrl = att.public_url || att.cloudinary_url || att.storage_path;
                    
                    // Only generate Supabase URL if no public URL is available and storage_path doesn't start with http
                    if (!imageUrl || (!imageUrl.startsWith('http') && att.storage_path && !att.storage_path.startsWith('http'))) {
                      const { data: publicUrlData } = supabase.storage
                        .from('chat-attachments')
                        .getPublicUrl(att.storage_path);
                      imageUrl = publicUrlData.publicUrl;
                    }
                    
                    console.log('Processing image attachment:', {
                      id: att.id,
                      fileName: att.file_name,
                      publicUrl: att.public_url,
                      cloudinaryUrl: att.cloudinary_url,
                      storagePath: att.storage_path,
                      finalUrl: imageUrl
                    });
                    
                    return {
                      id: att.id,
                      url: imageUrl,
                      name: att.file_name || 'image'
                    };
                  }) || [],
                  videos: msg.chat_attachments?.filter(att => att.file_type?.startsWith('video/'))?.map(att => ({
                    id: att.id,
                    url: att.file_url,
                    name: att.file_name
                  })) || msg.videos || [],
                  metadata: msg.metadata
                })) }
              : s
          ));
        } catch (error) {
          console.error("❌ Failed to load session messages:", error);
        }
      } else {
        console.log('❌ Session not found in sessions array');
      }
    }
  }, [sessions, loadSessionMessages]);

  const getCurrentSession = useCallback((): ChatSession | null => {
    return sessions.find(session => session.id === currentSessionId) || null;
  }, [sessions, currentSessionId]);

  const clearAllSessions = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('https://pbndydilyqxqmcxwadvy.supabase.co/functions/v1/clear-all-sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to clear all sessions: ${response.statusText}`);
      }

      // Clear local state
      setSessions([]);
      setCurrentSessionId(null);
    } catch (error) {
      console.error('Error clearing all sessions:', error);
      throw error; // Don't clear local state if API fails
    }
  }, []);

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      createSession,
      updateSession,
      deleteSession,
      renameSession,
      setCurrentSession,
      getCurrentSession,
      clearAllSessions,
      saveMessage,
      loadSessions,
      loadSessionMessages,
      isLoading
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context || Object.keys(context).length === 0) {
    throw new Error('useChat must be used within a ChatProvider. Make sure the component is wrapped with ChatProvider.');
  }
  return context;
}