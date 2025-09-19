import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatHistoryService, ChatSession, ChatMessage } from '@/services/chatHistoryService';

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

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const MAX_SESSIONS = 50; // Limit to prevent storage bloat

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user and sessions on mount
  useEffect(() => {
    const initializeChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        await loadSessions();
      }
    };

    initializeChat();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
        await loadSessions();
      } else {
        setCurrentUserId(null);
        setSessions([]);
        setCurrentSessionId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load sessions from Supabase
  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const loadedSessions = await ChatHistoryService.getSessions();
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new session
  const createSession = async (title?: string): Promise<string> => {
    try {
      const newSession = await ChatHistoryService.createSession(title);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      return newSession.id;
    } catch (error) {
      console.error('Failed to create session:', error);
      // Fallback to local session for offline mode
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const id = `local-${timestamp}-${randomId}`;
      
      const localSession: ChatSession = {
        id,
        title: title || `New Chat`,
        messages: [],
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setSessions(prev => [localSession, ...prev]);
      setCurrentSessionId(id);
      return id;
    }
  };

  // Save a message to a session
  const saveMessage = async (
    sessionId: string, 
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage> => {
    try {
      const savedMessage = await ChatHistoryService.saveMessage(sessionId, message);
      
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

  const updateSession = async (sessionId: string, updates: Partial<ChatSession>) => {
    try {
      await ChatHistoryService.updateSession(sessionId, updates);
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, ...updates, updatedAt: new Date() }
            : session
        )
      );
    } catch (error) {
      console.error('Failed to update session:', error);
      // Fallback to local update
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, ...updates, updatedAt: new Date() }
            : session
        )
      );
    }
  };

  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      await ChatHistoryService.deleteSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      // Fallback to local delete
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    }
  };

  const renameSession = async (sessionId: string, newTitle: string): Promise<void> => {
    try {
      await ChatHistoryService.updateSession(sessionId, { title: newTitle.trim() || 'Untitled Chat' });
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, title: newTitle.trim() || 'Untitled Chat', updatedAt: new Date() }
            : session
        )
      );
    } catch (error) {
      console.error('Failed to rename session:', error);
      // Fallback to local rename
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, title: newTitle.trim() || 'Untitled Chat', updatedAt: new Date() }
            : session
        )
      );
    }
  };

  const setCurrentSession = (sessionId: string | null) => {
    setCurrentSessionId(sessionId);
  };

  const getCurrentSession = (): ChatSession | null => {
    return sessions.find(session => session.id === currentSessionId) || null;
  };

  const clearAllSessions = async () => {
    try {
      await ChatHistoryService.clearAllSessions();
      setSessions([]);
      setCurrentSessionId(null);
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      // Fallback to local clear
      setSessions([]);
      setCurrentSessionId(null);
    }
  };

  // Load messages for a specific session
  const loadSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      return await ChatHistoryService.getSessionMessages(sessionId);
    } catch (error) {
      console.error('Failed to load session messages:', error);
      return [];
    }
  };

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
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}