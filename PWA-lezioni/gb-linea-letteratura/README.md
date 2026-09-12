# GB — Letteratura italiana nel tempo

PWA autonoma senza dipendenze di esecuzione, integrata nell'indice UTILITY.

- [Apri la PWA](https://gbprof.it/UTILITY/PWA-lezioni/gb-linea-letteratura/)
- [Copertura di autori, correnti, immagini e PWA](docs/COPERTURA.md)
- [Fonti, metodo e aggiornamento](docs/FONTI-E-METODO.md)

## Sviluppo

Servire la directory UTILITY tramite un server HTTP locale, poi aprire `PWA-lezioni/gb-linea-letteratura/`. Non usare `file://`: moduli, dati e service worker richiedono HTTP o HTTPS. Su `127.0.0.1` l'anteprima normale non registra il service worker; usare `?offline-test` per verificarlo.

Con Node.js 24: `npm run build` genera la cache con versione derivata dai file; `npm test` controlla struttura, date, relazioni, mappa PWA e disposizione delle fasce. La pagina `tests/browser.html` esegue 29 controlli integrati nel browser, inclusa l'apertura di tutte le schede e il precaricamento offline.

Le immagini e tutti i contenuti necessari sono locali. Non si usano CDN, font remoti, analytics o dipendenze JavaScript di terze parti.

I repository III/IV/V-anno sono fonti consultate in sola lettura. La pubblicazione avviene con il workflow preesistente di UTILITY.
