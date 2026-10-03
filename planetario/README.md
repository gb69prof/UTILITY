# Planetario gbprof

**Versione 0.3.0 · Fase 3 — struttura e build system.**

Il progetto prepara un osservatorio scientifico per gbprof.it. Attualmente esiste il nucleo tecnico: pagina diagnostica, import Babylon.js, canvas predisposto, contratti scientifici e validazione. Non esistono ancora scena 3D, Sistema solare, propagatore orbitale, orologio eseguibile o sessioni XR. La Fase 4 richiede un nuovo incarico.

## Prerequisiti e versioni

Usare Node.js **24.14.1** (ramo 24, almeno questa versione) e npm **11.11.0**; il ramo npm 11 è ammesso. Il runner di test usa il supporto TypeScript nativo di Node 24, senza transpiler aggiuntivo. Fermare il server prima di reinstallare le dipendenze: Windows può bloccare la sostituzione della libreria nativa di Rolldown in uso.

| Dipendenza diretta | Versione esatta | Funzione |
| --- | --- | --- |
| `@babylonjs/core` | 9.29.0 | Import mirato del modulo Engine |
| `typescript` | 7.0.2 | Controllo statico rigoroso |
| `vite` | 8.3.2 | Sviluppo e compilazione statica |
| `ajv` | 8.20.0 | JSON Schema draft 2020-12 |
| `@types/node` | 24.19.1 | Tipi di strumenti e test Node 24 |

Versioni stabili ricavate dai metadati npm il 3 ottobre 2026; nessuna versione preview o intervallo nelle dipendenze dirette. `package-lock.json` blocca anche le dipendenze transitive. Node 24 soddisfa il requisito di Vite `^20.19.0 || >=22.12.0`; TypeScript richiede Node ≥16.20.0. Compatibilità dei pacchetti controllata con installazione, typecheck senza `skipLibCheck` e build reali.

