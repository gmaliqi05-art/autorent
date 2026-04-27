/*
  # Seed Chat Responses - Batch 4
  
  Additional responses to reach 1000+ total
  Categories: mixed - more detailed Q&A for common scenarios
*/

INSERT INTO chat_responses (category, keywords, question, answer, priority) VALUES
-- More booking scenarios
('rezervime', '["here","first time","pare"]', 'Eshte hera e pare qe perdor platformen, si filloj?', 'Miresevini! Per te filluar: 1) Krijoni nje llogari falas, 2) Kerkoni automjetin qe deshironi, 3) Klikoni "Rezervo" dhe plotesoni detajet, 4) Prisni konfirmimin. Eshte shume e thjeshte!', 9),
('rezervime', '["dite","fundjave","weekend"]', 'A ka cmime speciale per fundjave?', 'Disa kompani ofrojne paketa speciale per fundjave (e premte-e diel). Kontrolloni ofertat e seciles kompani ne faqen e automjeteve.', 6),
('rezervime', '["larg","distance","gjate"]', 'A mund te udhetoj larg me automjetin?', 'Po, mund te udhetoni kudo brenda shtetit pa kufizime. Per udhetim jashte shtetit (Kosove-Shqiperi-Maqedoni), duhet leje paraprake nga kompania.', 7),
('rezervime', '["bast","last minute","urgjent"]', 'A mund te rezervoj per sot?', 'Po, nese ka automjete te disponueshme, mund te rezervoni edhe per te njejten dite. Megjithate, konfirmimi mund te marre deri ne disa ore.', 7),
('rezervime', '["paralel","multiple","disa"]', 'A mund te bej disa rezervime njekohesisht?', 'Po, mund te keni disa rezervime aktive njekohesisht. Cdo rezervim menaxhohet ne menyre te pavarur ne panelin tuaj.', 5),
('rezervime', '["shenim","note","koment"]', 'A mund te le shenim per kompanine?', 'Po, gjate procesit te rezervimit ka nje fushe per shenime ku mund te vendosni kerkesa te vecanta, si ore specifike marrjeje, aksesore shtese, etj.', 5),
('rezervime', '["verifikim","verify","confirm email"]', 'A duhet te verifikoj emailin per te rezervuar?', 'Po, emaili verifikohet automatikisht gjate regjistrimit. Kjo siguron qe te merrni njoftimet per rezervimin tuaj.', 6),
('rezervime', '["kushdo","anyone","pa llogari"]', 'A mund te rezervoj pa llogari?', 'Jo, duhet te krijoni nje llogari falas per te bere nje rezervim. Regjistrimi merr vetem 1 minut dhe siguron menaxhimin e sigurt te rezervimit tuaj.', 7),
('rezervime', '["telefon","mobile","smartphone"]', 'A mund te rezervoj nga telefoni?', 'Po, faqja jone eshte plotesisht responsive. Mund te kerkoni, rezervoni, dhe menaxhoni rezervimet nga telefoni juaj pa asnje kufizim.', 6),

