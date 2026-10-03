# Verifica della Fase 3

**3 ottobre 2026 · versione applicativa 0.3.0 · sola struttura e build system.**

## Base e confini

`main` verificato alla ripresa: `99107d1ae7a3393c1bdd39fcbda97413aa4f49c8`. Le modifiche successive alla Fase 1 erano soltanto i due commit di Fase 2: `b025fe5a2231f38e32200f2a18edcb150b98b5ba` e `99107d1ae7a3393c1bdd39fcbda97413aa4f49c8`, sui quattro documenti normativi. Letti integralmente ARCHITECTURE, ROADMAP, DATA-MODEL e ACCEPTANCE-TESTS prima dell'implementazione.

Checkout locale dedicato con sparse checkout `planetario`. Nessuna modifica persistente fuori da `planetario/`; `gitkeep` conservato. Nessuna modifica a workflow, server, indice UTILITY o altre PWA. L'albero dei percorsi modificati viene verificato prima di ogni commit. Le specifiche scientifiche storiche restano invariate; ROADMAP aggiorna lo stato corrente.

## Ambiente e comandi eseguiti

Windows, Node **24.14.1**, npm **11.11.0**. Versioni dirette: Babylon **9.29.0**, TypeScript **7.0.2**, Vite **8.3.2**, Ajv **8.20.0**, tipi Node **24.19.1**. Metadati npm interrogati prima della selezione. Nessuna dipendenza prerelease; file di lock v3.

| Controllo | Evidenza | Esito |
| --- | --- | --- |
| `npm install` | AUTO, creazione lockfile | Riuscito: 25 pacchetti installati, audit npm senza vulnerabilità riportate al momento della prova |
| `npm ci` | AUTO, reinstallazione dal lockfile | Riuscito dopo arresto del dev server; 25 pacchetti installati |
| `npm run typecheck` | AUTO, strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes; dipendenze non escluse dal controllo | Riuscito |
| `npm run test` | AUTO, runner Node | **19 test superati, 0 falliti, 0 saltati** |
| `npm run build` | AUTO, Vite e verifica staging | Riuscito, 256 moduli trasformati |
| `npm run release` | AUTO, test → typecheck/build → allowlist → copia | Riuscito |
| `npm run dev` | Browser integrato Codex su Windows, URL locale | Avvio verificato a `/UTILITY/planetario/`; necessario un caricamento fresco dopo modifica HTML |
| `npm run preview` | Browser integrato Codex su Windows, build statica | Stato “Fase 3 — struttura inizializzata”, Babylon caricato, console error/warn vuota |
| HTTP di tutti i file statici | AUTO, GET + confronto SHA-256 con staging e destinazione | **27/27 HTTP 200 e identici**, 487479 byte totali non compressi |
| Perimetro Git | DOC/AUTO | Percorsi della consegna soltanto `planetario/`; gitkeep invariato |

La sandbox iniziale bloccava la rete e la creazione di sottoprocessi con `spawn EPERM`: installazione e runner/build sono stati eseguiti con l'escalation autorizzata. Una prima reinstallazione con Vite attivo incontrava un file nativo in uso; risolta fermando il server. Non sono difetti del progetto residui. Il test browser ha individuato e fatto correggere l'ingresso HTML relativo fuori dalla root Vite: ora passa tramite `app/entry.ts`.

## Cosa coprono i 19 test

- Configurazione di sottocartella e versione, backend WebGL 2.
- Capacità simulate: presenza/assenza API, XR rifiutato o non supportato, contesto non sicuro, distinzione WebGPU rilevato/non verificato. Nessuna sessione XR richiesta.
- Rilascio: `emptyOutDir:false`, staging interno, allowlist, ripetibilità, file inattesi e URL errati rifiutati, junction/link rifiutati, collisione di un asset immutabile, conservazione di documenti/gitkeep e file di un altro progetto sintetico.
- BodyData fittizio conforme; fonti assenti/non risolte/duplicate, URL/data/locator invalidi; numeri non finiti, GM non positivo, unità mancanti/sbagliate e chiavi sconosciute rifiutati.
- Identità/NAIF/grafo del moto, ragioni dei valori assenti, ordine dei raggi, frazioni, epoch/frame/periodo/verso della rotazione, conversioni prive di provenienza.
- Record draft escluso dalla modalità reviewed, hash e revisione richiesti; epoca/frame/centro/dominio/angoli/eccentricità/unità orbitali controllati; confronto del periodo e mean motion importati.
- Envelope sintetico completo coerente, chiavi e riferimenti verificati; nessuna autoqualificazione tramite un flag di stato e caricamento operativo sempre bloccato in Fase 3.

I valori sono esclusivamente fixture sintetiche, etichettate in ogni definizione e non incluse nei bundle. Nessuna conversione di unità generale o propagazione fisica implementata. A20 ha evidenza automatica per i controlli pertinenti a questa fase; A01–A19/A21–A34 e B01–B08 non sono dichiarati superati. V10 sui quaternion/poli calcolati e V12/V13 attendono i provider e riferimenti indipendenti.

## Browser e output

URL di sviluppo `http://127.0.0.1:5173/UTILITY/planetario/`; URL della build `http://127.0.0.1:4173/UTILITY/planetario/`. Browser **integrato Codex**, non equiparato a Chrome/Edge standalone. Versione del motore/browser e GPU non inventariate. Viewport osservata: 1280 CSS px, nessun overflow orizzontale; controllo visivo della pagina e screenshot locale conservato in `.tmp/phase3-desktop.jpg` (non destinato alla pubblicazione).

Osservato: WebGL 2 disponibile con creazione/rilascio di un contesto di prova, Pointer Events disponibile, indizio touch disponibile; `isSessionSupported('immersive-vr')` falso; API WebGPU rilevata ma adattatore non richiesto. Si tratta della configurazione del browser integrato, non del supporto a iPad/Quest. Canvas predisposto senza istanza Engine, Scene, camera o render loop.

Output: un HTML e 26 JS/CSS con hash dentro `build/`. SHA-256 di `index.html`:

```text
48ca219175d1d687486db41367a92370f4221c0d30c651a478bbabae4a9a2304
```

Tutti i riferimenti HTML appartengono al base path, tutti i file statici sono stati confrontati con HTTP. Il bundle non importa le fixture o il validatore non utilizzato dalla diagnostica. I moduli di supporto Babylon generati dal bundler non significano che texture, decoder o postprocessing vengano avviati; non sono stati caricati asset astronomici.

Log locali ignorati: `.tmp/quality-final.log`, `.tmp/http-check.json`, screenshot. Il totale statico riguarda la build completa su disco, non una misura del traffico iniziale o della memoria GPU. Gli spazi finali nelle stringhe shader Babylon vengono conservati byte per byte; `.gitattributes` esclude soltanto i JS generati dal controllo whitespace, senza alterare il bundle.

## Limiti e arresto

Non eseguiti: rendering Babylon della Fase 4, Safari/iPad/Android/Quest fisici, Chrome/Edge/Firefox standalone, stereo/controller/comfort, benchmark, confronto scientifico JPL, acquisizione PCK o texture. Non vengono assegnati risultati positivi alle relative righe della matrice di accettazione.

La prova locale e il commit Git non attestano da soli la pubblicazione pubblica. Il workflow esistente resta invariato; eventuali risultati GitHub Actions e HTTP pubblico devono essere registrati separatamente. Nessuna configurazione server richiesta o modificata.

**Criteri di uscita della Fase 3 soddisfatti. Arresto prima della Fase 4.**
