/**
 * 🔒 PROTECTED COMPONENT — DO NOT DELETE OR REVERT
 *
 * Formë me Stripe Elements që autorizon (jo i tërheq) një shumë garancie
 * në kartën e klientit kur ai zgjedh pagesë me cash.
 *
 * Flow:
 *  1. Therr backend (create-cash-hold) -> merr clientSecret per PaymentIntent
 *  2. Render Stripe PaymentElement
 *  3. confirmPayment() -> karta autorizohet (capture_method=manual)
 *  4. PaymentIntent kalon ne status 'requires_capture'
 *  5. Para kompania nuk i merr; ato qendrojne te bllokuara 7 dite.
 */
import { useEffect, useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
import { Loader2, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { getStripe, createCashHold } from '../../lib/stripeClient';
import { supabase } from '../../lib/supabase';

interface CashHoldFormProps {
  bookingId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function CashHoldForm(props: CashHoldFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [holdAmount, setHoldAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setInitError('Duhet te jeni te kycur.');
        setLoading(false);
        return;
      }
      const result = await createCashHold(props.bookingId, session.access_token);
      if (cancelled) return;
      if ('error' in result) {
        setInitError(result.error);
      } else {
        setClientSecret(result.clientSecret);
        setHoldAmount(result.holdAmount);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [props.bookingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (initError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-900 text-sm">Nuk u krijua hold-i</p>
          <p className="text-xs text-red-700 mt-0.5">{initError}</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) return null;

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0066ff',
        borderRadius: '12px',
      },
    },
  };

  return (
    <div>
      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-2.5">
          <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <p className="font-semibold mb-1">Garanci nga karta juaj: {holdAmount} EUR</p>
            <p>
              Shuma <strong>NUK do te debituar</strong> menjehere — vetem e <strong>bllokuar</strong> ne karten tuaj
              si garanci. Pas pages kesh ne lokal, kompania e <strong>lirona</strong> brenda 7 diteve
              dhe asnje shume nuk u tërhiqet realisht.
            </p>
          </div>
        </div>
      </div>

      <Elements stripe={getStripe()} options={options}>
        <CardForm onSuccess={props.onSuccess} onError={props.onError} holdAmount={holdAmount} />
      </Elements>
    </div>
  );
}

function CardForm({ onSuccess, onError, holdAmount }: { onSuccess: () => void; onError: (m: string) => void; holdAmount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      const msg = result.error.message || 'Pagesa deshtoi';
      setError(msg);
      onError(msg);
      setSubmitting(false);
      return;
    }

    if (result.paymentIntent?.status === 'requires_capture') {
      setSuccess(true);
      setTimeout(() => onSuccess(), 1200);
    } else {
      const msg = `Status i papritur: ${result.paymentIntent?.status}`;
      setError(msg);
      onError(msg);
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <p className="font-semibold text-dark-900">Garanci u autorizua me sukses</p>
        <p className="text-xs text-dark-500 mt-1">{holdAmount} EUR e bllokuar ne karten tuaj</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Duke autorizuar...' : `Autorizo garancin ${holdAmount} EUR`}
      </button>

      <p className="text-[10px] text-center text-dark-400">
        Pagesa e sigurt nepermjet Stripe. Asnje shume nuk i merret realisht karten tuaj — eshte vetem nje bllokim 7-ditor.
      </p>
    </form>
  );
}