-- More vehicle details
('automjete', '["manual","manuale","stick"]', 'A keni automjete manuale?', 'Po, kemi edhe automjete me transmision manual. Perdorni filtrin "Transmisioni" ne faqen e automjeteve per te pare vetem automjetet manuale.', 6),
('automjete', '["9 vende","8 vende","shume","large"]', 'A keni automjete per grupe te medha?', 'Po, kemi minivana me 7-9 vende si Mercedes V-Class, VW Touran, dhe Ford Galaxy. Per grupe me te medha, mund te rezervoni disa automjete.', 7),
('automjete', '["ri","2024","2025","2026"]', 'A keni automjete te vitit 2025-2026?', 'Po, shume kompani kane automjete te reja te viteve 2024-2026. Perdorni filtrin e vitit per te pare vetem modelet me te reja.', 6),
('automjete', '["mercedes","benz"]', 'A keni Mercedes-Benz?', 'Po, kemi modele te ndryshme Mercedes: A-Class, C-Class, E-Class, GLC, GLE, V-Class, dhe Sprinter. Kerkoni "Mercedes" ne faqen e automjeteve.', 6),
('automjete', '["bmw"]', 'A keni BMW?', 'Po, kemi modele BMW si: 1 Series, 3 Series, 5 Series, X1, X3, X5. Kerkoni "BMW" ne faqen e automjeteve per te pare disponueshmerine.', 6),
('automjete', '["volkswagen","vw","golf"]', 'A keni Volkswagen?', 'Po, VW eshte nje nga markat me te popullarizuara. Kemi: Golf, Polo, Tiguan, Touran, Passat, dhe T-Roc. Kerkoni "Volkswagen" ne faqen e automjeteve.', 6),
('automjete', '["toyota","yaris","corolla"]', 'A keni Toyota?', 'Po, kemi modele Toyota si: Yaris, Corolla, RAV4, C-HR, dhe Land Cruiser. Toyota eshte e njohur per besueshmeri te larte.', 6),
('automjete', '["audi"]', 'A keni Audi?', 'Po, kemi modele Audi: A3, A4, A6, Q3, Q5, dhe Q7. Kerkoni "Audi" ne faqen e automjeteve per disponueshmeri dhe cmime.', 6),
('automjete', '["renault","clio","megane"]', 'A keni Renault?', 'Po, kemi Renault Clio, Megane, Captur, dhe Kadjar. Renault eshte shume popullar per qirane ekonomike ne rajonin tone.', 5),
('automjete', '["fiat","500","punto"]', 'A keni Fiat?', 'Po, Fiat 500 eshte nder automjetet me te popullarizuara ekonomike. Kemi edhe modele te tjera Fiat ne kategorite kompakte.', 5),
('automjete', '["hyundai","kia"]', 'A keni Hyundai ose Kia?', 'Po, kemi modele Hyundai (i10, i20, Tucson, Kona) dhe Kia (Picanto, Ceed, Sportage). Jane automjete me cmim te mire dhe cilesore.', 5),
('automjete', '["pickup","truck","kamion"]', 'A keni pickup ose kamione?', 'Disa kompani ofrojne pickup si Toyota Hilux ose Ford Ranger. Per kamione te medhenj, kontaktoni kompanite specializuara per transport.', 4),

-- More pricing details
('cmime', '["i lire","cheapest","me i lire"]', 'Cili eshte automjeti me i lire?', 'Automjetet me te lira jane ne kategorine Ekonomike, duke filluar nga 15 EUR/dite. Modele si Fiat 500, Hyundai i10, dhe Renault Clio jane nder me te lirat.', 8),
('cmime', '["i shtrenjte","expensive","luksoz"]', 'Sa kushton automjeti me i shtrenjte?', 'Automjetet luksoze fillojne nga 65 EUR/dite dhe mund te shkojne deri ne 200+ EUR/dite per modele si Porsche, Range Rover, ose Mercedes S-Class.', 6),
('cmime', '["negocioj","negotiate","diskutoj cmim"]', 'A mund te negocioj cmimin?', 'Cmimet ne platforme jane te vendosura nga kompanite. Per qira afatgjate (30+ dite) ose flota, mund te kontaktoni kompanine direkt per cmime te vecanta.', 5),
('cmime', '["fshehur","hidden","shtese papritur"]', 'A ka tarifa te fshehura?', 'Jo, cmimet qe shihni jane transparente. Megjithate, tarifat shtese mund te aplikohen per: karburant te munguar, vonese ne kthim, demtime, ose aksesore shtese qe zgjidhni.', 8),
('cmime', '["garanci","deposit","bllokuar"]', 'Sa eshte depozita e sigurise?', 'Depozita ndryshon sipas kategorise: Ekonomike (100-200 EUR), Kompakte/Sedan (200-300 EUR), SUV (300-500 EUR), Luksoze (500-1000 EUR). Depozita bllokohet ne karten tuaj dhe kthehet pas kthimit.', 8),
('cmime', '["kupone","promo","kod"]', 'A ka kode promocionale?', 'Here pas here ofrojme kode promocionale per zbritje. Ndiqni ne ne rrjete sociale dhe regjistrohuni per newsletter per te marre ofertat me te fundit.', 5),

