import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const sections = [
  {
    title: '1. Kush Jemi Ne dhe Si te na Kontaktoni',
    content: `Booking SH.P.K., me emrin tregtar RentaKar, me NUI: 812373174, me seli ne Rr. Epopeja e Jezercit Nr. 402, Ferizaj 70000, Republika e Kosoves, eshte kontrolluesi i te dhenave ("Data Controller") i platformes RentaKar.

Kontakti per ceshtjet e privatesise:
Email: privacy@rentakar.com
Adresa: Rr. Epopeja e Jezercit Nr. 402, Ferizaj 70000, Kosove
Telefoni: +383 49 400 006

Autoriteti mbikëqyrës kompetent: Agjencia Kosovare per Mbrojtjen e te Dhenave (AKMD), Prishtine, Kosove.`,
  },
  {
    title: '2. Bazat Ligjore dhe Parimet e Perpunimit',
    content: `Perpunojme te dhenat tuaja personale ne perputhje me:
- Rregulloren e Pergjithshme per Mbrojtjen e te Dhenave (GDPR - EU 2016/679)
- Ligjin per Mbrojtjen e te Dhenave Personale te Kosoves
- Direktiven e BE-se per Sherbimet Digjitale (DSA - EU 2022/2065)

Parimet qe ndjekim:
Ligjshmeria dhe transparenca: perpunojme te dhenat vetem kur kemi baze te ligjshme
Kufizimi i qellimit: mbledhim te dhena vetem per qellime specifike dhe te legjitimuara
Minimizimi i te dhenave: mbledhim vetem ato qe jane te nevojshme
Saktesia: mbajme te dhenat te perditesimet dhe te sakta
Kufizimi i ruajtjes: nuk mbajme te dhenat me gjate sa eshte e nevojshme
Integriteti dhe konfidencialiteti: zbatojme masa teknike dhe organizative te pershtashme`,
  },
  {
    title: '3. Cilat te Dhena Mbledhim dhe Pse',
    content: `3.1 Te Dhena qe jepni drejtperdrejt:
Gjate regjistrimit: emer, mbiemer, email, fjalekalim (i enkriptuar), numri i telefonit, data e lindjes
Gjate rezervimit: adresa e marrjes se automjetit, koha e kthimit, metodat e pagesës
Ne profilin tuaj: fotografia e profilit (opsionale), adresa, dokumentet e identitetit per verifikim
Per kompanite: emri i kompanise, NUI/NIPT, numri i TVSH-se, te dhenat e licences, informata per flotën

3.2 Te Dhena te Mbledhura Automatikisht:
Adresa IP, lloji dhe versioni i browser-it, sistemi operativ, identifikuesit e pajisjes
Koha dhe data e vizitave, faqet e vizituara, kohëzgjatja e sesioneve
Rruga e referimit, termat e kerkimit brenda platformes
Vendndodhja e perblershme bazuar ne adresën IP (ne nivel qyteti)

3.3 Te Dhena nga Pale te Treta:
Nese hyni nepermjet paleve te treta (p.sh. Google), marrim informacion bazik te profilit
Informacione publike nga regjistri tregtar per verifikimin e kompanive`,
  },
  {
    title: '4. Si i Perdorim te Dhenat Tuaja',
    content: `Baza ligjore per secilin qellim:

EKZEKUTIMI I KONTRATES (Neni 6(1)(b) GDPR):
Perpunimi i rezervimeve dhe pagesave
Komunikimi per statusin e rezervimit
Gjenerimi i faturave dhe dokumenteve te nevojshme
Zgjidhja e mosmarreveshjeve kontraktuale

INTERESI LEGJITIM (Neni 6(1)(f) GDPR):
Parandalimi i mashtrimit dhe mbrojtja e sigurisë
Permiresimi i sherbimeve nepermjet analizave te anonimizuara
Komunikimi administrativ i nevojshem per sherbimin
Mbrojtja e te drejtave ligjore ne procese gjyqesore

PELQIMI (Neni 6(1)(a) GDPR):
Dergimi i emaileve marketing dhe ofertave promovuese
Perdorimi i cookie-ve analitike dhe te marketingut
Dergimi i njoftimeve push (nese aktivizohen)

DETYRIMI LIGJOR (Neni 6(1)(c) GDPR):
Ruajtja e regjistrave tatimore dhe financiare (5 vjet)
Raportimi ndaj autoriteteve kompetente kur kerkohet me ligj`,
  },
  {
    title: '5. Ndarja e te Dhenave me Pale te Treta',
    content: `5.1 Kompanite Partnere te Qiramarrjes:
Ndajme me kompanite: emrin, numrin e telefonit, detajet e rezervimit dhe kohëzgjatjen. Kompanite jane te detyruara te nënshkruajne nje marreveshje perpunimi te te dhenave (DPA) me ne.

5.2 Ofrueset e Sherbimeve (Data Processors):
Supabase Inc. (USA) - infrastruktura e bazës se te dhenave, me garanci te nivelit standart te mbrojtjes se te dhenave (SCC)
Sherbimi i email-eve - per dergimin e njoftimeve transaksionale
Sherbimi i pagesave - per perpunimin e transaksioneve financiare

5.3 Autoritetet Publike:
Ndajme te dhena kur kemi detyrimin ligjor (p.sh. urdher gjyqësor, kerkese nga autoritetet tatimore, hetime penale).

5.4 Transferimi Nderkombetar:
Disa nga ofrueset e sherbimeve tona ndodhen jashte BE-se/KEE-se. Per keto transferime perdorim mekanizmat e mbrojtes te aprovuar nga GDPR, si klauzolat kontraktuale standarde (SCC).

Nuk shesim, as tregtojme, as japim me qira te dhenat tuaja per askend.`,
  },
  {
    title: '6. Sa Kohe Ruajme te Dhenat Tuaja',
    content: `Perpiqemi te mbajme te dhenat tuaja vetem per aq kohe sa eshte e nevojshme:

Te dhenat e llogarise: deri sa fshini llogarinë ose kerkoni fshirjen, plus 30 dite per periudhen e thirrjes prapa

Te dhenat e rezervimeve:
- Rezervime aktive dhe te fundit: gjate periudhes kontraktuale plus 5 vjet (kerkese ligjore tatimore)
- Komunikim brenda platformes: 3 vjet pas perfundimit

Te dhenat financiare dhe faturat: 5 vjet sipas ligjit tatimor dhe kontabilitetit

Log-et teknike dhe siguria: 12 muaj

Komunikimet e marketingut: deri sa terhiqni pelqimin ose cregjistroheni

Nese nje llogari rri joaktive per me shume se 3 vjet pa asnje rezervim, do t'ju njoftojme me email para se te fillojme procesin e fshirjes se te dhenave jo-esenciale.`,
  },
  {
    title: '7. Te Drejtat Tuaja sipas GDPR',
    content: `Si subject i te dhenave, keni te drejtat e meposhtme:

E DREJTA E QASJES (Neni 15): Te dini nese perpunojme te dhenat tuaja dhe te merrni nje kopje
E DREJTA E REKTIFIKIMIT (Neni 16): Te kerkoni korrigjimin e te dhenave te pasakta
E DREJTA E FSHIRJES (Neni 17): Te kerkoni fshirjen ("e drejta per t'u harruar") ne rrethana te caktuara
E DREJTA E KUFIZIMIT (Neni 18): Te kufizoni perpunimin ne rrethana te caktuara
E DREJTA E PORTABILITETIT (Neni 20): Te merrni te dhenat ne format te strukturuar
E DREJTA E KUNDERSHITMIT (Neni 21): Te kundershtoni perpunimin per marketing direkt ose interesin legjitim
E DREJTA NDAJ VENDIMMARRJES AUTOMATIKE (Neni 22): Te mos jeni subjekt i vendimeve vetem-automatike
E DREJTA E ANKESES (Neni 77): Te paraqisni ankese prane AKMD-se

Per te ushtruar te drejtat tuaja: vizitoni /te-drejtat-gdpr ose dergoni email ne privacy@rentakar.com.
Pergjigja brenda: 30 ditësh (me mundesi zgjatjeje deri ne 90 dite per kerkesa komplekse).`,
  },
  {
    title: '8. Siguria e te Dhenave',
    content: `Zbatojme masa te gjera teknike dhe organizative per te mbrojtur te dhenat tuaja:

Masa teknike:
- Enkriptim TLS 1.3 per te gjitha komunikimet
- Enkriptim AES-256 per te dhenat ne gjendje te qete (at rest)
- Hash-im me bcrypt per fjalekalime (nuk ruajme fjalekalime ne tekst te qarte)
- Autentifikim me dy faktor (2FA) i disponueshem
- Monitorim i vazhdueshëm i sigurise dhe skanim per cenueshmeri
- Backup-e te enkriptuara te rregullta

Masa organizative:
- Kufizim i qasjes ne te dhena bazuar ne parimin "nevoja per te ditur"
- Marreveshje konfidencialiteti per te gjithe personelin
- Trajnim i rregullt i stafit per mbrojtjen e te dhenave
- Proçedura te dokumentuara per te perballur incidentet e sigurise

Njoftimi per shkeljet: Nese lind nje shkelje e sigurise qe cenon te drejtat tuaja, do t'ju njoftojme brenda 72 oreve nga zbulimi (Neni 34 GDPR).`,
  },
  {
    title: '9. Femijet',
    content: `Platforma jone eshte e destinuar per perdorues me moshe 18 vjeç ose me shume. Ne menyre te qellimshme nuk mbledhim te dhena personale te fëmijeve nen moshen 16 vjeç pa pelqimin e prindit ose kujdestarit ligjor.

Nese keni besim se kemi mbledhur pa dashje te dhena te nje femije, ju lutem na kontaktoni menjehere ne privacy@rentakar.com dhe do t'i fshijme ato te dhena.`,
  },
  {
    title: '10. Cookie-t dhe Teknologjite e Gjurmimit',
    content: `Perdorim cookie-t dhe teknologji te ngjashme gjurmimi (web beacons, pixels) ne platformen tone. Per informacion te detajuar mbi llojet e cookie-ve qe perdorim, si i menaxhoni ato, dhe bazat ligjore, ju lutem shikoni Politiken tone te Cookie-ve ne /politika-cookie.`,
  },
  {
    title: '11. Ndryshimet e Politikes',
    content: `Mund te perditesojme kete politike privatesie periodikisht per te reflektuar ndryshimet ne praktikat tona te perpunimit, ndryshimet legjislative, ose per arsye te tjera operacionale.

Kur bejme ndryshime materiale:
- Do t'ju njoftojme me email (per ndryshime te rendesishme)
- Do te shfaqim nje njoftim te dukshëm ne platforme
- Do te perditesojme daten "Perditesuar" ne krye te kesaj faqeje

Perdorimi i vazhdueshem i platformes pas publikimit te politikes se perditesuar konsiderohet pranim i saj. Nese nuk bini dakord me ndryshimet, keni te drejten te fshini llogarinë tuaj.`,
  },
  {
    title: '12. Informacione Shtese per Rajonin',
    content: `Per perdoruesit ne Bashkimin Evropian: Keni te drejten te ndershme te ankoheni prane autoritetit mbikëqyrës te vendit tuaj te BE-se, shtesë ndaj AKMD-se.

Per perdoruesit ne Shqiperi: Zbatojme edhe Ligjin Nr. 9887/2008 "Per Mbrojtjen e te Dhenave Personale" dhe ndryshimet e tij, me mbikëqyrje nga Komisioneri per te Drejten e Informimit dhe Mbrojtjen e te Dhenave Personale (IDP).

Per perdoruesit ne Maqedonine e Veriut: Respektojme Ligjin per Mbrojtjen e te Dhenave Personale (Gazetën Zyrtare nr. 42/2020), me mbikëqyrje nga Agjencia per Mbrojtjen e te Dhenave Personale (ADZL).`,
  },
  {
    title: '13. Kontakti per Ceshtjet e Privatesise',
    content: `Per cdo pyetje, kerkese, ose ankese lidhur me privatesine tuaj:

Booking SH.P.K. (RentaKar)
Email: privacy@rentakar.com
Adresa: Rr. Epopeja e Jezercit Nr. 402, Ferizaj 70000, Kosove
Telefoni: +383 49 400 006

Per te ushtruar te drejtat tuaja GDPR: /te-drejtat-gdpr

Autoriteti mbikëqyrës:
AKMD - Agjencia Kosovare per Mbrojtjen e te Dhenave
Rruga Luan Haradinaj pn, Prishtine, Kosove
ankesa@akmd-ks.org | www.akmd-ks.org`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-[68px]">
      <div className="bg-dark-950 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Ballina
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-primary-600/20">
              <Shield className="w-6 h-6 text-primary-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Politika e Privatesise</h1>
          </div>
          <p className="text-gray-400 text-sm mt-2">Perditesuar: 14 Mars 2026 &nbsp;&middot;&nbsp; Versioni 2.0 &nbsp;&middot;&nbsp; Efektive nga: 14 Mars 2026</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
              Konform GDPR (EU 2016/679)
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
              DSA (EU 2022/2065)
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Ligji Kosovar per Mbrojtjen e te Dhenave
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5">
          <p className="text-primary-800 text-sm leading-relaxed">
            <strong>Permbledhje e shkurtër:</strong> Mbledhim vetem te dhenat qe jane te nevojshme per te ofruar sherbimet tona. Nuk i shesim te dhenat tuaja. Ju keni te drejta te plota mbi te dhenat tuaja sipas GDPR. Per pyetje, shkruani ne privacy@rentakar.com.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-bold text-dark-900 mb-3">Tabela e Permbajtjes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {sections.map((s, i) => (
                <a key={i} href={`#pp-section-${i}`} className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
          <div className="p-6 sm:p-10 space-y-10">
            {sections.map((s, i) => (
              <div key={i} id={`pp-section-${i}`}>
                <h2 className="text-lg font-bold text-dark-950 mb-3 pb-2 border-b border-gray-100">{s.title}</h2>
                <p className="text-dark-600 leading-relaxed text-[15px] whitespace-pre-line">{s.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-600">Shihni edhe dokumentet tona te tjera ligjore:</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/kushtet-perdorimit" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Kushtet e Perdorimit</Link>
            <span className="text-gray-300">|</span>
            <Link to="/politika-cookie" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Politika e Cookie-ve</Link>
            <span className="text-gray-300">|</span>
            <Link to="/te-drejtat-gdpr" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Te Drejtat GDPR</Link>
            <span className="text-gray-300">|</span>
            <Link to="/njoftim-ligjor" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Njoftim Ligjor</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
