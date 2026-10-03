# Planetario — Matrice di accettazione

**Fase 2 · Specifica v1 · 3 ottobre 2026**

Questa matrice stabilisce cosa dovrà essere verificato. **Nessuno dei test applicativi, scientifici o su dispositivi elencati è stato eseguito nella Fase 2.** In questa fase si controllano documenti, riferimenti, coerenza dei contratti e diff. I criteri numerici sono requisiti di progetto, non benchmark o errori già misurati.

Riferimenti normativi: [DATA-MODEL.md](DATA-MODEL.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ROADMAP.md](ROADMAP.md). I contratti formali della Fase 2 prevalgono sulle opzioni lasciate aperte nella Fase 1.

## 1. Classificazione delle evidenze

| Codice | Tipo | Che cosa dimostra |
| --- | --- | --- |
| DOC | Controllo documentale | Perimetro, specifiche, collegamenti e revisione; nessuna funzionalità runtime |
| AUTO | Test automatico | Proprietà del codice/dataset eseguito con commit e log identificati |
| DESKTOP | Browser desktop reale | Comportamento sul browser e computer registrati |
| EMU | Emulazione o simulazione | Flussi riproducibili nel simulatore; non prestazioni, stereo, gesture fisiche o comfort reali |
| FISICO | Dispositivo reale | Comportamento sul modello/OS/browser esplicitamente registrati |

Stati dei singoli casi: `NON ESEGUITO`, `SUPERATO`, `FALLITO`, `BLOCCATO`. Un caso superato su un browser non supera automaticamente le righe degli altri browser. Un rapporto deve indicare quale variante e quale evidenza sono state ottenute.

Ogni esecuzione conserva: ID test, data, commit/build e hash dataset, versioni delle dipendenze, dispositivo/OS/browser, profilo e modalità di scala, procedura, risultato atteso/osservato, esito, log e screenshot/video pertinenti. Riferimenti esterni: query, risposta e versione; mai soltanto un'immagine senza valori confrontabili.

## 2. Dispositivi e ambienti

| ID | Priorità e piattaforma | Hardware | Versioni OS/browser | Tipo richiesto | Stato |
| --- | --- | --- | --- | --- | --- |
| W-C | 1 — PC Windows, Chrome/Chromium | DA DEFINIRE CON TEST REALE | DA DEFINIRE CON TEST REALE | DESKTOP | NON ESEGUITO |
| W-E | 1 — PC Windows, Edge | DA DEFINIRE CON TEST REALE | DA DEFINIRE CON TEST REALE | DESKTOP distinto da Chrome | NON ESEGUITO |
| W-F | Firefox desktop, quando disponibile | DA DEFINIRE CON TEST REALE | DA DEFINIRE CON TEST REALE | DESKTOP | NON ESEGUITO |
| I-S | 2 — iPad, Safari | DA DEFINIRE CON TEST REALE | DA DEFINIRE CON TEST REALE | FISICO, landscape e portrait | NON ESEGUITO |
| Q-B | 3 — Meta Quest/Oculus, Browser | DA DEFINIRE CON TEST REALE | DA DEFINIRE CON TEST REALE | FISICO, controller e stereo | NON ESEGUITO |
| A-C | Secondario — tablet Android Chromium | DA DEFINIRE CON TEST REALE | DA DEFINIRE CON TEST REALE | FISICO | NON ESEGUITO |
| P-M | Secondario — smartphone | DA DEFINIRE CON TEST REALE | DA DEFINIRE CON TEST REALE | FISICO, percorso compatto | NON ESEGUITO |
| E-X | Ambiente XR emulato | Simulatore da scegliere, nessun visore implicito | Versione da registrare | EMU | NON ESEGUITO |
| A-U | Runner per dominio scientifico | Ambiente da registrare alla Fase 3 | Runtime e strumenti da registrare | AUTO | NON ESEGUITO |

Le priorità indicano l'ordine organizzativo, non l'esclusione delle prove XR iniziali. Non è stata svolta un'inventariazione hardware e non si deduce il modello del dispositivo da conversazioni precedenti.

## 3. Soglie quantitative

### 3.1 Correttezza interna

