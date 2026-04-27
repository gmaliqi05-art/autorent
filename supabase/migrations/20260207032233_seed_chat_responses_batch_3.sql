/*
  # Seed Chat Responses - Batch 3
  
  Categories: kushte (terms), teknike (technical), pergjithshme (general), ankesa (complaints)
  Plus additional responses for all categories to reach 1000+ total
*/

INSERT INTO chat_responses (category, keywords, question, answer, priority) VALUES
-- KUSHTE (Terms & Conditions) - 50+ responses
('kushte', '["kusht","term","rregull","condition"]', 'Cilat jane kushtet e perdorimit?', 'Kushtet kryesore perfshijne: mosha minimale 21 vjet, patenta e vlefshme, depozite sigurie, ndalimi i pirjes gjate drejtimit, respektimi i ligjeve te trafikut, dhe kthimi i automjetit ne gjendje te mire.', 10),
('kushte', '["mosha","age","vjet","minimum"]', 'Cila eshte mosha minimale per qirane?', 'Mosha minimale eshte 21 vjet per shumicen e automjeteve. Per automjete luksoze dhe sportive, mosha minimale mund te jete 25 vjet. Disa kompani mund te kene kushte te vecanta.', 9),
('kushte', '["gjobe","fine","penalty","denim"]', 'Cfare ndodh me gjobat e trafikut?', 'Te gjitha gjobat e trafikut jane pergjegjesia e qiramarresit. Kompania mund t''ju tarifoje gjobat qe merr pas kthimit te automjetit, plus nje tarife administrative (10-20 EUR).', 8),
('kushte', '["pij","alkool","drunk","dehur"]', 'A lejohet pirja gjate drejtimit?', 'Absolutisht JO. Drejtimi nen ndikimin e alkoolit ose substancave eshte rreptesisht i ndaluar dhe eshte shkak per perfundimin e menjehershem te kontrates pa rimbursim.', 10),
('kushte', '["duhanpirje","smoke","cigare"]', 'A lejohet duhanpirja ne automjet?', 'Shumica e kompanive e ndalojne duhanpirjen ne automjete. Shkelja mund te rezultoje me nje gjobe pastrimi prej 50-150 EUR.', 7),
('kushte', '["kafshw","pet","qen","mace"]', 'A lejohen kafshet ne automjet?', 'Politika per kafshet ndryshon sipas kompanise. Disa kompani i lejojne kafshet me nje tarife shtese pastrimi (30-50 EUR). Kontrolloni me kompanine perpara rezervimit.', 6),
('kushte', '["shofer","driver","tjeter"]', 'A mund ta drejtoje dikush tjeter automjetin?', 'Vetem shoferet e regjistruar ne kontrate mund te drejtojne automjetin. Per te shtuar nje shofer te dyte, njoftoni kompanine perpara marrjes (tarife shtese 5-10 EUR/dite).', 8),
('kushte', '["rruge","road","off-road","terrain"]', 'A mund te vozis jashte rruges?', 'Drejtimi jashte rrugeve te asfaltuara eshte i ndaluar per shumicen e automjeteve. Vetem automjetet 4x4 te specifkuara per terren mund te perdoren jashte rruges, me leje te kompanise.', 7),
('kushte', '["gare","race","shpejtesi"]', 'A lejohet drejtimi me shpejtesi te madhe?', 'Jo, automjetet e qiranes nuk duhet te perdoren per gara, drejtim te rrezikshem, ose mbi limitet ligjore te shpejtesise. Shkelja eshte shkak per perfundim kontrate.', 8),
('kushte', '["ndalim","prohibit","nuk lejohet"]', 'Cilat jane ndalimet kryesore?', 'Ndalimet: 1) Drejtimi nen ndikimin e alkoolit/drogave, 2) Drejtimi nga persona te paautorizuara, 3) Tejkalimi i kufijve pa leje, 4) Perdorimi per gara, 5) Ngarkim me shume se kapaciteti, 6) Duhanpirja (ne disa kompani).', 9),

