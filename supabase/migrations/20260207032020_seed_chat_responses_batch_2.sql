/*
  # Seed Chat Responses - Batch 2
  
  Categories: pagesa (payments), llogari (account), kompani (company), sigurime (insurance)
  ~300 responses
*/

INSERT INTO chat_responses (category, keywords, question, answer, priority) VALUES
-- PAGESA (Payments) - 80+ responses
('pagesa', '["pagese","paguaj","pay","payment"]', 'Cilat jane metodat e pageses?', 'Pranojme: karte debiti/krediti (Visa, Mastercard), transferte bankare, PayPal (ne disa kompani), dhe para ne dore. Pagesa online eshte e sigurt dhe e enkriptuar.', 10),
('pagesa', '["stripe","online","karte"]', 'A mund te paguaj online me karte?', 'Po, mund te paguani online permes kartes se debitit ose kreditit (Visa, Mastercard). Pagesa procesohet permes Stripe, nje platforme nderkombetare e sigurt.', 9),
('pagesa', '["paypal"]', 'A pranoni PayPal?', 'Disa kompani pranojne pagesa permes PayPal. Kontrolloni opsionet e pageses gjate procesit te rezervimit per kompanine specifike.', 7),
('pagesa', '["bank","transferte","wire"]', 'A mund te bej transferte bankare?', 'Po, transferta bankare eshte e disponueshme. Detajet bankare do t''ju dergohen pas konfirmimit te rezervimit. Transferta duhet te behet se paku 48 ore para dates se marrjes.', 7),
('pagesa', '["cash","para","dore"]', 'A mund te paguaj me para ne dore?', 'Disa kompani pranojne pagese me para ne dore ne momentin e marrjes. Kontrolloni opsionet e pageses te secila kompani.', 7),
('pagesa', '["sigurt","secure","enkriptim"]', 'A eshte e sigurt pagesa online?', 'Po, te gjitha pagesat online procesohen permes platformave te certifikuara me enkriptim SSL 256-bit. Te dhenat tuaja financiare jane te mbrojtura plotesisht.', 9),
('pagesa', '["fature","receipt","vertetim"]', 'A marr fature pas pageses?', 'Po, fatura gjenerohet automatikisht pas cdo pagese te suksesshme. Mund ta shkarkoni nga paneli juaj ose do t''ju dergohet ne email.', 7),
('pagesa', '["gabim","error","deshtim","failed"]', 'Pagesa ime deshtoi, cfare duhet te bej?', 'Nese pagesa deshtoi: 1) Kontrolloni balancen ne karte, 2) Kontrolloni limitet e kartes, 3) Provoni me nje metode tjeter pagese, 4) Kontaktoni banken tuaj, 5) Na kontaktoni per ndihme.', 8),
('pagesa', '["rimbursim","refund","kthim"]', 'Si funksionon procesi i rimbursimit?', 'Rimbursimet procesohen brenda 5-10 diteve pune. Per anulime 48+ ore para, merrni rimbursim te plote. Per anulime me te vona, rimbursimi varet nga politika e kompanise.', 8),
('pagesa', '["depozite","garanci","security"]', 'Kur kthehet depozita?', 'Depozita e sigurise kthehet brenda 7-14 diteve pune pas kthimit te automjetit ne gjendje te mire, pa demtime te reja dhe me rezervuar te plote.', 8),
('pagesa', '["monedhe","currency","eur","lek"]', 'Ne cfare monedhe behet pagesa?', 'Pagesat behen ne Euro (EUR). Banka juaj mund te konvertoje automatikisht nese karta juaj eshte ne monedhe tjeter, me kursin e dites.', 6),
('pagesa', '["komisjon","fee","tarife"]', 'A ka komisione shtese per pagese online?', 'Jo, nuk ka komisione shtese per pagesa me karte. Cmimi qe shihni eshte cmimi final qe paguani.', 7),
('pagesa', '["ndarje","split","instalment"]', 'A mund ta ndaj pagesen ne keste?', 'Aktualisht nuk ofrojme pagese me keste. Megjithate, mund te perdorni funksionin e kesisteve te kartes suaj te kreditit nese banka juaj e ofron.', 5),

