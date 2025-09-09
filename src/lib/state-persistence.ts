/**
 * Perfect State Persistence System
 * 
 * Since browsers aggressively suspend tabs, this system ensures that
 * when the app does reload, it perfectly restores the user's exact state
 * making the reload completely invisible to the user.
 */

export interface AppState {
  currentRoute: string;
  currentSessionId: string | null;
  chatSessions: any[];
  uploadedImages: any[];
  inputValue: string;
  generatedImage: string | null;
  currentPrompt: string | null;
  messages: any[];
  timestamp: number;
  userActivity: {
    lastAction: string;
    lastActionTime: number;
  };
}

class StatePersistence {
  private readonly STATE_KEY = 'nino-perfect-state';
  private readonly ACTIVITY_KEY = 'nino-user-activity';
  private saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Save complete application state
   */
  saveState(state: Partial<AppState>) {
    try {
      const currentState = this.getState();
      const newState: AppState = {
        ...currentState,
        ...state,
        timestamp: Date.now(),
        currentRoute: window.location.href,
      };

      localStorage.setItem(this.STATE_KEY, JSON.stringify(newState));
      console.log('💾 Perfect state saved:', Object.keys(state));
      
      // Also save to sessionStorage as backup
      sessionStorage.setItem(this.STATE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('❌ Failed to save state:', error);
    }
  }

  /**
   * Save state with debouncing to avoid excessive writes
   */
  saveStateDebounced(state: Partial<AppState>) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveState(state);
    }, 500); // 500ms debounce
  }

  /**
   * Get saved state
   */
  getState(): AppState {
    try {
      // Try localStorage first
      let saved = localStorage.getItem(this.STATE_KEY);
      
      // Fallback to sessionStorage
      if (!saved) {
        saved = sessionStorage.getItem(this.STATE_KEY);
      }

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('❌ Failed to load state:', error);
    }

    // Return default state
    return {
      currentRoute: window.location.href,
      currentSessionId: null,
      chatSessions: [],
      uploadedImages: [],
      inputValue: '',
      generatedImage: null,
      currentPrompt: null,
      messages: [],
      timestamp: Date.now(),
      userActivity: {
        lastAction: 'app_start',
        lastActionTime: Date.now(),
      },
    };
  }

  /**
   * Check if we need to restore state (detect unwanted reload)
   */
  shouldRestore(): boolean {
    const state = this.getState();
    const timeDiff = Date.now() - state.timestamp;
    
    // If state was saved within the last 2 minutes, we should restore
    return timeDiff < 120000; // 2 minutes
  }

  /**
   * Record user activity
   */
  recordActivity(action: string) {
    const activity = {
      lastAction: action,
      lastActionTime: Date.now(),
    };

    localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(activity));
    
    // Also update state
    this.saveStateDebounced({
      userActivity: activity,
    });
  }

  /**
   * Clear saved state (when user explicitly starts fresh)
   */
  clearState() {
    localStorage.removeItem(this.STATE_KEY);
    sessionStorage.removeItem(this.STATE_KEY);
    localStorage.removeItem(this.ACTIVITY_KEY);
    console.log('🗑️ State cleared');
  }

  /**
   * Get restoration info for debugging
   */
  getRestorationInfo() {
    const state = this.getState();
    return {
      hasState: state.timestamp > 0,
      stateAge: Date.now() - state.timestamp,
      lastActivity: state.userActivity.lastAction,
      shouldRestore: this.shouldRestore(),
    };
  }
}

// Export singleton instance
export const statePersistence = new StatePersistence();

// Export convenience functions
export const saveAppState = (state: Partial<AppState>) => statePersistence.saveState(state);
export const saveAppStateDebounced = (state: Partial<AppState>) => statePersistence.saveStateDebounced(state);
export const getAppState = () => statePersistence.getState();
export const shouldRestoreState = () => statePersistence.shouldRestore();
export const recordUserActivity = (action: string) => statePersistence.recordActivity(action);
export const clearAppState = () => statePersistence.clearState();
export const getRestorationInfo = () => statePersistence.getRestorationInfo();
