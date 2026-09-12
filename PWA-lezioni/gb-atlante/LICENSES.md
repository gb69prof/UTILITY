# Licenze e attribuzioni

## Contenuti e codice propri

Il codice e le sintesi originali GB-Atlante sono consegnati al proprietario del progetto. Questa consegna non attribuisce automaticamente una nuova licenza pubblica al checkpoint ricevuto: restano valide le indicazioni e le condizioni presenti nei suoi file. `package.json` usa `UNLICENSED` per evitare di concedere diritti non esplicitamente stabiliti.

## Componenti redistribuiti

| Componente | Origine/versione | Licenza e attribuzione |
|---|---|---|
| MapLibre GL JS | npm `maplibre-gl` 6.9.0 | BSD-3-Clause; testo completo in [vendor/maplibre-LICENSE.txt](vendor/maplibre-LICENSE.txt). Copyright MapLibre contributors e precedenti titolari riportati nel file |
| Perimetri OHM | Relazioni registrate nel GeoJSON canonico; acquisizione 2026-09-12 | 229 record con CC0-1.0 e 12 con tag CC0. Attribuzione: OpenHistoricalMap contributors; [politica](https://www.openhistoricalmap.org/copyright). Le riserve scientifiche dei tag sono conservate |
| Natural Earth | `110m_land`, `110m_populated_places`, repository natural-earth-vector | [Pubblico dominio](https://www.naturalearthdata.com/about/terms-of-use/); Natural Earth contributors |
| Trascrizione Minard | `@stdlib/datasets-minard-napoleons-march` 0.2.3 | Database PDDL-1.0, singoli contenuti CC0-1.0, come dichiarato dal progetto stdlib; codice del pacchetto Apache-2.0, non incluso nel runtime |
| Carta Stockdale | John Stockdale, London, 25 luglio 1812; Library of Congress item 2018588030 | Pubblico dominio; LoC indica free to use and reuse salvo advisory specifico. Nessun advisory specifico nella scheda consultata. Credit: Library of Congress, Geography and Map Division |
| Icone GB-Atlante | Disegno originale SVG e derivati PNG | Realizzate nel progetto, nessun asset esterno |

Le pagine e immagini Fondation Napoléon non sono redistribuite. IEG-MAPS è usato solo come riferimento: le condizioni CC BY-NC 4.0 delle carte e i diritti sulle geometrie sottostanti non sono convertiti in CC0. La carta Stockdale resta distinta dalle geometrie OHM.

Le dipendenze di sviluppo `shapely`, `jsonschema` e `osmtogeojson` non sono caricate dal browser. Chi rinnova l'acquisizione deve riesaminare licenze e tag: la politica di default OHM ammette eccezioni e non sostituisce la verifica delle fonti upstream. Le fonti del checkpoint con diritti della digitalizzazione non determinati rimangono link bibliografici, senza copia dei relativi documenti.
