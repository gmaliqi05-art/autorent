import { Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, Eye, CreditCard as Edit, Trash2, Download, Ban, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { useState } from 'react';

const rights = [
  {
    icon: Eye,
    title: 'E Drejta e Qasjes (Neni 15 GDPR)',
    color: 'bg-blue-100 text-blue-700',
    description: 'Keni te drejten te dini nese perpunojme te dhenat tuaja personale dhe, nese po, te merrni nje kopje te te dhenave, te dini qellimin e perpunimit, kategorine e te dhenave, marrësit, periudhën e ruajtjes, dhe origjinën e të dhënave nëse nuk janë mbledhur drejtpërdrejt nga ju.',
    timeframe: '30 ditë',
    how: 'Dërgoni email në privacy@rentakar.com me subjektin "Kërkesë për Qasje në të Dhëna"',
  },
  {
    icon: Edit,
    title: 'E Drejta e Rektifikimit (Neni 16 GDPR)',
    color: 'bg-green-100 text-green-700',
    description: 'Keni te drejten te kerkoni korrigjimin e te dhenave tuaja personale qe jane te pasakta ose te pakompletuara. Kjo perfshine perditesimin e informacionit si emri, adresa, email-i, dhe te dhenat e tjera te profilit tuaj.',
    timeframe: '30 ditë',
    how: 'Perditesoni drejpërdrejt ne profili juaj ose kontaktoni privacy@rentakar.com',
  },
  {
    icon: Trash2,
    title: 'E Drejta e Fshirjes ("E Drejta per t\'u Harruar") (Neni 17 GDPR)',
    color: 'bg-red-100 text-red-700',
    description: 'Keni te drejten te kerkoni fshirjen e te dhenave tuaja personale kur: nuk jane me te nevojshme per qellimin fillestar, keni terheqer pelqimin, kunder-shtoheni ndaj perpunimit, te dhenat jane perpunuar ne menyrë të paligjshme, ose kur fshirja eshte e detyrushme ligjore.',
    timeframe: '30 ditë',
    how: 'Kontaktoni privacy@rentakar.com. Disa te dhena duhet te ruhen per qellime ligjore (p.sh. fatura 5 vjet)',
    note: 'E drejta e fshirjes ka kufizime ligjore - te dhenat financiare mbahen per 5 vjet sipas ligjit tatimor.',
  },
  {
    icon: Ban,
    title: 'E Drejta e Kufizimit te Perpunimit (Neni 18 GDPR)',
    color: 'bg-amber-100 text-amber-700',
    description: 'Keni te drejten te kerkoni kufizimin e perpunimit te te dhenave tuaja ne rastet kur: kontestoni saktesine e te dhenave, perpunimi eshte i paligjshem por preferoni kufizimin ndaj fshirjes, ose nese keni ushtruar te drejten e kundershitmit.',
    timeframe: '30 ditë',
    how: 'Kerkoni kufizimin me email ne privacy@rentakar.com, duke specifikuar arsyen',
  },
  {
    icon: Download,
    title: 'E Drejta e Portabilitetit (Neni 20 GDPR)',
    color: 'bg-sky-100 text-sky-700',
    description: 'Keni te drejten te merrni te dhenat tuaja personale ne nje format te strukturuar, te perdorur gjeresisht dhe te lexueshem nga makina (JSON, CSV), dhe te drejten te transferoni ato te dhena tek nje kontrollues tjeter pa pengese nga ana jone.',
    timeframe: '30 ditë',
    how: 'Kerkoni eksportimin e te dhenave me email ne privacy@rentakar.com',
  },
  {
    icon: RefreshCw,
    title: 'E Drejta e Kundershitmit (Neni 21 GDPR)',
    color: 'bg-orange-100 text-orange-700',
    description: 'Keni te drejten te kundershtoheni ndaj perpunimit te te dhenave tuaja per qellime te marketingut direkt (ne cdo kohe), dhe perpunimit bazuar ne interesen legjitime kur ekzistojne arsye te forta personale. Ne kete rast, nuk do te perpunojme me te dhenat tuaja per ato qellime.',
    timeframe: 'Menjëherë për marketing direkt; 30 ditë për raste të tjera',
    how: 'Cregjistrohuni nga emailet promocionale ose kontaktoni privacy@rentakar.com',
  },
  {
    icon: UserCheck,
    title: 'E Drejta ndaj Vendimmarrjes se Automatizuar (Neni 22 GDPR)',
    color: 'bg-violet-100 text-violet-700',
    description: 'Keni te drejten te mos jeni subjekt i nje vendimi te bazuar vetem ne perpunim te automatizuar, duke perfshire profilizimin, nese ky vendim prodhon efekte juridike ose ndikon ndjeshem tek ju. Mund te kerkoni nderhyrje njerezore, shpjegim, ose kontestim te vendimit.',
    timeframe: '30 ditë',
    how: 'Kontaktoni privacy@rentakar.com per cdo shqetesim mbi vendimmarrjen automatike',
  },
  {
    icon: AlertCircle,
    title: 'E Drejta e Ankeses (Neni 77 GDPR)',
    color: 'bg-rose-100 text-rose-700',
    description: 'Nese mendoni qe perpunimi i te dhenave tuaja personale shkel GDPR-in, keni te drejten te paraqisni ankese prane autoritetit mbikëqyrës kompetent. Ne Kosove, ky eshte Agjencia Kosovare per Mbrojtjen e te Dhenave (AKMD).',
    timeframe: 'Sipas procedurave te AKMD-se',
    how: 'AKMD - Rruga Luan Haradinaj pn, Prishtine | www.akmd-ks.org | ankesa@akmd-ks.org',
  },
];

type FormState = { name: string; email: string; rightType: string; message: string };

export default function GDPRRightsPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', rightType: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[68px]">
      <div className="bg-dark-950 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Ballina
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-green-500/20">
              <UserCheck className="w-6 h-6 text-green-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Te Drejtat Tuaja GDPR</h1>
          </div>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            Rregullorja e Pergjithshme per Mbrojtjen e te Dhenave (EU 2016/679) ju jep kontrolle te plota mbi te dhenat tuaja personale. Ketu jane te gjitha te drejtat tuaja dhe si t'i ushtroni ato.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">

        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <p className="text-green-800 text-sm leading-relaxed">
            <strong>Angazhimi yne ndaj privatesise tuaj:</strong> Respektojme plotesisht te drejtat tuaja sipas GDPR dhe legjislacionit vendor. Cdo kerkese per ushtrimin e te drejtave tuaja do te trajtohet brenda 30 ditësh kalendarike. Nese kerkesa eshte komplekse ose e shumëfishtë, kjo periudhe mund te zgjatet me 60 dite te tjera (totali 90 dite), por do t'ju njoftojme brenda 30 diteve te para.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {rights.map((right, i) => {
            const Icon = right.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl shrink-0 ${right.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-dark-950 mb-2">{right.title}</h2>
                    <p className="text-dark-600 text-sm leading-relaxed mb-3">{right.description}</p>
                    {right.note && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                        <p className="text-amber-800 text-xs">{right.note}</p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex items-center gap-2 text-xs text-dark-500 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="font-semibold text-dark-700">Afati:</span>
                        <span>{right.timeframe}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-dark-500 bg-gray-50 rounded-lg px-3 py-2 flex-1">
                        <span className="font-semibold text-dark-700 shrink-0">Si:</span>
                        <span>{right.how}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary-100">
              <Send className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dark-950">Ushtroni te Drejten Tuaj</h2>
              <p className="text-sm text-dark-500">Plotesoni formularin dhe do t'ju pergjigjemi brenda 30 diteve</p>
            </div>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-950 mb-2">Kerkesa juaj u dergua!</h3>
              <p className="text-dark-600 text-sm">Do t'ju pergjigjemi brenda 30 ditëve kalendarike ne adresen tuaj te emailit. Nese kerkoni informacion shteses, do t'ju kontaktojme.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">Emri i plote <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Emri dhe mbiemri juaj"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="emaili@juaj.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">Lloji i kerkeses <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.rightType}
                  onChange={e => setForm(p => ({ ...p, rightType: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                >
                  <option value="">Zgjidhni te drejten qe doni te ushtroni...</option>
                  <option value="access">E Drejta e Qasjes (kopia e te dhenave)</option>
                  <option value="rectification">E Drejta e Rektifikimit (korrigjimi)</option>
                  <option value="erasure">E Drejta e Fshirjes (harrimit)</option>
                  <option value="restriction">E Drejta e Kufizimit</option>
                  <option value="portability">E Drejta e Portabilitetit (eksportimi)</option>
                  <option value="objection">E Drejta e Kundershitmit</option>
                  <option value="automated">Kunder vendimmarrjes se automatizuar</option>
                  <option value="other">Tjeter kerkese</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-dark-600 uppercase tracking-wide mb-1.5">Mesazhi <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Pershkruani kerkesen tuaj ne detaje. Sa me shume informacion te jepni, aq me shpejt mund te perpunojme kerkesen..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-dark-900 placeholder:text-dark-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-dark-500">
                <p><strong className="text-dark-700">Shenim:</strong> Per te verifikuar identitetin tuaj, mund t'ju kerkojme dokumentacion shtese. Kjo eshte e nevojshme per te mbrojtur te dhenat tuaja dhe te parandalojme qasje te paautorizuar.</p>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors text-sm flex items-center gap-2 justify-center"
              >
                <Send className="w-4 h-4" />
                Dërgo kerkesen
              </button>
            </form>
          )}
        </div>

        <div className="bg-dark-950 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white mb-2">Kontakti per Mbrojtjen e te Dhenave</h2>
          <p className="text-gray-400 text-sm mb-4">Nese keni pyetje specifike mbi to dhenat tuaja ose keni nje ankese, mund te na kontaktoni drejtperdrejt:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300">
              <p className="font-semibold text-white text-xs uppercase tracking-wide mb-2">Email Dedikuar</p>
              <a href="mailto:privacy@rentakar.com" className="text-primary-400 hover:text-primary-300 transition-colors">privacy@rentakar.com</a>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300">
              <p className="font-semibold text-white text-xs uppercase tracking-wide mb-2">Autoriteti Mbikëqyrës</p>
              <p>AKMD - Agjencia Kosovare per Mbrojtjen e te Dhenave</p>
              <p className="text-xs mt-1 text-gray-500">ankesa@akmd-ks.org</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300">
              <p className="font-semibold text-white text-xs uppercase tracking-wide mb-2">Pergjigja</p>
              <p>Brenda 30 ditëve kalendarike nga marrja e kerkeses tuaj</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-600">Shihni edhe dokumentet tona te tjera ligjore:</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/politika-privatesise" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Politika e Privatesise</Link>
            <span className="text-gray-300">|</span>
            <Link to="/kushtet-perdorimit" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Kushtet e Perdorimit</Link>
            <span className="text-gray-300">|</span>
            <Link to="/politika-cookie" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Politika e Cookie-ve</Link>
            <span className="text-gray-300">|</span>
            <Link to="/njoftim-ligjor" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Njoftim Ligjor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
