import { toast } from 'sonner';
import { useChat } from '@/contexts/ChatContext';
import { FlowType, FLOW_SESSION_TITLES, FLOW_MESSAGES, ContentDetector } from '@/types/common';

/**
 * 🧠 Smart Session Management Hook
 * 
 * Intelligent session management that prevents empty sessions in the sidebar.
 * Only creates new sessions when the current session has meaningful content.
 * 
 * **Key Features:**
 * - Content detection to prevent empty sessions
 * - Flow-specific session titles and messages
 * - Automatic state clearing for empty sessions
 * - User-friendly toast notifications
 * 
 * **How It Works:**
 * 1. Checks if current session has content using provided detectors
 * 2. If empty: Clears local state, shows "ready" message
 * 3. If has content: Creates new session, saves old to sidebar
 * 
 * **Usage:**
 * ```typescript
 * const { startNewSession } = useSmartSession('enhance', [
 *   () => uploadedImages.length > 0,
 *   () => !!generatedImage,
 *   () => !!currentPrompt
 * ]);
 * 
 * const handleNewChat = () => {
 *   startNewSession(() => {
 *     // Clear component state
 *     setUploadedImages([]);
 *     setGeneratedImage(undefined);
 *   });
 * };
 * ```
 * 
 * @param flowType - The workflow type for session naming
 * @param contentDetectors - Array of functions that return true if content exists
 * @returns Hook interface with session management functions
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
      const newSessionId = createSession(FLOW_SESSION_TITLES[flowType], flowType);
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
