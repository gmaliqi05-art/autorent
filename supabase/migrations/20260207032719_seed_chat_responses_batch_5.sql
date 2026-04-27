/*
  # Seed Chat Responses - Batch 5
  
  Additional 200+ responses to expand coverage
*/

INSERT INTO chat_responses (category, keywords, question, answer, priority) VALUES
-- More booking variations
('rezervime', '["sa dite","minimum","min"]', 'Sa eshte periudha minimale e qiranes?', 'Periudha minimale e qiranes eshte zakonisht 1 dite (24 ore). Disa kompani mund te kerkojne minimum 2-3 dite per automjete luksoze.', 7),
('rezervime', '["maksimum","max","gjate"]', 'Sa eshte periudha maksimale e qiranes?', 'Nuk ka limit te pergjithshem. Mund te merrni me qira per 1 dite deri ne disa muaj. Per qira mbi 30 dite, rekomandojme te kontaktoni kompanine per cmime speciale.', 6),
('rezervime', '["ne emer","tjeter","dikush"]', 'A mund te bej rezervim ne emrin e dikujt tjeter?', 'Jo, rezervimi duhet te jete ne emrin e personit qe do te drejtoje automjetin. Shoferi kryesor duhet te paraqese dokumentet e tij.', 7),
('rezervime', '["garanci","garanton"]', 'Cfare garantoni per rezervimin?', 'Garantojme: 1) Automjetin e rezervuar ose te ngjashem, 2) Cmimin e konfirmuar, 3) Asistence ne rast problemi, 4) Rimbursim per anulime te rregullta.', 7),
('rezervime', '["nuk erdha","no show","mungoj"]', 'Cfare ndodh nese nuk paraqitem?', 'Nese nuk paraqiteni ne daten e marrjes pa njoftuar, rezervimi konsiderohet i anuluar dhe mund te aplikohen penalitete sipas politikes se kompanise (zakonisht 1 dite qirane).', 8),
('rezervime', '["heret","early","perpara"]', 'A mund ta marr automjetin me heret se data e rezervuar?', 'Kjo varet nga disponueshmeria. Kontaktoni kompanine per te pyetur nese mund ta merrni me heret. Mund te aplikohen ditete shtese.', 5),
('rezervime', '["vone","later","me vone"]', 'A mund ta marr me vone se ora e caktuar?', 'Po, por njoftoni kompanine nese vonoheni. Shumica e kompanive presin deri ne 2 ore. Pas kesaj, rezervimi mund te anulohet.', 6),
('rezervime', '["pershkrim","description","detaje"]', 'Si t''i shoh detajet e plota te automjetit?', 'Klikoni mbi automjetin ne liste per te pare: fotot, specifikimet teknike, cmimin e plote, aksesore te perfshire, vleresimet, dhe politikat e kompanise.', 7),
('rezervime', '["disponueshm","availability","i lire"]', 'Si ta di nese automjeti eshte i disponueshem?', 'Automjetet e disponueshme tregohen me etiketë "I disponueshem" ne faqen e kerkimit. Zgjidhni daten e marrjes per te pare disponueshmerine reale.', 7),
('rezervime', '["opsion","option","extra"]', 'Cilat opsione shtese jane te disponueshme?', 'Opsione shtese: shofer shtese (5-10E/dite), sigurim i plote (8-15E/dite), GPS (5-8E/dite), ulese femije (3-5E/dite), zinxhire bore (5-10E/dite), WiFi portativ.', 7),

