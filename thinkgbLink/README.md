# thinkgbLink

**Immagini che diventano percorsi.**

thinkgbLink è una PWA locale per trasformare un’immagine in una superficie didattica esplorabile attraverso hotspot. Non richiede account, backend o servizi esterni: editor, archivio e strumenti di esportazione funzionano direttamente nel browser.

Il flusso essenziale è: **Carico → Punto → Entro → Collego → Esploro → Esporto.**

## Funzioni

- caricamento di immagini JPG, PNG e WEBP;
- hotspot posizionati con coordinate percentuali, responsive e trascinabili;
- scene annidate: ogni hotspot può aprire una nuova immagine con altri hotspot, senza limite prefissato di profondità;
- breadcrumb e comando **Indietro** per orientarsi tra i livelli;
- contenuti testuali, immagini, audio, video locali, URL video e link;
- domande didattiche con risposta nascosta;
- categorie e quattro stili visivi per gli hotspot;
- relazioni libere, precedente e successivo per i percorsi guidati;
- modalità **Editor** e **Esplora** nettamente separate;
- zoom, pan, rotellina e pinch-to-zoom;
- salvataggio automatico in IndexedDB;
- importazione ed esportazione del progetto `.thinkgblink`;
- esportazione di un Viewer statico autonomo in ZIP;
- app shell offline tramite service worker;
- interfaccia responsive pensata anche per Safari su iPadOS.

## Avvio

thinkgbLink è un’app statica. Per provarla in locale serve un piccolo server HTTP, perché service worker e alcune API del browser non funzionano correttamente aprendo direttamente `index.html` come file.

Esempi:

```bash
python3 -m http.server 8080
```

oppure:

```bash
npx serve .
```

Poi aprire `http://localhost:8080/thinkgbLink/` se il server è avviato dalla radice del repository.

## Creare un progetto

1. Aprire la home e scegliere **Nuovo progetto**.
2. Inserire titolo, descrizione e immagine principale.
3. Toccare l’immagine con lo strumento **Punto** attivo.
4. Compilare il pannello dell’hotspot.
5. Trascinare l’hotspot per correggerne la posizione.

Le coordinate sono conservate come percentuali dell’immagine, quindi i punti restano allineati su schermi differenti e durante il ridimensionamento.

## Media, domande e relazioni

Nel pannello dell’hotspot si possono associare:

- testo breve e approfondimento;
- immagine con testo alternativo;
- audio o video del dispositivo;
- URL video e collegamento esterno;
- domanda con risposta rivelabile;
- precedente, successivo e relazioni libere con altri hotspot.

I file locali vengono incorporati nel progetto conservato in IndexedDB. Video molto grandi possono consumare rapidamente la quota assegnata da Safari: in quel caso conviene comprimere il file o usare un URL.

## Creare scene dentro gli hotspot

Ogni hotspot può essere sia una scheda informativa sia una porta verso una nuova scena:

1. selezionare l’hotspot nell’Editor;
2. aprire **Scena interna**;
3. premere **Crea e apri scena interna**;
4. inserire subito l’immagine oppure aggiungerla dal nuovo spazio di lavoro;
5. usare **Punto** per aggiungere gli hotspot esattamente come nella scena madre.

Una scena già collegata si riapre con **Apri e modifica questa scena**. L’Editor entra automaticamente in modalità **Modifica** con lo strumento **Punto** attivo, anche quando il passaggio parte da un livello più profondo.

Il percorso in alto mostra sempre la posizione corrente. **Indietro** riporta alla scena precedente. Eliminando un hotspot che contiene scene, l’Editor avverte che verranno rimossi anche tutti i livelli discendenti, evitando scene orfane.

## Salvare e riaprire

Le modifiche vengono salvate automaticamente dopo una breve pausa; lo stato è indicato nell’intestazione. Il comando **Salva** forza il salvataggio immediato. Da **Apri progetto** si accede all’archivio del dispositivo.

IndexedDB appartiene al browser e al dominio corrente. Cancellando i dati di Safari si cancellano anche i progetti locali: per un archivio durevole occorre esportare periodicamente il progetto.

## Esportare e importare il progetto

Il pulsante **Progetto** genera un file `.thinkgblink`. È un JSON versionato che contiene anche immagine e media come dati incorporati.

Per riaprirlo:

1. tornare alla home;
2. scegliere **Importa**;
3. selezionare il file `.thinkgblink` o `.json`.

L’importazione convalida la struttura, ripara i campi compatibili e rifiuta file non validi o versioni future del formato.

## Esportare il Viewer autonomo

**Viewer ZIP** genera un archivio con questa struttura:

```text
nome-progetto/
├── index.html
├── data.json
├── assets/
│   ├── scenes/
│   ├── images/
│   ├── audio/
│   └── video/
├── css/style.css
├── js/viewer.js
└── README.txt
```

Il Viewer non contiene strumenti di modifica e non dipende da thinkgbLink. Conserva scene annidate, breadcrumb e navigazione Indietro. I dati essenziali sono incorporati anche in `index.html`, così la pagina può essere aperta direttamente; `data.json` resta disponibile come formato leggibile e riutilizzabile.

## Pubblicare il Viewer su GitHub Pages

1. Esportare **Viewer ZIP**.
2. Decomprimere l’archivio.
3. Copiare l’intera cartella esportata in un repository GitHub.
4. In **Settings → Pages**, scegliere la pubblicazione da branch e la cartella che contiene `index.html`.
5. Attendere il completamento del deploy e aprire l’indirizzo indicato da GitHub.

Tutti i percorsi del Viewer sono relativi, quindi funzionano anche in una sottocartella di GitHub Pages.

## Installazione su iPad

1. Aprire la pagina pubblicata in Safari.
2. Toccare **Condividi**.
3. Scegliere **Aggiungi alla schermata Home**.
4. Confermare il nome **thinkgbLink**.

Dopo il primo caricamento, l’app shell resta disponibile offline. I progetti e i media già salvati sono locali all’iPad. Per evitare perdita di dati è comunque opportuno esportare i lavori importanti.

## Esempio

La home offre **Apri l’esempio**, che crea una copia modificabile con due scene e cinque hotspot. È inoltre disponibile [`examples/demo-project.thinkgblink`](./examples/demo-project.thinkgblink), importabile manualmente.

## Architettura e formato

Il progetto usa soltanto HTML5, CSS e JavaScript moderno. Non richiede framework o CDN.

- `js/db.js`: persistenza IndexedDB;
- `js/app.js`: stato, editor, touch, Viewer interno e accessibilità;
- `js/exporter.js`: progetto portabile e Viewer statico;
- `js/zip.js`: generatore ZIP senza dipendenze;
- `sw.js`: cache offline dell’app shell.

Il formato dati espone `version: 2` e conserva esplicitamente scene, gerarchia, coordinate, contenuti, relazioni, sequenza e impostazioni. I progetti `version: 1` vengono migrati automaticamente: la vecchia immagine diventa la scena principale e nessun hotspot viene perduto.

## Limiti consapevoli

- nessun montaggio o conversione dei media;
- nessuna valutazione, registro studenti o funzione LMS;
- le relazioni sono esplorabili ma non vengono ancora disegnate come grafo sull’immagine.

Le relazioni precedente/successivo restano interne alla scena corrente; la navigazione tra scene avviene attraverso l’hotspot che le contiene. È una scelta deliberata: mantiene leggibile la struttura e impedisce percorsi gerarchici incoerenti.
