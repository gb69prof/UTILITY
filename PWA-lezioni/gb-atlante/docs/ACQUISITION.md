# Acquisizione riproducibile

Il canonico versionato consente di rigenerare offline tutti i derivati. Non è necessaria una nuova interrogazione per compilare l'applicazione.

Interrogazione di inventario su `https://overpass-api.openhistoricalmap.org/api/interpreter`, 12 settembre 2026:

```text
[out:json][timeout:90];
relation(33,-26,72,46)["boundary"="administrative"]
 ["admin_level"~"^[234]$"]["start_date"]
 (if:t["start_date"]<="1816-12-31" &&
 (!is_tag("end_date") || t["end_date"]>="1796-01-01"));
out tags;
```

619 relazioni nell'inventario. Selezionate 243 relazioni: livello 2 e casi subordinati espliciti (Illiria, Moldavia, Valacchia, Finlandia, Pontecorvo, Benevento, Pomerania, Erfurt, Schleswig, Holstein, Simplon, Lippe, Islanda, Fær Øer, Danimarca e Norvegia). Le relazioni sono richieste a lotti con `relation(id:…);out geom;` e convertite con `osmtogeojson` 3.0.0-beta.5. Ogni file convertito ha un SHA-256 nel rapporto d'importazione.

`python tools/import_ohm.py --input <cartella-convertita>` seleziona solo geometrie poligonali complete, conserva provenienza, applica il ritaglio e registra riparazioni. L'importazione ha prodotto 241 geometrie canoniche. Due relazioni non hanno prodotto superfici utilizzabili nel riquadro: l'inventario delle sole geometrie non equivale a una copertura completa degli Stati.

Ricerche supplementari per i piccoli Stati e per le relazioni `type=chronology` di Austria e Baviera non hanno fornito i perimetri mancanti fra 1814 e 1816. Non si è propagata la geometria del 1816 all'indietro. Tali risultati sono documentati come lacune nel registro.

Fondo e località: repository `https://github.com/nvkelso/natural-earth-vector`, file GeoJSON `geojson/ne_110m_land.geojson` e `geojson/ne_110m_populated_places.geojson`. Le copie dati necessarie sono conservate nel progetto.

Minard: `@stdlib/datasets-minard-napoleons-march` versione 0.2.3; si conservano le tabelle originali in `minard-source.json`. Documento LoC: derivato IIIF `https://tile.loc.gov/image-services/iiif/service:gmd:gmd5:g5700:g5700:fi000190r/full/pct:12.5/0/default.jpg`, collegato alla scheda item 2018588030.

Prima di rinnovare l'importazione conservare il canonico e l'inventario precedenti, confrontare i cambiamenti e rieseguire la verifica storico-geografica: OHM è una fonte dinamica, non una release immutabile.
