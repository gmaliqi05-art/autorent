import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const sections = [
  {
    title: '1. Pranimi i Kushteve dhe Fusha e Zbatimit',
    content: `Duke hyre ne, regjistruar ose duke perdorur platformen RentaKar, te operuar nga Booking SH.P.K. me NUI: 812373174, ju deklaroni se:
- Keni lexuar dhe kuptuar plotesisht keto Kushte te Perdorimit
- Pranoni t'i zbatoni ne teresi
- Jeni ose nje person fizik me moshe 18 vjeç e lart, ose nje entitet juridik i autorizuar ligjsherisht

Keto Kushte zbatohen per:
- Klientet (personat fizike qe bejne rezervime)
- Kompanite partnere te qiramarrjes (operatoret e flotës)
- Cdo vizitor i platformes

Nese nuk pranoni keto Kushte, ju lutem mos perdorni platformen. Perdorimi i vazhdueshem konsiderohet pranim i plotë.

Baza ligjore: Keto Kushte jane hartuar ne perputhje me Direktiven e BE-se mbi Tregtine Elektronike (2000/31/EC), Direktiven e Konsumatoreve (2011/83/EU), Rregulloren DSA (EU 2022/2065) dhe legjislacionin vendor te Kosoves.`,
  },
  {
    title: '2. Pershkrimi i Sherbimit dhe Roli i RentaKar',
    content: `2.1 Natyra e Platformes:
RentaKar eshte nje platforme digjitale ndermjetesimi (marketplace) qe lehteson lidhjen midis klienteve qe kerkojne te qirajne automjete dhe kompanive profesionale te qiramarrjes. Ne nuk jemi pale kontraktuale direkte ne marreveshjen e qiramarrjes midis klientit dhe kompanise.

2.2 Kufizimet e Pergjegjësise si Ndermjetes:
- Nuk prodhojme dhe nuk jemi pronar te automjeteve te listuara
- Nuk jemi pergjegjese per gjendjen fizike te automjeteve
- Nuk garantojme disponueshmerine e nje automjeti specifik pas rezervimit
- Kompanite partnere jane plotesisht pergjegjese per saktesine e pershkrimeve, fotove, cmimeve dhe gjendjes se automjeteve

2.3 Sherbime qe Ofrojme:
- Motor kerkimi dhe filtrimi per automjetet e disponueshme
- Sistemi i rezervimit dhe konfirmimit
- Sistemi i pagesave te sigurta
- Komunikim i facilituar midis klienteve dhe kompanive
- Sistem faturash dhe dokumentacioni
- Mbeshtetje ndaj klienteve dhe kompanive

2.4 Ndryshimet ne Sherbim:
Rezervojme te drejten te modifikojme, pezullojme ose nderpresim çdo aspekt te sherbimit, me njoftim paraprak te arsyeshëm, vecse ne raste urgjente te sigurisë.`,
  },
  {
    title: '3. Regjistrimi dhe Siguria e Llogarise',
    content: `3.1 Krijimi i Llogarise:
Per te perdorur funksionalitetet kryesore te platformes, duhet te krijoni nje llogari. Gjate regjistrimit jeni te detyruar te:
- Jepni informacione te sakta, te plota dhe te perditesimet
- Jeni person me moshe mbi 18 vjec
- Mos perdorni identitete te rreme ose te tjera personi
- Mos krijoni me shume se nje llogari personale pa autorizimin tone

3.2 Pergjegjesia per Llogarine:
- Jeni plotesisht pergjegjese per ruajtjen e konfidencialitetit te kredencialeve tuaja
- Duhet te na njoftoni menjehere ne rast dyshimi per qasje te paautorizuar ne info@rentakar.com
- Cdo veprim i kryer nepermjet llogarise suaj konsiderohet si veprim i juaji

3.3 Pezullimi dhe Mbyllja e Llogarise:
Mund te pezullojme ose mbyllim llogarinë tuaj ne raste si:
- Shkelje e rende e Kushteve
- Fraude ose aktivitete te dyshimta
- Mos-pagese e detyrimeve
- Kerkese e organeve te ligjit
- Joaktivitet per me shume se 3 vjet

Do t'ju njoftojme paraprakisht vecse kur kjo eshte e pamundur per arsye sigurie ose ligjore.`,
  },
  {
    title: '4. Rezervimet - Procesi dhe Kushtet',
    content: `4.1 Formimi i Kontrates se Rezervimit:
Nje rezervim nuk eshte i lidhur ligjshem deri ne momentin kur:
a) Klienti ka dorezuar kerkesen e rezervimit
b) Kompania ka konfirmuar rezervimin ne menyre eksplicite
c) Pagesa eshte kryer sipas metodës se zgjedhur

4.2 Cmimi dhe Transparenca:
- Te gjitha cmimet shfaqen ne EUR dhe perfshijne TVSH-ne ku aplikohet
- Kosto shtesë te mundshme (kasko shtesë, shofer shtesë, GPS) shfaqen qartë para konfirmimit
- Depozita eshte e ndare nga tarifa dhe kthehet pas kthimit te automjetit ne gjendje te mire

4.3 Konfirmimi i Rezervimit:
Pas konfirmimit do te merrni:
- Email konfirmimi me detajet e plota
- Faturën e rezervimit me nr. unik
- Informacionet e kontaktit te kompanise

4.4 Modifikimi i Rezervimit:
Ndryshimet pas konfirmimit varen nga politika e çdo kompanie individuale. Kerkoni ndryshime ne kohe per te shmangur tarifat e anulimit.`,
  },
  {
    title: '5. Politika e Anulimit dhe Rimbursimeve',
    content: `5.1 Anulimi nga Klienti:
Politika standarde e platformes (kompanite mund te kene politika te ndryshme):

Me shume se 72 ore para marrjes: Rimbursim 100% i tarifes
Midis 48-72 oreve: Rimbursim 75% i tarifes
Midis 24-48 oreve: Rimbursim 50% i tarifes
Me pak se 24 ore: Rimbursim 0% (perveç nese kompania vendon ndryshe)

5.2 Mosparaqitja (No-Show):
Nese klienti nuk paraqitet ne vendmarrje brenda 2 oreve pa njoftim, rezervimi konsiderohet i anuluar pa rimbursim.

5.3 Anulimi nga Kompania:
- Klienti merr rimbursim 100% brenda 5-7 ditësh pune
- Klienti mund te kerkoje nje automjet alternativ pa kosto shtesë
- Per vonesa te kompanise mbi 2 ore, klienti ka te drejten e anulimit falas

5.4 Procesi i Rimbursimit:
Rimbursimet perpihen brenda 5-10 ditësh pune nepermjet metodës origjinale te pagesës. Tarifat e transaksionit nuk rimbursohen.

5.5 Disputa dhe Apele:
Ankese per rimëbursim paraqisni ne info@rentakar.com brenda 14 ditësh. Do te shqyrtohet brenda 15 ditësh pune.`,
  },
  {
    title: '6. Detyrimet e Klientit',
    content: `6.1 Kerkesa te Dokumentacionit:
- Posedoni patente te vlefshme te shoferit (leshuar te pakten 2 vjet para dates se marrjes)
- Keni nje dokument identiteti te vlefshëm (letërnjoftim ose pasaporte)
- Plotesoni moshen minimale te kerkuar nga kompania (zakonisht 21-25 vjec per automjete premium)

6.2 Perdorimi i Duhur i Automjetit:
- Perdorni automjetin vetem per qellime ligjore
- Mos e perdorni per gara, testim shpejtesie, ose aktivitete rrezikuese
- Mos e nënkontraktoni automjetin tek te trete pa leje me shkrim
- Mos transportoni mallra te paligjshme, substanca narkotike, ose arme
- Respektoni rregullat e trafikut dhe legjislacionin vendor

6.3 Kujdesi per Automjetin:
- Ktheni automjetin ne te njejtin nivel karburanti si ne momentin e marrjes
- Njoftoni menjehere kompanine per cdo dem, aksident, ose defekt
- Perdorni vetem karburantin e kerkuar nga kompania

6.4 Pergjegjesia Financiare:
Jeni financiarisht pergjegjese per: demet e shkaktuara gjate periudhes se qiramarrjes, gjobat dhe tarifat e parkingut, dhe koston e rikuperimit te automjetit.`,
  },
  {
    title: '7. Detyrimet e Kompanive Partnere',
    content: `7.1 Kushtet e Pranimit ne Platforme:
Kompanite duhet te plotesojne:
- Regjistrim valid tregtar dhe licenca te vlefshme operimi
- Sigurim valide per te gjithe flotën
- Certifikata teknike te vlefshme per automjetet

7.2 Detyrimet Operative:
- Ofrojne automjete ne gjendje te mire teknike
- Konfirmojne ose refuzojne rezervimet brenda 24 oreve
- Mbajne informacionet (cmime, fotografi, specifikimet) te perditesimet
- Trajtojne klientet me profesionalizem dhe respekt

7.3 Ndalime per Kompanite:
- Eshte e ndaluar rreptesisht te kerkojne pagesa direkte jashte platformes per rezervimet e krijuara nepermjet RentaKar
- Nuk lejohet diskriminimi i klienteve
- Nuk mund te listohen automjete te cilat nuk jane faktikisht te disponueshme

7.4 Pergjegjesia:
Kompanite jane plotesisht pergjegjese per gjendjen e automjeteve, saktesine e informacioneve, sigurimin, dhe trajtimin e demeve.`,
  },
  {
    title: '8. Pagesat dhe Tarifat',
    content: `8.1 Metodat e Pagesës:
- Kartela krediti/debiti (Visa, Mastercard, Amex)
- Transferte bankare (per rezervimet korporative)
- Metoda te tjera te specifikuara ne platforme

8.2 Siguria e Pagesave:
Te gjitha transaksionet perpihen nepermjet sistemeve te certifikuara PCI-DSS. Nuk ruajme numrat e plota te kartelave.

8.3 Tarifat e Platformes:
RentaKar mban nje tarifë sherbimi nga kompanite partnere. Klientet nuk paguajne tarifa te fshehura mbi cmimin e treguar.

8.4 Mosmarreveshjet per Pagesat (Chargebacks):
Nese kerkoni anulim te pagesës nepermjet bankes tuaj pa kaluar nëpër procedurat tona, do t'i kundervijme ketij pretendimi me dokumentacionin perkates.`,
  },
  {
    title: '9. Vlerësimet dhe Permbajtja e Gjeneruar nga Perdoruesit',
    content: `9.1 Vlerësimet:
Pasi te perfundoje nje rezervim, klientet mund te lene vleresime dhe komente. Kompanite kane te drejten e pergjigjes.

9.2 Rregullat per Permbajtjen:
Eshte e ndaluar te postoni permbajtje:
- Fallce ose te fabrikuara
- Cenuese te privatesise se paleve te treta
- Fyese, raciste, diskriminuese, ose hate speech
- Qe shkelin ligjin vendor ose nderkombtar

9.3 Moderimi:
Rezervojme te drejten te heqim permbajtjet qe shkelin keto kushte. Per ankesa, kontaktoni info@rentakar.com.

9.4 Licenca:
Duke postuar permbajtje ne platforme, na jepni nje licensë per te shfaqur dhe perdorur ate permbajtje per qellime te platformes.`,
  },
  {
    title: '10. Pronesia Intelektuale',
    content: `10.1 E Drejta e Autorit e RentaKar:
Te gjitha elementet e platformes - logot, emrat, dizajnet, teksti, kodi - jane prone e Booking SH.P.K. ose i licensuar asaj.

10.2 Ndalime:
Pa lejen tone me shkrim, nuk lejohet:
- Reprodukimi ose shperndarja e materialeve te platformes
- Perdorimi i logot ose markave tregtare
- Scraping ose ekstraktimi automatik i te dhenave

10.3 Raporto Shkelje:
Kontaktoni legal@rentakar.com per çdo shkelje te dyshuar te te drejtes se autorit.`,
  },
  {
    title: '11. Kufizimi i Pergjegjesise',
    content: `11.1 Pergjegjesia si Ndermjetes:
Ne perputhje me nenin 14 te Direktives se Tregtise Elektronike (2000/31/EC) dhe DSA (EU 2022/2065), nuk jemi pergjegjese per:
- Gjendjen fizike te automjeteve te kompanive partnere
- Aksidentet, demet ose lendimet gjate perdorimit
- Nderprerjet e rezervimeve nga kompanite
- Humbjet ekonomike indirekte ose te paparashikuara

11.2 Kufizimi Financiar:
Pergjegjesia jone maksimale ndaj nje klienti eshte e kufizuar ne shumen e paguar per ate rezervim specifik.

11.3 Garancite:
Platforma ofrohet "si eshte" (as is). Nuk garantojme sherbim te panderprerë ose mungese gabimesh.

11.4 Force Majeure:
Nuk jemi pergjegjese per deshtimet per shkak te ngjarjeve jashte kontrollit tone: katastrofa natyrore, pandemite, sulmet kibernetike, etj.`,
  },
  {
    title: '12. Mbrojtja e Konsumatorit dhe Zgjidhja e Mosmarreveshjeve',
    content: `12.1 Te Drejtat e Konsumatorit:
Klientet individuale gëzojne te drejtat e plota te konsumatorit sipas Direktives 2011/83/EU dhe legjislacionit vendor.

12.2 Procedura e Ankesave:
Hapi 1: Kontaktoni kompanine direkt
Hapi 2: Paraqisni ankese ne platforme nese nuk zgjidheni
Hapi 3: Ekipi yne ndermjeton brenda 5 ditësh pune
Hapi 4: Perdorni ADR ose ODR nese nuk jeni te kenaqur

12.3 Zgjidhja Alternative e Mosmarreveshjeve (ADR):
Ne perputhje me Direktiven ADR (2013/11/EU):
- Platforma ODR e Komisionit Europian
- Autoriteti Kosovar i Mbrojtjes se Konsumatorit

12.4 Juridiksioni:
Zbatohen ligjet e Republikes se Kosoves. Gjykata kompetente: Gjykata Themelore e Ferizajt.`,
  },
  {
    title: '13. Ndryshimet e Kushteve',
    content: `Rezervojme te drejten te ndryshojme keto Kushte ne cdo kohe. Per ndryshimet materiale:
- Do t'ju njoftojme me email ose njoftim ne platforme te pakten 30 dite para hyrjes ne fuqi
- Do t'ju jepet mundesia te refuzoni
- Perdorimi i vazhdueshem pas dates se hyrjes ne fuqi konsiderohet pranim

Ndryshimet e vogla hyjne menjehere ne fuqi. Versioni aktual eshte gjithmone i disponueshëm ne kete faqe.`,
  },
  {
    title: '14. Dispozita te Ndryshme',
    content: `Ndarshmeria e Dispozitave: Nese ndonje dispozite gjendet e pavlefshme, te tjerat mbeten ne fuqi.

Mosperdorimi i te Drejtave: Mos-ushtrimi i nje te drejte ne nje rast te caktuar nuk konsiderohet heqje dore.

Marrëveshja e Plote: Keto Kushte, Politika e Privatesise, Politika e Cookie-ve dhe cdo marreveshje shtesë me shkrim perbejne marrëveshjen e plote.

Gjuha Zyrtare: Versioni shqip eshte versioni zyrtar i ketyre Kushteve.`,
  },
  {
    title: '15. Kontakti',
    content: `Booking SH.P.K. (RentaKar)
NUI: 812373174
Rr. Epopeja e Jezercit Nr. 402, Ferizaj 70000, Kosove

Email i pergjithshem: info@rentakar.com
Ceshtjet ligjore: legal@rentakar.com
Mbrojtja e te dhenave: privacy@rentakar.com
Telefoni: +383 49 400 006

Oren e punes: E Hene - E Premte, 08:00 - 17:00`,
  },
];

