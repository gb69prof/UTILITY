# DAUNIA NEL TEMPO — Uomo, ambiente e territorio

Atlante didattico per la scuola secondaria superiore, dal Paleolitico alla tarda antichità. Domanda generatrice: **perché scegliere un luogo, e come trasformarlo?**

## Uso

Aprire `index.html` tramite un server HTTP/HTTPS, dalla sottocartella `PWA-lezioni/Daunia-nel-tempo/`. Nessuna build, chiave API, libreria remota o servizio di mappe necessario. Per provare l’intero repository: `python -m http.server 8787`, poi aprire `http://localhost:8787/PWA-lezioni/Daunia-nel-tempo/`.

- **Esplora:** carta geografica, undici fasi, ricerca, filtro geografico, tutte le fasi, schede dei luoghi.
- **Segui un luogo:** evidenze, cambi di funzione e intervalli non documentati. Una casella piena non significa occupazione continua per l’intero periodo.
- **Perché proprio qui:** formulare un’ipotesi e confrontarla con dati e interpretazioni; il testo personale non viene salvato.
- **Il percorso:** risorse, clima, vegetazione, fauna, acqua, antropizzazione e domande per la classe.
- **Prima / dopo:** confronto fra condizioni ambientali e tracce umane, con limiti e fonti; distingue documentazione e ricostruzione illustrativa.
- **Come lo sappiamo:** nove casi di metodo, concetti essenziali, lessico e cinque esercizi con spiegazione e recupero.
- **Fonti e immagini:** bibliografia ragionata, dieci documenti fotografici, tredici ricostruzioni ipotetiche, crediti e licenze.
- **LIM:** testo e carta ingranditi. Tastiera: Tab, Invio/Spazio, Esc per chiudere le finestre; anche l’elenco permette di aprire tutti i siti.

## Fasi e luoghi

Paleolitico; Mesolitico; Neolitico; Eneolitico; Bronzo; Ferro; centri dauni; contatti greci e italici; romanizzazione; età romana; tarda antichità. Le ultime due lenti repubblicane si sovrappongono. Le caselle non sono in scala cronologica. Il VII–VIII secolo è un raccordo per comprendere la trasformazione di Faragola.

Grotta Paglicci; Grotta Scaloria; Passo di Corvo; Coppa Nevigata; Monte Saraceno; Arpi; Herdonia/Ordona; Ausculum/Ascoli Satriano; Salapia vetus; Salapia romana; Siponto; Lucera; Faragola.

Dodici punti cartografici; Salapia vetus è consultabile senza punto: la georeferenziazione non è stata verificata e non viene inventata. Salapia romana è a Monte Salpi, Trinitapoli, oggi provincia BAT. Passo di Corvo non è confuso con il vicino Passo di Corvo II. Cupola–Beccarini non è sovrapposta alla colonia di Siponto. Monte Saraceno è quello di Mattinata.

## Ricerca e provenienza

Fonti consultate il 1 ottobre 2026. Ogni scheda e ciascuna fase contengono riferimenti; le evidenze più importanti hanno fonti direttamente associate. Il catalogo completo, con URL e limiti d’uso, è in `data/sources.json` e nella sezione Fonti. Principali nuclei:

- MiC, catalogo nazionale e CartApulia della Regione Puglia: sequenze, strutture e georeferenziazione.
- Elster, Isetti, Robb, Traverso (2016), *The Archaeology of Grotta Scaloria*, UCLA, Monumenta Archaeologica 38: revisione delle datazioni e dei contesti.
- Berto et al. (2017), record dei piccoli mammiferi di Paglicci: indicatori ambientali contestualizzati.
- Cazzella e Recchia, ricerche a Coppa Nevigata; Caldara, Caroli, Simone (2004), cambiamenti geomorfologici e interventi umani.
- Di Rita, Magri, Simone, Caldara, Gehrels (2011), sequenza multiproxy Frattarolo–Lago Salso: cambiamenti naturali, indicatori pollinici e interruzioni sedimentarie.
- Nava (2008 e studi cronologici collegati): Monte Saraceno e contesti distinti delle statue-stele eneolitiche.
- Goffredo e Totten (2024), studio di Salapia, paesaggio e gestione delle acque.
- Università e Soprintendenza per Faragola; cataloghi regionali per Herdonia, Ausculum, Arpi, Lucera e Siponto.

Si distinguono reperto/risultato documentato, interpretazione e limite. Le ragioni della scelta del luogo sono inferenze, non pensieri degli abitanti osservati direttamente. La presenza in una fase può rappresentare attività funerarie o sporadiche, non abitazione. Il record di Scaloria e la scarsa risoluzione ambientale delle fasi tarde richiedono particolare cautela. Un vuoto nel campione non è una prova automatica di abbandono.

## Geografia

Carta offline vettoriale: costa italiana e Ofanto moderni, Natural Earth 1:10m, pubblico dominio. È una base generalizzata: ingrandirla non ne migliora la precisione. Non raffigura paleocoste, lagune antiche, confini etnici né itinerari antichi ipotetici.

