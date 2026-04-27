import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie } from 'lucide-react';

const cookieTypes = [
  {
    name: 'Cookies Esenciale',
    required: true,
    description: 'Keto cookie jane absolutisht te nevojshme per funksionimin e platformes. Pa to, sherbime te caktuara si identifikimi, siguria dhe preferencat tuaja nuk do te funksionojne. Keto nuk mund te caktivizohen.',
    examples: [
      { name: 'session_id', purpose: 'Ruajtja e sesionit te hyrjes', duration: 'Sesion (mbyllet me browser-in)' },
      { name: 'csrf_token', purpose: 'Mbrojtja ndaj sulmeve CSRF', duration: 'Sesion' },
      { name: 'auth_token', purpose: 'Autentifikimi i perdoruesit ne platform', duration: '30 dite' },
      { name: 'locale', purpose: 'Gjuha dhe preferencat e rajonit', duration: '1 vit' },
    ],
  },
  {
    name: 'Cookies Funksionale',
    required: false,
    description: 'Keto cookie na lejojne te kujtojme zgjedhjet tuaja (si emaili per hyrje te shpejte) dhe te ofrojme funksionalitete te permiresuar dhe me personale. Nese nuk i lejoni, disa funksione mund te mos punojne siç duhet.',
    examples: [
      { name: 'remember_email', purpose: 'Mbajtja mend e emailit per hyrje te shpejte', duration: '30 dite' },
      { name: 'search_filters', purpose: 'Ruajtja e filtrave te kerkimit per komoditet', duration: '7 dite' },
      { name: 'booking_draft', purpose: 'Ruajtja e rezervimit ne progres nese largoheni', duration: '24 ore' },
    ],
  },
  {
    name: 'Cookies Analitike',
    required: false,
    description: 'Keto cookie na ndihmojne te kuptojme se si perdoruesit nderveprojne me platformen tone, cilat faqe vizitohen me shume, dhe ku hasen probleme. Te gjitha te dhenat jane anonimizuara dhe nuk identifikojne askend personalisht.',
    examples: [
      { name: '_ga', purpose: 'Google Analytics - identifikimi i vizitorit unik', duration: '2 vjet' },
      { name: '_gid', purpose: 'Google Analytics - dallimi i sesioneve', duration: '24 ore' },
      { name: '_gat', purpose: 'Google Analytics - kufizimi i kerkesave', duration: '1 minute' },
    ],
  },
  {
    name: 'Cookies Marketingu',
    required: false,
    description: 'Keto cookie perdoren per te treguar reklama relevante per ju ne faqet tona dhe te tjera. Gjithashtu ndihmojne per te matur efektivitetin e fushatave reklamuese. Nese nuk i lejoni, do te shihni po aq reklama por me pak relevante per interesat tuaja.',
    examples: [
      { name: '_fbp', purpose: 'Facebook Pixel - gjurmimi i konvertimeve', duration: '90 dite' },
      { name: 'ads_pref', purpose: 'Preferencat e reklamave', duration: '1 vit' },
    ],
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-[68px]">
      <div className="bg-dark-950 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Ballina
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <Cookie className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Politika e Cookie-ve</h1>
          </div>
          <p className="text-gray-400 text-sm">Perditesuar: 14 Mars 2026 &nbsp;&middot;&nbsp; Efektive nga: 14 Mars 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong>Informacion i rendesishem:</strong> Kjo politike eshte hartuar ne perputhje me Rregulloren e Pergjithshme te Mbrojtjes se te Dhenave (GDPR - EU 2016/679), Direktivat e BE-se mbi Cookie-t (2009/136/EC), dhe legjislacionin e Kosoves per mbrojtjen e te dhenave. Duke vazhduar te perdorni platformen tone, pranoni perdorimin e cookie-ve esenciale. Per cookie-t opsionale, ju kerkojme pelqimin tuaj eksplicit.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-3">1. Cfare jane Cookie-t?</h2>
            <p className="text-dark-600 leading-relaxed text-[15px] mb-4">
              Cookie-t jane skedare te vogla teksti qe vendosen ne pajisjen tuaj (kompjuter, smartphone, tablet) kur vizitoni nje faqe interneti. Ato perdoren gjeresisht per te bere faqet te funksionojne me efikasitet, per te ofruar informacion per pronaresit e faqes, dhe per te personalizuar eksperiencen e perdoruesit.
            </p>
            <p className="text-dark-600 leading-relaxed text-[15px]">
              Cookie-t mund te jene <strong>sesionale</strong> (fshihen kur mbyllni browser-in) ose <strong>te qendrueshme</strong> (qendrojne ne pajisjen tuaj per nje periudhe te caktuar). Ato mund te vendosen drejtperdrejt nga ne (<em>cookie-t e paleve te para</em>) ose nga partnerët tane (<em>cookie-t e palëve të treta</em>).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-3">2. Si i Perdorim Cookie-t</h2>
            <p className="text-dark-600 leading-relaxed text-[15px] mb-4">
              RentaKar, i operuar nga Booking SH.P.K. (NUI: 812373174), perdor cookie-t per arsyet e meposhtme:
            </p>
            <ul className="list-disc list-inside text-dark-600 text-[15px] space-y-2 ml-4">
              <li>Per te mbajtur seancen tuaj aktive dhe te sigurt gjate hyrjes</li>
              <li>Per te kujtuar preferencat tuaja dhe te bejme eksperiencen me te personalizuar</li>
              <li>Per te analizuar trafikun dhe perdorimin e platformes ne menyre te anonimizuar</li>
              <li>Per te permiresuar performancen dhe funksionalitetin e platformes</li>
              <li>Per qellime marketingu dhe tregimi te reklamave te personalizuara (vetem me pelqimin tuaj)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-6">3. Llojet e Cookie-ve qe Perdorim</h2>
            <div className="space-y-6">
              {cookieTypes.map((type, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className={`px-5 py-4 flex items-center justify-between ${type.required ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <h3 className="font-bold text-dark-950 text-[15px]">{type.name}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${type.required ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {type.required ? 'I detyrueshëm' : 'Opsional'}
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-dark-600 text-sm leading-relaxed mb-4">{type.description}</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 pr-4 text-xs font-semibold text-dark-500 uppercase tracking-wide">Emri</th>
                            <th className="text-left py-2 pr-4 text-xs font-semibold text-dark-500 uppercase tracking-wide">Qellimi</th>
                            <th className="text-left py-2 text-xs font-semibold text-dark-500 uppercase tracking-wide">Kohezgjatja</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {type.examples.map((ex, j) => (
                            <tr key={j}>
                              <td className="py-2 pr-4 font-mono text-xs text-dark-700">{ex.name}</td>
                              <td className="py-2 pr-4 text-dark-600 text-xs">{ex.purpose}</td>
                              <td className="py-2 text-dark-500 text-xs">{ex.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-3">4. Cookie-t e Paleve te Treta</h2>
            <p className="text-dark-600 leading-relaxed text-[15px] mb-4">
              Perdorim sherbime te paleve te treta qe mund te vendosin cookie-t e tyre ne pajisjen tuaj. Keto pale te treta kane politikat e tyre te privatesise, per te cilat ne nuk jemi pergjegjese:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600">Ofruesi</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600">Sherbimi</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-dark-600">Qellimi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-4 py-3 text-dark-700">Google LLC</td><td className="px-4 py-3 text-dark-600">Google Analytics</td><td className="px-4 py-3 text-dark-500 text-xs">Analiza e trafikut dhe perdorimit</td></tr>
                  <tr><td className="px-4 py-3 text-dark-700">Meta Platforms</td><td className="px-4 py-3 text-dark-600">Facebook Pixel</td><td className="px-4 py-3 text-dark-500 text-xs">Gjurmimi i konvertimeve dhe reklamat</td></tr>
                  <tr><td className="px-4 py-3 text-dark-700">Supabase Inc.</td><td className="px-4 py-3 text-dark-600">Supabase Auth</td><td className="px-4 py-3 text-dark-500 text-xs">Autentifikim i sigurt</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-3">5. Si te Menaxhoni Cookie-t</h2>
            <p className="text-dark-600 leading-relaxed text-[15px] mb-4">
              Ju keni te drejten te kontrolloni dhe menaxhoni cookie-t ne disa menyra:
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-dark-900 text-sm mb-2">Paneli i Preferncave te Cookie-ve</h3>
                <p className="text-dark-600 text-sm">Perdorni panelin tone te preferncave te cookie-ve (te aksesueshem ne footer ose ne cilesimet e llogarise) per te aktivizuar ose deaktivizuar cookie-t opsionale ne cdo kohe.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-dark-900 text-sm mb-2">Cilesimet e Browser-it</h3>
                <p className="text-dark-600 text-sm mb-2">Mund te konfiguroni browser-in tuaj per te bllokuar ose fshire cookie-t:</p>
                <ul className="list-disc list-inside text-dark-600 text-sm space-y-1 ml-2">
                  <li><strong>Chrome:</strong> Cilesimet &rarr; Privacesia dhe siguria &rarr; Cookie-t</li>
                  <li><strong>Firefox:</strong> Opsionet &rarr; Privacesia dhe siguria</li>
                  <li><strong>Safari:</strong> Preferencat &rarr; Privacesia</li>
                  <li><strong>Edge:</strong> Cilesimet &rarr; Cookie-t dhe lejet e faqes</li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 text-sm"><strong>Kujdes:</strong> Bllokimi i cookie-ve esenciale mund te pengoje funksionimin e duhur te platformes, duke perfshire hyrjen ne llogari dhe procesin e rezervimit.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-3">6. Baza Ligjore</h2>
            <p className="text-dark-600 leading-relaxed text-[15px] mb-3">
              Perpunimi i te dhenave nepermjet cookie-ve bazohet ne:
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-dark-600">
                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                <span><strong>Interesi legjitim (Neni 6(1)(f) GDPR)</strong> - Per cookie-t esenciale te nevojshme per sigurimin e sherbimit</span>
              </li>
              <li className="flex gap-3 text-sm text-dark-600">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                <span><strong>Pelqimi (Neni 6(1)(a) GDPR)</strong> - Per cookie-t analitike dhe te marketingut, ku kerkohet pelqimi juaj eksplicit</span>
              </li>
              <li className="flex gap-3 text-sm text-dark-600">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                <span><strong>Ekzekutimi i kontrates (Neni 6(1)(b) GDPR)</strong> - Per cookie-t qe jane te nevojshme per te ofruar sherbimin e kerkuar</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-3">7. Ndryshimet e Policies</h2>
            <p className="text-dark-600 leading-relaxed text-[15px]">
              Mund te perditesojme kete politike periodikisht per te reflektuar ndryshimet ne praktikat tona ose per arsye ligjore. Do t'ju njoftojme per ndryshimet materiale nepermjet nje njoftimi ne platforme ose me email. Ju inkurajojme te shikoni kete faqe rregullisht. Perdorimi i vazhdueshem i platformes pas ndryshimeve konsiderohet pranim i politikes se re.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-dark-950 mb-3">8. Kontakti</h2>
            <div className="bg-gray-50 rounded-xl p-5 text-sm text-dark-600 space-y-1">
              <p><strong className="text-dark-900">Booking SH.P.K. (RentaKar)</strong></p>
              <p>NUI: 812373174</p>
              <p>Rr. Epopeja e Jezercit Nr. 402, Ferizaj 70000, Kosove</p>
              <p>Email: <a href="mailto:privacy@rentakar.com" className="text-primary-600 hover:underline">privacy@rentakar.com</a></p>
              <p>Telefoni: +383 49 400 006</p>
            </div>
          </section>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-600">Shihni edhe dokumentet tona te tjera ligjore:</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/politika-privatesise" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Politika e Privatesise</Link>
            <span className="text-gray-300">|</span>
            <Link to="/kushtet-perdorimit" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Kushtet e Perdorimit</Link>
            <span className="text-gray-300">|</span>
            <Link to="/te-drejtat-gdpr" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Te Drejtat GDPR</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