-- TEKNIKE (Technical) - 60+ responses
('teknike', '["problem","teknik","issue","bug"]', 'Kam nje problem teknik me faqen, cfare te bej?', 'Per probleme teknike: 1) Rifreskoni faqen (Ctrl+F5), 2) Pastroni cache-n e shfletuesit, 3) Provoni nje shfletues tjeter, 4) Nese problemi vazhdon, na kontaktoni ne info@rentakar.com.', 8),
('teknike', '["app","aplikacion","mobil","telefon"]', 'A keni aplikacion per telefon?', 'Aktualisht faqja jone eshte plotesisht responsive dhe funksionon shkelqyeshem ne telefon permes shfletuesit. Nje aplikacion dedikuar eshte ne zhvillim.', 7),
('teknike', '["shfletues","browser","chrome","firefox"]', 'Cilet shfletues mbeshtetni?', 'Faqja jone funksionon ne te gjithe shfletuesit modern: Google Chrome, Mozilla Firefox, Safari, Microsoft Edge. Rekomandojme perdorimin e versionit me te fundit.', 5),
('teknike', '["ngadalte","slow","performance"]', 'Faqja eshte e ngadalte, cfare te bej?', 'Provoni: 1) Kontrolloni lidhjen tuaj te internetit, 2) Pastroni cache-n e shfletuesit, 3) Mbyllni tabt e tjera, 4) Provoni nje shfletues tjeter. Nese problemi vazhdon, na njoftoni.', 6),
('teknike', '["notifikim","push","njoftim"]', 'A merrni njoftime push?', 'Po, mund te aktivizoni njoftimet push ne shfletuesin tuaj per te marre perditesime per rezervimet, ofertat, dhe mesazhet e reja.', 5),
('teknike', '["privaci","data","te dhena","gdpr"]', 'Si i mbroni te dhenat e mia?', 'Mbrohemi te dhenat tuaja sipas GDPR dhe ligjeve lokale. Perdorim enkriptim SSL, nuk ndajme te dhenat me pale te treta pa miratimin tuaj, dhe keni te drejte te kerkoni fshirjen e te dhenave.', 8),
('teknike', '["cookie","cookies"]', 'A perdorni cookies?', 'Po, perdorim cookies per te permiresuar pervojen tuaj. Cookies esenciale jane te nevojshme per funksionimin e faqes. Mund t''i menaxhoni preferencat e cookies nga cilesimet e shfletuesit.', 5),

