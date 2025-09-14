import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  generatedImage?: string;
  generatedVideo?: string;
  currentPrompt?: string;
  uploadedImages?: any[];
  inputValue?: string;
  videoMetadata?: {
    movement: string;
    sfx: string;
    size: string;
    isDemoVideo?: boolean;
    demoMessage?: string;
  };
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  createSession: (title?: string) => string;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  setCurrentSession: (sessionId: string | null) => void;
  getCurrentSession: () => ChatSession | null;
  clearAllSessions: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const MAX_SESSIONS = 50; // Limit to prevent storage bloat

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get user-specific storage key
  const getStorageKey = (userId: string) => `nino-chat-sessions-${userId}`;

  // Load user session and initialize theme for new users
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // For new users, ensure they start in light mode
          const themeKey = 'nino-theme-preference';
          const existingTheme = localStorage.getItem(themeKey);
          if (!existingTheme) {
            localStorage.setItem(themeKey, 'light');
            document.documentElement.classList.remove('dark');
          }
          
          // Load user-specific chat sessions
          const userStorageKey = getStorageKey(user.id);
          const saved = localStorage.getItem(userStorageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const validSessions = parsed
                .filter(session => session.id && session.title)
                .map((session: any) => ({
                  ...session,
                  createdAt: new Date(session.createdAt),
                  updatedAt: new Date(session.updatedAt)
                }))
                .slice(0, MAX_SESSIONS);
              
              setSessions(validSessions);
            }
          }
        } else {
          // No user - fallback to old storage key for backwards compatibility
          try {
            const oldKey = 'nino-chat-sessions';
            const saved = localStorage.getItem(oldKey);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const validSessions = parsed
                  .filter(session => session.id && session.title)
                  .map((session: any) => ({
                    ...session,
                    createdAt: new Date(session.createdAt),
                    updatedAt: new Date(session.updatedAt)
                  }))
                  .slice(0, MAX_SESSIONS);
                
                setSessions(validSessions);
              }
            }
          } catch (error) {
            console.error('Error loading fallback sessions:', error);
          }
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
        if (currentUserId) {
          localStorage.removeItem(getStorageKey(currentUserId));
        }
      } finally {
        setIsLoaded(true);
      }
    };

    initializeUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUserId(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUserId(null);
        setSessions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save sessions to localStorage when they change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        if (currentUserId) {
          // Save to user-specific key
          const userStorageKey = getStorageKey(currentUserId);
          localStorage.setItem(userStorageKey, JSON.stringify(sessions));
        } else {
          // Fallback to old key for backwards compatibility
          const oldKey = 'nino-chat-sessions';
          localStorage.setItem(oldKey, JSON.stringify(sessions));
        }

      } catch (error) {
        console.error('Error saving chat sessions:', error);
      }
    }
  }, [sessions, isLoaded, currentUserId, currentSessionId]);

  const createSession = (title?: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const id = `chat-${timestamp}-${randomId}`;
    
    const newSession: ChatSession = {
      id,
      title: title || `New Chat`,
      messages: [],
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSessions(prev => {
      const updated = [newSession, ...prev].slice(0, MAX_SESSIONS);
      return updated;
    });
    
    setCurrentSessionId(id);
    return id;
  };

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates, updatedAt: new Date() }
          : session
      )
    );
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    
    // If we're deleting the current session, clear the current session
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  };

  const renameSession = (sessionId: string, newTitle: string) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, title: newTitle.trim() || 'Untitled Chat', updatedAt: new Date() }
          : session
      )
    );
  };

  const setCurrentSession = (sessionId: string | null) => {
    setCurrentSessionId(sessionId);
  };

  const getCurrentSession = (): ChatSession | null => {
    if (!currentSessionId) return null;
    return sessions.find(session => session.id === currentSessionId) || null;
  };

  const clearAllSessions = () => {
    setSessions([]);
    setCurrentSessionId(null);
    if (currentUserId) {
      localStorage.removeItem(getStorageKey(currentUserId));
    } else {
      // Also clear old key for backwards compatibility
      localStorage.removeItem('nino-chat-sessions');
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
      clearAllSessions
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