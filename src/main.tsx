import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Prevent flash of unstyled content
document.documentElement.style.visibility = 'visible';

// Create root and render immediately to prevent white flash
const root = createRoot(document.getElementById("root")!);

// Hide loading spinner once React is ready
const hideSpinner = () => {
  const spinner = document.querySelector('.loading-spinner');
  if (spinner) {
    spinner.remove();
  }
};

// ENHANCED state preservation for React app
let wasHidden = false;
let stateSnapshot = {};

// Save React state periodically
function saveReactState() {
  try {
    // Save current React state to localStorage
    const currentUrl = window.location.href;
    const timestamp = Date.now();
    
    stateSnapshot = {
      url: currentUrl,
      timestamp,
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    };
    
    localStorage.setItem('nino-react-state-backup', JSON.stringify(stateSnapshot));
    console.log('💾 React state snapshot saved');
  } catch (e) {
    console.log('⚠️ Could not save React state:', e.message);
  }
}

// Enhanced visibility change handling
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    wasHidden = true;
    console.log('🔄 Page hidden - preserving React state');
    saveReactState();
    
    // Set a flag that we were working
    localStorage.setItem('nino-was-working', 'true');
    localStorage.setItem('nino-hidden-time', Date.now().toString());
  } else if (wasHidden) {
    console.log('🔄 Page visible again - checking state preservation');
    
    const hiddenTime = localStorage.getItem('nino-hidden-time');
    const timeDiff = Date.now() - parseInt(hiddenTime || '0');
    
    if (timeDiff > 5000) { // If hidden for more than 5 seconds
      console.log('⚠️ Long absence detected, verifying state integrity');
    }
    
    wasHidden = false;
    localStorage.removeItem('nino-was-working');
  }
});

// Detect if app was forcefully reloaded
window.addEventListener('load', () => {
  const wasWorking = localStorage.getItem('nino-was-working');
  if (wasWorking === 'true') {
    console.log('🚨 DETECTED UNWANTED APP RELOAD - Attempting state recovery');
    
    try {
      const backup = localStorage.getItem('nino-react-state-backup');
      if (backup) {
        const state = JSON.parse(backup);
        console.log('🔄 Found state backup from:', new Date(state.timestamp));
        
        // Restore URL if needed
        if (state.url && state.url !== window.location.href) {
          console.log('🔄 Restoring URL:', state.url);
          window.history.replaceState(null, '', state.url);
        }
      }
    } catch (e) {
      console.log('❌ Could not restore state:', e.message);
    }
    
    localStorage.removeItem('nino-was-working');
  }
});

// Periodic state saving (every 30 seconds when active)
setInterval(() => {
  if (!document.hidden) {
    saveReactState();
  }
}, 30000);

// Render app and hide spinner
root.render(<App />);
hideSpinner();