| Oggetto | Soglia di superamento |
| --- | --- |
| Solver di Keplero | `abs(E−e sin(E)−M) ≤ 1e−12 rad` su e∈[0,0,2], incluse e=0 ed e=0,2 |
| Confronto con soluzione indipendente della stessa conica | Errore relativo posizione e velocità ≤1e−10; componenti prossime a zero confrontate con norma globale e fondo 1 m / 1 m/s |
| Energia e momento angolare del modello a due corpi | Scostamento relativo ≤1e−10 su 1000 fasi; nessuna deriva temporale da integrazione |
| Chiusura baricentrica | Errore sulle posizioni ricostruite ≤1e−3 m; sulla velocità ≤1e−8 m/s |
| Orientamenti numerici | Norma quaternion e polo entro 1e−12; determinante matrice entro 1e−12 da +1 |
| Stesso istante/dataset | Stesso stato entro 1e−6 m, 1e−9 m/s e 1e−10 rad; confronto dei quaternioni invariato per q→−q |
| Clock a frame rate diversi | Differenza tempo ≤1e−6 s usando stessi ancoraggi/eventi e nessun gap di sospensione |
| Scala scientifica | Rapporti CPU con fattore unico entro 1e−12 relativo; nessun clamp del raggio della mesh |
| Cambio origine | Identità CPU entro 1e−9 unità render; spostamento a schermo ≤0,25 px nella prova deterministica |

Usare confronti su norma/scalari, non divisione per componenti nulle. Le soglie sono per questo dominio limitato, non per distanze interstellari o ogni browser immaginabile.

### 3.2 Qualificazione astronomica del modello iniziale

Dominio fissato: JD TDB 2451530,0–2451560,0. Griglia principale ogni 6 ore, 121 istanti inclusi gli estremi; griglia intermedia a +3 ore, 120 istanti, acquisita dal riferimento. Includere t0 e verificare tutti i punti; niente media che nasconda il massimo.

| Quantità rispetto a Horizons geometrico | Errore massimo ammesso v1 |
| --- | --- |
| EMB/Sole e Terra/Sole, posizione | 20.000 km |
| Marte/Sole, posizione | 20.000 km |
| Luna/Terra, posizione | 30.000 km |
| Luna/Sole, posizione | 50.000 km |
| EMB/Sole, Terra/Sole, Marte/Sole, velocità | 20 m/s |
| Luna/Terra e Luna/Sole, velocità | 100 m/s |
| Orientamento rispetto al modello PCK completo: Sole, Terra, Marte | 0,1° |
| Orientamento rispetto al modello PCK completo: Luna | 10° |

Sono **limiti di accettazione di un modello educativo**, deliberatamente distinti dalla precisione dell'effemeride e non sufficienti per eclissi o osservazioni. Le soglie non attestano che le future implementazioni le rispettino. Se una soglia fallisce, la milestone non supera la verifica scientifica: correggere unità, dati o modello; se serve cambiare intervallo/provider, aggiornare esplicitamente specifica e motivazione. Vietato allargare automaticamente le tolleranze dopo il risultato.

Il Sole eliocentrico nullo è un'identità del centro, non una prova dell'accuratezza dinamica. Il confronto a t0 verifica l'importazione: richiedere ≤1 km e ≤0,001 m/s tra stato ricostruito ed elementi/vettori JPL coerenti. Il PCK completo è il riferimento indipendente della rotazione semplificata, non una certificazione di orientamento terrestre ITRF o librationi lunari di alta precisione.

Per il futuro EphemerisProvider: interpolazione contro campioni non usati negli estremi, ≤1000 m e ≤0,01 m/s per stati eliocentrici planetari; ≤100 m e ≤0,01 m/s per Luna/Terra. Il passo 1 ora è una proposta iniziale: dimezzarlo se fallisce, senza oltrepassare lacune. Queste prove non appartengono all'implementazione attuale.

## 4. Matrice degli scenari

Tutte le righe runtime partono da `NON ESEGUITO`. «CPU» indica runner A-U; «schermo» richiede W-C, W-E e I-S, con A-C successivo. Le evidenze per ciascuna piattaforma restano distinte.