-- More payment details
('pagesa', '["visa","mastercard"]', 'A pranoni Visa dhe Mastercard?', 'Po, pranojme te dyja Visa dhe Mastercard, si karta debiti ashtu edhe krediti. Pagesa procesohet ne menyre te sigurt.', 7),
('pagesa', '["bllokuar","hold","authorize"]', 'Pse u bllokuan parate ne karten time?', 'Kjo eshte zakonisht depozita e sigurise qe bllokohet (autorizohet) ne karten tuaj. Kjo shume nuk merret, vetem mbahet si garanci dhe lirohet brenda 7-14 diteve pas kthimit.', 8),
('pagesa', '["dy here","double charge","gabim pagese"]', 'Me jane marre parate dy here!', 'Nese keni vene re nje pagesete dyfish, kontaktoni menjehere ekipin tone ne info@rentakar.com me detajet e pageses. Do ta verifikojme dhe rimbursojme nese eshte gabim.', 9),
('pagesa', '["para","cash","withdraw"]', 'A ka bankomate afer?', 'Bankomate (ATM) gjenden ne te gjithe qytetet kryesore prane aeroporteve, qendrave tregtare, dhe zonave qendrore. Shumica pranojne karta nderkombetare.', 3),

-- More account & company
('llogari', '["dy llogari","two accounts","shume"]', 'A mund te kem dy llogari?', 'Jo, cdo person duhet te kete vetem nje llogari. Nese deshironi nje llogari klienti dhe nje per kompani, mund te regjistroni kompanine me nje email tjeter.', 6),
('llogari', '["data","eksport","shkarko"]', 'A mund ti shkarkoj te dhenat e mia?', 'Po, sipas GDPR keni te drejte te kerkoni nje kopje te te dhenave tuaja. Dergoni kerkesen ne privacy@rentakar.com dhe do te pergaditim eksportin brenda 30 diteve.', 5),
('kompani', '["withdraw","terheq","largohem"]', 'Si ta terhiqte kompanine nga platforma?', 'Per te terhequr kompanine: 1) Perfundoni te gjitha rezervimet aktive, 2) Kontaktoni ekipin tone ne info@rentakar.com, 3) Konfirmoni terheqjen. Te dhenat ruhen per 30 dite para fshirjes.', 6),
('kompani', '["permireso","upgrade","plan"]', 'Si ta permiresoj planin e abonimit?', 'Hyni ne panelin e kompanise > "Cilesimet" > "Aboniri". Zgjidhni planin e ri dhe konfirmoni ndryshimin. Plani i ri aktivizohet menjehere.', 7),
('kompani', '["kalender","calendar","orar"]', 'A ka kalendar per menaxhimin e rezervimeve?', 'Po, paneli i kompanise ka nje kalendar ku mund te shihni te gjitha rezervimet, disponueshmerine e automjeteve, dhe te planifikoni me mire.', 6),

-- Insurance continued
('sigurime', '["super","premium sigurim","mbrojtje max"]', 'Cili eshte sigurimi me i mire?', 'Sigurimi gjitheperfshires (Full Coverage/CDW) eshte opsioni me i mire. Mbulon: aksidentet, vjedhjen, demtimet natyrore, dhe zvoglon francizen ne zero. Cmimi: 8-15 EUR/dite.', 8),
('sigurime', '["pa sigurim","without insurance"]', 'A mund te udhetoj pa sigurim shtese?', 'Sigurimi baze TPL eshte gjithmone i perfshire. Sigurim shtese nuk eshte i detyrueshem, por rekomandohet forte vecanerisht per automjete te shtrenjta ose udhetim te gjate.', 7),
('sigurime', '["motiv","deshmi","prove"]', 'Cfare ndodh nese nuk kam faj ne aksident?', 'Nese nuk jeni fajtori, sigurimi i pales tjeter duhet te mbuloje demtimet. Gjithmone merrni raportin e policise dhe fotot e vendit te aksidentit per dokumentim.', 7),

