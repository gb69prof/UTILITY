# Verifiche Desk libero

Questi test usano un profilo browser temporaneo e dati inventati. Non eseguirli
contro un archivio personale: usare il server locale del repository.

Richiedono Node, Playwright e Chromium installati nell'ambiente di sviluppo.
Nessuna dipendenza è richiesta dalla PWA in produzione.

Dalla radice del repository, servire i file su `http://127.0.0.1:8765`, quindi:

```sh
node Desk/tests/desktop.cjs
node Desk/tests/touch-offline.cjs
```

È possibile impostare `DESK_TEST_URL` per un diverso server locale e
`CHROMIUM_EXECUTABLE` per un browser già installato. Immagini e copie di prova
sono scritte in una cartella temporanea dichiarata dal test.

Il primo test verifica migrazione, persistenza, drag, viste, barra laterale,
blocco, connettori, annullamento, personalizzazione, URL, annullamento dialoghi,
scrivanie, export/import binario, archivi non validi e dimensioni tablet.
Il secondo usa eventi touch del browser, tastiera, immagine personale,
rollback della transazione di importazione, service worker e riapertura offline.
Sono prove Chromium con viewport tablet; non sostituiscono una prova fisica
su Safari/iPadOS.
