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

// Handle page visibility changes to preserve state
let wasHidden = false;

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    wasHidden = true;
    console.log('🔄 Page hidden - preserving state');
  } else if (wasHidden) {
    console.log('🔄 Page visible again - state preserved');
    wasHidden = false;
  }
});

// Render app and hide spinner
root.render(<App />);
hideSpinner();