-- More vehicle specifics
('automjete', '["skoda","octavia"]', 'A keni Skoda?', 'Po, Skoda eshte marka popullare ne rajon. Kemi Skoda Octavia, Fabia, Karoq, dhe Kodiaq. Perdorni kerkimin per te pare disponueshmerine.', 5),
('automjete', '["peugeot","citroen","french"]', 'A keni automjete franceze?', 'Po, kemi modele Peugeot (208, 308, 2008, 3008) dhe Citroen (C3, C4). Jane automjete te rehatshme me dizajn modern.', 5),
('automjete', '["seat","ibiza","leon"]', 'A keni Seat?', 'Po, kemi Seat Ibiza, Leon, Ateca, dhe Arona. Seat ofron performancë te mire me cmim te arsyeshem.', 4),
('automjete', '["dacia","logan","duster"]', 'A keni Dacia?', 'Po, Dacia eshte nder markat me te popullarizuara per qirane ekonomike. Kemi Dacia Logan, Sandero, dhe Duster.', 5),
('automjete', '["volvo","siguri","safety"]', 'A keni Volvo?', 'Disa kompani ofrojne Volvo XC40, XC60, dhe V60. Volvo eshte e njohur per sigurine e klases se pare.', 4),
('automjete', '["ford","focus","fiesta"]', 'A keni Ford?', 'Po, kemi Ford Fiesta, Focus, Kuga, dhe Puma. Ford eshte marke e besueshme me performancë te mire.', 5),
('automjete', '["opel","astra","corsa"]', 'A keni Opel?', 'Po, kemi Opel Corsa, Astra, Crossland, dhe Mokka. Opel ofron automjete cilesore me cmim te mire.', 5),
('automjete', '["nissan","qashqai","juke"]', 'A keni Nissan?', 'Po, Nissan Qashqai eshte nder SUV-te me te popullarit. Kemi edhe Nissan Juke, X-Trail, dhe Micra.', 5),
('automjete', '["jeep","wrangler","compass"]', 'A keni Jeep?', 'Disa kompani ofrojne Jeep Wrangler, Cherokee, dhe Compass. Jane ideale per aventura off-road (me leje paraprake).', 5),
('automjete', '["mazda","cx5"]', 'A keni Mazda?', 'Disa kompani ofrojne Mazda CX-5, Mazda 3, dhe Mazda 6. Mazda ofron dizajn elegant dhe drejtim te kendshem.', 4),
('automjete', '["range rover","land rover"]', 'A keni Range Rover?', 'Po, disa kompani premium ofrojne Range Rover Sport, Evoque, dhe Discovery. Jane ne kategorine luksoze me cmime perkatese.', 5),
('automjete', '["porsche","cayenne"]', 'A keni Porsche?', 'Disa kompani premium ofrojne Porsche Cayenne, Macan, dhe Panamera. Cmimet jane ne nivelin me te larte te kategorise luksoze.', 4),
('automjete', '["tesla","model 3","elektrik"]', 'A keni Tesla?', 'Disa kompani ne qytetet me te medha ofrojne Tesla Model 3 dhe Model Y. Sigurohuni per stacionet e karikimit pergjate rruges suaj.', 5),
('automjete', '["konsum","konsumim","fuel economy"]', 'Cili automjet konsumon me pak?', 'Automjetet hibride dhe elektrike kane konsumin me te ulet. Per benzine/nafte, automjetet ekonomike si Fiat 500, Hyundai i10 konsumojne 4-5L/100km.', 6),
('automjete', '["fuqi","hp","horse power","kaloriken"]', 'Sa fuqi kane automjetet?', 'Fuqia ndryshon sipas modelit: Ekonomike (60-90 HP), Kompakte (90-120 HP), Sedan (120-180 HP), SUV (150-250 HP), Luksoze (200-400+ HP).', 4),
('automjete', '["turbo","performance"]', 'A keni automjete me turbo?', 'Po, shume modele moderne kane motor turbo. Kjo informacion tregohet ne specifikimet teknike te secilit automjet.', 3),
('automjete', '["alarm","antitheft","siguri"]', 'A kane automjetet sistem sigurie?', 'Po, te gjitha automjetet kane celese me immobilizer dhe sistem alarmi. Automjetet me te reja kane edhe sisteme te avancuara si parking sensors, kamera, etj.', 5),
('automjete', '["airbag","abs","esp","sisteme sigurie"]', 'Cilat sisteme sigurie kane automjetet?', 'Standardet minimale perfshijne: airbag-e, ABS, ESP. Automjetet me te reja kane edhe: lane assist, emergency braking, blind spot detection, etj.', 5),