| ID | Scenario e procedura | Dispositivo/tipo | Risultato e criterio di superamento | Evidenza da conservare |
| --- | --- | --- | --- | --- |
| A01 | **A — Distanza invariata:** a t=0 in pausa leggere Terra–Sole, cambiare scientifica→didattica→esplorativa | CPU AUTO; schermo DESKTOP/FISICO | Dato fisico e distanza numerica invariati; fattori dei raggi visibili; snapshot non mutato | Snapshot prima/dopo, assert distanza, screenshot di ogni scala |
| A02 | **B — ×1000:** avviare 10 s monotoni da t=0 a ×1000 | CPU AUTO; W-C DESKTOP | t=10000 s entro tolleranza clock; stato uguale a getSnapshot(10000), non rotazione angolare uniforme dell'ellisse | Timeline eventi e confronto vettori |
| A03 | **C — Un comando:** selezionare Terra via mouse, tap, controller | W-C DESKTOP; I-S e Q-B FISICO; AUTO adattatori | Stessa action `selectBody` con `bodyId=earth`; una sola transizione di stato per gesto, pannello coerente | Log eventi/actionId, stato, video per dispositivo |
| A04 | **D — Vista locale:** avvicinarsi alla Terra con tempo fermo | CPU AUTO; schermo e Q-B | Cambiano origine/L/camera; posizione, velocità e orientamento scientifici restano identici | Snapshot e proiezione separati |
| A05 | **E — Rebase:** forzare ΔO noto a scala costante | CPU AUTO; W-C DESKTOP; Q-B FISICO | Compensazione A o camera, ≤0,25 px nel caso deterministico; in XR nessuna modifica di pose/IPD | Matrici, proiezioni prima/dopo; log pose simulate più video reale |
| A06 | Scientifico subpixel: Sole e Terra alla distanza reale | W-C/I-S; AUTO proiezione | Raggio mesh esatto R/L; marker distinto e selezionabile con hit area ≥44 px | Raggio GPU/CPU, screenshot e log picking |
| A07 | Terra/Luna sovrapposte in modalità didattica | Schermo e Q-B | Scelta esplicita dei due corpi, nessuno spostamento nascosto, distanza fisica invariata | Elenco candidati e video scelta |
| A08 | Curve delle orbite in tre scale e vista locale | CPU AUTO; W-C DESKTOP | Corpo sulla propria curva del modello entro tolleranza di discretizzazione dichiarata; guida EMB distinta dalla traccia terrestre | Valori e screenshot con legenda |
| A09 | Equazione di Keplero e casi circolare/equatoriale | CPU AUTO | Soglie §3.1; ramo degenerato conserva stato; e>0,2 respinto | Vettori analitici o SPICE e log di confronto |
| A10 | Pericentro/apocentro e legge delle aree | CPU AUTO | rp=a(1−e), ra=a(1+e); velocità maggiore al pericentro; energia e h conservati | Parametri sintetici, derivazioni e risultati |
| A11 | Terra/Luna/EMB ricostruiti a tutti i campioni | CPU AUTO | `rMoon−rEarth=ρ`; media pesata GM restituisce B e Vb entro §3.1 | Tabella dei residui, ID/fonti GM |
| A12 | Confronto con Horizons su griglia completa | CPU AUTO + revisione scientifica | Tutti i massimi entro §3.2; centri/frame/tempo/correzioni uguali | Query/risposte, hash, report massimi con istante |
| A13 | Poli, meridiano zero, est e verso di spin | CPU AUTO; W-C DESKTOP | Q destrorsa; +Z al polo; +X al meridiano; confronto PCK completo e soglie; niente doppia inclinazione | Matrici/quaternion, screenshot con griglia di collaudo |
| A14 | Clock a 30/60/90 Hz con stessi eventi | CPU AUTO | Uguale t finale e stato; nessuna somma per-frame delle posizioni | Sequenze deterministiche e log |
| A15 | Pausa, cambio rate in pausa, reset | CPU AUTO; schermo | Pausa conserva tempo, rate non avvia; reset t=0/×1/pausa senza cambiare selezione | Action log e clock snapshot |
| A16 | Nascondere scheda, attendere, tornare | W-C/W-E DESKTOP; I-S FISICO | Nessun recupero del tempo nascosto; ripresa solo con Play | Video, timestamp prima/dopo |
| A17 | Gap >1000 ms senza evento di visibilità | CPU AUTO; hardware alla ripresa | Ultimo t pubblicato conservato; pausa `suspended`; nessun salto ×100000 | Timestamp e pause reason |
| A18 | Superare fine intervallo a ×100000 | CPU AUTO; W-C | Clamp esatto a +1296000 s e pausa; getState fuori intervallo restituisce errore | Asserzioni limite e UI avviso |
| A19 | Provider fallisce su un corpo | CPU AUTO | Nessuno snapshot misto; ultimo completo con stato errore; nessuno zero fittizio | Errore iniettato e stati UI |
| A20 | Importare unità errate, GM negativi, fonte assente, NAIF incoerente, record draft | CPU AUTO | Ogni caso rifiutato con JSON Pointer e codice; nessun accesso al runtime | Fixture invalidi e output del validatore |
| A21 | Cambiare provider con fixture identiche | CPU AUTO | Stesso contratto UI/render; nessun ramo dipendente da nome provider | Due provider finti con stesso snapshot e confronto |
| A22 | Drag, pinch, pan, tap, pointercancel | I-S/A-C FISICO; AUTO sequenze | Drag >8 px, secondo dito o cancel non producono selezione; pinch non viaggia; tap seleziona | Video e log delle azioni |
| A23 | Tastiera e focus del pannello | W-C/W-E DESKTOP | Tab/Enter/Escape funzionano; focus torna al controllo di origine; nessun tasto WASD sottratto a un campo testo | Registrazione keyboard-only |
| A24 | Landscape/portrait e testo 200% | I-S FISICO; DESKTOP zoom | Comandi ≥44 px accessibili, niente tagli irreversibili; testo scorre senza muovere la scena | Screenshot orientamenti e scala testo |
| A25 | Movimento ridotto | DESKTOP/I-S | Cambio scala immediato; nessun viaggio animato obbligatorio; simulazione controllabile | Impostazione OS e video |
| A26 | Ingresso/uscita XR tre volte | Q-B FISICO; E-X solo EMU aggiuntiva | Nessun listener duplicato, t/rate/selezione conservati; pausa dopo ciascuna transizione | Session log e video visore |
| A27 | 20 pressioni trigger per ciascun controller | Q-B FISICO | Esattamente 20 select action per controller, nessuna doppia da Gamepad e WebXR | Contatore visibile e log eventi |
| A28 | Controller assente/disconnesso, tracking perso | Q-B FISICO; EMU errori | Stato leggibile, nessun crash, tempo in pausa, recupero senza auto-viaggio | Log session/inputSources e video |
| A29 | Osservare pannello con entrambi gli occhi e muovere la testa | Q-B FISICO | Stereo corretto, testo leggibile, radice testa scala 1; nessuna guida artificiale del capo | Osservazioni manuali e log trasformazioni |
| A30 | Caricamento texture fallito e contesto perso | AUTO fault injection; DESKTOP/I-S | UI funzionante, fallback esplicito, stato conservato alla ricostruzione | Errori simulati distinti dai guasti reali |
| A31 | 15 minuti di selezioni/cambi qualità | I-S/Q-B FISICO | Budget dichiarati, nessuna crescita monotona delle risorse vive dopo 20 cicli; nessun crash | Tempi p50/p95/p99, frame mancati, allocazioni e stato termico osservabile |
| A32 | Engine/modalità non supportati e permesso XR negato | DESKTOP/AUTO; Q-B | Messaggio chiaro, niente falso pulsante VR funzionante, nessuna perdita dati | Errori e screenshot |
| A33 | Load/deactivate/dispose di un ambiente | AUTO con renderer finto; DESKTOP successivo | Transizioni legali; abort e errore puliscono risorse; dispose idempotente | Contatori risorse/listener prima/dopo |
| A34 | Luce e misure dopo cambio scala | CPU AUTO; W-C | Vettore corpo→Sole ricavato da fisica; d/c invariato; nessuna eclissi da raggi didattici | Confronto vettori e formule |

