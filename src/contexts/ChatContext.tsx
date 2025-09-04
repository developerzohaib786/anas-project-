import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  createSession: (title?: string) => string;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  deleteSession: (sessionId: string) => void;
  setCurrentSession: (sessionId: string | null) => void;
  getCurrentSession: () => ChatSession | null;
  clearAllSessions: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = 'nino-chat-sessions';
const MAX_SESSIONS = 50; // Limit to prevent storage bloat

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
            .slice(0, MAX_SESSIONS); // Limit sessions
          
          setSessions(validSessions);
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save sessions to localStorage when they change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (error) {
        console.error('Error saving chat sessions:', error);
      }
    }
  }, [sessions, isLoaded]);

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
    
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
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
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      createSession,
      updateSession,
      deleteSession,
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