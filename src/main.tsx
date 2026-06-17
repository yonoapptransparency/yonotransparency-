/**
 * Front-end entry point of the Portal Directory application
 * Mounts the core React layout with Global Error Boundary handlers.
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import './index.css';

// Remove the SSR SEO pre-rendered content off-screen div once React takes over to avoid duplicate content penalty
document.getElementById('seo-prerender')?.remove();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