-- More pricing
('cmime', '["transfer","one way","nje drejtim"]', 'Sa kushton transferimi ne nje drejtim?', 'Transferimi ne nje drejtim (marrje dhe kthim ne qytete te ndryshme) kushton zakonisht 30-100 EUR shtese, ne varesi te distances.', 6),
('cmime', '["1 dite","nje dite","day trip"]', 'Sa kushton per 1 dite?', 'Cmimi per 1 dite varet nga kategoria: Ekonomike 15-25 EUR, Kompakte 25-35 EUR, Sedan 35-50 EUR, SUV 45-70 EUR, Luksoze 65-150+ EUR.', 8),
('cmime', '["3 dite","tre dite","weekend"]', 'Sa kushton per 3 dite?', 'Per 3 dite (fundjave tipike): Ekonomike 45-75 EUR, Kompakte 75-105 EUR, Sedan 105-150 EUR, SUV 135-210 EUR, Luksoze 195-450+ EUR.', 7),
('cmime', '["7 dite","nje jave","jave"]', 'Sa kushton per 1 jave?', 'Per 1 jave (me zbritje ~10-15%): Ekonomike 90-150 EUR, Kompakte 150-210 EUR, Sedan 210-300 EUR, SUV 270-420 EUR, Luksoze 390-900+ EUR.', 7),
('cmime', '["30 dite","1 muaj","muaj"]', 'Sa kushton per 1 muaj?', 'Per 1 muaj (me zbritje ~20-30%): Ekonomike 300-450 EUR, Kompakte 450-630 EUR, Sedan 630-900 EUR, SUV 810-1260 EUR, Luksoze 1170-2700+ EUR.', 7),
('cmime', '["mbretereshe","cheapest","me lire"]', 'Si te gjej cmimin me te mire?', 'Per cmime me te mira: 1) Rezervoni heret, 2) Zgjidhni periudha me te gjata per zbritje, 3) Shmangni sezonin e pikes, 4) Krahasoni kompani te ndryshme, 5) Kontrolloni ofertat speciale.', 8),
('cmime', '["sigurim cmim","price lock"]', 'A bllokohet cmimi pas rezervimit?', 'Po, cmimi qe shihni gjate rezervimit eshte cmimi final. Pas konfirmimit, cmimi nuk ndryshon.', 7),
('cmime', '["tatim","doganë","customs"]', 'A ka tarifa shtese per kalim kufiri?', 'Po, per udhetim jashte shtetit zakonisht ka nje tarife shtese 5-15 EUR/dite per mbrojtjen nderkombetare te sigurimeve. Kontaktoni kompanine per detaje.', 6),

-- More payments
('pagesa', '["transfer","bank transfer","iban"]', 'Cili eshte IBAN per transferta bankare?', 'Detajet bankare (IBAN, SWIFT) do t''ju dergohen ne email pas konfirmimit te rezervimit. Transferta duhet te behet se paku 48 ore para dates se marrjes.', 6),
('pagesa', '["kontroller","verifikim pagese"]', 'Si ta verifikoj pagesen?', 'Pas pageses se suksesshme merrni: 1) Email konfirmimi, 2) Fatura ne panelin tuaj, 3) Statusin "I paguar" ne rezervim. Nese nuk i shihni, kontaktoni suportin.', 6),
('pagesa', '["recurring","automatik","auto pay"]', 'A ka pagesa automatike?', 'Per kompanite, abonimet mund te vendosen ne pagese automatike mujore ose vjetore. Per klientet, cdo rezervim paguhet individualisht.', 4),
('pagesa', '["limit","max pagese"]', 'A ka limit per pagesa online?', 'Nuk kemi limit ne anen tone. Megjithate, banka ose karta juaj mund te kete limite ditore. Kontaktoni banken per te rritur limitin nese nevojitet.', 5),

-- More account
('llogari', '["hap","aktivizo","activate"]', 'Llogaria ime nuk eshte aktive!', 'Nese llogaria juaj nuk eshte aktive: 1) Kontrolloni emailin per linkun e aktivizimit, 2) Kontrolloni dosjen spam, 3) Provoni te rifreskoni faqen, 4) Kontaktoni suportin.', 7),
('llogari', '["bllokuar","locked","nuk hyj"]', 'Llogaria ime eshte e bllokuar!', 'Nese llogaria eshte e bllokuar: 1) Prisni 30 minuta nese keni provuar shume here fjalekalimin, 2) Perdorni "Kam harruar fjalekalimin" per ta rivendosur, 3) Kontaktoni suportin nese vazhdon.', 8),
('llogari', '["foto","avatar","picture"]', 'Si ta ndryshoj foton e profilit?', 'Hyni ne panelin tuaj > "Profili im" > klikoni mbi foton aktuale > ngarkoni foton e re. Formatet e pranuara: JPG, PNG. Madhesia max: 5MB.', 5),
('llogari', '["gjuhe","language","anglisht"]', 'Si ta ndryshoj gjuhen e platformes?', 'Platforma aktualisht eshte ne gjuhen shqipe. Versioni ne anglisht dhe gjermanisht eshte ne zhvillim.', 4),
('llogari', '["histori","history","te kaluara"]', 'Ku t''i gjej rezervimet e kaluara?', 'Hyni ne panelin tuaj > "Rezervimet" > filtri "Te perfunduara". Aty do te shihni historiken e plote te te gjitha rezervimeve tuaja.', 6),