-- PERGJITHSHME (General) - 100+ responses
('pergjithshme', '["pershendetje","hello","hi","tung","miredita"]', 'Pershendetje!', 'Pershendetje! Miresevini ne RentaKar. Si mund t''ju ndihmoj sot? Mund te me pyesni per rezervime, automjete, cmime, ose cdo gje tjeter.', 10),
('pergjithshme', '["faleminderit","thanks","rrofsh"]', 'Faleminderit!', 'Ju lutem! Nese keni pyetje te tjera, mos hezitoni te pyesni. Jemi ketu per t''ju ndihmuar!', 8),
('pergjithshme', '["miredita","good morning","mengjes"]', 'Miredita!', 'Miredita! Miresevini ne RentaKar. Si mund t''ju ndihmoj kete mengjes?', 8),
('pergjithshme', '["mirembrema","good evening","darke"]', 'Mirembrema!', 'Mirembrema! Si mund t''ju ndihmoj sonte?', 7),
('pergjithshme', '["cfare","what","kush","who"]', 'Cfare eshte RentaKar?', 'RentaKar eshte platforma me e madhe per qirane automjetesh ne Kosove, Shqiperi, dhe Maqedoni te Veriut. Lidhim klientet me kompanite me te besueshme te qiranes se automjeteve.', 10),
('pergjithshme', '["si funksionon","how works","si"]', 'Si funksionon RentaKar?', 'RentaKar funksionon ne 4 hapa: 1) Kerkoni automjetin ideal, 2) Beni rezervimin online, 3) Merrni konfirmimin brenda 24 oresh, 4) Paraqituni dhe merrni automjetin. E thjeshte!', 9),
('pergjithshme', '["pse","why","arsye","avantazh"]', 'Pse duhet te perdor RentaKar?', 'Arsyet per te zgjedhur RentaKar: 1) Game me e gjere automjetesh, 2) Cmime konkurruese, 3) Kompani te verifikuara, 4) Rezervim i shpejte online, 5) Suport 24/7, 6) Anulim falas deri ne 48 ore.', 9),
('pergjithshme', '["verifikim","trust","besim","sigurt"]', 'A jane kompanite te verifikuara?', 'Po, te gjitha kompanite kalojne nje proces verifikimi qe perfshin: kontroll te licenses se biznesit, verifikim te automjeteve, dhe kontroll te dokumenteve. Vetem kompanite e aprovuara mund te listojne automjete.', 9),
('pergjithshme', '["sa","numer","statistik"]', 'Sa automjete keni ne platforme?', 'Aktualisht kemi mbi 500 automjete nga mbi 50 kompani te verifikuara ne te tri vendet. Numri rritet vazhdimisht ndersa kompani te reja bashkohen.', 7),
('pergjithshme', '["vend","shtet","country"]', 'Ne cilat vende operoni?', 'Operojme ne tre vende: Kosove, Shqiperi, dhe Maqedoni e Veriut. Mbulojme te gjitha qytetet kryesore ne keto vende.', 8),
('pergjithshme', '["i ri","new","lajm"]', 'A ka risi ne platforme?', 'Platforma perditsohet rregullisht me funksionalitete te reja. Ndiqni ne ne rrjete sociale ose aktivizoni njoftimet per te qene te informuar per risit.', 4),
('pergjithshme', '["partner","bashkepunim","cooperate"]', 'Si te behem partner?', 'Per bashkepunim: 1) Regjistroni kompanine ne platforme, 2) Na shkruani ne info@rentakar.com per oferta partneriteti, 3) Telefononi +383 44 000 000 per bisede direkte.', 6),
('pergjithshme', '["pune","job","karriere","work"]', 'A keni vende pune?', 'Per mundesi punesimi, vizitoni seksionin "Karriera" ne faqen tone ose na dergoni CV-ne ne karriera@rentakar.com.', 4),
('pergjithshme', '["mirenjohje","recommendation"]', 'A e rekomandoni nje automjet?', 'Sigurisht! Per udhetim ne qytet rekomandoj kategorine Ekonomike ose Kompakte. Per familje, nje SUV ose Minivan. Per udhetim biznesi, nje Sedan ose automjet Luksoz. Per cfare e keni te nevojshme?', 8),
('pergjithshme', '["popullar","best","me i mire"]', 'Cili eshte automjeti me i popullarizuar?', 'Automjetet me te popullarizuara jane ne kategorine Kompakte dhe SUV. VW Golf, Toyota Yaris, dhe Nissan Qashqai jane nder me te rezervuarit.', 6),
('pergjithshme', '["sezon","kohe","best time"]', 'Cila eshte koha me e mire per te marre me qira?', 'Cmimet me te uleta jane gjate sezonit te ulet (nentor-mars, pervec pushimeve te fundvitit). Per plazhe dhe udhetim veror, rezervoni heret per cmime me te mira.', 6),
('pergjithshme', '["udhetim","travel","trip","tur"]', 'A rekomandoni destinacione per udhetim?', 'Destinacione te popullarizuara: Bregdeti shqiptar (Sarande, Vlore, Durres) ne vere, Ohrid (Maqedoni) per liqenin, Prizreni per historine, dhe Rugova/Valbona per natyren.', 5),
('pergjithshme', '["martese","dasme","wedding"]', 'A keni automjete per dasma?', 'Po, disa kompani ofrojne automjete luksoze te dekoruara per dasma. Kontaktoni kompanite ne kategorine "Luksoze" per te diskutuar nevojat tuaja.', 5),
('pergjithshme', '["biznes","corporate","korporat"]', 'A ofroni sherbime per biznese?', 'Po, ofrojme plane speciale per biznese: qira afatgjate, flota automjetesh, cmime te vecanta per korporata. Kontaktoni ekipin tone per oferte te personalizuar.', 7),
('pergjithshme', '["student","zbritje student"]', 'A ka zbritje per studente?', 'Disa kompani ofrojne zbritje per studente me prezantimin e kartes se studentit. Kontrolloni ofertat e vecanta te seciles kompani.', 5),
('pergjithshme', '["grup","group","organizate"]', 'A ofroni cmime per grupe?', 'Po, per rezervime grupi (3+ automjete) ofrojme cmime speciale. Kontaktoni ekipin tone per oferte te personalizuar per grupin tuaj.', 6),
('pergjithshme', '["lamtumire","bye","mirupafshim"]', 'Lamtumire!', 'Mirupafshim! Shpresojme qe ju ndihmuam. Nese keni pyetje te tjera ne te ardhmen, jemi ketu per ju. Udhetim te mbare!', 7),
('pergjithshme', '["nuk kuptoj","confused","i hutuar"]', 'Nuk e kuptoj, mund te me ndihmoni?', 'Sigurisht! Provoni te me beni nje pyetje me specifike. Per shembull: "Sa kushton nje automjet ekonomik?" ose "Si te bej rezervim?" dhe do t''ju ndihmoj me kenaqesi.', 8),
('pergjithshme', '["operator","njeri","person","live"]', 'Dua te flas me nje operator!', 'Mund te kontaktoni ekipin tone direkt: Telefon: +383 44 000 000 (E hene - E premte, 08:00-18:00), Email: info@rentakar.com, ose na vizitoni ne zyre: Rr. Epopeja e Jezercit Nr. 402, Ferizaj.', 9),

