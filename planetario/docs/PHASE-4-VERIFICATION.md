# Fase 4 — Verifica del motore minimo

**3 ottobre 2026 · versione 0.4.0 · arresto prima della Fase 5.**

## Esito e perimetro

**BABYLON CONFERMATO per la configurazione effettivamente provata: browser integrato Codex su Windows, WebGL 2. Conferma provvisoria rispetto a Chrome/Edge autonomi, iPad e Quest.** Non è stato osservato un difetto bloccante che giustifichi il riesame del motore. Non è dichiarata conclusa la qualificazione multipiattaforma B01–B08.

La scena minima e l'integrazione XR sono implementate. iPad e Quest: **NON VERIFICATO SU HARDWARE FISICO**. L'assenza di questi dispositivi lascia prove BLOCCATE e rischi aperti; non è né successo emulato né fallimento di Babylon.

Tutti i cambiamenti sono sotto `planetario/`; `gitkeep` conservato. Nessun cambiamento a workflow, indice UTILITY, altre PWA o server. Nessun corpo astronomico, effemeride Horizons, propagatore, texture scientifica, campo stellare, laboratorio o audio introdotto. I contratti di DATA-MODEL e le soglie di ACCEPTANCE-TESTS non sono stati modificati.

## Base verificata ed ambiente

`main` e copia locale inizialmente pulita coincidevano con `53c9aa18ffcc5ff1ee8f768e5d3da094099b7450`. I tre commit Fase 3 presenti sono `00b3cc4ec63e89d0146e47c8d0e3c08fa178c016`, `d89a5e942c8351f549f9883829e37187249deb60`, `53c9aa18ffcc5ff1ee8f768e5d3da094099b7450`. Prima delle modifiche: npm ci, 19/19 test, typecheck e build riusciti. Riletti README, PHASE-3-VERIFICATION, ARCHITECTURE, ROADMAP, DATA-MODEL e ACCEPTANCE-TESTS.

| Voce | Evidenza |
| --- | --- |
| Sistema | Windows; sessione locale dell'utente |
| Node / npm | 24.14.1 / 11.11.0 |
| Babylon / TypeScript / Vite | 9.29.0 / 7.0.2 / 8.3.2, versioni bloccate |
| Browser eseguito | Codex In-app Browser; UA dichiarato Chrome/154.0.0.0, Windows NT 10.0 x64 |
| Chrome autonomo | Non disponibile al controllo: tentativo di apertura restituisce browser non disponibile |
| Edge autonomo | Non disponibile al controllo: tentativo di apertura restituisce browser non disponibile |
| Firefox autonomo | Non esposto dagli strumenti; non eseguito |
| iPad / Quest | Non disponibili nella sessione, NON VERIFICATO SU HARDWARE FISICO |
| Backend | WebGL 2 reale; WebGL 1 rifiutato; WebGPU rilevato ma non inizializzato |
| XR nel browser provato | API presente, `isSessionSupported('immersive-vr')` falso; nessuna sessione richiesta |

L'UA identifica il motore dichiarato dal browser integrato, **non una prova in Google Chrome autonomo**. GPU/driver e versione del contenitore Codex non sono stati inventariati; nessuna stima della VRAM disponibile.

## Implementazione verificabile

`core/interaction.ts` è lo store puro della prova. L'identificatore `technical-sphere` non è aggiunto al tipo astronomico BodyId. selectBody/focusBody/overview/openInfo/closeInfo/orbitView/zoomView/panView conservano il flusso INPUT → ACTION → STATE → RENDER/UI. Le API del dominio scientifico restano separate; non vengono mostrati comandi temporali o scale ancora inesistenti. La specializzazione di Fase 4 implementa Observe, senza inventare contenuti Understand/Deepen.

Gli envelope hanno sessione, sequence, actionId, fonte e tempo reale; ripetizioni e sequenze obsolete sono rifiutate. Non finiti, coordinate mancanti e ID sconosciuti sono rifiutati. Selezionare apre la scheda senza spostare la camera; focus avvicina istantaneamente; overview conserva selezione/scheda; chiusura conserva selezione e restituisce il focus se era nel pannello. Camera numerica nello store, senza attachControl Babylon. Nessun input modifica direttamente una mesh.

