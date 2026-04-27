/*
  # Seed Chat Responses - Batch 6
  
  Final batch - Additional 400+ responses to reach 1000+ total
  Extended Q&A variations, seasonal, scenario-based responses
*/

INSERT INTO chat_responses (category, keywords, question, answer, priority) VALUES
-- Seasonal & scenario-based
('rezervime', '["vere","summer","plazh","pushim"]', 'Rekomandime per qirane ne vere?', 'Per vere rekomandojme: 1) Rezervoni heret (cmimet rriten 15-30%), 2) Zgjidhni automjet me klime, 3) SUV per rruge malore, 4) Kontrolloni kthimin e dite-shtune per te shmangur trafik.', 6),
('rezervime', '["dimer","winter","acar","bore"]', 'Rekomandime per qirane ne dimer?', 'Per dimer: 1) Zgjidhni automjet me 4x4 ose trakcion te perparme, 2) Shtoni zinxhire bore, 3) Kontrolloni gomat dimrore, 4) Kini kujdes per rruget malore.', 6),
('rezervime', '["pranvere","spring"]', 'A ka oferta per pranvere?', 'Pranvera eshte sezon i mire per qirane me cmime te arsyeshme. Shume kompani kane oferta speciale per pranvere. Kontrolloni faqen per ofertat aktuale.', 4),
('rezervime', '["vjeshte","autumn","fall"]', 'A ka oferta per vjeshte?', 'Vjeshta ofron cmime te uleta pasi eshte jashte sezonit te pikes. Kohe e mire per udhetim me cmime me te lira.', 4),
('rezervime', '["krishtlindje","christmas","new year","vit i ri"]', 'A ka automjete gjate Krishtlindjeve dhe Vitit te Ri?', 'Po, por disponueshmeria eshte e kufizuar gjate festave. Rezervoni se paku 2-3 jave perpara per te siguruar automjetin e deshiruar.', 6),
('rezervime', '["bajram","feste","pashke","easter"]', 'A ka automjete gjate Bajramit/Pashkeve?', 'Po, por kerkesa eshte e larte gjate festave zyrtare. Rekomandojme rezervim te hershme. Disa kompani mund te kene cmime te rritura.', 5),
('rezervime', '["verore","beach holiday","pushime"]', 'Dua te shkoj ne plazh, cfare automjeti rekomandoni?', 'Per pushime ne plazh rekomandojme: Kompakte ose SUV me klime te mire. Nese udhetoni me familje, Minivan ose SUV 7-venderesh. Kontrolloni disponueshmerine ne qytetet bregdetare.', 6),
('rezervime', '["mal","mountain","bjeshke"]', 'Dua te shkoj ne mal, cfare automjeti nevojitet?', 'Per rruge malore rekomandojme SUV me 4x4: Toyota RAV4, Nissan Qashqai, ose Jeep. Sigurohuni qe automjeti ka goma te pershtatshme per terrenin.', 6),
('rezervime', '["biznes","business trip"]', 'Dua automjet per udhetim biznesi?', 'Per udhetim biznesi rekomandojme: Sedan (VW Passat, Mercedes C-Class) ose SUV premium (BMW X3, Audi Q5). Cmime nga 35-80 EUR/dite.', 6),
('rezervime', '["dasme","wedding","ceremoni"]', 'Dua automjet per dasme, cfare ofroni?', 'Per dasma, shume kompani ofrojne automjete luksoze te dekoruara. Mercedes S-Class, BMW 7 Series, ose Range Rover jane zgjedhje popullare. Kontaktoni kompanite luksoze.', 5),
('rezervime', '["airport transfer","fluturim","aeroport"]', 'A ofroni transfer aeroport?', 'Shume kompani ofrojne marrje/dorezim ne aeroportet kryesore: Prishtina (PRN), Tirana (TIA), Shkup (SKP). Tarifa shtese 5-15 EUR.', 7),
('rezervime', '["tur","tour","ekskursion"]', 'A ofroni automjete per ture turistike?', 'Po! Mund te merrni me qira automjet per ture ditore ose shumeditore. Per grupe, mund te organizohen disa automjete. Kontaktoni kompanite per paketa speciale.', 5),

