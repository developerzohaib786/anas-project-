import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { statePersistence, recordUserActivity, AppState } from '@/lib/state-persistence';

/**
 * Hook for automatic state persistence and restoration
 */
export const useStatePersistence = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Save current state
   */
  const saveState = useCallback((state: Partial<AppState>) => {
    statePersistence.saveStateDebounced(state);
    recordUserActivity('state_save');
  }, []);

  /**
   * Restore complete application state
   */
  const restoreState = useCallback(async () => {
    try {
      if (!statePersistence.shouldRestore()) {
        console.log('🔄 No recent state to restore');
        return false;
      }

      const state = statePersistence.getState();
      const info = statePersistence.getRestorationInfo();
      
      console.log('🔄 Restoring state:', info);

      // Restore URL/route if different
      const currentUrl = window.location.href;
      if (state.currentRoute && state.currentRoute !== currentUrl) {
        console.log('🔄 Restoring route:', state.currentRoute);
        const url = new URL(state.currentRoute);
        navigate(url.pathname + url.search, { replace: true });
      }

      recordUserActivity('state_restore');
      return true;
    } catch (error) {
      console.error('❌ Failed to restore state:', error);
      return false;
    }
  }, [navigate]);

  /**
   * Initialize state persistence on app load
   */
  useEffect(() => {
    // Check if we should restore state on app start
    const restored = restoreState();
    if (restored) {
      console.log('✅ State restoration completed');
    }
  }, []); // Only run once on mount

  /**
   * Save route changes
   */
  useEffect(() => {
    saveState({
      currentRoute: window.location.href,
    });
    recordUserActivity('route_change');
  }, [location.pathname, location.search, saveState]);

  return {
    saveState,
    restoreState,
    getState: statePersistence.getState.bind(statePersistence),
    shouldRestore: statePersistence.shouldRestore.bind(statePersistence),
    clearState: statePersistence.clearState.bind(statePersistence),
    getRestorationInfo: statePersistence.getRestorationInfo.bind(statePersistence),
  };
};
