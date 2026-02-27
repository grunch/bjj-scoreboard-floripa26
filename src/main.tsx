import { createRoot } from 'react-dom/client';

// Import polyfills first
import './lib/polyfills.ts';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Custom font
import '@fontsource-variable/outfit';
// FIXME: a custom font should be used. Eg:
// import '@fontsource-variable/<font-name>';

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