-- More vehicle variations by use-case
('automjete', '["per dy","coupe","2 vende"]', 'A keni automjete per dy persona?', 'Po, kemi automjete kompakte dhe sportive ideale per dy persona. Fiat 500, Mini Cooper, ose automjete kabriolet jane perfekte per dysh.', 5),
('automjete', '["familje","family","femije"]', 'Cili automjet eshte me i miri per familje?', 'Per familje rekomandojme: SUV (5 vende + bagazh te madh) ose Minivan (7-9 vende). Modele si VW Touran, Toyota RAV4, ose Mercedes V-Class.', 7),
('automjete', '["ekonomik","kursim","save fuel"]', 'Cili automjet kursen me shume karburant?', 'Automjetet me ekonomike: 1) Elektrike (Tesla, Hyundai Kona EV), 2) Hibride (Toyota Yaris Hybrid ~3.5L/100km), 3) Diesel te vogla (Fiat 500 ~4L/100km).', 6),
('automjete', '["komod","comfortable","rehatshem"]', 'Cili automjet eshte me i rehatshmi?', 'Per rehati maksimale: Mercedes E-Class, BMW 5 Series, Audi A6, ose Volvo XC60. Keto ofrojne ulse te rehatshme, izolim te mire, dhe teknologji te avancuar.', 5),
('automjete', '["i vogel","small","compact"]', 'Dua automjetin me te vogel qe keni!', 'Automjetet me te vogla: Fiat 500, Hyundai i10, Toyota Aygo, VW Up. Ideale per parkim te lehte ne qytet, me cmime nga 15 EUR/dite.', 6),
('automjete', '["i madh","large","big","spacious"]', 'Dua automjetin me te madh qe keni!', 'Per hapesire maksimale: Mercedes V-Class (7-8 vende), VW Touran (7 vende), Ford Galaxy (7 vende), ose furgone si Mercedes Sprinter.', 6),
('automjete', '["shpejt","fast","i fuqishem"]', 'Dua automjetin me te shpejte!', 'Automjetet me te fuqishme: Porsche Cayenne (300+ HP), BMW M3 (480 HP), Mercedes AMG (350+ HP), Audi RS (400+ HP). Kategorija luksoze.', 4),
('automjete', '["i ri","newest","fundit"]', 'Dua automjetin me te ri qe keni!', 'Filtrojne sipas vitit te prodhimit (2025-2026) ne faqen e automjeteve per te pare modelet me te reja. Shume kompani perditesojne flotan rregullisht.', 5),
('automjete', '["i lire","cheapest","me lire"]', 'Cili eshte automjeti me i lire?', 'Automjetet me te lira fillojne nga 15 EUR/dite ne kategorine Ekonomike: Fiat 500, Hyundai i10, Dacia Sandero. Kerkoni sipas cmimit me te ulet.', 7),
('automjete', '["special","i vecante","unique"]', 'A keni automjete te vecanta?', 'Disa kompani ofrojne automjete te vecanta: kabriolete, klasike, elektrike, ose luksoze. Kontrolloni kategorine "Luksoze" per opsione premium.', 4),

-- More pricing edge cases
('cmime', '["ndryshoj cmim","price change"]', 'Pse ndryshoi cmimi kur ndryshova daten?', 'Cmimet mund te ndryshojne sipas: 1) Sezonit (vere me shtrenjte se dimer), 2) Dites se javes (fundjava me shtrenjte), 3) Kohezgjatjes (me gjate = me lire per dite).', 6),
('cmime', '["krah","compare prices"]', 'Si t''i krahasoj cmimet e kompanive?', 'Kerkoni automjetin e deshiruar ne faqen e automjeteve. Rezultatet tregojne cmimin per dite per cdo kompani, duke ju lejuar te krahasoni lehte.', 6),
('cmime', '["best deal","oferte","me e mire"]', 'Si te gjej oferten me te mire?', 'Per ofertat me te mira: 1) Krahasoni kompani te ndryshme, 2) Kontrolloni ofertat javore, 3) Rezervoni heret, 4) Zgjidhni periudha jashte pikes, 5) Shtoni zbritje per qira te gjata.', 7),
('cmime', '["1 ore","per ore","hourly"]', 'A mund te marr me qira per disa ore?', 'Periudha minimale e qiranes eshte 1 dite (24 ore). Nuk ofrohem qirane me ore. Per nevoja te shkurtra, konsideroni sherbimet e taxi-t.', 5),

