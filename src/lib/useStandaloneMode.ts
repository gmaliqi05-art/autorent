/**
 * 🔒 PROTECTED FILE — DO NOT DELETE OR REVERT
 *
 * Hook qe detekton nese app po ekzekutohet ne:
 *  - PWA standalone mode (perdoruesi e ka "Install"-uar nga browseri)
 *  - Native shell permes Capacitor (Play Store / App Store)
 *
 * Perdoret per te fshehur browser chrome (Navbar/Footer) dhe per te
 * shfaqur bottom nav app-like.
 */
import { useEffect, useState } from 'react';

const STANDALONE_MEDIA_QUERY = '(display-mode: standalone)';

export interface StandaloneMode {
  /** Eshte ne PWA standalone (Add to Home Screen) */
  isStandalone: boolean;
  /** Eshte brenda nje shell Capacitor (Android/iOS native) */
  isNative: boolean;
  /** Cilido nga te dyja: shfaqim UI si app */
  isAppMode: boolean;
}

function detect(): StandaloneMode {
  if (typeof window === 'undefined') {
    return { isStandalone: false, isNative: false, isAppMode: false };
  }

  // Capacitor injecton nje object window.Capacitor kur app eshte i ngarkuar nga shell native
  // deno-lint-ignore no-explicit-any
  const isNative = !!(window as any).Capacitor?.isNativePlatform?.() ||
    !!(window as any).Capacitor;

  // PWA standalone — Add to Home Screen
  const isStandalone =
    window.matchMedia(STANDALONE_MEDIA_QUERY).matches ||
    // iOS Safari: window.navigator.standalone
    // deno-lint-ignore no-explicit-any
    (window.navigator as any).standalone === true;

  return {
    isStandalone,
    isNative,
    isAppMode: isStandalone || isNative,
  };
}

export function useStandaloneMode(): StandaloneMode {
  const [mode, setMode] = useState<StandaloneMode>(() => detect());

  useEffect(() => {
    const mq = window.matchMedia(STANDALONE_MEDIA_QUERY);
    const handler = () => setMode(detect());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return mode;
}