Per A08 la discretizzazione della polilinea deve mantenere errore proiettato ≤0,5 px nel viewport di test; il valore non sostituisce la verifica matematica dell'orbita. Per A31 riportare risorse vive dopo rilascio e garbage collection quando osservabile; una stima di memoria non va presentata come misura esatta della VRAM.

## 5. Prima prova tecnica Babylon: progetto, non implementazione

Da eseguire dopo setup/build della Fase 3, come prima attività eseguibile della Fase 4. Contenuto strettamente limitato: engine WebGL 2, scena, camera, luce, **una sfera con texture di collaudo a scacchi e meridiani**, selezione, piccolo pannello HTML/spaziale, touch, sessione e controller XR. La texture tecnica non è un asset astronomico e va etichettata come tale. Nessun Sole/Terra/Luna/Marte definitivo.

Dimensioni di prova: sfera raggio 0,25 m nell'osservatorio XR, centro 2 m davanti all'utente; 1K massimo per la texture, un materiale e una luce, niente postproduzione. L'ingresso deve mostrare il pannello senza muovere la testa e restituire la modalità desktop all'uscita. Accedere via HTTPS valido, registrando URL e build. Questi valori sono parametri della prova, non scala scientifica.

| ID | Condizione di successo | Verifica |
| --- | --- | --- |
| B01 | Build e avvio WebGL 2 senza errori non gestiti | W-C e W-E reali, console e rete pulite |
| B02 | Sfera, luce e griglia UV orientate correttamente | Desktop e iPad reale, screenshot di meridiani/poli |
| B03 | Selezione e pannello identici nel dominio applicativo | 20 click, 20 tap, 20 trigger per controller: esattamente un comando ciascuno |
| B04 | Touch usabile in landscape/portrait | Drag/pinch/pan/cancel non selezionano; pulsanti e pannello raggiungibili |
| B05 | Ingresso/uscita XR ripetibili | Tre cicli nel Quest reale, stato conservato e nessuna duplicazione di input |
| B06 | Tracking metrico e stereo corretti | Traslazione della testa 1:1; nessun riscalamento delle pose; testo leggibile |
| B07 | Prestazione di una scena minima adeguata | 5 min: desktop/iPad obiettivo 60 fps; Quest sostiene refresh scelto; frame mancati <1% dopo warm-up, nessun degrado progressivo |
| B08 | Risorse e errori gestiti | Nessuna crescita del numero di risorse dopo 20 cicli di attivazione/uscita; texture assente e XR negato recuperabili |