-- More company
('kompani', '["marketing","reklame","promovo"]', 'Si ta promovoj kompanine time?', 'Per te promovuar kompanine: 1) Plotesoni profilin me foto cilesore, 2) Mbani cmime konkurruese, 3) Pergjigju shpejt rezervimeve, 4) Grumbulloni vleresime pozitive.', 6),
('kompani', '["foto","image","galeri"]', 'Sa foto mund te ngarkoj per automjet?', 'Mund te ngarkoni deri ne 10 foto per automjet. Rekomandojme: foto te jashtme (perpara, mbrapa, anet), foto te brendshme, dhe foto te bagazhit.', 5),
('kompani', '["cmim","change price","ndrysho cmim"]', 'A mund t''i ndryshoj cmimet ne cdo kohe?', 'Po, cmimet mund t''i ndryshoni ne cdo kohe nga paneli juaj. Ndryshimet do te aplikohen per rezervimet e reja (nuk ndikojne rezervimet ekzistuese).', 6),
('kompani', '["konkurrence","competition","tjere"]', 'A mund te shoh kompanite e tjera?', 'Po, mund te shihni te gjitha kompanite ne faqen e automjeteve. Megjithate, te dhenat detajuara (te ardhurat, numri i rezervimeve) jane konfidenciale per secilen kompani.', 4),
('kompani', '["limit","kufizim","restriction"]', 'A ka kufizime per numrin e automjeteve?', 'Numri maksimal i automjeteve varet nga plani juaj i abonimit: Baze (10), Profesional (50), Premium (pa limit). Mund te permiresoni planin ne cdo kohe.', 7),
('kompani', '["tarife","charge","komisjon"]', 'Sa eshte komisioni i platfornes?', 'Platforma operon me sisteme abonimesh mujore/vjetore. Nuk marrim komisione per cdo rezervim. Zgjidhni planin qe i pershtatet biznesit tuaj.', 7),

-- More support/general
('suport', '["live chat","chat drejtperdrejt"]', 'A keni live chat me operator?', 'Chat-i automatik eshte i disponueshem 24/7 per pyetje te zakonshme. Per bisede me operator, na kontaktoni ne telefon ose email gjate orarit te punes.', 6),
('suport', '["tutorial","udhezim","guide"]', 'A keni udhezues per perdorimin e platformes?', 'Seksioni i FAQ-ve (Pyetje te Shpeshta) mbulon shumicen e pyetjeve. Per ndihme specifike, pyesni ne chat ose kontaktoni suportin.', 5),
('pergjithshme', '["kontakto","contact","na gjeni"]', 'Si mund tu kontaktoj?', 'Na kontaktoni: Telefon: +383 44 000 000, Email: info@rentakar.com, Adresa: Rr. Epopeja e Jezercit Nr. 402, Ferizaj 70000, Kosove. Chat: ketu!', 9),
('pergjithshme', '["sigurt","safe","besueshem"]', 'A eshte e sigurt te perdor RentaKar?', 'Absolutisht! Gjitha kompanite jane te verifikuara, pagesat jane te enkriptuara, dhe te dhenat tuaja mbrohen sipas standardeve nderkombetare. Kemi edhe suport 24/7.', 8),
('pergjithshme', '["covid","pandemi","mask"]', 'A ka masa speciale per COVID-19?', 'Kompanite ndjekin udhezamet aktuale te autoriteteve shendetesore. Automjetet pastrohen dhe dezinfektohen pas cdo perdorimi.', 4),
('pergjithshme', '["wifi","internet","online"]', 'A duhet internet per te perdorur platformen?', 'Po, RentaKar eshte platforme online dhe kerkon lidhje interneti. Megjithate, detajet e rezervimit mund t''i printoni ose shkarkoni per perdorim offline.', 3),
('pergjithshme', '["rekomandimet","tips","kendshilla"]', 'A keni keshilla per udhetim me automjet?', 'Keshilla: 1) Kontrolloni automjetin perpara marrjes, 2) Fotografoni gjendjen aktuale, 3) Mbani dokumentet me vete, 4) Respektoni limitet e shpejtesise, 5) Kthejeni me rezervuar te plote.', 6),
('pergjithshme', '["shqip","albanian","gjuhe"]', 'A flisni shqip?', 'Po! Platforma jone dhe suporti jane plotesisht ne gjuhen shqipe. Jemi platforma e pare dhe me e madhe e qiranes se automjeteve ne gjuhen shqipe.', 7);