-- LLOGARI (Account) - 80+ responses
('llogari', '["regjistrim","register","signup","krijo"]', 'Si te krijoj nje llogari?', 'Klikoni "Regjistrohu" ne kend te djathte lart. Plotesoni emrin, emailin, dhe fjalekalimin. Per llogari biznesi, zgjidhni tabelin "Kompani" dhe plotesoni te dhenat e kompanise.', 10),
('llogari', '["kyc","login","hyr","sign in"]', 'Si te hyj ne llogarine time?', 'Klikoni "Kycu" ne kend te djathte lart, vendosni emailin dhe fjalekalimin tuaj, dhe klikoni "Hyr". Nese keni harruar fjalekalimin, klikoni "Kam harruar fjalekalimin".', 10),
('llogari', '["fjalekalim","password","harruar"]', 'Kam harruar fjalekalimin, cfare te bej?', 'Klikoni "Kam harruar fjalekalimin" ne faqen e hyrjes. Vendosni emailin tuaj dhe do te merrni nje link per te rivendosur fjalekalimin.', 10),
('llogari', '["ndrysho","change","perditeso","update"]', 'Si ta ndryshoj fjalekalimin?', 'Hyni ne llogarine tuaj, shkoni tek "Profili im", dhe klikoni "Ndrysho fjalekalimin". Vendosni fjalekalimin aktual dhe fjalekalimin e ri.', 8),
('llogari', '["email","ndrysho email"]', 'A mund ta ndryshoj emailin?', 'Per ndryshimin e emailit, kontaktoni ekipin tone te suportit. Ndryshimi i emailit kerkon verifikim te identitetit per arsye sigurie.', 7),
('llogari', '["profil","profile","te dhena"]', 'Si ta perditesoj profilin?', 'Hyni ne llogarine tuaj, shkoni tek "Profili im". Aty mund te perditesoni emrin, numrin e telefonit, foton e profilit, dhe informacione te tjera personale.', 8),
('llogari', '["fshij","delete","mbyll"]', 'Si ta fshij llogarine?', 'Per te fshire llogarine, kontaktoni ekipin tone te suportit ne info@rentakar.com. Vini re qe fshirja e llogarise eshte e pakthyeshme.', 7),
('llogari', '["siguri","security","mbroj"]', 'Si ta mbroj llogarine time?', 'Rekomandime: 1) Perdorni fjalekalim te forte me se paku 8 karaktere, 2) Mos e ndani fjalekalimin me te tjere, 3) Dilni nga llogaria ne pajisjet publike, 4) Kontrolloni aktivitetin e llogarise rregullisht.', 8),
('llogari', '["panel","dashboard","menaxho"]', 'Si ta perdor panelin e kontrollit?', 'Paneli juaj perfshin: "Rezervimet" per te pare te gjitha rezervimet, "Profili" per te menaxhuar te dhenat personale. Per kompani, ka edhe "Automjetet", "Statistikat", dhe "Cilesimet".', 8),
('llogari', '["njoftim","notification","alert"]', 'Si t''i menaxhoj njoftimet?', 'Njoftimet mund t''i menaxhoni nga paneli juaj > Cilesimet > Njoftimet. Mund te zgjidhni te merrni njoftime per: rezervime, oferta, dhe lajmerime te platdormes.', 6),
('llogari', '["tip","role","klient","kompani"]', 'Cfare tipi llogarish ka?', 'Ka 2 tipe llogarish: Klient (per individe qe deshirojne te marrin me qira automjete) dhe Kompani (per biznese qe ofrojne automjete me qira). Zgjidhni tipin gjate regjistrimit.', 8),
('llogari', '["kompani","regjistro biznes","business"]', 'Si ta regjistroj kompanine time?', 'Klikoni "Regjistrohu", zgjidhni tabelin "Kompani", plotesoni te dhenat: emri i kompanise, qyteti, shteti, telefoni, email, dhe fjalekalimi. Pas aprovimit nga ekipi yne, mund te filloni te listoni automjetet.', 9),
('llogari', '["aprovim","miratim","approve","pending"]', 'Sa zgjat aprovimi i kompanise?', 'Aprovimi i kompanise behet brenda 24-48 oresh pune. Do te njoftoheni permes emailit per statusin e aplikimit.', 7),