-- Terms continued
('kushte', '["karburant","benzine","nafte","full"]', 'Si eshte politika e karburantit?', 'Politika standarde eshte "plot-per-plot": merrni automjetin me rezervuar te plote dhe e ktheni me rezervuar te plote. Karburanti qe mungon tarifohet me cmim me te larte se cmimi i stacionit.', 8),
('kushte', '["gome","tire","flat"]', 'Cfare ndodh nese me plaset goma?', 'Ne rast defekti te gomes: 1) Perdorni gomen rezerve nese ka, 2) Telefononi asistencen rrugore, 3) Njoftoni kompanine. Goma e demtuar mund te zbritet nga depozita nese demtimi eshte per faj tuaj.', 7),
('kushte', '["erresire","dark","nate"]', 'A ka kufizime per drejtim naten?', 'Nuk ka kufizime per drejtim naten. Megjithate, sigurohuni qe dritat e automjetit funksionojne sic duhet para se te niseni.', 4),
('kushte', '["gps tracking","ndjekje","monitorim"]', 'A kane automjetet GPS tracking?', 'Disa kompani perdorin GPS per sigurine e automjetit. Kjo ndiahmon edhe ne rast vjedhje ose humbje te automjetit. Perdorimi i GPS-it eshte i specifikuar ne kontrate.', 5),
('kushte', '["park","parkim","parking"]', 'Kush paguan gjobat e parkimit?', 'Te gjitha gjobat e parkimit jane pergjegjesia e qiramarresit gjate periudhes se qiranes. Kompania mund t''ju tarifoje gjobat qe merr me vone, plus tarife administrative.', 7),

-- Location specifics
('lokacione', '["prizren"]', 'A keni automjete ne Prizren?', 'Po, kemi automjete ne Prizren. Prizreni eshte nje nder qytetet me te kerkuara per turistet. Perdorni filtrin e qytetit per te pare disponueshmerine.', 6),
('lokacione', '["peje","pec"]', 'A keni automjete ne Peje?', 'Po, kemi kompani qe operojne ne Peje. Peja eshte pike e mire nisjeje per vizita ne Rugove dhe Luginen e Valbones.', 6),
('lokacione', '["ferizaj"]', 'A keni automjete ne Ferizaj?', 'Po, Ferizaji eshte nje nga qytetet tona kryesore. Zyra jone kryesore ndodhet ne Ferizaj.', 6),
('lokacione', '["gjilan"]', 'A keni automjete ne Gjilan?', 'Po, kemi kompani dhe automjete ne Gjilan. Perdorni filtrin e qytetit per te pare te gjitha opsionet.', 5),
('lokacione', '["vlore","sarande","plazh","beach"]', 'A keni automjete ne bregdet (Vlore/Sarande)?', 'Po, kemi shume automjete ne qytetet bregdetare te Shqiperise. Gjate veres kerkesa eshte e larte, prandaj rekomandojme rezervim te hershme.', 7),
('lokacione', '["durres"]', 'A keni automjete ne Durres?', 'Po, Durresi eshte nje nga qytetet me te kerkuara per automjete, vecanerisht gjate sezonit veror. Kemi disa kompani qe operojne atje.', 6),
('lokacione', '["ohrid","ohri","liqen"]', 'A keni automjete ne Ohrid?', 'Po, Ohridi (Maqedoni e Veriut) ka disa kompani qe ofrojne automjete me qira. Liqeni i Ohrit eshte destinacion i mrekullueshem!', 5),

-- Technical continued
('teknike', '["hap","open","nuk hapet"]', 'Faqja nuk hapet, cfare te bej?', 'Provoni: 1) Kontrolloni lidhjen e internetit, 2) Pastroni cache-n e shfletuesit, 3) Provoni mode incognito, 4) Provoni nje shfletues tjeter. Nese vazhdon, na kontaktoni.', 7),
('teknike', '["gabim","error","404","500"]', 'Po shoh nje gabim ne faqe!', 'Na vjen keq per problemin! Provoni: 1) Rifreskoni faqen, 2) Kthehuni ne faqen kryesore, 3) Pastroni cache-n. Nese gabimi vazhdon, na shkruani ne info@rentakar.com me screenshot te gabimit.', 7),
('teknike', '["ngarkos","loading","ngarkim"]', 'Faqja ngarkohet ngadale!', 'Per permiresim te shpejtesise: 1) Kontrolloni shpejtesine e internetit, 2) Mbyllni tabt e tjera, 3) Pastroni cache-n. Ne hapen shumicen e rasteve faqja ngarkohet shpejt.', 5),

