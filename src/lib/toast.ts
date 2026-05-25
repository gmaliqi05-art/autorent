/**
 * Wrapper i thjeshte mbi sonner per konsistence ne app.
 *
 * Perdorimi:
 *   import { showSuccess, showError, showInfo } from '@/lib/toast';
 *   showSuccess(t('common.saved'));
 *   showError(error.message);
 *
 * Pse jo direkt toast.success(...)?
 *  - Konsistence ne defaults (duration, position) — vetem nje vend i ndryshohet.
 *  - I lehte ta zevendesojme me librari tjeter ne te ardhmen.
 *  - aria-live polite garanton accessibility per screen readers.
 */
import { toast } from 'sonner';

export function showSuccess(message: string, opts?: { description?: string }) {
  return toast.success(message, {
    description: opts?.description,
  });
}

export function showError(message: string, opts?: { description?: string }) {
  return toast.error(message, {
    description: opts?.description,
    duration: 6000, // me i gjate per errors qe useri mund t'i shqyrtoje
  });
}

export function showInfo(message: string, opts?: { description?: string }) {
  return toast(message, {
    description: opts?.description,
  });
}

export function showLoading(message: string) {
  return toast.loading(message);
}

/**
 * Promise toast — automatikisht tregon loading -> success/error.
 *
 * Perdorimi:
 *   await toastPromise(
 *     supabase.from('x').insert(...),
 *     {
 *       loading: 'Duke ruajtur...',
 *       success: 'U ruajt me sukses',
 *       error: (err) => err.message,
 *     }
 *   );
 */
export function toastPromise<T>(
  promise: Promise<T>,
  msgs: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  },
) {
  return toast.promise(promise, msgs);
}

export { toast };
