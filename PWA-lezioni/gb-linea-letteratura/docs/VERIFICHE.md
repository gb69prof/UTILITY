# Verifiche della versione 1.0

- Build completata: 53 risorse in cache, circa 1,67 MB di struttura, dati e immagini fondamentali.
- 8 test sui dati superati: autori unici, date, Ferrante e Benni, relazioni, inventario, assenza di sovrapposizioni nelle righe, ricerca normalizzata, risorse locali.
- 29 controlli integrati nel browser superati, inclusa l'apertura di tutte le 84 schede autore e delle 43 schede corrente.
- Tutti i 37 ritratti locali si caricano e vengono decodificati dal browser.
- Tutti i 40 collegamenti alle PWA hanno una pagina pubblica corrispondente e un manifest leggibile.
- Verifiche visive a 1536×1024, 1024×768, 768×1024 e 390×844, senza overflow orizzontale della pagina.
- Trascinamento diretto del mouse verificato: l'intervallo visibile passa da 1180–1482 a 1260–1562, senza apertura accidentale del pannello.
- Verifica offline con il server locale spento: ricaricamento della PWA e ricerca di Calvino con biografia, opere e immagine disponibili dalla cache.

I test touch controllano la configurazione dello scorrimento nativo; i layout iPad e smartphone sono simulati nel browser. Non sono prove su hardware iPad/Safari, su un trackpad fisico o dell'installazione tramite la schermata Home di iOS. Il pinch temporale non è implementato: lo zoom usa pulsanti e cursore. I contenuti delle PWA esterne non sono precaricati dalla timeline.

Per ripetere la verifica integrata aprire `tests/browser.html` tramite HTTP/HTTPS. L'esito compare nella pagina. La console della PWA non ha mostrato errori applicativi durante le interazioni; il browser di automazione ha prodotto un errore del proprio osservatore DOM nella pagina di test, che non usa MutationObserver nel codice del progetto.
