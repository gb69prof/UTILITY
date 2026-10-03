# Planetario gbprof

**Versione 0.6.0 · Fase 6 — Interazioni desktop e touch.**

[Apri il Planetario](https://gbprof.it/UTILITY/planetario/). Quattro corpi, mappe 2K su richiesta, giorno/notte, assi, tre scale dichiarate e tempo condiviso con pausa e reset. La Terra è preselezionata nella scheda per offrire un punto di partenza; la camera parte dalla panoramica scientifica a J2000 in pausa. Seleziona un corpo, premi **Osserva**, trascina per orbitare e usa rotella o +/− per avvicinarti. Le frecce orbitano quando la scena ha il focus; Maiusc + frecce sposta la vista. **Fase 6 implementata; Fase 7 non avviata.**

Mouse: trascina per orbitare, Maiusc + trascina o tasto destro per spostare, rotella per zoom. Touch: scegli **Orbita/Sposta** per un dito; due dita spostano e fanno pinch. **Centra la vista** recupera il corpo dopo uno spostamento. C centra, Home torna al sistema, Invio osserva, Spazio avvia/ferma; Esc chiude la scheda e restituisce il focus. Il cursore temporale sceglie un istante fra −15 e +15 giorni da J2000 e mette in pausa; il reset conserva la selezione. Pannello laterale in landscape, inferiore in portrait fino a 1100 px.

Il [rapporto della Fase 6](docs/PHASE-6-VERIFICATION.md) distingue 51 test automatici, prove nel browser integrato e controlli ancora aperti: iPad fisico, browser autonomi e zoom effettivo del testo al 200%.

La verifica ha escluso il modello a tre coniche dal movimento: l’errore Luna–Terra raggiunge 45.233 km contro il limite di 30.000 km. La [revisione esplicita ADR-005](docs/ADR-005-EPHEMERIS.md) attiva le effemeridi JPL interpolate già previste nell’architettura. Restano invariati SI, frame, epoca e dominio di 30 giorni. Nessuna soglia allargata. Le ellissi sono soltanto guide etichettate.

Il [rapporto della Fase 5](docs/PHASE-5-VERIFICATION.md) separa verifiche scientifiche, browser integrato e pubblicazione. iPad e Quest fisici restano da qualificare. Il [collaudo tecnico / VR della Fase 4](https://gbprof.it/UTILITY/planetario/?technical=1) rimane disponibile; la scena astronomica in XR appartiene alla Fase 8.

## Prerequisiti e versioni

Usare Node.js **24.14.1** (ramo 24, almeno questa versione) e npm **11.11.0**; il ramo npm 11 è ammesso. Il runner di test usa il supporto TypeScript nativo di Node 24, senza transpiler aggiuntivo. Fermare il server prima di reinstallare le dipendenze: Windows può bloccare la sostituzione della libreria nativa di Rolldown in uso.

| Dipendenza diretta | Versione esatta | Funzione |
| --- | --- | --- |
| `@babylonjs/core` | 9.29.0 | Engine, scena WebGL 2 e integrazione WebXR |
| `typescript` | 7.0.2 | Controllo statico rigoroso |
| `vite` | 8.3.2 | Sviluppo e compilazione statica |
| `ajv` | 8.20.0 | JSON Schema draft 2020-12 |
| `@types/node` | 24.19.1 | Tipi di strumenti e test Node 24 |

Versioni stabili ricavate dai metadati npm il 3 ottobre 2026; nessuna versione preview o intervallo nelle dipendenze dirette. `package-lock.json` blocca anche le dipendenze transitive. Node 24 soddisfa il requisito di Vite `^20.19.0 || >=22.12.0`; TypeScript richiede Node ≥16.20.0. Compatibilità dei pacchetti controllata con installazione, typecheck senza `skipLibCheck` e build reali.

Vite transpila per Chrome/Edge 111, Firefox 114 e Safari 16.4 o successivi; questi sono **target del codice generato**, non dispositivi già certificati. Verificare separatamente WebGL 2 e WebXR. Babylon importa il backend WebGL; WebGPU è solo una voce diagnostica. Le prove mancanti su browser autonomi, iPad e Quest sono elencate nel rapporto di Fase 4. Riferimenti: [Vite, requisiti](https://vite.dev/guide/), [opzioni di build](https://vite.dev/config/build-options), [Babylon, moduli ES](https://github.com/BabylonJS/Documentation/blob/master/content/setup/frameworkPackages/es6Support.md), [Babylon, WebXR](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/webXR/introToWebXR.md).

## Comandi

Eseguire dalla cartella `UTILITY/planetario`, mai dalla root di UTILITY:

```sh
npm ci
npm run dev
```

Aprire `http://127.0.0.1:5173/UTILITY/planetario/`. Il server ascolta solo sul computer locale. Per i dispositivi usare l’URL HTTPS pubblico; non è predisposto un server LAN o un certificato locale.

```sh
npm run typecheck
npm run test
npm run build
npm run release
npm run preview
```

| Comando | Risultato |
| --- | --- |
| `typecheck` | Controlla sorgenti, strumenti, test e configurazione; nessuna emissione |
| `test` | Runner Node: dati, azioni, gesture simulate, confini XR, lifecycle Babylon NullEngine e rilascio |
| `build` | Typecheck, pulizia controllata della sola `.staging`, build Vite e controllo allowlist |
| `release` | Test + build completa + copia statica consentita; nessun push o comando server |
| `preview` | Serve lo staging su `http://127.0.0.1:4173/UTILITY/planetario/` |

Non aprire l'HTML tramite `file://`: i moduli richiedono un server HTTP. Non serve un servizio esterno per i test. Non sono incluse conversioni di unità, fisica o fixture scientifiche reali.

## Sorgenti, staging e rilascio

- `app/index.html` e `app/entry.ts`: ingresso locale di Vite, collegato a `src/main.ts`; non modificare manualmente l'HTML generato nella root del Planetario.
- `src/core`: bootstrap, configurazione, store delle azioni, capacità, metriche e lifetime.
- `src/rendering`: Engine/Scene, griglia generata, camera sullo schermo e ripristino del contesto.
- `src/input`: adattatore Pointer Events/tastiera e riconoscitore puro delle gesture.
- `src/xr`: sessione immersiva, tracciamento metrico, raggi e pannello tecnico.
- `src/data`: tipi normativi, schema JSON, controlli semantici e envelope draft.
- `src/ui`: diagnostica HTML e stile responsive.
- `tests`: fixture sintetiche e confronti con dati scientifici congelati; i test non entrano nel bundle.
- `tools`: percorsi fissi, build e promozione statica.
- `docs`: specifiche e registri delle fonti, rapporti delle Fasi 3 e 4.
- `.staging`, `.cache`, `.tmp`, `node_modules`: solo locali, ignorati da Git.
- `index.html` e `build/`: output statico versionato, necessario perché il workflow corrente non compila.

`data/` contiene originali JPL/NAIF, richieste, import, riferimenti indipendenti e rapporti con hash. `src/physics/` contiene calcolo, provider, clock e proiezione; `src/assets/` conserva le quattro texture originali. Le librerie Python per la sola acquisizione sono locali in `.tmp/science-tools`, escluse dalla build.

Il base path unico è `/UTILITY/planetario/`, definito in `tools/paths.ts` e usato da Vite e dal controllo di rilascio. Non si presume la root del sito. `emptyOutDir:false` impedisce a Vite di cancellare automaticamente l'output. `tools/build.ts` può pulire soltanto il figlio fisso `.staging`, dopo verifica del percorso e rifiuto di link/junction. Nessun parametro CLI consente di scegliere un'altra destinazione.

Lo script di rilascio accetta **solo** `index.html` e file JS/CSS/JPEG con hash dentro `build/`, senza sottodirectory; rifiuta file inattesi, link e riferimenti HTML fuori base path. Valida tutte le destinazioni prima delle scritture e scrive l'HTML per ultimo. Mantiene i vecchi asset con hash per le pagine già aperte; non effettua pulizie automatiche del rilascio. Una futura rimozione di asset obsoleti richiederà una procedura esplicita. Aggiungere nuovi formati alla allowlist soltanto quando necessari e con test dedicati. La promozione non è una transazione filesystem atomica contro un arresto del sistema durante la scrittura dell'HTML.

Non vengono modificati `.github`, server, indice generale o altre PWA. `gitkeep` è conservato.

## Validazione scientifica e limiti

`contracts.ts` traduce i quattro blocchi TypeScript di [DATA-MODEL](docs/DATA-MODEL.md) senza introdurre dipendenze dal motore. Include BodyData, fonti/provenienza/unità, elementi e rotazioni, BodyState/Provider, clock e proiezione. Il dominio resta SI, Float64, ECLIPJ2000, centro Sole, JD 2451545 TDB, ±1296000 s.

`validateBodyData` accetta bozze strutturalmente e semanticamente coerenti per revisione; la modalità `reviewed` richiede GM/raggio/rotazione, provenienza revisionata e hash sorgenti. Anche un record già dichiarato `reviewed` viene sottoposto a questi controlli. I fallimenti restituiscono codici, JSON Pointer e motivi, senza conversioni o correzioni automatiche.

`validateOrbitalElements` e `validateOrbitalImport` verificano struttura, unità, frame, centro e n/periodo. Il caricatore generico `loadOperationalDataset` continua a rifiutare le bozze. Il nuovo `EphemerisProvider.initialize` richiede rapporto passato, hash SHA-256 corrispondenti e griglia completa; un semplice flag reviewed non basta. La build ricalcola il confronto scientifico e rifiuta regressioni. I massimi misurati riguardano la griglia di controllo, non un limite dimostrato su ogni istante né l’errore fisico assoluto di JPL.

`npm run science:audit` rigenera il rapporto delle coniche, richiedendo l’unico fallimento noto Luna–Terra, e il rapporto operativo Hermite, che deve passare interamente. V12/V13 sono eseguiti con riferimenti JPL e CSPICE indipendenti dal codice TypeScript. `npm run test` verifica anche Keplero, invarianti, barycenter, clock, proiezione, orientamenti e rifiuto di dati non qualificati.

Acquisizione riproducibile, non necessaria all’avvio o alla normale build: Python 3.14, SpiceyPy 8.2.0 (CSPICE N0067) e NumPy 2.5.3. Eseguire `python tools/acquire-science.py`, `python tools/acquire-ephemeris.py`, `python tools/import-science.py`, poi `npm run science:audit`. Gli script non sovrascrivono risposte originali già presenti. I manifest versionati registrano la prima acquisizione di questo rilascio; una nuova acquisizione va revisionata e nuovamente qualificata.

Per capacità, `available` significa esito positivo della singola prova, `unavailable` assenza/esito negativo, `unverified` prova fallita/non completata. Per WebGPU viene rilevata soltanto l'API; nessun adattatore viene richiesto. Per WebXR viene interrogato `isSessionSupported('immersive-vr')` con timeout. Solo il pulsante Entra in VR richiede una sessione, quando supportata; un rifiuto lascia operativa la scena sullo schermo. Touch e Pointer Events non costituiscono prove di gesture fisiche.

Vedere [verifica Fase 3](docs/PHASE-3-VERIFICATION.md), [fonti scientifiche](docs/SCIENTIFIC-SOURCES.md), [fonti asset](docs/ASSET-SOURCES.md) e [roadmap](docs/ROADMAP.md). Nessun supporto iPad/Quest è dichiarato già qualificato.

## Comandi del collaudo tecnico separato (`?technical=1`)

Clic/tocco breve sulla sfera selezionano e aprono la scheda; trascinamento orbita; rotella/pinch zoom; due dita spostano il bersaglio. Il canvas gestisce le gesture soltanto nella propria area. Sui pannelli rimane lo scorrimento ordinario. Tastiera: frecce, +/−, Invio, Home, Escape; gli stessi comandi sono accessibili con pulsanti HTML. La scheda è non modale, si chiude senza perdere la selezione e restituisce il focus al comando di apertura.

Auto limita il rapporto pixel a 1,5; Qualità a 2; Prestazioni a 0,8. Su un monitor DPR 1 Auto e Qualità coincidono, mentre Prestazioni riduce realmente il buffer. In XR i controlli della camera e del profilo sono disabilitati; il tracciamento rimane nativo. Nessuna locomozione continua o animazione di camera.

Diagnostica e collaudo mostra FPS, intervallo frame, risoluzione, mesh/materiali/texture/draw call, stato XR e contatore selezioni. Misura 5 minuti raccoglie intervalli del render loop dopo 10 secondi di warm-up; non misura il tempo GPU né il compositor XR. Prova ripristino grafico simula la perdita del contesto; Riavvia scena smaltisce e ricrea le risorse. Questi pulsanti sono strumenti espliciti della Fase 4.
