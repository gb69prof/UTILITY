# GB-Atlante · Europa 1796–1816

Atlante statico italiano con 15 date, MapLibre GL JS, confronto interattivo 1812/1815, eventi, campagne e documento cartografico del 1812.

**Versione di ricerca 0.1.0. Non è ancora un atlante scientificamente completo.**
Il software rende consultabili i dati disponibili e segnala i limiti. Il passaggio dei test strutturali non certifica l'esattezza storica dei perimetri.

- Sito: https://gbprof.it/UTILITY/PWA-lezioni/gb-atlante/
- Repository: https://github.com/gb69prof/UTILITY/tree/main/PWA-lezioni/gb-atlante
- [Metodo e questioni aperte](METHODOLOGY.md)
- [Fonti](SOURCES.md) · [Licenze](LICENSES.md)
- [Registro strutturato](data/common/issues.json) · [Validazione](docs/validation.json)

## Uso

La carta iniziale è il 1 giugno 1812: l'invasione della Russia non è ancora iniziata. La barra inferiore consente di scegliere le 15 date; «Cosa cambia?» mostra gli eventi dall'ultima carta. «Livelli» distingue relazioni politiche, sovranità e controllo. Le aree bianche e i valori non documentati indicano lacune, non assenza di governo.

«Cerca» include le 126 entità e le 66 persone del checkpoint 1812, anche prive di geometria. Ogni territorio colorato è interrogabile. Il confronto 1812/1815 sincronizza spostamenti e zoom delle due carte. I colori non provano il controllo militare.

La campagna selezionata ha una cronologia autonoma, esplicitata nella legenda. La Russia mostra sei rami generalizzati dalla carta di Minard del 1869. «Documento storico» apre la carta di Stockdale pubblicata il 25 luglio 1812: è un oggetto documentario separato, non una sovrapposizione georeferenziata.

Dopo «Copia offline pronta», il nucleo dell'applicazione è conservato sul dispositivo. Un aggiornamento completo viene attivato con il pulsante apposito; la versione precedente resta utilizzabile durante il download. I siti delle fonti richiedono una connessione. L'installazione dipende dalle funzioni del browser; su Safari si usa il comando Aggiungi alla schermata Home.

## Struttura

```text
index.html, css/, js/       interfaccia e motore
vendor/                    MapLibre 6.9.0, ospitato localmente
data/MAP_10/               checkpoint 1.0.1 conservato + atlas.json aggiuntivo
data/MAP_01/ … MAP_15/      riferimenti temporali alle geometrie comuni
data/common/               entità condivise, geometrie, eventi, fonti, issues
assets/                    carta Stockdale 1812
icons/, manifest.webmanifest, service-worker.js
tools/, tests/, docs/       compilazione, verifiche e rapporti
```

## Riproduzione

Per servire la cartella è sufficiente un server HTTP statico. HTTPS o localhost è necessario per il service worker. L'applicazione funziona nella sottocartella indicata senza API commerciali, backend, token o CDN.

Dipendenze di sviluppo: Python 3.12 o successivo, `jsonschema`, `shapely`; Node.js 20 o successivo per i test JavaScript. Il browser non richiede queste dipendenze.

```sh
python -m pip install -r tools/requirements.txt
python tools/build_content.py
python tools/build_atlas.py
python tools/build_pwa.py
python tools/validate_atlas.py
node --test tests/model.test.js
python tools/validate_map10.py --mutation-tests
```

In ambienti Windows che impediscono la creazione dei processi dei test Node, Node 22+ consente `node --test --test-isolation=none tests/model.test.js`.

Il file canonico `data/common/canonical.geojson.gz` contiene GeoJSON EPSG:4326 compresso senza perdita; decomprimerlo con gzip restituisce le coordinate originali importate. I derivati semplificati si ricostruiscono senza rete. Per una nuova acquisizione, consultare [la procedura](docs/ACQUISITION.md). Non sovrascrivere il checkpoint per aggiornare le geometrie.