-- Support continued
('suport', '["orari","schedule","kur"]', 'Cili eshte orari juaj i punes?', 'Orari i suportit: E hene - E premte: 08:00-18:00, E shtune: 09:00-14:00. Per emergjenca, jemi te disponueshem 24/7 ne numrin +383 44 000 000.', 7),
('suport', '["kohe","pergjigje","response time"]', 'Sa shpejt pergjigjeni?', 'Chat: menjehere (automatik), Email: brenda 24 oresh pune, Telefon: menjehere gjate orarit te punes. Per raste urgjente, rekomandojme telefonin.', 6),
('suport', '["propozim","sugjerim","suggestion"]', 'Kam nje sugjerim per platformen!', 'Faleminderit per interesin! Na dergoni sugjerimet tuaja ne feedback@rentakar.com. Vleresojme cdo ide qe na ndihmon te permiresohemi!', 4),

-- More booking edge cases
('rezervime', '["feste","festat","holiday","krishtlindjet","bajram"]', 'A mund te rezervoj gjate festave?', 'Po, mund te rezervoni gjate festave, por disponueshmeria mund te jete me e kufizuar dhe cmimet mund te jene me te larta. Rekomandojme rezervim te hershme per periudha festive.', 7),
('rezervime', '["nate","overnight","gjate nates"]', 'A tarifohet dita e marrjes dhe kthimit?', 'Po, dita e marrjes dhe dita e kthimit llogariten si dite te plota. Per shembull, nese merrni te henen dhe ktheni te merkuren, jane 3 dite.', 7),
('rezervime', '["mik","friend","per dikend"]', 'A mund te rezervoj per dikend tjeter?', 'Jo, personi qe ben rezervimin duhet te jete edhe shoferi kryesor. Nese dikush tjeter do te drejtoje, duhet te regjistrohet si shofer shtese ne kontrate.', 7),
('rezervime', '["fshij","cancel all","te gjitha"]', 'A mund ti fshij te gjitha rezervimet?', 'Po, mund te anuloni cdo rezervim individualisht nga paneli juaj. Kushtet e anulimit varen nga koha e mbetur deri ne daten e marrjes.', 5),

-- General extras
('pergjithshme', '["ligjor","legal","norme"]', 'A eshte e ligjshme platforma?', 'Po, RentaKar operohet nga Booking Shpk, kompani e regjistruar ne Kosove me NUI: 812373174. Operojme ne perputhje te plote me ligjet e vendeve ku operojme.', 8),
('pergjithshme', '["garanci","guarantee","warranty"]', 'A ka garanci per sherbimin?', 'Po, garantojme: 1) Cmimet transparente pa tarifa te fshehura, 2) Kompani te verifikuara, 3) Asistence 24/7, 4) Rimbursim te plote per anulime te hershme, 5) Ndermjetesim ne rast mosmarreveshjeje.', 7),
('pergjithshme', '["ndryshim","difference","vs","tjeter"]', 'Si dalloheni nga platformat e tjera?', 'RentaKar dallohet per: 1) Fokus ne rajonin shqipfolës, 2) Suport ne shqip 24/7, 3) Kompani te verifikuara lokale, 4) Cmime transparente, 5) Proces i thjeshte rezervimi.', 8),
('pergjithshme', '["te reja","news","update","lajm"]', 'Ku mund te gjej lajmet me te reja?', 'Ndiqni ne ne Facebook dhe Instagram per lajme, oferta, dhe perditesime. Gjithashtu mund te regjistroheni per newsletter ne fund te faqes kryesore.', 4),
('pergjithshme', '["vleresim","rate","review"]', 'Si te le nje vleresim?', 'Pas perfundimit te cdo rezervimi, do te merrni nje ftese per te lene vleresim (1-5 yje) dhe koment. Vleresimi juaj ndihmon perdoruesit e tjere dhe kompanite te permiresohent.', 6),
('pergjithshme', '["rekomando","suggest","refer"]', 'A ka program referimi?', 'Aktualisht nuk kemi program formal referimi, por ndani RentaKar me miqte tuaj! Nje program referimi me shperblime eshte ne zhvillim.', 3);