Coordinate in WGS84, ordine **latitudine, longitudine**. `coordinateSource` e `coordinateMethod` documentano ogni punto: centri di geometrie CartApulia, coordinate di geositi provinciali, punti di repertori Wikidata o posizione esplicita di una pubblicazione. Un centro del perimetro è un riferimento indicativo, non l’ingresso per una visita.

## Immagini e diritti

Dieci immagini reali scaricate da Wikimedia Commons con licenze compatibili. La seconda edizione aggiunge 13 scene fotorealistiche generate con IA, sempre etichettate come ricostruzioni ipotetiche e accompagnate da una datazione, fonti e limiti. Le due icone sono segni grafici originali disegnati in SVG e rasterizzati, non ricostruzioni del passato. Tutte le fotografie hanno autore, fonte, licenza, data e nota sulla copia locale in `data/images.json`, nell’app e in `CREDITS.md`.

Le didascalie distinguono scavo, reperto, pianta scientifica e ambiente attuale. Il cervo è una fotografia moderna di riferimento della specie, non dell’ambiente di Paglicci. Il panorama di Mattinata è un paesaggio moderno antropizzato. La foto di Faragola è del 2006, precedente all’incendio del 2017. La pianta di Coppa Nevigata documenta lo scavo, non è una veduta del villaggio antico.

## Struttura

```
index.html                struttura semantica e navigazione
styles.css                layout desktop/tablet/mobile/LIM
app.js                    mappa, fase, filtri, schede e attività
manifest.webmanifest      scope e start_url relativi
sw.js                     cache atomica dei contenuti locali
assets/icon-*.png          icone 192 e 512, area sicura maskable
assets/photos/            fotografie con crediti
vendor/                   Leaflet 1.9.4 e licenza BSD-2-Clause
data/periods.json         cronologie, ambiente, prima/dopo e fonti
data/sites.json           evidenze, interpretazioni, coordinate e fonti
data/sources.json         bibliografia ragionata
data/images.json          provenienza fotografica e licenze
data/land.geojson         costa moderna generalizzata
data/rivers.geojson       Ofanto moderno generalizzato
CREDITS.md                attribuzioni e condizioni d’uso
VALIDATION.md             controlli effettuati
```

Riutilizzati `../../pwa-common/gbprof-accessibility.css` e `.js`: salto al contenuto, collegamenti esterni protetti, finestra modale e footer comuni. Percorsi relativi compatibili con sottocartelle del server. Non sono alterate le altre applicazioni.

## Offline e manutenzione

Richiede HTTPS oppure localhost. Il service worker prepara un’intera versione (circa 9 MB) prima di renderla disponibile; una sola risorsa mancante interrompe l’installazione e lascia utilizzabile la versione precedente. Nessun `skipWaiting` durante l’installazione: non mescolare dati e codice di due versioni nelle schede aperte. Le cache precedenti vengono eliminate solo per il prefisso di questa PWA. I siti esterni e UTILITY non sono inclusi nella copia offline; privacy/accessibilità comuni lo sono.

Su iPad: Safari, Condividi, Aggiungi alla schermata Home. Le risposte degli esercizi e le ipotesi restano in memoria solo durante la sessione. Nessun tracker, account, tile server o dato personale archiviato.

Per aggiornare: modificare i JSON mantenendo riferimenti validi; cambiare la versione in `sw.js`; aggiornare il suo elenco FILES se si aggiungono risorse; ripetere i controlli di `VALIDATION.md`. Pubblicazione tramite workflow preesistente del repository, push su `main`.

## Possibile seconda fase

Georeferenziazione scientifica di Salapia vetus; ulteriori dati archeobotanici e quantitativi per singole fasi; paleocoste datate con licenza e modelli espliciti; itinerari antichi georeferenziati verificati; nuovi siti e confronto con ricognizioni sistematiche. Non aggiungere continuità, specie, vie o confini per riempire lacune.

## Seconda edizione — 1 ottobre 2026

Le 13 schede contengono 65 capitoli estesi su paesaggio, vita quotidiana, tecniche, abitanti e trasformazioni; 39 approfondimenti su oggetti e strutture; confronto con le evidenze, cronologia, domande e fonti. I nuovi capitoli aggiungono oltre 5.400 parole al percorso esistente.

La nuova interfaccia usa una copertina immersiva, schede fotografiche e un lettore ampio con navigazione fra capitoli. Le scene non rappresentano tutte le fasi del luogo: la datazione è indicata separatamente dalla cronologia complessiva. Volti, abiti, alzati, gesti e disposizione sono scelte illustrative. Le immagini non sono documenti antichi né ricostruzioni scientifiche validate.

`data/deepening.json` contiene gli approfondimenti; `data/reconstructions.json` conserva prompt, revisioni, fonti e metadati delle immagini. `assets/reconstructions/` contiene le 13 copie WebP ottimizzate (circa 3,7 MB complessivi). Le scene e i testi sono inclusi nella cache offline v2. La bibliografia comprende 43 riferimenti.