Pointer Events: tap/clic solo al rilascio, soglia 8 CSS px; drag, secondo dito, cancel, perdita di cattura/focus cancellano il tap. Pinch zoom e pan a due dita; touch-action circoscritto al canvas, pulsanti e pannello HTML normalmente scorrevoli. Tastiera: frecce, +/−, Invio, Home, Escape. Pulsanti ≥44 CSS px, focus visibile, scheda non modale, alternativa HTML alla selezione grafica.

Scena destrorsa, una luce emisferica, sfera diametro convenzionale 0,50, materiale StandardMaterial e griglia locale 512 px senza mipmap. Se la texture non può essere creata, viene smaltita e resta il colore uniforme; non esiste un caricamento texture remoto da cui dipendere. Griglia e pannello sono registrati in ASSET-SOURCES. WebGL non disponibile/errore di avvio: messaggio esplicito, scheda HTML utilizzabile, comando di riavvio. Engine/Scene/render loop/ResizeObserver/listener/timer/strumentazione vengono smaltiti; inizializzazioni tardive sono intercettate.

Qualità è un evento di servizio distinto dalle azioni: Auto cap DPR 1,5; Qualità cap 2; Prestazioni cap 0,8. Su DPR 1 Auto e Qualità coincidono, Prestazioni riduce il buffer. Durante XR profilo e camera desktop sono bloccati. Nessun postprocessing pesante.

## XR: implementato e limiti

Session manager Babylon + WebXRCamera + WebXRInput, preparati soltanto quando la capacità immersiva è positiva. Il pulsante richiede una sessione reale; errori e rifiuti sono non bloccanti per il desktop. Reference space local-floor preferito, fallback local; non viene usato viewer come origine fissa. Un solo render target riusato evita l'accumulo di osservatori della managed canvas tra sessioni.

Tracciamento in metri, worldScalingFactor=1, camera senza compensazione dalla vista desktop. Il nodo rendered-world è separato dalla camera e viene collocato una volta a due metri davanti alla prima posa valida, all'altezza iniziale degli occhi. Non è figlio del rig; nessuna modifica delle pose degli occhi, dell'IPD o della scala dei controller. Il futuro floating origin e le scale astronomiche dovranno agire sul solo mondo renderizzato, mantenendo questo confine.

Controller con raggi geometrici locali, niente modelli remoti. Il solo evento semantico select conferma: nessun polling Gamepad o azione su selectstart/selectend. Il ray picking dà precedenza alla scheda XR e poi alla sfera. Scheda mesh con texture 1024 × 512: nome, stato e Chiudi. Uscita via menu del browser/visore e pulsante HTML Esci dalla VR ove accessibile; ritorno alla camera desktop conservata. Nessuna locomozione continua, teleport o animazione della camera; non occorrono fade per transizioni istantanee desktop.

Questa integrazione non è stata eseguita in un visore né con un emulatore XR disponibile. Restano da verificare orientamento/leggibilità stereoscopica del pannello, tracking 1:1, raggi dei controller, permessi, tre/venti cicli, comfort e prestazioni del compositor. Procedura: [QUEST-TEST](QUEST-TEST.md).

## Matrice B01–B08

Le soglie sotto restano quelle normative, senza trasformare una prova simulata in prova fisica.

