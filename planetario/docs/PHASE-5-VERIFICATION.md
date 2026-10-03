# Fase 5 — Rapporto di verifica

3 ottobre 2026 · v0.5.0 · base `ab3c976384983bf939d3950c0fb744d78ff14be2`. Modifiche circoscritte a `planetario/`; `gitkeep` preservato. La Fase 6 non è avviata.

## Esito scientifico

Revisione esplicita [ADR-005](ADR-005-EPHEMERIS.md): il modello lunare a conica congelata non supera la soglia, quindi non alimenta la scena. L’applicazione usa le effemeridi JPL interpolate. Hash, richieste e versioni sono nei file `data/*acquisition.json`, gli originali in `data/raw/`. I numeri seguenti sono errori sui campioni di controllo, non garanzie di accuratezza fisica assoluta.

| Controllo | Evidenza | Esito |
| --- | --- | --- |
| Tre coniche contro CSPICE N0067 / SpiceyPy 8.2.0 | 241 istanti ×3; massimo relativo <1,2×10⁻¹² | PASS interno |
| Coniche contro Horizons | 121 punti ogni 6 h +120 intermedi | FAIL Luna/Terra: 45.233 km contro 30.000 km |
| Hermite operativo contro campioni esclusi dai nodi | 720 mezz’ore ×5 serie, passo nodi 1 h | PASS |
| Posizione Luna/Terra | max 0,015320 m; soglia 100 m | PASS |
| Posizione eliocentrica | max 0,015295 m (Luna); soglia 1000 m | PASS |
| Velocità | max <6,84×10⁻⁸ m/s; soglia 0,01 m/s | PASS |
| Orientamento vs PCK completo | 241 istanti ×4 corpi | PASS: Luna <0,0711°, altri <0,00035° |
| Keplero, energia, momento angolare | 1000 fasi, casi circolari e limiti | PASS automatico |
| Chiusura baricentrica | posizione ≤1 mm, velocità ≤10⁻⁸ m/s | PASS automatico |
| Poli, quaternion e basi destrorse | norma/determinante entro 10⁻¹² | PASS automatico |
| Clock 30/60/90 Hz, pausa, reset, sospensione, limite | sequenze temporali indipendenti dal rendering | PASS automatico |
| Scale e origine | rapporti fisici, snapshot immutati, rebase compensato ≤10⁻⁹ u | PASS automatico |
| Passaggio vicino/locale | isteresi 6/8 R, camera/target compensati | PASS automatico e browser |
| Loader | stato non pronto, dati alterati, rapporto fallito, abort, fuori dominio | PASS automatico |

Le prove sono riproducibili con `npm run test` e `npm run science:audit`. Il report delle coniche resta intenzionalmente FAIL; il comando di audit verifica che l’unica violazione sia quella già documentata. Il rapporto operativo deve passare senza eccezioni. `npm run release` esegue test, typecheck, audit, build e controllo allowlist.

## Interfaccia e rendering

Quattro corpi in geometria canonica (+Z nord, +X meridiano zero, +Y est), orientamento attivo PCK→ECLIPJ2000→Babylon Y-up. Luce direzionale calcolata dalla posizione fisica del Sole per ciascun corpo; niente ombre generate dai raggi ingranditi. Sole emissivo con mappa e attenuazione qualitativa al bordo. Nessun dato fisico derivato dalle coordinate ridotte della scena.

Scientific/Exploratory: raggi e distanze nella stessa scala. Didactic/system: Sole ×5, Terra/Luna/Marte ×1000, distanze invariate. Nelle viste di dettaglio tutti i fattori tornano 1. Il gruppo Terra/Luna resta selezionabile nell’elenco senza spostamenti nascosti. I marcatori sono indicatori HTML da almeno 44 px, separati dai raggi delle mesh. I corpi remoti fuori volume non vengono renderizzati come sfere giganti; si raggiungono dall’elenco. I comandi della Fase 5 limitano camera e pan entro la zona numericamente stabile; un libero spostamento oltre 32 u non è esposto. La compensazione di origine è verificata dalla proiezione pura; il percorso di rebase libero/XR resta alle successive interazioni.

Guide: 2048 segmenti per le ellissi di riferimento; percorso lunare relativo valutato ogni 15 minuti. Nessuna falsa orbita terrestre chiusa. Mappa 2K richiesta solo alla prima osservazione o alla scala didattica; fallback colorato mantenuto durante il download e in caso di errore. Materiali, engine, listener e provider hanno smaltimento esplicito. La fase precedente resta raggiungibile con `?technical=1`.

## Prove browser realmente eseguite

Browser integrato Codex su Windows, anteprima statica `http://127.0.0.1:4185/UTILITY/planetario/`. Non equivale a Chrome/Edge autonomi o a Safari fisico. La precedente porta dev 5173 restituiva nel browser una vecchia pagina e un errore websocket; il contenuto HTTP locale corrente era corretto. La verifica è stata quindi effettuata sulla build statica in una porta nuova, senza dipendere da HMR.