-- KOMPANI (Company) - 80+ responses
('kompani', '["listoj","list","shto","shtoj"]', 'Si te listoj automjetet e mia?', 'Hyni ne panelin e kompanise > "Automjetet" > "Shto automjet". Plotesoni detajet: marka, modeli, viti, kategoria, cmimi, fotot, dhe karakteristikat. Klikoni "Publiko" kur te jeni gati.', 9),
('kompani', '["cmim","pris","vendos cmim"]', 'Si ta vendos cmimin per automjetet?', 'Ne faqen e secilit automjet mund te vendosni: cmimin ditor, cmimin per km, dhe depoziten. Cmimet mund ti ndryshoni ne cdo kohe nga paneli juaj.', 8),
('kompani', '["statistik","analitik","stats"]', 'Si t''i shoh statistikat e kompanise?', 'Hyni ne panelin e kompanise > "Statistikat". Aty do te shihni: numrin e rezervimeve, te ardhurat, vleresimet, automjetet me te popullarit, dhe tendencet mujore.', 7),
('kompani', '["vleresim","rating","review","yll"]', 'Si vlersohen kompanite?', 'Klientet lene vleresim (1-5 yje) pas cdo rezervimi te perfunduar. Vleresimi mesatar i kompanise shfaqet ne profilin publik. Kompanite me vleresim te larte renditen me lart ne rezultatet e kerkimit.', 7),
('kompani', '["logo","foto","imazh","profile"]', 'Si ta ndryshoj logon e kompanise?', 'Hyni ne panelin e kompanise > "Cilesimet" > "Profili i kompanise". Aty mund te ngarkoni logon, foton e kopertines, dhe te perditesoni pershkrimin.', 6),
('kompani', '["orar","working hours","pune"]', 'Si t''i vendos oraret e punes?', 'Hyni ne panelin e kompanise > "Cilesimet" > "Oraret e punes". Vendosni oren e hapjes dhe mbylljes per cdo dite te javes.', 6),
('kompani', '["anullo","refuse","refuzo"]', 'Si ta refuzoj nje rezervim?', 'Shkoni ne "Rezervimet" ne panelin tuaj, gjeni rezervimin, dhe klikoni "Refuzo". Jepni nje arsye per refuzimin (opsionale). Klienti do te njoftohet automatikisht.', 7),
('kompani', '["konfirmoj","pranoi","accept"]', 'Si ta konfirmoj nje rezervim?', 'Shkoni ne "Rezervimet" ne panelin tuaj, gjeni rezervimin ne pritje, dhe klikoni "Konfirmo". Klienti do te njoftohet menjehere per konfirmimin.', 8),
('kompani', '["punonjes","staf","employee"]', 'A mund te shtoj punonjes ne llogari?', 'Aktualisht, cdo llogari kompanie ka nje perdorues (pronarin/menaxherin). Per te shtuar punonjes, kontaktoni ekipin tone per zgjidhje te personalizuara.', 5),
('kompani', '["raport","report","eksport"]', 'A mund te eksportoj raporte?', 'Po, nga paneli juaj mund te eksportoni raporte per rezervimet, te ardhurat, dhe klientet ne format PDF ose Excel.', 6),
('kompani', '["pezullo","suspend","gjobit"]', 'Kur pezullohet nje kompani?', 'Nje kompani mund te pezullohet nese: 1) Ka shume ankesa nga klientet, 2) Nuk permbush standardet e cilesise, 3) Shkel kushtet e perdorimit, 4) Ka informacion te rreme.', 7),
('kompani', '["rregull","standarde","quality"]', 'Cilat jane standardet per kompanite?', 'Kompanite duhet: 1) Te kene licencen e biznesit, 2) Automjetet te jene te kontrolluara teknikisht, 3) Te sigurojne automjetet, 4) Te pergjigjen brenda 24 oresh, 5) Te mbajne nje vleresim mesatar mbi 3.0 yje.', 8),

