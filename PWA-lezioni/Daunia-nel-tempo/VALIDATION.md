# Verifica — 1 ottobre 2026

## Controlli dei dati e delle risorse

- Sintassi di `app.js` e `sw.js`: verificata con `node --check`.
- JSON: 13 siti, 11 fasi, 39 fonti; riferimenti delle evidenze, delle storie e delle fasi risolti.
- 10 fotografie: file presenti, autore, fonte e licenza indicati; nessuna immagine generata con IA.
- Percorsi locali dell’HTML e 38 voci della cache: tutti presenti, nessun duplicato.
- Manifest: `scope`, `id` e `start_url` relativi; icone 192/512 presenti.
- Coordinate: origine e metodo in ogni scheda; Salapia vetus senza punto inventato.
- Indice generale: aggiunta una sola card; le dieci precedenti conservate.
- 52 URL di fonti, fotografie e coordinate controllati: 50 risposte 200; UCLA risponde 202 (pagina raggiungibile con protezione); Natural Earth risponde 406 al client automatico, perciò il riferimento nell’app usa anche il repository ufficiale con la licenza.

## Verifica interattiva

Il controllo nel browser della versione pubblicata viene completato dopo il deploy automatico e registrato in questo file. Il browser locale di questa sessione non può aprire socket; la verifica avviene sul browser remoto.
