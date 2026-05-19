import { useEffect, useRef } from 'react';

// Komponent qe ngarkon dhe shfaq Cloudflare Turnstile widget.
// Token-i kthehet permes onVerify callback.
//
// Setup:
//   1. Sign up: https://dash.cloudflare.com → Turnstile → Add site
//   2. Kopjo "Site Key" → vendos ne .env si VITE_TURNSTILE_SITE_KEY
//   3. Kopjo "Secret Key" → Supabase Dashboard → Authentication → Bot and Abuse Protection
//      → Enable Captcha protection → Turnstile → paste secret
//
// Nese VITE_TURNSTILE_SITE_KEY nuk eshte vendosur, komponenti nuk shfaqet
// dhe onVerify therret menjehere me 'dev-mode' (lejon punen lokale pa setup).

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          action?: string;
          theme?: string;
          size?: string;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';

let scriptLoaded = false;
let scriptLoading = false;
const pendingCallbacks: Array<() => void> = [];

function loadTurnstileScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    pendingCallbacks.push(resolve);
    if (scriptLoading) return;
    scriptLoading = true;

    window.onTurnstileLoad = () => {
      scriptLoaded = true;
      pendingCallbacks.forEach((cb) => cb());
      pendingCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

export default function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  action,
  theme = 'light',
  size = 'flexible',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    // Mode dev: pa CAPTCHA — pranojme menjehere
    if (!siteKey) {
      console.warn('VITE_TURNSTILE_SITE_KEY mungon — dev mode (pa CAPTCHA)');
      onVerify('dev-mode');
      return;
    }

    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'error-callback': onError,
        'expired-callback': onExpire,
        action,
        theme,
        size,
      });
    });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* noop */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!siteKey) {
    return (
      <div className="text-xs text-amber-600 italic">
        CAPTCHA jo aktiv (dev mode)
      </div>
    );
  }

  return <div ref={containerRef} className="my-3" />;
}
