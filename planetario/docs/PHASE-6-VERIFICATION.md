# Fase 6 — Interazioni desktop e touch

3 ottobre 2026 · v0.6.0 · base `b2d4583eaa411a118abcb73ecbb2a73924f3fd4d`. Ambito: solo `planetario/`; `gitkeep`, dati scientifici, fonti e texture originali invariati. Fase 7 non avviata.

## Implementazione

- Un controller applicativo per tutte le azioni dello schermo astronomico, con envelope, validazione, deduplicazione, selezione distinta dal fuoco e cleanup delle sessioni.
- Orbita, zoom, pan proporzionato al viewport, centratura, osservazione e panoramica con mouse, tastiera e controlli HTML. Un dito: Orbita/Sposta; due dita: pan del centro e pinch. Anche i marcatori distinguono tap e drag.
- Chiusura/riapertura scheda, Esc e restituzione del focus; i campi conservano i propri tasti nativi. Comandi sulla scena solo quando il canvas ha il focus. Nessuna animazione obbligatoria.
- Cursore di tempo TDB ±15 giorni; seek in pausa, rate invariato, reset t=0/×1/pausa, selezione conservata. Arresto esatto a +15 giorni; selezionare un istante precedente riabilita Avvia senza avvio implicito.
- Pannello laterale in landscape e sotto la scena in portrait fino a 1100 px. Comandi in flusso e pagina scorrevole; cattura dei gesti limitata a canvas/marcatori.

## Evidenze automatiche

`npm run release`: **51/51 test passati**, TypeScript rigoroso e build passati. Gli otto nuovi test verificano parità dei quattro adattatori, duplicati/non finiti/ID errati/dispose, 20 tap, soglia di drag, ritorno al punto iniziale, secondo/terzo dito, cancellazione, centro del pinch, sensibilità relativa al viewport, tastiera, seek ai limiti, blocchi ambientali, reset e limite della camera. I test precedenti conservano isteresi vicino/locale, invarianza delle coordinate scientifiche e lifecycle.

Audit scientifico invariato: il vecchio modello a coniche resta escluso per l'errore lunare; il provider operativo JPL e il suo rapporto passano. Nessun dato né soglia scientifica modificati. **58/58 file HTTP locali** identici a staging e rilascio, porta 4186.

## Browser integrato Windows

Prove reali di interfaccia nel browser integrato Codex, distinte dai test fisici:

- Osserva Terra e Luna caricano le mappe; frecce orbitano, Maiusc + frecce sposta. Drag del canvas cambia yaw senza incrementare le selezioni. Sposta + drag cambia pan, conserva selezione e fuoco. Centra azzera pan.
- Click sul marcatore Marte: una sola selezione, camera ancora di sistema. Drag iniziato sul marcatore Sole: orbita e zero selezioni aggiuntive.
- Selezionare Luna durante l'osservazione della Terra aggiorna solo la scheda. Osserva Luna cambia fuoco; Esc dal pulsante Osserva chiude la scheda e riporta il focus al pulsante Luna. Home sul canvas torna al sistema conservando Luna.
- Slider Home seleziona esattamente −1296000 s; End +1296000 s con Avvia disabilitato. Freccia sinistra seleziona 14,99 giorni in pausa. Reset conserva camera/selezione e ripristina ×1; ×100000 + Avvia incrementa il tempo condiviso.
- Viewport simulate 1280×900, 1024×768, 768×1024 e 390×844. Portrait 768: pannello sotto la scena; landscape 1024: pannello laterale. A 768 e 390 nessun overflow orizzontale e controlli visibili alti almeno 44 CSS px. Le aree della pagina esterne al canvas restano scorrevoli.

## Verifiche aperte e protocollo fisico

**Non qualificati:** Safari su iPad fisico, touch nativo/pinch reale, rotazione fisica, zoom effettivo del testo al 200%, browser Chrome/Edge autonomi, Quest. Il browser integrato non ha applicato la scorciatoia di zoom pagina: non viene dichiarato un test 200%. Le viewport ridotte non lo sostituiscono. Il criterio di uscita della Fase 6 resta parzialmente aperto per questi controlli.

Su iPad: provare 20 tap su Terra e Luna, drag che ritorna all'origine, pinch con rilascio alternato delle dita, passaggio a tre dita, trascinamento sui marcatori, cambio app e rotazione durante un gesto. Non devono partire osservazioni/viaggi né selezioni accidentali. Provare Orbita/Sposta, Centra, Osserva, panoramica e cursore tempo in entrambi gli orientamenti. Portare il testo al 200% e verificare ogni comando scorrendo il pannello senza muovere la scena. Registrare dispositivo, sistema, browser, esito e video; non dedurre l'esito dalle simulazioni automatiche.

## Pubblicazione

Esito remoto e manifest HTTP da registrare dopo il rilascio.