- Apertura, scelta e osservazione di Sole, Terra, Luna e Marte; caricamento di tutte le texture confermato dalla diagnostica DOM. Terra ispezionata per orientamento nord/sud e disposizione dei continenti; Sole corretto dopo rilevazione della saturazione del materiale iniziale.
- Passaggio scientifica/didattica/esplorativa; dichiarazioni dei fattori e distanza fisica invariata a t=0.
- Avvio a ×100000, arresto esatto a +1296000 s, pulsante Avvia disabilitato a fine dominio, reset a t=0/×1/pausa.
- Passaggio vicino→locale e ritorno: le coordinate fisiche restano immutate, cambia la sola proiezione.
- Viewport simulate 1024×768 e 390×844: nessun overflow orizzontale; pulsanti/select visibili con altezza ≥44 px. Pannello sotto la scena nel formato stretto. Non sono test iPad fisici.
- Contatore del render loop osservato intorno a 60 FPS nelle scene provate: dato indicativo della sessione, non misura GPU né benchmark termico di 15 minuti.

Build locale finale: **43/43 test**, TypeScript e audit scientifico passati; **58/58 file HTTP locali** identici allo staging e al rilascio. Browser dichiarato dal collaudo: Windows NT 10.0, Chrome/154.0.0.0 nel browser integrato Codex. Collaudo tecnico separato aperto e selezione confermata una sola volta, senza errori di console. Gli spazi finali nei kernel originali NAIF sono preservati intenzionalmente; non normalizzare le fonti acquisite. `.gitattributes` impedisce conversioni di terminatore sui dati per conservare gli hash. Le evidenze di pubblicazione e commit sono riportate nella sezione finale. La ripresa da una vera sospensione OS, gesture su iPad, stereo, trigger e comfort Quest non sono stati verificati in questa fase. I limiti della matrice B01–B08 restano quelli del rapporto Fase 4; non vengono chiusi per analogia.

## Limiti residui

Orientamenti semplificati, superfici sferiche e mappe illustrative; niente previsioni di eclissi. Nessuna atmosfera o nube aggiuntiva. Stati soltanto nei 30 giorni J2000. La UI iniziale percorre t≥0 con rate positivi; la copertura scientifica negativa è verificata dal provider, ma la navigazione libera del calendario appartiene al completamento dei controlli. Lezioni complete, Gravity/Light Lab, audio, navigazione XR astronomica e ottimizzazione hardware non sono parte della Fase 5.


## Pubblicazione verificata

Commit scientifico: `4b7bed7d33dd2e19340acd52e158efd36e4c407e`. Commit scena/rilascio: `2f55adbc3f05d9ec6ce36f5894ff0c1e08bea444`. Alberi Git remoti confrontati con quelli locali prima di aggiornare main; identità confermata. Nessuna modifica fuori da `planetario/`; blob gitkeep invariato `8b137891791fe96927ad78e64b0aad7bded08bdc`.

Workflow del rilascio entrambi SUCCESS: [Deploy to gbprof server 37114041401](https://github.com/gb69prof/UTILITY/actions/runs/37114041401), [Pages 37114040979](https://github.com/gb69prof/UTILITY/actions/runs/37114040979).

[URL pubblico](https://gbprof.it/UTILITY/planetario/): **58/58 risorse HTTP 200**, bytes e SHA-256 coincidenti con staging e rilascio. Dettaglio in [phase5-public-http.json](phase5-public-http.json). HTML SHA-256 `cb77ef9a011ddd8f45c2ad41a99d46f4e941efc7aa8fd152dfd24c82b4f175b3`. Il primo confronto aveva rilevato solo i terminatori di riga dell’HTML locale: la build ora normalizza esplicitamente a LF come Git, preservando invece i byte delle fonti scientifiche.

Browser pubblico: avvio scientifico, Sole con fotosfera emissiva e attenuazione al bordo, Terra con texture caricata e vista locale; ×100000 fino a +15 giorni, blocco di Avvia e reset a t=0/×1/pausa confermati. Nessun errore/warning di console. Viewport pubblica 1280×900 senza overflow orizzontale. Cattura dell’anteprima salvata localmente; il risultato è stato lasciato aperto nel browser. Le prove fisiche iPad/Quest non sono state eseguite.

Integrità degli originali: tutti i 19 blob Git delle acquisizioni scientifiche e delle texture corrispondono agli hash dei manifest. Il successivo commit di questa evidenza e della normalizzazione HTML non cambia i byte dell’applicazione già verificata sul server.


Perfezionamento della provenienza: commit `5816053791938660f70e7c9e0cbbccc86e3ac8a0`, con coefficienti originali PCK in deg/day, trasformazioni distinte per polo/meridiano/spin/periodo/obliquità e doppia fonte per il GM marziano derivato. Confronto ricorsivo: valori numerici, unità, frame, epoca e intervallo immutati; precisata anche la definizione testuale del GM effettivo di Marte. Nuova esecuzione: 43/43 test e audit passati, 58/58 file pubblici identici. Workflow del rilascio definitivo SUCCESS: [Deploy 37114513003](https://github.com/gb69prof/UTILITY/actions/runs/37114513003), [Pages 37114512735](https://github.com/gb69prof/UTILITY/actions/runs/37114512735). Il manifest HTTP allegato e l’hash HTML sopra riportato si riferiscono a questa build finale.
