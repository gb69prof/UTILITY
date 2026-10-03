# Registro delle fonti scientifiche

**Fase 3 · 3 ottobre 2026. Nessun dataset astronomico acquisito o qualificato.**

Questo registro prepara l'acquisizione successiva. Una pagina consultata non equivale a uno snapshot operativo. Le convenzioni e la ricetta restano quelle di [DATA-MODEL](DATA-MODEL.md), in particolare §§2, 5 e 10.

| ID di registro | Ente / riferimento | Uso previsto | Stato |
| --- | --- | --- | --- |
| candidate-jpl-ssd | [NASA JPL Solar System Dynamics](https://ssd.jpl.nasa.gov/), [parametri astrodinamici](https://ssd.jpl.nasa.gov/astro_par.html) | GM, costanti e controllo dei riferimenti | Candidata |
| candidate-jpl-horizons | [JPL Horizons: manuale](https://ssd.jpl.nasa.gov/horizons/manual.html), [API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | Elementi osculatori a t0 e vettori geometrici indipendenti | Candidata |
| candidate-naif-pck | [NAIF PCK](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/pck.html), [pck00011.tpc](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc) | Inizializzazione completa di poli e meridiani | Candidata |
| candidate-nasa-science | [NASA Science](https://science.nasa.gov/) | Contenuti e documentazione di missione, da identificare per singola affermazione | Candidata |
| candidate-iau | [IAU](https://www.iau.org/), [SOFA](https://www.iausofa.org/current-software) | Convenzioni e futura conversione del tempo; documento/versione da fissare | Candidata |
| candidate-esa | [ESA](https://www.esa.int/) | Contenuti e risorse di missione, da selezionare | Candidata |
| candidate-usgs | [USGS Astrogeology](https://astrogeology.usgs.gov/) | Riferimenti cartografici e proiezioni dei futuri asset | Candidata |

Consultazione web di questo turno: portali JPL, Horizons, NASA, IAU, ESA raggiunti; il recupero del portale USGS tramite lo strumento web non è riuscito. USGS resta il riferimento candidato già approvato in ARCHITECTURE; ciò non costituisce acquisizione di un file.

## Stati e tracciabilità

| Stato/evento | Evidenza obbligatoria |
| --- | --- |
| Candidata | Pagina identificata, impiego previsto, verifiche mancanti; nessun valore ammesso al runtime |
| Acquisita | Richiesta esatta, risposta/file originale, data, versione, URL e SHA-256 registrati |
| Validata | Revisore e data, locator preciso, coerenza di unità/frame/centro/tempo, rapporto pertinente; la qualifica astronomica richiede V12/V13 |
| Trasformazione effettuata | Evento collegato all'originale, algoritmo/versione/parametri, unità prima/dopo, file e hash risultante; non sostituisce lo stato di validazione |

Ogni fonte acquisita produrrà un record `Source`: id, titolo, ente, URL, pubblicazione/versione, data acquisizione ISO, locator, hash dello snapshot. Ogni quantità conserva `Provenance`: sourceIds risolvibili, valore/unità originale, trasformazioni ordinate, status, review, limiti. Gli ID `candidate-*` qui elencati non sono fonti operative già importate.

Per Horizons conservare target e centro distinti, query completa, versione API ed effemeride dichiarata, unità KM-S, ECLIPJ2000/ICRF, TDB e correzione NONE. Per la rotazione preservare il PCK completo e i termini periodici valutati a t0. Convertire soltanto con trasformazioni registrate. I dati trasformati e quelli di confronto non devono essere prodotti dalla stessa implementazione che si vuole verificare.

## Acquisizioni e trasformazioni effettuate

Nessuna. Non sono stati scaricati elementi, vettori, kernel o campioni scientifici. I numeri in `tests/fixtures.ts` sono esplicitamente fittizi, separati dalla build e privi di qualifica scientifica. L'esempio documentale storico in DATA-MODEL non è stato promosso a dataset.
