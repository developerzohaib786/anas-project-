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

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chat-sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only load sessions if the array is valid and not empty
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed.map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt)
          })));
        }
      } catch (error) {
        console.error('Error loading chat sessions:', error);
        // Clear corrupted data
        localStorage.removeItem('chat-sessions');
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chat-sessions', JSON.stringify(sessions));
  }, [sessions]);

  const createSession = (title?: string): string => {
    const id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: ChatSession = {
      id,
      title: title || `Chat ${sessions.length + 1}`,
      messages: [],
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(id);
    return id;
  };

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, ...updates, updatedAt: new Date() }
        : session
    ));
  };

  const deleteSession = (sessionId: string) => {
    console.log('deleteSession called with:', sessionId);
    console.log('Sessions before filter:', sessions.map(s => s.id));
    setSessions(prev => {
      const filtered = prev.filter(session => session.id !== sessionId);
      console.log('Sessions after filter:', filtered.map(s => s.id));
      return filtered;
    });
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
    localStorage.removeItem('chat-sessions');
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