| ID | Criterio normativo | Evidenza di questa fase | Esito completo |
| --- | --- | --- | --- |
| B01 | Build/avvio WebGL 2, W-C e W-E reali, console/rete pulite | Build e scena funzionanti nel browser integrato; console pulita nell'avvio ordinario. Chrome/Edge autonomi non disponibili | PARZIALE; W-C/W-E da eseguire |
| B02 | Sfera, luce, UV corretti su desktop e iPad reale | Griglia osservata nel browser integrato e corretta nell'orientamento verticale; screenshot. iPad assente | PARZIALE; iPad NON VERIFICATO SU HARDWARE FISICO |
| B03 | 20 clic, 20 tap, 20 trigger per controller, un comando ciascuno | 20 clic reali sul canvas = 20 selezioni. 20 tap e 20 select per ciascun controller provati nel modello automatico, non su dispositivi | PARZIALE; tap/trigger fisici aperti |
| B04 | Landscape/portrait, drag/pinch/pan/cancel senza selezione, UI raggiungibile | Drag mouse reale senza incremento selezioni; gesture automatiche; viewport 1024×768, 768×1024, 390×844 senza overflow, pulsanti 44 px | PARZIALE; touch fisico aperto |
| B05 | Tre ingressi/uscite su Quest reale senza duplicazioni | Ciclo implementato, gestione ritorno/errori; nessuna sessione immersiva disponibile | BLOCCATO: NON VERIFICATO SU HARDWARE FISICO |
| B06 | Traslazione testa 1:1, stereo, testo leggibile | Separazione world/rig e azioni camera bloccate in XR verificate nel codice/test; stereo non eseguito | BLOCCATO: NON VERIFICATO SU HARDWARE FISICO |
| B07 | 5 min, desktop/iPad 60 FPS, refresh Quest, mancati <1%, nessun degrado | Misura del render loop nel browser integrato, riportata sotto. Nessuna misura del compositor o dei dispositivi fisici | PARZIALE; non certifica la soglia su W-C/W-E/iPad/Quest |
| B08 | Nessuna crescita risorse dopo 20 cicli; texture assente/XR negato recuperabili | 20 riavvii nel browser con conteggi finali stabili; 20 scene NullEngine con dispose; perdita/ripristino WebGL riusciti. Riferimento XR negato testato al confine API | PARZIALE; rifiuto della sessione e cicli fisici XR aperti |

## Misure e prove browser

Prima baseline: circa 59,9 FPS, intervalli circa 16,7 ms; 1 mesh, 1 materiale, 1 texture, 4624 triangoli, 1 draw call. Buffer Auto 1215 × 382 (DPR 1). Con scheda aperta: 889 × 382. Prestazioni: 711 × 305; Qualità: 889 × 382 nello stesso layout. Queste dimensioni derivano dal layout e non sono risoluzioni obbligatorie.

Texture sfera: 512 × 512 × 4 = 1 MiB nominale di pixel, senza mipmap. Non include allineamenti, copie CPU, buffer, depth/color attachment, driver o risorse XR; **non è VRAM totale**. Pannello XR: ulteriori 2 MiB nominali di pixel quando l'integrazione è preparata. Nessuna memoria disponibile dichiarata.

La misura di cinque minuti usa performance.now tra render successivi, 10 s di warm-up, pagina visibile e configurazione stabile. Riporta p50/p95/p99 e quota di intervalli >25 ms (1,5 periodi a 60 Hz). È un indicatore di ritardi, non il conteggio certificato dei frame mancati del display/compositor. Non basta da sola a chiudere B07.

Risultato nel browser integrato: **300/300 s dopo warm-up; 17.961 frame; p50/p95/p99 16,7/16,8/17,2 ms; intervalli >25 ms 0,01%**. La pagina non ha segnalato invalidazione. Profilo Auto, buffer 1215 × 382, una sfera e una draw call. FPS osservati circa 59,9 durante e dopo la misura. Bundle della baseline `index-C6Uiy2oZ.js`; le successive correzioni riguardano validazione input, cancellazione su blur, confine XR e diagnostica dei motori, senza cambiare scena, materiali o camera. La build finale è stata poi ricontrollata con 20 riavvii, 20 clic in Prestazioni e ripristino WebGL.

Evidenze locali ignorate da Git: `.tmp/phase4-browser-evidence.json`, `.tmp/phase4-local-http.json`; screenshot finale salvato separatamente. Nessuna telemetria è inviata a un servizio esterno.

Viewport simulate: desktop predefinito 1280×720; tablet 1024×768 e 768×1024; telefono 390×844. `scrollWidth == clientWidth` in ogni viewport controllata con scheda aperta; nessuna barra orizzontale. Chiusura della scheda restituisce il focus a Seleziona oggetto. Drag reale cambia yaw/pitch senza incrementare il contatore; frecce/Home funzionano. Venti riavvii conservano lo stato e i conteggi 1/1/1 senza errori. I soli warning osservati durante la prova indotta sono WebGL context lost e successfully restored.

## Test, build e pubblicazione

31 test automatici: 19 regressioni Fase 3 più 12 su azioni/invarianti, deduplicazione, valori invalidi, camera e blocco XR, profili, tap/drag/pinch/pan/cancel, riferimento XR locale, semantic select, disposal e 20 cicli Babylon NullEngine, campionamento frame. NullEngine prova lifecycle/picking geometrico, non GPU/stereo.

