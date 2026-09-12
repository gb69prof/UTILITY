# Verifiche browser · 12 settembre 2026

Ambiente: browser Chromium integrato, sito servito nella sottocartella `/UTILITY/PWA-lezioni/gb-atlante/`. Operazioni effettuate sull'interfaccia reale, non soltanto su funzioni isolate.

| Prova | Risultato osservato |
|---|---|
| Tutte le 15 selezioni della timeline | Data, titolo e `MAP_01`…`MAP_15` aggiornati; caricamento concluso per ciascuna |
| Ricerca «Baviera» | Entità e sovrano trovati |
| Scheda Baviera | Sovranità e controllo propri, Massimiliano I Giuseppe, Confederazione del Reno |
| Selezione del poligono francese | Apertura della scheda Impero francese |
| Livelli politici, controllo e campagne | Controlli selezionabili; legenda aggiornata; percorso di Russia visibile |
| Confronto 1812/1815 | Due mappe WebGL; zoom e spostamento da tastiera; scala coerente; selezione temporale bloccata durante il confronto |
| Documento originale | Immagine 2419 px caricata; ingrandimento al 150%; scorrimento nel dialogo |
| Aggiornamento PWA | Nuova cache pronta, attivazione tramite pulsante, ricaricamento; pulsante scompare quando non esiste una versione in attesa |
| Offline effettivo | Server locale arrestato, porta 8765 non raggiungibile, riapertura dell'app; 15/15 carte caricate e immagine del documento disponibile |
| Console | Nessun errore o warning nelle letture effettuate dopo le prove |
| Fonti su mobile | Pulsante dedicato apre metodo, licenze e registro |

## Dimensioni verificate

| Viewport CSS | Osservazione |
|---|---|
| 1920×1080 | Full HD, carta e timeline visibili, nessun overflow orizzontale |
| 1280×720 | Notebook, pannello introduttivo compatto; zoom corretto per includere Europa meridionale |
| 1180×820 | iPad orizzontale simulato, area cartografica 1180×555 prima dell'ultimo aumento dei controlli inferiori |
| 820×1180 | iPad verticale simulato, nessun overflow, carta utilizzabile |
| 390×844 | Telefono simulato, timeline/selettore accessibili, livelli e confronto funzionanti, nessun overflow |

Non è stato usato un iPad fisico; nessun test Safari/WebKit, gesto multitouch fisico o installazione dalla schermata Home completata. Il browser integrato non ha esposto il prompt d'installazione: manifest, icone, scope e service worker sono stati verificati, ma questo non equivale a una prova di installazione nativa. I collegamenti alle biblioteche esterne richiedono connessione.

Le prove confermano il funzionamento dell'interfaccia per i dati presenti. Non eliminano le lacune scientifiche descritte nella metodologia.
