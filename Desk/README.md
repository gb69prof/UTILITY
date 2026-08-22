# Desk LIM

> Il Desk appartiene al docente. La LIM appartiene alla lezione.

Desk LIM è una PWA statica, installabile e pensata per PC, tablet e iPad. Il Controller conserva cartelle, file, URL e strumenti del docente. Il Viewer LIM (`lim.html`) mostra esclusivamente il materiale inviato con un comando deliberato.

## Funzioni della prima release

- importazione singola, multipla e di cartelle (`webkitdirectory` dove supportato);
- drag & drop da sistema e spostamento di elementi sopra una cartella;
- cartelle virtuali, rinomina, spostamento, eliminazione ricorsiva, ricerca, preferiti e recenti;
- vista a icone o elenco, ordinamento e menu contestuale (click destro / pressione prolungata);
- persistenza reale di metadati e file binari in IndexedDB;
- viewer privato ridimensionabile e separato dalla LIM;
- PDF, immagini, audio, video, testo, HTML locale e URL;
- posizione PDF, zoom immagine e posizione media ricordati;
- comandi `Mostra alla LIM`, `Oscura`, `Ripristina`, `Chiudi proiezione` e schermo intero;
- stato di collegamento e riepilogo/anteprima semantica del contenuto proiettato;
- scrivanie di lezione salvabili, duplicabili, riordinabili e avviabili in sequenza;
- tema chiaro, scuro o automatico;
- app shell offline tramite service worker;
- layout desktop, iPad portrait/landscape e mobile con supporto mouse, touch e tastiera.

## Architettura

```text
Controller (index.html)
  ├─ Desk privato + Viewer privato
  ├─ IndexedDB: file, cartelle, scrivanie, impostazioni
  └─ comando esplicito
          │ BroadcastChannel + storage event fallback
          ▼
Viewer LIM (lim.html)
  └─ legge solo l’item richiesto da IndexedDB e lo mostra a tutto schermo
```

Il Controller non trasmette la propria interfaccia. Invia soltanto l’identificatore del materiale e lo stato utile (per esempio la pagina del PDF). `lim.html` non contiene file manager, percorsi locali o pannelli privati.

## Uso con un secondo monitor

1. Aprire Desk LIM nel browser sul PC del docente.
2. Premere **Viewer LIM**: si apre `lim.html` in una finestra dedicata.
3. Spostare quella finestra sul monitor esteso/LIM e premere **Schermo intero**.
4. Aprire e preparare privatamente un materiale nel Controller.
5. Premere **Mostra alla LIM** solo quando è pronto.

Questa è la modalità completa e più robusta della release statica: le due finestre usano la stessa origine e lo stesso profilo browser, quindi condividono IndexedDB e BroadcastChannel.

## Uso tramite rete locale: limite reale

Una pubblicazione puramente statica su GitHub Pages non può sincronizzare in modo affidabile due dispositivi distinti. `BroadcastChannel`, gli eventi `storage` e IndexedDB sono confinati allo stesso browser/origine locale: una LIM aperta su un altro PC non può leggere i file archiviati nell’iPad del docente.

La successiva estensione di rete dovrà aggiungere un piccolo servizio autenticato con:

- WebSocket o Server-Sent Events per stato e comandi;
- WebRTC per il trasferimento diretto dei file, con signaling via server;
- codice stanza breve o QR temporaneo;
- cifratura, scadenza della sessione e nessuna esposizione dell’archivio completo;
- eventuale cache effimera lato LIM, cancellata alla chiusura della lezione.

Il protocollo interno è già separato (`lim-controller.js` / `lim-viewer.js`) per permettere di sostituire il trasporto locale senza riscrivere il Desk.

## Formati supportati

