/**
 * 🔒 PROTECTED COMPONENT — DO NOT DELETE OR REVERT
 *
 * Modal informacionai per kompanite qe shpjegon si funksionon
 * sistemi i Cash Hold (Stripe Authorization).
 */
import { X, Shield, Unlock, AlertTriangle, Clock, CheckCircle2, HelpCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CashHoldHelpModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-950">Si funksionon Cash Hold?</h2>
              <p className="text-sm text-dark-500 mt-0.5">Garanci automatike për pagesat me kesh</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
            <X className="w-5 h-5 text-dark-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Çfarë është */}
          <section>
            <h3 className="font-semibold text-dark-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-600" />
              Çfarë është Cash Hold?
            </h3>
            <p className="text-sm text-dark-600 leading-relaxed">
              Kur një klient rezervon dhe zgjedh të paguajë <strong>"në lokal me kesh"</strong>, ne i kërkojmë
              <strong> kartën e tij si garanci</strong>. Stripe-i <strong>autorizon</strong> (jo i tërheq!) një shumë
              të caktuar — zakonisht 100€ ose depozita e veturës — që mbetet e <strong>bllokuar</strong> në kartën
              e klientit deri sa ju ta lironi.
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800">
                💡 <strong>Mendoje si depozitin e hotelit:</strong> hoteli "rezervon" një shumë në kartë kur bën check-in,
                por nuk e merr realisht; e liron kur klienti del pa probleme.
              </p>
            </div>
          </section>

          {/* Flow */}
          <section>
            <h3 className="font-semibold text-dark-900 mb-3">Çfarë ndodh hap pas hapi</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900">Klienti zgjedh "Kesh në lokal"</p>
                  <p className="text-xs text-dark-500 mt-0.5">Vendos kartën në Stripe — Stripe e autorizon (nuk debiten). Booking statusi: <code className="text-[10px] bg-amber-100 text-amber-900 px-1 py-0.5 rounded">pending</code></p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900">Ju aprovoni rezervimin</p>
                  <p className="text-xs text-dark-500 mt-0.5">Si zakonisht — booking-u kalon në <code className="text-[10px] bg-blue-100 text-blue-900 px-1 py-0.5 rounded">confirmed</code>. Garancia mbetet e bllokuar.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900">Klienti vjen në lokal për veturen</p>
                  <p className="text-xs text-dark-500 mt-0.5">Paguan pjesën e mbetur kesh tek ju. Booking-u kalon në <code className="text-[10px] bg-green-100 text-green-900 px-1 py-0.5 rounded">active</code> (start të qirasë).</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4a</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900 flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5 text-green-600" />
                    Klikoni "Lësho [X]€" — garancia liroet
                  </p>
                  <p className="text-xs text-dark-500 mt-0.5">Stripe e <strong>anulon</strong> autorizimin. Klientit <strong>NUK i merren para</strong>. Banka e tij e zhduk shumën e bllokuar nga lista brenda 1-5 ditësh.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4b</span>
                <div>
                  <p className="text-sm font-semibold text-dark-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    OSE klikoni "Kape" — penaliteti debiten
                  </p>
                  <p className="text-xs text-dark-500 mt-0.5">Nëse klienti nuk u shfaq ose nuk pagoi, ju mund të <strong>kapni</strong> garancin si penalitet. Shuma debiten realisht nga karta e tij dhe vjen tek ju.</p>
                </div>
              </li>
            </ol>
          </section>

          {/* Kur duhet të bëj çfarë */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="font-semibold text-green-900 text-sm flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                Lëshoni hold-in kur:
              </p>
              <ul className="text-xs text-green-800 space-y-1.5 ml-2">
                <li>✓ Klienti pagoi kesh në lokal</li>
                <li>✓ Vetura u dorëzua pa probleme</li>
                <li>✓ Klienti ndryshoi mendjen e dha kartë në vend të kesh-it (atëherë merre me kartë direkt)</li>
              </ul>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-semibold text-red-900 text-sm flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Kapeni hold-in kur:
              </p>
              <ul className="text-xs text-red-800 space-y-1.5 ml-2">
                <li>✗ Klienti nuk u shfaq pa lajmëruar (no-show)</li>
                <li>✗ Refuzoi të paguante në lokal</li>
                <li>✗ E ktheve veturen me dëme jashtë mbulesës</li>
                <li>✗ Karburant i mangët, kohë vonesë, etj.</li>
              </ul>
            </div>
          </section>

          {/* Limite + skadenca */}
          <section className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="font-semibold text-amber-900 text-sm flex items-center gap-1.5 mb-2">
              <Clock className="w-4 h-4" />
              Vini re kohën
            </p>
            <ul className="text-xs text-amber-800 space-y-1.5 ml-2">
              <li>• Autorizimi qëndron i vlefshëm <strong>7 ditë</strong> në kartën e klientit.</li>
              <li>• Nëse nuk veproni brenda 7 ditësh, Stripe e <strong>expires automatikisht</strong> dhe klientit nuk i merren para.</li>
              <li>• Mund të kapni edhe një <strong>shumë më të vogël</strong> se hold-i (psh nga 100€ kapni vetëm 50€).</li>
              <li>• Klienti merr <strong>email automatik</strong> sa herë që ndryshon statusi (autorizuar / lirua / kapur).</li>
            </ul>
          </section>

          {/* FAQ shkurt */}
          <section>
            <h3 className="font-semibold text-dark-900 mb-3">Pyetje të shpeshta</h3>
            <div className="space-y-3">
              <details className="bg-gray-50 rounded-xl">
                <summary className="cursor-pointer p-3 text-sm font-medium text-dark-900">Çfarë ndodh nëse klienti tregon kartë jo-funksionale?</summary>
                <p className="px-3 pb-3 text-xs text-dark-600">
                  Stripe nuk lejon autorizimin. Booking-u nuk konfirmohet dhe klienti detyrohet të provojë kartë tjetër ose metodë tjetër pagese.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl">
                <summary className="cursor-pointer p-3 text-sm font-medium text-dark-900">A debiten ndonjë para nga karta kur shtyp "Lësho"?</summary>
                <p className="px-3 pb-3 text-xs text-dark-600">
                  Jo. Lëshimi është thjesht <strong>anulim i autorizimit</strong>. Klienti nuk humbet asnjë cent.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl">
                <summary className="cursor-pointer p-3 text-sm font-medium text-dark-900">Kur duhet ta bëj kapjen?</summary>
                <p className="px-3 pb-3 text-xs text-dark-600">
                  Sa më shpejt të jetë e mundur pas momentit ku konstaton që klienti ka shkelur kushtet. Idealisht brenda 24-48 orëve pas pickup-it të humbur. Pas 7 ditësh autorizimi skadon dhe nuk mund të kapni më.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl">
                <summary className="cursor-pointer p-3 text-sm font-medium text-dark-900">Si llogariten paratë e kapur?</summary>
                <p className="px-3 pb-3 text-xs text-dark-600">
                  Stripe i kalon në llogarinë tuaj Stripe pas zbritjes së komisionit standard (1.4% + 0.25€ për karta evropiane). Komisionin tuaj e shihni në Stripe Dashboard.
                </p>
              </details>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700">
            E kuptova
          </button>
        </div>
      </div>
    </div>
  );
}
