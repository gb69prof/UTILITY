# Registro delle fonti degli asset

**Fase 5 · quattro texture acquisite e integrate il 3 ottobre 2026.** Il registro macchina completo è `data/assets.json`, con URL diretto, autore, licenza, data, dimensioni in byte e SHA-256. Autore Solar System Scope / INOVE; [pagina e licenza dichiarata](https://www.solarsystemscope.com/textures/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribuzione presente nell’interfaccia. Originali JPEG 2048×1024, non modificati: `2k_earth_daymap.jpg`, `2k_moon.jpg`, `2k_mars.jpg`, `2k_sun.jpg`. Nessuna texture 8K/16K.

Caricamento progressivo: colore di riserva immediato, richiesta 2K quando si osserva il corpo o si attiva la panoramica didattica, applicazione soltanto a caricamento concluso, mipmap GPU. Fallimento: superficie colorata e avviso. Quattro mappe complessivamente circa 3,09 MB decimali; memoria RGBA8 con mipmap stimata circa 42,7 MiB, non misura VRAM. Geometria canonica generata localmente, 96×48 segmenti, +Z nord / +X longitudine zero / +Y est. UV e assi verificati nel codice; la Terra è stata ispezionata visivamente.

Le mappe sono elaborazioni illustrative, non misure dell’istante J2000. La Terra mostra un mosaico elaborato; la fotosfera solare non rappresenta attività corrente, ed è resa emissiva con attenuazione qualitativa al bordo, non calibrazione radiometrica. Nessuna atmosfera, nube o rilievo geometrico aggiuntivo. Stelle sintetiche deterministiche, senza catalogo o identità, esposizione illustrativa. Nessun audio o modello esterno.

La tabella seguente conserva i candidati della ricognizione iniziale: non attribuire loro gli asset effettivamente integrati.

## Candidati già individuati

| ID candidato | Corpo/uso | Pagina della risorsa | Stato |
| --- | --- | --- | --- |
| earth-bmng | Terra, superficie | [NASA Blue Marble Next Generation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) | Candidato, file/licenza da verificare |
| moon-cgi | Luna, colore e rilievo | [NASA SVS CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) | Candidato, file/licenza da verificare |
| mars-viking | Marte, mosaico | [USGS Mars Viking Global Color Mosaic 925m](https://astrogeology.usgs.gov/search/map/mars_viking_global_color_mosaic_925m) | Candidato, file/licenza da verificare |
| stars-svs | Sfondo stellare | [NASA SVS Deep Star Maps](https://svs.gsfc.nasa.gov/4851/) | Candidato, frame/esposizione/licenza da verificare |
| sun-sdo | Sole, riferimento osservativo | [NASA SDO](https://sdo.gsfc.nasa.gov/data/) | Candidato; immagine del disco non equivale a mappa globale |

Sono riferimenti già presenti in ARCHITECTURE, non file scaricati in Fase 3. Nessun modello o audio selezionato. L'appartenenza a un ente non basta per attribuire una licenza a ogni file.

## Scheda obbligatoria per ogni acquisizione futura

| Campo | Contenuto da registrare |
| --- | --- |
| Identità | ID stabile, nome, categoria (texture/modello/mappa/immagine/audio), corpo e uso |
| Provenienza | Fonte, pagina originale, URL esatto del file, autore/ente, versione, data osservazione o intervallo |
| Condizioni | Licenza/condizioni, URL dei termini, attribuzione richiesta, revisore e data della verifica |
| Acquisizione | Data ISO, file originale/percorso di archivio, SHA-256 originale |
| Descrizione tecnica | Risoluzione, formato, proiezione, frame, orientamento meridiani/poli, spazio colore; per audio frequenza/canali/durata |
| Derivato | File risultante, risoluzione/formato, SHA-256 distinto, collegamento all'originale |
| Trasformazioni | Ordine dei passaggi, strumenti/versioni, parametri, ricampionamento, compressione, conversioni di colore, esagerazioni dichiarate |
| Qualità | Controlli visivi e geometrici, artefatti/cuciture, limiti, responsabile e rapporto |
| Stato | Candidato → acquisito → validato; ogni trasformazione è un evento con input/output, non una licenza o validazione implicita |

Campi sconosciuti restano `null` con motivo: niente date, hash o licenze inventate. Escludere l'asset dal rilascio finché provenienza, termini e derivati non sono verificati. Le future schede leggibili dovranno rimandare al manifest dei file effettivi.

Gli originali pesanti non entrano automaticamente in Git o nel browser. Risoluzioni e formati saranno scelti sui budget misurati. Distinguere osservazione, mosaico, derivato topografico, procedurale e illustrazione. In Fase 3 non sono state eseguite trasformazioni e non esistono record acquisiti/validati.

## Risorse procedurali della Fase 4

Nessun asset astronomico acquisito. La sfera usa `generated-grid-512`, prodotta da `src/rendering/technical-scene.ts`: canvas RGBA 512 × 512, scacchiera, meridiani convenzionali, N/S e numeri. Non deriva da osservazioni o immagini esterne; non richiede download o attribuzioni a terzi. Il codice generatore è versionato; non esiste un file immagine originale da archiviare. La correzione verticale UV è salvata sulla texture per sopravvivere al ripristino del contesto.

Il pannello XR usa un canvas procedurale 1024 × 512 con nome, stato e Chiudi (`src/xr/session.ts`). Nessun font remoto o modello di controller viene scaricato. Font di sistema: l'aspetto raster può variare leggermente tra dispositivi. Queste risorse non convalidano alcuna texture scientifica candidata.
