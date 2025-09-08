import { toast } from 'sonner';
import { useChat } from '@/contexts/ChatContext';
import { FlowType, FLOW_SESSION_TITLES, FLOW_MESSAGES, ContentDetector } from '@/types/common';

/**
 * Custom hook for smart session management across different flows
 * Handles session creation logic to avoid empty sessions in sidebar
 */
export const useSmartSession = (flowType: FlowType, contentDetectors: ContentDetector[]) => {
  const { createSession, setCurrentSession, getCurrentSession } = useChat();

  /**
   * Check if current session has any content
   */
  const hasContent = () => {
    const currentSession = getCurrentSession();
    const hasSessionMessages = currentSession && currentSession.messages && currentSession.messages.length > 0;
    const hasOtherContent = contentDetectors.some(detector => detector());
    
    return hasSessionMessages || hasOtherContent;
  };

  /**
   * Start a new session intelligently
   * Only creates new session if current one has content
   */
  const startNewSession = (clearStateCallback: () => void) => {
    const currentHasContent = hasContent();

    if (!currentHasContent) {
      // Current session is empty, just clear local state
      clearStateCallback();
      toast.success(FLOW_MESSAGES[flowType].empty);
      return { type: 'cleared' as const };
    } else {
      // Current session has content, create a new one
      const newSessionId = createSession(FLOW_SESSION_TITLES[flowType]);
      setCurrentSession(newSessionId);
      clearStateCallback();
      toast.success(FLOW_MESSAGES[flowType].newSession);
      return { type: 'created' as const, sessionId: newSessionId };
    }
  };

  return {
    hasContent,
    startNewSession
  };
};