| Formato | Comportamento |
|---|---|
| PDF | Viewer PDF nativo del browser, pagina iniziale controllata dal Desk, zoom/ricerca disponibili nella toolbar nativa quando il browser li espone |
| JPG, PNG, WEBP, GIF, SVG, AVIF | Viewer con zoom, adattamento e rotazione |
| MP4, WEBM e formati video decodificati dal browser | Player HTML5 |
| MP3, WAV, OGG, M4A e formati audio decodificati dal browser | Player HTML5 |
| TXT, MD, CSV, JSON, XML, CSS, JS | Anteprima testuale |
| HTML singolo | iframe sandboxed; risorse relative esterne al file non vengono ricostruite |
| URL / PWA web | iframe quando il sito lo consente, più apertura esterna |
| DOCX, XLSX, PPTX e altri Office | conservazione e download/apertura nell’app nativa; nessuna falsa anteprima |

### Perché Office non viene simulato

Una resa fedele di DOCX/XLSX/PPTX richiede librerie specifiche con compatibilità parziale oppure una conversione server-side (preferibilmente LibreOffice headless verso PDF). La prima release sceglie l’onestà tecnica: conserva il file ma raccomanda la conversione in PDF per la proiezione.

## File locali, iPad e persistenza

- Chrome/Edge desktop: input multiplo, drag & drop, importazione cartella e IndexedDB.
- Safari/iPadOS: selettore file nativo e IndexedDB; drag & drop e importazione cartelle dipendono dalla versione del sistema.
- File System Access API non è indispensabile, perché non è disponibile in modo uniforme su Safari/iPadOS.
- I file binari non vengono mai inseriti in `localStorage`.
- Il browser può imporre quote e rimuovere dati in condizioni di forte pressione sullo spazio. Desk LIM richiede, quando possibile, la persistenza dello storage; per materiale insostituibile resta prudente conservare gli originali anche fuori dall’app.

## Offline

Il service worker salva l’app shell. Il Desk, il Viewer LIM e i file già importati restano utilizzabili offline. URL e PWA remote non sono garantiti offline se il browser non li ha già memorizzati autonomamente.

## Privacy e sicurezza

- nessuna selezione viene proiettata automaticamente;
- **Apri** modifica soltanto il Viewer privato;
- il contenuto sulla LIM cambia soltanto con **Mostra alla LIM**;
- il Viewer LIM non legge o elenca l’intero Desk;
- nessun token, password, API key o percorso filesystem è incorporato;
- gli HTML locali vengono aperti in iframe sandboxed;
- i dati restano nel profilo browser del dispositivo.

## GitHub Pages

Tutti i percorsi sono relativi. Manifest, `start_url`, `scope`, service worker e asset funzionano sotto:

```text
https://gb69prof.github.io/UTILITY/Desk/
```

## Verifica manuale del flusso centrale

1. Aprire `index.html` e `lim.html` dalla stessa origine in due finestre.
2. Importare tre PDF, due immagini e un video.
3. Creare `Leopardi`, quindi spostarvi alcuni file.
4. Aprire un PDF: il Controller passa a Desk + Viewer, la LIM resta invariata.
5. Impostare una pagina e premere **Mostra alla LIM**.
6. Aprire privatamente un’immagine: la LIM deve conservare il PDF.
7. Premere **Mostra alla LIM**: soltanto ora la LIM passa all’immagine.
8. Provare **Oscura**, **Ripristina**, **Chiudi proiezione** e **Chiudi** del Viewer privato.
9. Creare una Scrivania e verificare precedente/successivo.
10. Ricaricare l’app e verificare che archivio e impostazioni siano ancora presenti.

## Struttura

```text
Desk/
├── index.html
├── lim.html
├── manifest.webmanifest
├── sw.js
├── css/main.css
├── js/
│   ├── app.js
│   ├── db.js
│   ├── files.js
│   ├── lessons.js
│   ├── viewer.js
│   ├── lim-controller.js
│   └── lim-viewer.js
├── assets/icons/
├── ATTRIBUTIONS.md
└── README.md
```
