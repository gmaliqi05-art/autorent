import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import App from './App.tsx';
import ErrorPage from './pages/ErrorPage';
import { initSentry, SentryErrorBoundary } from './lib/sentry';
import { registerServiceWorker } from './lib/registerSW';
import './index.css';
import './i18n';

initSentry();
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary fallback={<ErrorPage statusCode={500} />}>
      <HelmetProvider>
        <App />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            className: 'text-sm',
          }}
        />
      </HelmetProvider>
    </SentryErrorBoundary>
  </StrictMode>
);
