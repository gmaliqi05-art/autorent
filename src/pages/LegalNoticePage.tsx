import { Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Globe, Scale } from 'lucide-react';

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-[68px]">
      <div className="bg-dark-950 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Ballina
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20">
              <Scale className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Njoftim Ligjor</h1>
          </div>
          <p className="text-gray-400 text-sm">Imprint &middot; Perditesuar: 14 Mars 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-blue-800 text-sm leading-relaxed">
            Ky njoftim ligjor (Imprint) eshte pergatitur ne perputhje me kerkesten e Rregullores se BE-se mbi Sherbimet Digjitale (DSA - EU 2022/2065), Direktiven mbi Tregtine Elektronike (2000/31/EC), dhe legjislacionin vendor te Kosoves.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 space-y-10">

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-dark-950">Identiteti i Operatorit</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-dark-600">
                <p><span className="font-semibold text-dark-900">Emri i kompanise:</span> Booking SH.P.K.</p>
                <p><span className="font-semibold text-dark-900">Emri tregtar:</span> RentaKar</p>
                <p><span className="font-semibold text-dark-900">Forma juridike:</span> Shoqeri me Pergjegjesi te Kufizuar (SH.P.K.)</p>
                <p><span className="font-semibold text-dark-900">Numri unik i identifikimit (NUI):</span> 812373174</p>
                <p><span className="font-semibold text-dark-900">Numri i TVSH-se:</span> 812373174-V</p>
                <p><span className="font-semibold text-dark-900">Data e regjistrimit:</span> 2024</p>
                <p><span className="font-semibold text-dark-900">Vendi i regjistrimit:</span> Kosove</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-dark-600">
                <p className="font-semibold text-dark-900">Adresa e selise:</p>
                <p>Rr. Epopeja e Jezercit Nr. 402</p>
                <p>Ferizaj 70000</p>
                <p>Republika e Kosoves</p>
                <br />
                <p><span className="font-semibold text-dark-900">Organ rregullator:</span> Agjencia Kosovare per Mbrojtjen e te Dhenave (AKMD)</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-dark-950">Kontakti</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-dark-600 bg-gray-50 rounded-xl p-3">
                  <Phone className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-dark-900 text-xs mb-0.5">Telefoni</p>
                    <p>+383 49 400 006</p>
                    <p className="text-xs text-dark-400">E Hene - E Premte: 08:00 - 17:00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-dark-600 bg-gray-50 rounded-xl p-3">
                  <Mail className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-dark-900 text-xs mb-0.5">Email i pergjithshem</p>
                    <a href="mailto:info@rentakar.com" className="text-primary-600 hover:underline">info@rentakar.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-dark-600 bg-gray-50 rounded-xl p-3">
                  <Mail className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-dark-900 text-xs mb-0.5">Email per ceshtje ligjore</p>
                    <a href="mailto:legal@rentakar.com" className="text-primary-600 hover:underline">legal@rentakar.com</a>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-dark-600 bg-gray-50 rounded-xl p-3">
                  <Mail className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-dark-900 text-xs mb-0.5">Email per mbrojtje te te dhenave</p>
                    <a href="mailto:privacy@rentakar.com" className="text-primary-600 hover:underline">privacy@rentakar.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-dark-600 bg-gray-50 rounded-xl p-3">
                  <Globe className="w-4 h-4 text-primary-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-dark-900 text-xs mb-0.5">Faqja zyrtare</p>
                    <p>www.rentakar.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm text-dark-600 bg-gray-50 rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-dark-900 text-xs mb-0.5">Adresa postare</p>
                    <p>P.Kut. 402, Ferizaj 70000, Kosove</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-4">Natyra e Aktivitetit dhe Licencat</h2>
            <div className="space-y-4 text-dark-600 text-sm leading-relaxed">
              <p>
                <strong className="text-dark-900">Aktiviteti kryesor:</strong> RentaKar eshte nje platforme digjitale ndermjetesimi qe ofron sherbime te tregtise elektronike per qiranë e automjeteve. Platforma lidh klientet me kompanite e qiramarrjes se automjeteve ne Kosove, Shqiperi dhe Maqedoni te Veriut.
              </p>
              <p>
                <strong className="text-dark-900">Klasifikimi si ndermjetes online (OSP):</strong> Ne perputhje me Rregulloren e BE-se mbi Sherbimet Digjitale (DSA), RentaKar klasifikohet si Ofrues i Sherbimeve te Ndermjetesimit Online. Si i tille, ne veprojme si platorme dhe nuk jemi pale kontraktuese ne marreveshjet midis klienteve dhe kompanive te qiramarrjes.
              </p>
              <p>
                <strong className="text-dark-900">Pergjegjesia per permbajtjen:</strong> Permbajtja e ofruar nga kompanite partnere (fotografi, pershkrime, cmime te automjeteve) eshte pergjegjesia e tyre ekskluzive. RentaKar ben perpjekje te arsyeshme per te verifikuar saktesine e informacionit por nuk garanton perfundimisht saktesine e te dhenave te paleve te treta.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-4">E Drejta e Autorit dhe Pronesia Intelektuale</h2>
            <div className="space-y-4 text-dark-600 text-sm leading-relaxed">
              <p>
                Te gjitha elementet e platformes RentaKar - duke perfshire, por pa u kufizuar ne, dizajnin, logon, tekstet, grafikat, imazhet, kodin e programimit, dhe strukturen - jane prone ekskluzive e Booking SH.P.K. ose jane te licencuara ne baze te marreveshjeve te licences.
              </p>
              <p>
                Asnje element i platformes nuk mund te riprodhohet, shperndahet, modifikohet, transmetohet, riperdoret, ridrejtimit, ose perdoret per qellime publike apo komerciale pa pelqimin paraprak me shkrim nga Booking SH.P.K.
              </p>
              <p>
                Markat tregtare, logot dhe emrat e sherbimeve te shfaqura ne platforme jane prona e Booking SH.P.K. ose pronareve perkatese. Asgje ne platforme nuk duhet te interpretohet si dhenie e licences ose te drejtes per perdorimin e ndonje marke tregtare pa pelqimin e shprehur.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-4">Pergjegjesia dhe Kufizimi i Saj</h2>
            <div className="space-y-3 text-dark-600 text-sm leading-relaxed">
              <p>
                <strong className="text-dark-900">Saktesia e informacionit:</strong> Perqafojme perpjekje te arsyeshme per te siguruar saktesine e informacionit ne platformen tone, por nuk garantojme qe te gjitha informacionet jane te plota, te sakta ose te perditesimet ne cdo kohe.
              </p>
              <p>
                <strong className="text-dark-900">Lidhjet e jashtme:</strong> Platforma mund te permbaje lidhje per faqe te jashtme. Nuk kemi kontroll mbi permbajtjen e atyre faqeve dhe nuk jemi pergjegjese per permbajtjen, politikat e privatesise, ose praktikat e tyre.
              </p>
              <p>
                <strong className="text-dark-900">Nderprerja e sherbimit:</strong> Nuk garantojme disponueshmerine e panderprer te platformes. Mund te ndodhin nderprerje te perkohshme per mirëmbajtje, permiresime teknike, ose per shkak te ngjarjeve jashte kontrollit tone.
              </p>
              <p>
                <strong className="text-dark-900">Kufizimi i pergjegjesise financiare:</strong> Ne perputhje me nenin 6 te Direktives mbi Tregtine Elektronike (2000/31/EC), pergjegjesia jone financiare per demtimet indirekte, ekonomike ose morale eshte e kufizuar ne masen maksimale te lejuar nga ligji vendor.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-4">Legjislacioni i Zbatueshëm dhe Juridiksioni</h2>
            <div className="bg-gray-50 rounded-xl p-5 text-sm text-dark-600 space-y-2">
              <p><strong className="text-dark-900">Ligji primar:</strong> Ligji i Republikes se Kosoves</p>
              <p><strong className="text-dark-900">Legjislacioni evropian i zbatueshëm:</strong> GDPR (EU 2016/679), DSA (EU 2022/2065), Direktiva e Tregtise Elektronike (2000/31/EC), Direktiva mbi Cookie-t (2009/136/EC), Direktiva e Konsumatoreve (2011/83/EU)</p>
              <p><strong className="text-dark-900">Gjykata kompetente:</strong> Gjykata Themelore e Ferizajt, Kosove</p>
              <p><strong className="text-dark-900">Gjuha e kontrates:</strong> Shqip (versioni zyrtar); anglisht (per qellime nderkombetare)</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-4">Zgjidhja Alternative e Mosmarreveshjeve (ADR)</h2>
            <p className="text-dark-600 text-sm leading-relaxed mb-3">
              Ne perputhje me Direktivën e BE-se per Zgjidhjen Alternative te Mosmarreveshjeve (ADR) dhe Rregulloren per Zgjidhjen Online te Mosmarreveshjeve (ODR), si konsumator i BE-se keni te drejten te perdorni platformen ODR te Komisionit Evropian per zgjidhjen e mosmarreveshjeve:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p>Per mosmarreveshje te pa-zgjidhura, mund te kontaktoni gjithashtu:</p>
              <p className="mt-2"><strong>Autoriteti Kosovar i Mbrojtjes se Konsumatorit</strong></p>
              <p>Ministria e Tregtise dhe Industrise, Prishtine, Kosove</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-3">Perditesimet e Njoftimit Ligjor</h2>
            <p className="text-dark-600 text-sm leading-relaxed">
              Ky njoftim ligjor mund te perditësohet periodikisht per te reflektuar ndryshimet ne strukturen e kompanise, ne ligjet e zbatueshme, ose ne aktivitetet e platformes. Data e perditesimit te fundit eshte shfaqur ne krye te kesaj faqeje. Perdorimi i vazhdueshem i platformes pas ndryshimeve konsiderohet pranim i njoftimit te ri ligjor.
            </p>
          </section>
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
            <Link to="/te-drejtat-gdpr" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Te Drejtat GDPR</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
