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

// Simple tab preservation - just prevent refresh
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('✅ Tab active');
  }
});

// Render app and hide spinner
root.render(<App />);
hideSpinner();