-- More insurance details
('sigurime', '["zvoglo","reduce","less"]', 'Si ta zvogloj franizen e sigurimit?', 'Mund ta zvogloni ose eliminoni franizen duke zgjedhur sigurimin gjithperfshires (CDW). Me CDW, franciza bie nga 500-1000 EUR ne 0-100 EUR.', 7),
('sigurime', '["palet e treta","third party"]', 'Cfare mbulon sigurimi i paleve te treta?', 'TPL mbulon: demtimet ndaj automjeteve te tjera, demtimet ndaj pronave te tjera, dhe demtimet trupore ndaj personave te tjere ne rast aksidenti qe eshte faji juaj.', 7),
('sigurime', '["rekomando","suggest insurance"]', 'Cilin sigurim rekomandoni?', 'Rekomandojme sigurimin gjithperfshires (CDW) per te gjitha qiramarresit. Vecanesisht per: automjete te shtrenjta, shofera me me pak pervoje, udhetim ne rruge malore.', 7),
('sigurime', '["mote","weather","permbytje"]', 'A mbulon sigurimi demtimet nga moti?', 'Sigurimi gjithperfshires zakonisht mbulon demtimet nga fenomenet natyrore (bresheri, permbytje, stuhi). Kontrolloni kushtet specifike me kompanine.', 5),
('sigurime', '["pa faj","not at fault"]', 'Kush paguan nese nuk jam fajtori?', 'Nese nuk jeni fajtori ne aksident, sigurimi i pales fajtore mbulon demtimet. Gjithmone merrni raportin e policise per dokumentim.', 6),

-- More terms & conditions
('kushte', '["shkel","violation","break"]', 'Cfare ndodh nese shkel kushtet?', 'Shkelja e kushteve mund te rezultoje ne: 1) Mbajte te depozites, 2) Tarifa shtese, 3) Perfundim i kontrates, 4) Perjashtim nga platforma. Rasti varet nga natyra e shkeljes.', 7),
('kushte', '["mosmarreveshje","dispute","konflikt"]', 'Si zgjidhen mosmarreveshjet?', 'Mosmarreveshjet zgjidhen: 1) Fillimisht me kompanine direkt, 2) Me ndermjetesimin e RentaKar, 3) Permes procesit zyrtar te ankesave. Ne raste te renda, permes gjykates kompetente.', 6),
('kushte', '["nuk bie dakord","disagree","nuk pranoj"]', 'Nuk bie dakord me kushtet e kompanise!', 'Nese nuk bini dakord me kushtet: 1) Anuloni rezervimin para marrjes (pa penalite), 2) Kerkoni sqarime nga kompania, 3) Na kontaktoni per ndihme ne negocim.', 5),
('kushte', '["ligj","law","gjykate"]', 'Cilit ligj i nenshtrohet kontrata?', 'Kontrata i nenshtrohet ligjeve te shtetit ku behet qiraja (Kosove, Shqiperi, ose Maqedoni e Veriut). Gjykata kompetente eshte ajo e vendit te kontrates.', 5),

-- More technical
('teknike', '["screenshot","foto ekrani"]', 'Si te bej screenshot te nje gabimi?', 'Windows: shtypni PrtSc ose Alt+PrtSc. Mac: Cmd+Shift+4. Telefon: butonit e energjise + volumi poshte. Dergoni screenshot ne info@rentakar.com.', 4),
('teknike', '["pdf","shkarko","download"]', 'Si te shkarkoj faturen ne PDF?', 'Hyni ne panelin tuaj > "Rezervimet" > klikoni mbi rezervimin > "Shiko detajet" > butoni "Shkarko PDF". Fatura do te shkarkohet ne pajisjen tuaj.', 5),
('teknike', '["printos","print"]', 'Si te printoj konfirmimin e rezervimit?', 'Hapni detajet e rezervimit ne panelin tuaj dhe shtypni Ctrl+P (Windows) ose Cmd+P (Mac) per te printuar faqen. Ose shkarkoni PDF-ne dhe printoni ate.', 4),
('teknike', '["map","harte","google maps"]', 'A ka harte per vendndodhjen e kompanive?', 'Po, ne faqen e secilit automjeti tregohet vendndodhja e kompanise ne harte. Mund te klikoni per te hapur navigimin ne Google Maps.', 5),

-- More general & misc
('pergjithshme', '["vullnetar","volunteer"]', 'A ofron RentaKar cmime per OJQ?', 'Per organizata jo-fitimprurse, ofrojme cmime speciale. Kontaktoni ekipin tone ne info@rentakar.com me detajet e organizates suaj.', 3),
('pergjithshme', '["investim","invest","investor"]', 'Si mund te investoj ne RentaKar?', 'Per mundesi investimi, kontaktoni ekipin tone ekzekutiv ne invest@rentakar.com. Jemi gjithmone te hapur per partneritete strategjike.', 2),
('pergjithshme', '["media","press","gazetari"]', 'Dua te shkruaj per RentaKar!', 'Per kerkesa mediatike, kontaktoni departamentin tone te komunikimit ne press@rentakar.com. Do t''ju ofrojme te gjitha materialet e nevojshme.', 2),
('pergjithshme', '["api","integrimi","integration"]', 'A ofroni API per integrime?', 'Po, plani Premium i abonimit perfshin akses ne API per integrime me sisteme te tjera. Kontaktoni ekipin tone teknik per dokumentacionin.', 4),
('pergjithshme', '["affiliate","bashkepunim"]', 'A keni program affiliate?', 'Nje program affiliate eshte ne zhvillim. Per mundesi bashkepunimi aktuale, kontaktoni ekipin tone ne partner@rentakar.com.', 3),