-- ANKESA (Complaints) - 40+ responses
('ankesa', '["ankese","complaint","pakenyqesi"]', 'Kam nje ankese, ku ta dergoj?', 'Per ankesa: 1) Fillimisht kontaktoni kompanine direkt permes platformes, 2) Nese nuk zgjidhet brenda 48 oresh, dergoni ankesen ne ankesa@rentakar.com me numrin e rezervimit.', 9),
('ankesa', '["vonese","delay","prit"]', 'Kompania u vonua me konfirmimin!', 'Na vjen keq per vonesen. Kompanite kane 24 ore per te konfirmuar. Nese ka kaluar ky afat, na kontaktoni dhe do ta ndjekim situaten drejtperdrejt me kompanine.', 8),
('ankesa', '["gjendje","keqe","dirty","ndotur"]', 'Automjeti ishte ne gjendje te keqe!', 'Na vjen shume keq per kete pervoje. Ju lutem: 1) Merrni foto te gjendjes, 2) Njoftoni kompanine menjehere, 3) Dergoni ankesen me foto ne ankesa@rentakar.com. Do ta hetojme dhe do te marrim masa.', 9),
('ankesa', '["cmim","ndryshe","me shtrenjte"]', 'Cmimi ishte me i larte se ne faqe!', 'Cmimet ne platforme duhet te jene te sakta. Nese keni hasur ndryshim, dergoni detajet (screenshot, numri i rezervimit) ne ankesa@rentakar.com. Do ta verifikojme dhe korrigjojme.', 8),
('ankesa', '["i pakenaqur","unhappy","disappointing"]', 'Jam i pakenaqur me sherbimin!', 'Na vjen keq qe nuk kemi permbushur pritshmnerite tuaja. Ju lutem na tregoni me detaje se cfare shkoi keq dhe do te bejme cmos per ta korrigjuar situaten. Mund te na shkruani ne ankesa@rentakar.com.', 8),
('ankesa', '["mashtrim","scam","fraud"]', 'Mendoj qe kam qene viktime e mashtrimit!', 'Marrim shume seriozisht raportet per mashtrim. Ju lutem: 1) Mos beni me pagesa, 2) Ruani te gjitha komunikimet, 3) Dergoni detajet menjehere ne siguria@rentakar.com. Do ta hetojme urgjentisht.', 10),

-- Additional general responses
('pergjithshme', '["opsion","mundesi","option"]', 'Cilat opsione kam?', 'Keni shume opsione! Mund te kerkoni automjete sipas: qytetit, kategorise, cmimit, transmisionit, karburantit, vitit, dhe vleresimit. Filloni kerkimin ne faqen e automjeteve.', 7),
('pergjithshme', '["krahasoj","compare","dalloj"]', 'A mund te krahasoj automjete?', 'Po, mund te hapni faqet e detajeve te disa automjeteve ne taba te ndryshme per t''i krahasuar. Shikoni cmimin, karakteristikat, dhe vleresimet per te bere zgjedhjen me te mire.', 5),
('pergjithshme', '["dhurate","gift","voucher"]', 'A ofroni dhurata/vouchere?', 'Aktualisht nuk ofrojme vouchere dhurate, por eshte nje funksionalitet qe po e shqyrtojme per te ardhmen. Ndiqni ne per perditesime!', 3),
('pergjithshme', '["program","loyalty","besnikeri"]', 'A keni program besnikerie?', 'Nje program besnikerie eshte ne zhvillim. Do te perfshije pike per cdo rezervim, zbritje ekskluzive, dhe perfitime te tjera. Regjistrohuni per te qene nder te paret qe perfitojne!', 4),
('pergjithshme', '["feedback","pershtypje","mendim"]', 'Ku mund te le pershtypjen time?', 'Mund te leni vleresim pas cdo rezervimi te perfunduar. Gjithashtu mund te na dergoni feedback te pergjithshem ne feedback@rentakar.com. Mendimi juaj eshte i rendesishem!', 5);