Vite transpila per Chrome/Edge 111, Firefox 114 e Safari 16.4 o successivi; questi sono **target del codice generato**, non dispositivi già certificati. Verificare separatamente WebGL 2 e WebXR. Babylon importa il backend WebGL; WebGPU è solo una voce diagnostica. I controlli di rendering/stereo/controller della Fase 4 restano aperti. Riferimenti: [Vite, requisiti](https://vite.dev/guide/), [opzioni di build](https://vite.dev/config/build-options), [Babylon, moduli ES](https://github.com/BabylonJS/Documentation/blob/master/content/setup/frameworkPackages/es6Support.md), [Babylon, WebXR](https://github.com/BabylonJS/Documentation/blob/master/content/features/featuresDeepDive/webXR/introToWebXR.md).

## Comandi

Eseguire dalla cartella `UTILITY/planetario`, mai dalla root di UTILITY:

```sh
npm ci
npm run dev
```

Aprire `http://127.0.0.1:5173/UTILITY/planetario/`. Il server ascolta solo sul computer locale. Per i futuri test sui dispositivi servirà un URL HTTPS valido: non è predisposto un server LAN o un certificato in questa fase.

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
| `test` | Runner Node: contratti, validatori, capacità simulate e confinamento del rilascio |
| `build` | Typecheck, pulizia controllata della sola `.staging`, build Vite e controllo allowlist |
| `release` | Test + build completa + copia statica consentita; nessun push o comando server |
| `preview` | Serve lo staging su `http://127.0.0.1:4173/UTILITY/planetario/` |

Non aprire l'HTML tramite `file://`: i moduli richiedono un server HTTP. Non serve un servizio esterno per i test. Non sono incluse conversioni di unità, fisica o fixture scientifiche reali.

## Sorgenti, staging e rilascio

- `app/index.html` e `app/entry.ts`: ingresso locale di Vite, collegato a `src/main.ts`; non modificare manualmente l'HTML generato nella root del Planetario.
- `src/core`: bootstrap, configurazione, capacità ed errori visibili.
- `src/rendering`: confine Babylon con import mirato e riferimento al canvas; nessuna istanza Engine o Scene.
- `src/data`: tipi normativi, schema JSON, controlli semantici e envelope draft.
- `src/ui`: diagnostica HTML e stile responsive.
- `tests`: dati **fittizi di collaudo**, mai importati dall'applicazione o pubblicati nel bundle.
- `tools`: percorsi fissi, build e promozione statica.
- `docs`: specifiche e registri delle fonti, rapporto della Fase 3.
- `.staging`, `.cache`, `.tmp`, `node_modules`: solo locali, ignorati da Git.
- `index.html` e `build/`: output statico versionato, necessario perché il workflow corrente non compila.

Le directory scenes/physics/xr/assets/public verranno introdotte quando ospiteranno implementazioni o risorse effettive. Non ci sono cartelle vuote decorative né asset astronomici.

Il base path unico è `/UTILITY/planetario/`, definito in `tools/paths.ts` e usato da Vite e dal controllo di rilascio. Non si presume la root del sito. `emptyOutDir:false` impedisce a Vite di cancellare automaticamente l'output. `tools/build.ts` può pulire soltanto il figlio fisso `.staging`, dopo verifica del percorso e rifiuto di link/junction. Nessun parametro CLI consente di scegliere un'altra destinazione.

Lo script di rilascio accetta **solo** `index.html` e file JS/CSS con hash dentro `build/`, senza sottodirectory; rifiuta file inattesi, link e riferimenti HTML fuori base path. Valida tutte le destinazioni prima delle scritture e scrive l'HTML per ultimo. Mantiene i vecchi asset con hash per le pagine già aperte; non effettua pulizie automatiche del rilascio. Una futura rimozione di asset obsoleti richiederà una procedura esplicita. Aggiungere nuovi formati alla allowlist soltanto quando necessari e con test dedicati. La promozione non è una transazione filesystem atomica contro un arresto del sistema durante la scrittura dell'HTML.

Non vengono modificati `.github`, server, indice generale o altre PWA. `gitkeep` è conservato.

## Validazione scientifica e limiti

`contracts.ts` traduce i quattro blocchi TypeScript di [DATA-MODEL](docs/DATA-MODEL.md) senza introdurre dipendenze dal motore. Include BodyData, fonti/provenienza/unità, elementi e rotazioni, BodyState/Provider, clock e proiezione. Il dominio resta SI, Float64, ECLIPJ2000, centro Sole, JD 2451545 TDB, ±1296000 s.

`validateBodyData` accetta bozze strutturalmente e semanticamente coerenti per revisione; la modalità `reviewed` richiede GM/raggio/rotazione, provenienza revisionata e hash sorgenti. Anche un record già dichiarato `reviewed` viene sottoposto a questi controlli. I fallimenti restituiscono codici, JSON Pointer e motivi, senza conversioni o correzioni automatiche.

`validateOrbitalElements` controlla unità, frame, epoca, dominio e centri; `validateOrbitalImport` confronta mean motion (rad/s) e periodo (s) importati con a e μ. `validateDatasetDraft` risolve il grafo dell'envelope, distinguendo EMB dalla Terra. `loadOperationalDataset` **rifiuta sempre** in Fase 3: non esistono ancora provider e rapporti indipendenti V12/V13. Nessun campo inserito a mano può attribuire automaticamente la qualifica astronomica. La diagnostica non carica dataset.

Implementati V01–V07, V09, V11, V14 per i record previsti; V08 come funzione di controllo all'importazione; V10 per periodo/verso dello spin. Norma di quaternion/polo degli stati, calcoli baricentrici, confronti JPL, copertura dei campioni di effemeridi e rapporti V12/V13 saranno verificati insieme ai futuri provider. I test sui numeri fittizi verificano il software, non l'accuratezza astronomica.

Per capacità, `available` significa esito positivo della singola prova, `unavailable` assenza/esito negativo, `unverified` prova fallita/non completata. Per WebGPU viene rilevata soltanto l'API; nessun adattatore viene richiesto. Per WebXR viene interrogato `isSessionSupported('immersive-vr')` con timeout, senza richiedere sessioni o permessi. Touch e Pointer Events non costituiscono prove di gesture fisiche.

Vedere [verifica Fase 3](docs/PHASE-3-VERIFICATION.md), [fonti scientifiche](docs/SCIENTIFIC-SOURCES.md), [fonti asset](docs/ASSET-SOURCES.md) e [roadmap](docs/ROADMAP.md). Nessun supporto iPad/Quest è dichiarato già qualificato.