export default function TermsOfUsePage() {
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
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Kushtet e Perdorimit</h1>
          </div>
          <p className="text-gray-400 text-sm mt-2">Perditesuar: 14 Mars 2026 &nbsp;&middot;&nbsp; Versioni 2.0 &nbsp;&middot;&nbsp; Efektive nga: 14 Mars 2026</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
              Direktiva 2000/31/EC
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
              DSA (EU 2022/2065)
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              Direktiva Konsumatoreve 2011/83/EU
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-blue-800 text-sm leading-relaxed">
            <strong>Permbledhje e shkurtër:</strong> RentaKar eshte nje platforme ndermjetesimi. Duke u regjistruar, pranoni keto Kushte. Rezervimet konfirmohen nga kompanite. Keni te drejte rimbursimi sipas politikes tonë te anulimit. Per pyetje: info@rentakar.com.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-bold text-dark-900 mb-3">Tabela e Permbajtjes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {sections.map((s, i) => (
                <a key={i} href={`#tou-section-${i}`} className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
          <div className="p-6 sm:p-10 space-y-10">
            {sections.map((s, i) => (
              <div key={i} id={`tou-section-${i}`}>
                <h2 className="text-lg font-bold text-dark-950 mb-3 pb-2 border-b border-gray-100">{s.title}</h2>
                <p className="text-dark-600 leading-relaxed text-[15px] whitespace-pre-line">{s.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-600">Shihni edhe dokumentet tona te tjera ligjore:</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/politika-privatesise" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">Politika e Privatesise</Link>
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