Il successo B01–B08 sui dispositivi disponibili conferma la scelta solo per quelle configurazioni. Per dichiarare chiusa la prova multipiattaforma prioritaria servono PC Windows, iPad e Quest reali. Hardware assente = `BLOCCATO`, non fallimento del motore e non successo emulato. I budget della scena minima non provano quelli del Planetario completo.

### Quando riesaminare il motore

Aprire una valutazione Three.js/IWSDK soltanto con un problema riproducibile: crash/rendering errato della scena minima su un dispositivo prioritario con WebGL 2 funzionante; impossibilità di ingresso o input XR non riconducibile a HTTPS/permessi/browser; pannelli stereo incompatibili; prestazioni gravemente insufficienti della scena minima dopo profiling e correzione di errori applicativi.

Prima: riduzione a caso minimo, versioni bloccate, confronto con esempio ufficiale Babylon, verifica di driver/capacità e documentazione, tentativo di correzione circoscritto. Per motivare il cambio, ripetere lo stesso caso su una sola alternativa e conservare evidenza che risolve il difetto senza perdere touch/accessibilità. Asset troppo pesanti, hardware assente, rete lenta o bug delle nostre azioni non giustificano da soli un cambio motore. Il confronto non è riaperto in Fase 2.

Riferimenti: [helper XR Babylon](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/webXR/webXRExperienceHelpers.md), [ciclo di sessione WebXR](https://www.w3.org/TR/webxr/), [profiling WebXR Meta](https://developers.meta.com/vr/documentation/web/webxr-perf-workflow/). Le soglie B01–B08 sono definite dal progetto.

## 6. Condizioni per procedere e per concludere

**Fase 2 conclusa documentalmente** quando: quattro documenti coerenti; frame/unità/epoca/intervallo decisi; contratti dati, tempo, scale, input e ambienti definiti; test e soglie con evidenze previsti; diff soltanto nei quattro file autorizzati e `gitkeep` invariato. Non richiede fingere risultati su hardware o implementare il modello.

**Prima di avviare il vero prototipo scientifico (Fase 5):** setup Fase 3 funzionante, prova minima Fase 4 con difetti bloccanti risolti, acquisizione e validazione dei dati necessari, registri delle fonti, procedure di test riproducibili. Con iPad/Quest non disponibili si può proseguire come prototipo desktop esplicitamente non qualificato per quei dispositivi, ma non dichiarare raggiunto il supporto multipiattaforma.

**Prima milestone accettata:** tutti i casi applicabili A01–A34 superati, evidenza fisica I-S/Q-B disponibile e rapporti scientifici entro soglia. I casi del provider futuro non sono prerequisito della milestone kepleriana. Un problema di accuratezza, unità, origine, doppia selezione o comfort blocca la qualifica pertinente.

**Arresto richiesto ora:** aggiornare documentazione, verificare il diff, registrare i commit e fermarsi. La Fase 3 non è iniziata da questo incarico.
