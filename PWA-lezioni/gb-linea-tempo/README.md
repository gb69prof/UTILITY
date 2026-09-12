# GB — Linea del Tempo

PWA didattica autonoma, senza dipendenze o build: 58 soggetti storici e sei epoche, dalla preistoria al presente. Il riferimento centrale resta fermo mentre la storia scorre. All’apertura si torna sempre al passaggio 1 a.C. / 1 d.C.

## Avvio

Dalla radice di UTILITY: `python -m http.server 8765`, quindi aprire `/PWA-lezioni/gb-linea-tempo/`. La PWA va servita via HTTPS (o localhost per sviluppo). La versione pubblicata è disponibile su `https://gbprof.it/UTILITY/PWA-lezioni/gb-linea-tempo/`.

## Architettura

- `chronology.mjs`: date `{year: 1, era: "BCE"}` / `{year: 1, era: "CE"}`, oppure `{bp: 300000}`. `null` indica il presente, risolto dall’anno corrente del dispositivo. Anni zero e negativi sono rifiutati.
- Le coordinate sono anni trascorsi da un’origine tecnica remota (3.000.000 a.C.). Non sono anni astronomici. BP usa il 1950 come riferimento; i calcoli attraversano la cesura senza un anno aggiuntivo.
- Le durate sono differenze fra gli inizi degli anni indicati, non conteggi inclusivi. La precisione delle fonti resta annuale o approssimativa. Il 27 a.C. → 476 d.C. misura 502 anni.
- `data/civilizations.json`: contenuti, fonti, immagini, tipologie e note. `data/epochs.json`: periodizzazioni convenzionali e dichiaratamente regionali.
- `app.mjs`: rendering con richiesta di frame, fasce riutilizzate e selezione delle entità visibili. Le righe accostano intervalli non sovrapposti; la vicinanza non implica filiazione o continuità culturale. Sotto 16 pixel il tratto conserva la durata e riceve un bersaglio di selezione di 24 pixel.
- Scale storiche: le specie umane non vengono mostrate salvo selezione esplicita. Scale molto ampie: si privilegiano fenomeni lunghi. Ogni soggetto rimane raggiungibile tramite la ricerca.
- `style.css`: desktop e iPad orizzontale con pannello laterale; sotto 900 px pannello sovrapposto; telefono con scheda inferiore. La timeline conserva centro e zoom.
- `assets`: panorama generato per il progetto e simboli vettoriali originali. Le didascalie li identificano come illustrazioni, non documenti o ricostruzioni archeologiche.

## Interazione

Mouse o dito: trascinamento con riconoscimento dell’asse. Scorrimento verticale dentro le righe: altre storie. Rotella sopra la scala degli anni, oppure Shift+rotella e trackpad orizzontale: tempo. Due dita o Ctrl+rotella: zoom ancorato al gesto. Tastiera sulla timeline: frecce, +/− e Home. Ricerca con frecce ed Invio; Escape chiude la scheda. Con movimento ridotto l’inerzia è disabilitata.

## Offline e aggiornamenti

Il service worker precachea atomicamente codice, dati e immagini locali. Nessuna dipendenza esterna a runtime; le fonti richiedono la rete. La versione nuova aspetta la chiusura delle schede per non mescolare versioni di dati e codice. **Ad ogni rilascio incrementare `CACHE` in `sw.js`**; aggiungere nuove risorse a `FILES`. La pulizia riguarda esclusivamente le cache `gb-linea-tempo-*`. La card nell’indice generale è esterna allo scope della PWA.

## Verifiche

`node --test PWA-lezioni/gb-linea-tempo/tests/*.test.mjs` dalla radice del repository.

`tests/browser.html` offre viewport riproducibili e controlli funzionali sulla PWA servita, senza librerie. I gesti touch sono simulati: la cattura dei puntatori va verificata anche con un mouse reale o con il browser di collaudo. L’emulazione delle dimensioni non sostituisce una prova hardware su Safari/iPad.

## Scelte editoriali

Non si rappresentano popoli come se cessassero di esistere alla fine di uno Stato. Le fasce Maya, Indo e Grecia delimitano fasi dichiarate. Le continuità e interruzioni Han, bizantine e mongole sono esplicitate nelle note. Il 476 riguarda l’Occidente; il 330 è un inizio convenzionale della fascia orientale. Medioevo, età moderna e contemporanea sono convenzioni soprattutto europee.

Per aggiungere una scheda: creare un ID unico, date positive con era oppure BP, tutti i testi, almeno una fonte e le immagini con didascalie. Aggiornare la cache e lanciare i test.

## Stato della verifica (12 settembre 2026)

- Pubblicata su `gb69prof/UTILITY`, ramo `main`, e raggiungibile su https://gbprof.it/UTILITY/PWA-lezioni/gb-linea-tempo/. Il collegamento dalla card nell’indice UTILITY è stato aperto e verificato nel browser.
- 13 test Node superati: cronologia, date BP, etichette a ogni scala, integrità dei 58 soggetti, risorse locali, collegamento nell’indice e service worker in un ambiente simulato (offline, isolamento delle cache, navigazione di fallback). Sintassi JavaScript verificata.
- Collaudo della versione pubblicata completato in Chrome: 26 controlli superati, inclusi ricerca, zoom, scheda e durata romana, conservazione del momento, Oggi, filtro geografico, immagini e stato della cache offline. Nessun errore JavaScript della PWA rilevato.
- Layout, spazio utilizzabile della timeline e contenimento del pannello verificati nei viewport desktop 1440×900, iPad orizzontale 1180×820, iPad verticale 820×1180 e telefono 390×844.
- Trascinamento con mouse reale verificato tramite browser; trascinamento touch, pinch e trackpad verificati con eventi simulati. Anche la vista Epoche è stata controllata nel browser.
- Cache pronta confermata nel browser; comportamento senza rete verificato nei test simulati del service worker. Non è stata eseguita una prova su Safari o iPad fisico.