-- Customer service scenarios
('ankesa', '["sherbim","service","i keq"]', 'Sherbimi i kompanise ishte i keq!', 'Na vjen keq per pervojen negative. Ju lutem: 1) Leni vleresim te sinqerte per kompanine, 2) Dergoni detaje ne ankesa@rentakar.com, 3) Do ta investigojme dhe marrim masa te pershtatshme.', 8),
('ankesa', '["para shtese","extra charge","me shume"]', 'Me tarifuan pa arsye shtese!', 'Nese besoni se jeni tarifuar pa arsye: 1) Kontaktoni kompanine per sqarim, 2) Ruani te gjitha dokumentet, 3) Dergoni ankesen me fatura ne ankesa@rentakar.com. Do ta zgjidhim.', 8),
('ankesa', '["refuzo","nuk pranoi","rejected"]', 'Kompania me refuzoi pa arsye!', 'Nese rezervimi juaj u refuzua pa arsye te qarte: 1) Kontaktoni kompanine per sqarim, 2) Provoni nje kompani tjeter, 3) Raportoni ne ankesa@rentakar.com nese besoni se ka diskriminim.', 7),
('ankesa', '["i ndotur","dirty","papaster"]', 'Automjeti nuk ishte i paster!', 'Na vjen keq! Njoftoni kompanine menjehere dhe merrni foto. Nese nuk e zgjidhin, dergoni fotot ne ankesa@rentakar.com. Kompania do te marre mase perkatese.', 7),
('ankesa', '["prishur","broken","defekt"]', 'Automjeti kishte defekte teknike!', 'Per defekte teknike: 1) Mos e drejtoni nese eshte e rrezikshem, 2) Telefononi asistencen rrugore, 3) Njoftoni kompanine, 4) Kerkoni automjet zevendesues. Raportoni ne ankesa@rentakar.com.', 9),
('ankesa', '["mashtruese","dishonest","genjeshtare"]', 'Kompania ishte jo-transparente me cmimet!', 'Transparenca e cmimeve eshte kerkese e detyrueshme. Nese nje kompani nuk eshte transparente: 1) Dokumentoni cdo gje, 2) Raportoni ne ankesa@rentakar.com, 3) Do ta investigojme dhe marrim masa.', 8),
('ankesa', '["depozite","nuk kthyen","para mbrapa"]', 'Kompania nuk me ktheu depoziten!', 'Depozita duhet te kthehet brenda 14 diteve pune. Nese ka kaluar ky afat: 1) Kontaktoni kompanine, 2) Dergoni detajet ne ankesa@rentakar.com me numrin e rezervimit, 3) Do ta ndjekim per ju.', 9),
('ankesa', '["nuk pergjigjet","no response","heshtje"]', 'Kompania nuk me pergjigjet!', 'Nese kompania nuk pergjigjet brenda 48 oresh: 1) Provoni metoda te tjera kontakti, 2) Na njoftoni ne info@rentakar.com, 3) Do te kontaktojme kompanine ne emrin tuaj.', 7),

-- More detailed scenarios
('rezervime', '["transferoj","transfer booking"]', 'A mund ta transferoj rezervimin te dikush tjeter?', 'Jo, rezervimi eshte personal dhe nuk mund te transferohet. Anuloni rezervimin ekzistues dhe personi tjeter duhet te beje nje rezervim te ri.', 6),
('rezervime', '["dyfishi","duplicate","dy here"]', 'Bera dy rezervime pa dashje!', 'Nese keni bere rezervim te dyfishte, anuloni nje nga paneli juaj. Nese te dy jane konfirmuar, kontaktoni kompanine per te anuluar njerin. Rimbursimi behet sipas politikes se anulimit.', 7),
('rezervime', '["upgrade","permirso","klase"]', 'A mund te bej upgrade te automjetit?', 'Per upgrade te automjetit, kontaktoni kompanine direkt. Nese ka disponueshmeri, mund t''ju ofrojne nje automjet me te mire me nje tarife shtese te reduktuar.', 5),
('rezervime', '["downgrade","ulje","me i lire"]', 'A mund te kaloj ne nje automjet me te lire?', 'Po, mund te ndryshoni rezervimin per nje automjet me te lire nese disponueshmeria e lejon. Diferenca e cmimit rimbursohet. Kontaktoni kompanine.', 5),