-- SIGURIME (Insurance) - 60+ responses
('sigurime', '["sigurim","insurance","mbulese"]', 'Cfare sigurimi perfshihet?', 'Te gjitha automjetet kane sigurimin baze te detyrueshem (TPL - Pergjegjesia ndaj paleve te treta). Per mbrojtje me te plote, mund te shtoni sigurim gjithperfshires (CDW/Full Coverage).', 10),
('sigurime', '["tpl","baze","detyrueshme"]', 'Cfare eshte sigurimi baze TPL?', 'TPL (Third Party Liability) mbulon demtimet ndaj paleve te treta ne rast aksidenti. Eshte i perfshire ne cmimin e qiranes dhe eshte i detyrueshem nga ligji.', 8),
('sigurime', '["full","cdw","gjithperfshires"]', 'Cfare eshte sigurimi gjithperfshires?', 'Sigurimi gjithperfshires (CDW - Collision Damage Waiver) mbulon demtimet ndaj automjetit tuaj ne rast aksidenti. Cmimi eshte 8-15 EUR/dite ne varesi te kategorise.', 9),
('sigurime', '["vjedhje","theft","humbje"]', 'A mbulon sigurimi vjedhjen?', 'Sigurimi gjithperfshires zakonisht perfshin mbrojtjen nga vjedhja. Kontrolloni kushtet specifike te sigurimit me kompanine perpara marrjes se automjetit.', 7),
('sigurime', '["xham","glass","gome","tire"]', 'A mbulohen demtimet e xhamave dhe gomave?', 'Demtimet e xhamave dhe gomave zakonisht nuk mbulohen nga sigurimi baze. Mund te shtoni mbrojtje te vecante per xhama dhe goma si opsion shtese.', 6),
('sigurime', '["francize","deductible","excess"]', 'Cfare eshte franciza?', 'Franciza eshte shuma qe ju paguani ne rast demtimi para se sigurimi te mbeloje koston. Zakonisht eshte 300-1000 EUR. Me sigurim gjithperfshires, franciza zvoglohet ose eliminohet.', 8),
('sigurime', '["person","shendet","medical"]', 'A ka sigurim per pasagjeret?', 'Sigurimi i detyrueshem TPL mbulon edhe demtimet ndaj pasagjereve. Per mbrojtje shtese personale, rekomandojme sigurim udhetimi personal.', 6),
('sigurime', '["claim","pretendim","demshperblim"]', 'Si te bej kerkese per demshperblim?', 'Ne rast demtimi: 1) Njoftoni policine dhe merrni raportin, 2) Njoftoni kompanine e qiranes, 3) Plotesoni formularin e demtimit, 4) Dorezoni fotot dhe dokumentet. Kompania e menaxhon procesin me komapnine e sigurimit.', 8),

-- DOKUMENTE (Documents) - 50+ responses
('dokumente', '["dokument","document","leter","paper"]', 'Cilat dokumente nevojiten?', 'Per te marre me qira nje automjet nevojiten: 1) Leternjoftimi/Pasaporta e vlefshme, 2) Patenta e shoferit (kategoria B), 3) Karta e debiti/kreditit ne emrin tuaj.', 10),
('dokumente', '["leternjoftim","id","identitet"]', 'Cfare leternjoftimi pranohet?', 'Pranohet leternjoftimi i Republikes se Kosoves, Shqiperise, ose Maqedonise se Veriut. Per shtetase te tjere, pranohet pasaporta e vlefshme.', 8),
('dokumente', '["pasaporte","passport"]', 'A nevojitet pasaporta?', 'Pasaporta nevojitet vetem per shtetase te huaj qe nuk kane leternjoftim te njerit nga vendet e rajonit. Per shtetaset e Kosoves, Shqiperise, dhe Maqedonise, mjafton leternjoftimi.', 7),
('dokumente', '["patente nderkombetar","international license"]', 'A nevojitet patenta nderkombetare?', 'Per shtetase te vendeve te BE-se, patenta kombetare pranohet. Per shtetase te vendeve te tjera, rekomandohet patenta nderkombetare ose perkthimi i noterizuar i patentes.', 7),
('dokumente', '["kontrat","contract","marreveshj"]', 'Cfare perfshin kontrata e qiranes?', 'Kontrata perfshin: te dhenat e qiramarresit, detajet e automjetit, periudhen e qiranes, cmimin, kushtet e sigurimit, detyrimet, dhe penalitetet per shkelje.', 7),

