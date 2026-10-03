# Registro delle fonti scientifiche

**Fase 5 · fonti acquisite e verificate il 3 ottobre 2026.** Il registro operativo è `data/acquisition.json` più `data/ephemeris-acquisition.json`; ogni risposta originale è conservata con query completa e SHA-256. `data/dataset.json` conserva quantità, definizioni e provenienza, distinguendo EMB da Terra. PCK00011 completo e GM DE440; Horizons API risponde 1.2, DE441 per Terra/Luna/EMB e mar099 per Marte 499. La versione effettivamente ricevuta prevale sulla versione generale della documentazione API.

`data/qualification.json`: tre coniche confrontate con CSPICE e cinque stati con Horizons, rotazioni con PCK completo. Esito complessivo FAIL (Luna/Terra), escluso dal runtime. `data/ephemeris-qualification.json`: PASS delle effemeridi operative e degli orientamenti semplificati. Campioni orari e controlli alla mezz’ora sono distinti; non viene confrontato il modello con i propri risultati. Nessuna richiesta esterna durante l’esecuzione dell’app.

Raggi: sfera di volume equivalente `(abc)^(1/3)`, con trattamento esatto del caso sferico. GM relativo delle coniche preso dalla specifica risposta Horizons. Il GM marziano effettivo è derivato dalla risposta 499 meno il GM solare DE440, con limite di precisione da sottrazione esplicito in `data/gm-reconciliation.json`; BODY4_GM non è usato come GM di Marte. Le effemeridi operative non dipendono da quel GM marziano. Massa, densità, temperature e composizione non acquisite restano null/vuote con motivazione.

Le fonti candidate riportate di seguito documentano la ricognizione precedente; non sono tutte entrate nel prodotto.

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