Verifica finale riuscita: `npm ci` (25 pacchetti installati, audit senza vulnerabilità segnalate), `npm run release` (31/31 test, typecheck, build e promozione), `npm run preview`. 43/43 file HTTP locali hanno hash identici allo staging e al rilascio. Build di 513 moduli, 1 HTML + 42 JS/CSS; chunk principale 1.124,75 kB, circa 269,41 kB gzip. Dopo 20 riavvii reali: 1 motore e 1 scena registrati, 1 mesh/1 materiale/1 texture; 20 clic con profilo Prestazioni producono esattamente 20 selezioni. Ripristino WebGL finale riuscito, griglia ancora correttamente orientata.

URL di sviluppo e preview mantengono il prefisso `/UTILITY/planetario/`. Il rilascio conserva vecchi asset con hash e sostituisce l'HTML per ultimo; nessuna pulizia di altre directory. I bundle contengono alcuni decoder e shader Babylon come chunk del motore: non significano asset astronomici o postprocessing attivo. Vite segnala il chunk principale oltre 500 kB: warning di dimensione, non errore. Nessun download di texture/modelli/font esterni.

Pubblicazione verificata su [https://gbprof.it/UTILITY/planetario/](https://gbprof.it/UTILITY/planetario/) per il commit `93dfed877264f61456398eae1da4c479ffbda2c3`:

- implementazione: `b99b046be4a5227a286ef63f5416a2e883e36f30`;
- documentazione e release: `93dfed877264f61456398eae1da4c479ffbda2c3`;
- [Deploy to gbprof server, run 37111166431](https://github.com/gb69prof/UTILITY/actions/runs/37111166431): completed / success;
- [Pages, run 37111166105](https://github.com/gb69prof/UTILITY/actions/runs/37111166105): completed / success;
- **43/43 file HTTP pubblici** con stato 200 e SHA-256 identico allo staging e al rilascio; prova in `.tmp/phase4-public-http.json`;
- SHA-256 HTML: `a0a50805bcb457f44346d3cf784e5b963c338b934c1da2155fccaeb32cbf5851`;
- browser pubblico: build 0.4.0, scena visibile, ray picking, focus e scheda funzionanti, viewport 390×844 senza overflow, console senza errori/warning. Screenshot `.tmp/phase4-public.jpg`;
- albero GitHub confrontato con l'albero locale prima dell'aggiornamento non forzato di main; diff limitato a `planetario/`; blob gitkeep invariato `8b137891791fe96927ad78e64b0aad7bded08bdc`.

Questo paragrafo è aggiunto dopo la pubblicazione in un commit documentale separato; non modifica gli asset applicativi. Le prove online non certificano iPad/Quest né sostituiscono Chrome/Edge autonomi.

## Problemi corretti e rischi rimasti

Corretti prima del rilascio: orientamento verticale della griglia; persistenza dell'orientamento dopo ricostruzione del contesto; accumulo potenziale di osservatori del render target XR riutilizzandone una sola istanza; coordinate mancanti e rotazioni numeriche estreme; rilascio delle sessioni di input e delle risorse tardive, cleanup anche in caso di creazione parziale del pannello XR e interruzione dell'input alla perdita di focus. La prima pagina di preview era una risposta in cache della Fase 3: navigazione a URL locale con query nuova ha caricato la build corrente; gli hash pubblici vengono controllati separatamente.

Aperti: prove autonome Chrome/Edge/Firefox, iPad/Safari touch fisico, XR Quest (sessione, permessi/rifiuto, stereo, ray, panel, comfort, refresh e cicli), profiling GPU/compositor e memoria effettiva. Nessun problema bloccante riproducibile del motore dimostrato nella configurazione provata. Le dimensioni del bundle meritano monitoraggio nella futura crescita, senza introdurre ora asset o ottimizzazioni speculative.

La scelta Babylon rimane confermata con i limiti dichiarati. **Nessun avvio della Fase 5.**

Riferimenti tecnici: [API Babylon WebXR Session Manager](https://doc.babylonjs.com/typedoc/classes/BABYLON.WebXRSessionManager), [documentazione ufficiale WebXR helper](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/webXR/webXRExperienceHelpers.md). Implementazione controllata anche sui sorgenti e tipi locali della versione 9.29.0 bloccata.