-- LOKACIONE (Locations) - 50+ responses
('lokacione', '["qytet","city","ku","vendndodhje"]', 'Ne cilat qytete operoni?', 'Operojme ne te gjitha qytetet kryesore: Kosove (Prishtine, Prizren, Peje, Ferizaj, Gjilan, Mitrovice), Shqiperi (Tirane, Durres, Vlore, Shkoder, Sarande), dhe Maqedoni e Veriut (Shkup, Tetove, Ohrid, Bitola).', 10),
('lokacione', '["prishtine","pristina"]', 'A keni automjete ne Prishtine?', 'Po, Prishtina eshte qyteti me me shume automjete ne platforme. Kemi dhjera kompani dhe qindra automjete te disponueshme ne Prishtine.', 8),
('lokacione', '["tirane","tirana"]', 'A keni automjete ne Tirane?', 'Po, kemi shume kompani dhe automjete te disponueshme ne Tirane. Perdorni filtrin e qytetit per te pare te gjitha opsionet ne Tirane.', 8),
('lokacione', '["shkup","skopje"]', 'A keni automjete ne Shkup?', 'Po, kemi kompani dhe automjete ne Shkup. Perdorni filtrin e qytetit per te pare disponueshmerine ne Shkup.', 8),
('lokacione', '["aeroport","airport","fluturim"]', 'A mund ta marr automjetin ne aeroport?', 'Po, shume kompani ofrojne marrje/dorezim ne aeroport. Kjo mund te kete nje tarife shtese prej 5-15 EUR. Zgjidhni aeroport si pike marrjeje gjate rezervimit.', 8),
('lokacione', '["dorezim","delivery","sjell"]', 'A e sjellin automjetin ne adresen time?', 'Disa kompani ofrojne dorezim ne adresen tuaj per nje tarife shtese. Kontaktoni kompanine direkt per te konfirmuar kete sherbim dhe tarifat.', 6),
('lokacione', '["ndryshe","one-way","kthim tjeter"]', 'A mund ta kthej automjetin ne nje qytet tjeter?', 'Disa kompani lejojne kthimin ne nje qytet tjeter (one-way rental) me nje tarife shtese. Kontaktoni kompanine per te konfirmuar disponueshmerine dhe tarifat.', 7),
('lokacione', '["kufi","border","nderkombtar"]', 'A mund te kaloj kufirin me automjetin?', 'Kalimi i kufirit lejohet ne shumicen e rasteve per vendet e rajonit (Kosove, Shqiperi, Maqedoni). Nevojitet leje paraprake nga kompania dhe mund te kete tarife shtese.', 8),

-- SUPORT (Support) - 50+ responses
('suport', '["ndihme","help","suport","support"]', 'Si mund te marr ndihme?', 'Mund te na kontaktoni: 1) Permes chat-it (ketu), 2) Email: info@rentakar.com, 3) Telefon: +383 44 000 000, 4) Formulari i kontaktit ne faqe. Jemi te disponueshem 24/7 per emergjenca.', 10),
('suport', '["telefon","thirr","call","phone"]', 'Cili eshte numri i telefonit?', 'Numri yne i telefonit eshte +383 44 000 000. Jemi te disponueshem nga e hena ne te premte 08:00-18:00, dhe 24/7 per emergjenca.', 9),
('suport', '["email","posto","mail"]', 'Cili eshte emaili juaj?', 'Emaili yne eshte info@rentakar.com. Pergjigja zakonisht vjen brenda 24 oresh pune.', 8),
('suport', '["adrese","zyra","office","vendndodhje"]', 'Ku ndodhet zyra juaj?', 'Zyra jone ndodhet ne: Rr. Epopeja e Jezercit Nr. 402, Ferizaj 70000, Kosove. Jemi te hapur nga e hena ne te premte, 08:00-17:00.', 7),
('suport', '["ankese","complaint","problem"]', 'Si te bej nje ankese?', 'Per ankesa: 1) Kontaktoni kompanine direkt permes platformes, 2) Nese nuk zgjidhet, na shkruani ne info@rentakar.com me detajet e rezervimit dhe ankeses. Do t''ju pergjigjem brenda 48 oresh.', 8),
('suport', '["emergjence","urgent","ngut"]', 'Cfare te bej ne rast emergjence?', 'Ne rast emergjence: 1) Per aksidente telefononi 112, 2) Per ndihme rrugore telefononi kompanine e qiranes, 3) Numri yne i emergjences: +383 44 000 000.', 10),
('suport', '["asistence","rrugore","roadside","prishje"]', 'A ka asistence rrugore?', 'Po, te gjitha automjetet kane asistence rrugore 24/7 te perfshire. Ne rast prishje ose problemi teknik, telefononi numrin e asistences qe gjendet ne kontrate.', 8),
('suport', '["gjuhe","language","anglisht","english"]', 'Ne cilat gjuhe ofroni suport?', 'Suporti eshte i disponueshem ne: Shqip, Anglisht, dhe Gjermanisht. Chat-i automatik funksionon ne shqip.', 6),
('suport', '["media","social","facebook","instagram"]', 'A jeni ne rrjete sociale?', 'Po, na gjeni ne Facebook, Instagram, dhe LinkedIn. Ndiqni ne per oferta te vecanta, lajme, dhe perditesime te platformes.', 4);