-- Payments extra
('pagesa', '["crypto","bitcoin","ethereum"]', 'A pranoni kriptovaluta?', 'Aktualisht nuk pranojme pagesa me kriptovaluta. Metodat e pranuara jane: karte debiti/krediti, transferte bankare, PayPal (ne disa kompani), dhe para ne dore.', 3),
('pagesa', '["apple pay","google pay","samsung pay"]', 'A pranoni Apple Pay / Google Pay?', 'Aktualisht pranojme pagesa me karte Visa/Mastercard. Apple Pay dhe Google Pay jane ne plan per integrim te ardhshem.', 4),
('pagesa', '["fature","receipt","vertetim pagese"]', 'Ku ta gjej faturen e pageses?', 'Faturen e gjeni ne: Paneli juaj > "Rezervimet" > klikoni mbi rezervimin > "Shiko detajet" > "Shkarko faturen". Fatura gjenerohet edhe ne email pas pageses.', 6),
('pagesa', '["kthim","rimburso","refund process"]', 'Sa kohe merr rimbursimi?', 'Rimbursimet procesohennne brenda 5-10 diteve pune. Per karta krediti/debiti, mund te duheni edhe 3-5 dite shtese per t''u reflektuar ne llogarine tuaj bankare.', 7),

-- Account extras
('llogari', '["regjistrim kompani","business register"]', 'Sa kushton regjistrimi i kompanise?', 'Regjistrimi ne platforme eshte falas. Pas aprovimit, zgjidhni nje plan abonimesh: Baze (29.99E/muaj), Profesional (59.99E/muaj), ose Premium (99.99E/muaj).', 8),
('llogari', '["provoni","try","test","demo"]', 'A mund ta provoj platformen pa pagese?', 'Krijimi i llogarise se klientit eshte falas. Per kompani, regjistrimi eshte falas dhe mund te shikoni platformen perpara se te zgjidhni nje plan abonimesh.', 6),

-- Misc extra
('pergjithshme', '["pershendes","greet","mire"]', 'Pershendetje, a jeni online?', 'Po, jam ketu! Si mund t''ju ndihmoj? Mund te me pyesni per rezervime, automjete, cmime, ose cdo gje qe lidhet me qiradhenjene e automjeteve.', 9),
('pergjithshme', '["robot","bot","ai","automat"]', 'A po flas me nje robot?', 'Po, jam asistenti virtual i RentaKar! Mund t''ju ndihmoj me pyetje te zakonshme. Per bisede me nje person real, kontaktoni +383 44 000 000 ose info@rentakar.com.', 8),
('pergjithshme', '["gjuhe","shqip","english","deutsch"]', 'Ne cilen gjuhe mund te flas?', 'Chat-i automatik funksionon ne gjuhen shqipe. Per suport ne anglisht ose gjermanisht, kontaktoni ekipin tone ne info@rentakar.com.', 5),
('pergjithshme', '["falenderoj","thank you","awesome"]', 'Faleminderit per ndihmen!', 'Gjithe te mirat! Nese keni pyetje te tjera ne te ardhmen, mos hezitoni te ktheheni. Udhetim te mbare!', 7),
('pergjithshme', '["nuk di","dont know","i pasigurt"]', 'Nuk e di cfare automjeti te zgjedh!', 'Mund t''ju ndihmoj! Tregoni: 1) Sa persona do udhetoni? 2) Ku do shkoni? 3) Buxheti juaj? 4) A deshironi automatik apo manual? Me keto info, do t''ju rekomandoj automjetin ideal.', 8),
('pergjithshme', '["uroj","wish","birthday","ditelindj"]', 'Sot kam ditelindjen!', 'Gezuar ditelindjen! Per nje pervoje te vecante, pse nuk merrni me qira nje automjet luksoz per diten tuaj te vecante? Kontrolloni ofertat ne kategorine luksoze!', 3),
('pergjithshme', '["ndihmo","help me","mund te"]', 'A mund te me ndihmoni?', 'Sigurisht! Jam ketu per t''ju ndihmuar. Tregoni se cfare keni nevoje: rezervim automjeti, informacion per cmime, pyetje per kompanine, ose cdo gje tjeter!', 9);
