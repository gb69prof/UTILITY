# Planetario gbprof

**Versione 0.4.0 · Fase 4 — motore 3D minimo e verifica dei rischi.**

Il progetto prepara un osservatorio scientifico per gbprof.it. La prova corrente mostra una sfera tecnica con griglia UV generata, camera orbitale, picking, scheda HTML e diagnostica. Mouse, tastiera, touch e trigger XR convergono sullo stesso stato applicativo. Non contiene corpi astronomici o propagazione orbitale. **Fermarsi prima della Fase 5.**

Aprire [la prova pubblica](https://gbprof.it/UTILITY/planetario/). I risultati e le lacune di collaudo sono in [PHASE-4-VERIFICATION](docs/PHASE-4-VERIFICATION.md); la procedura per il visore è in [QUEST-TEST](docs/QUEST-TEST.md). Il supporto fisico iPad/Quest non è ancora qualificato.

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
- `tests`: dati **fittizi di collaudo**, mai importati dall'applicazione o pubblicati nel bundle.
- `tools`: percorsi fissi, build e promozione statica.
- `docs`: specifiche e registri delle fonti, rapporti delle Fasi 3 e 4.
- `.staging`, `.cache`, `.tmp`, `node_modules`: solo locali, ignorati da Git.
- `index.html` e `build/`: output statico versionato, necessario perché il workflow corrente non compila.

Le altre directory saranno introdotte quando ospiteranno implementazioni o risorse effettive. Non ci sono cartelle vuote decorative né asset astronomici.

Il base path unico è `/UTILITY/planetario/`, definito in `tools/paths.ts` e usato da Vite e dal controllo di rilascio. Non si presume la root del sito. `emptyOutDir:false` impedisce a Vite di cancellare automaticamente l'output. `tools/build.ts` può pulire soltanto il figlio fisso `.staging`, dopo verifica del percorso e rifiuto di link/junction. Nessun parametro CLI consente di scegliere un'altra destinazione.

Lo script di rilascio accetta **solo** `index.html` e file JS/CSS con hash dentro `build/`, senza sottodirectory; rifiuta file inattesi, link e riferimenti HTML fuori base path. Valida tutte le destinazioni prima delle scritture e scrive l'HTML per ultimo. Mantiene i vecchi asset con hash per le pagine già aperte; non effettua pulizie automatiche del rilascio. Una futura rimozione di asset obsoleti richiederà una procedura esplicita. Aggiungere nuovi formati alla allowlist soltanto quando necessari e con test dedicati. La promozione non è una transazione filesystem atomica contro un arresto del sistema durante la scrittura dell'HTML.

Non vengono modificati `.github`, server, indice generale o altre PWA. `gitkeep` è conservato.

## Validazione scientifica e limiti

`contracts.ts` traduce i quattro blocchi TypeScript di [DATA-MODEL](docs/DATA-MODEL.md) senza introdurre dipendenze dal motore. Include BodyData, fonti/provenienza/unità, elementi e rotazioni, BodyState/Provider, clock e proiezione. Il dominio resta SI, Float64, ECLIPJ2000, centro Sole, JD 2451545 TDB, ±1296000 s.

`validateBodyData` accetta bozze strutturalmente e semanticamente coerenti per revisione; la modalità `reviewed` richiede GM/raggio/rotazione, provenienza revisionata e hash sorgenti. Anche un record già dichiarato `reviewed` viene sottoposto a questi controlli. I fallimenti restituiscono codici, JSON Pointer e motivi, senza conversioni o correzioni automatiche.

`validateOrbitalElements` controlla unità, frame, epoca, dominio e centri; `validateOrbitalImport` confronta mean motion (rad/s) e periodo (s) importati con a e μ. `validateDatasetDraft` risolve il grafo dell'envelope, distinguendo EMB dalla Terra. `loadOperationalDataset` **rifiuta sempre** anche in Fase 4: non esistono ancora provider e rapporti indipendenti V12/V13. Nessun campo inserito a mano può attribuire automaticamente la qualifica astronomica. La diagnostica non carica dataset.

Implementati V01–V07, V09, V11, V14 per i record previsti; V08 come funzione di controllo all'importazione; V10 per periodo/verso dello spin. Norma di quaternion/polo degli stati, calcoli baricentrici, confronti JPL, copertura dei campioni di effemeridi e rapporti V12/V13 saranno verificati insieme ai futuri provider. I test sui numeri fittizi verificano il software, non l'accuratezza astronomica.

Per capacità, `available` significa esito positivo della singola prova, `unavailable` assenza/esito negativo, `unverified` prova fallita/non completata. Per WebGPU viene rilevata soltanto l'API; nessun adattatore viene richiesto. Per WebXR viene interrogato `isSessionSupported('immersive-vr')` con timeout. Solo il pulsante Entra in VR richiede una sessione, quando supportata; un rifiuto lascia operativa la scena sullo schermo. Touch e Pointer Events non costituiscono prove di gesture fisiche.

Vedere [verifica Fase 3](docs/PHASE-3-VERIFICATION.md), [fonti scientifiche](docs/SCIENTIFIC-SOURCES.md), [fonti asset](docs/ASSET-SOURCES.md) e [roadmap](docs/ROADMAP.md). Nessun supporto iPad/Quest è dichiarato già qualificato.

## Comandi della prova

Clic/tocco breve sulla sfera selezionano e aprono la scheda; trascinamento orbita; rotella/pinch zoom; due dita spostano il bersaglio. Il canvas gestisce le gesture soltanto nella propria area. Sui pannelli rimane lo scorrimento ordinario. Tastiera: frecce, +/−, Invio, Home, Escape; gli stessi comandi sono accessibili con pulsanti HTML. La scheda è non modale, si chiude senza perdere la selezione e restituisce il focus al comando di apertura.

Auto limita il rapporto pixel a 1,5; Qualità a 2; Prestazioni a 0,8. Su un monitor DPR 1 Auto e Qualità coincidono, mentre Prestazioni riduce realmente il buffer. In XR i controlli della camera e del profilo sono disabilitati; il tracciamento rimane nativo. Nessuna locomozione continua o animazione di camera.

Diagnostica e collaudo mostra FPS, intervallo frame, risoluzione, mesh/materiali/texture/draw call, stato XR e contatore selezioni. Misura 5 minuti raccoglie intervalli del render loop dopo 10 secondi di warm-up; non misura il tempo GPU né il compositor XR. Prova ripristino grafico simula la perdita del contesto; Riavvia scena smaltisce e ricrea le risorse. Questi pulsanti sono strumenti espliciti della Fase 4.
