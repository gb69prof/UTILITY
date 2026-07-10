# Spazio — PWA per presentazioni visuali

Spazio è un prototipo funzionante di editor e visualizzatore per presentazioni zoomabili, ispirato al modello di navigazione di Prezi.

## Avvio

La PWA va aperta tramite un piccolo server locale (non con un doppio clic sul file HTML), perché installazione e modalità offline richiedono un indirizzo `http://`.

Da PowerShell, dentro questa cartella:

```powershell
python -m http.server 8080
```

Poi aprire `http://localhost:8080` nel browser. Dal menu del browser si può scegliere **Installa Spazio** o **Installa app**.

## Funzioni incluse

- spazio di lavoro libero, zoomabile e trascinabile;
- testo e forme con posizione, dimensioni, rotazione, colori, bordo e forma personalizzabili;
- immagini, URL, audio, video, file Word, PDF e testo;
- connettori retti, curvi o a gomito, con colore, spessore, tratto e freccia modificabili;
- ordine fronte/retro degli elementi;
- sequenza guidata di presentazione;
- salvataggio nel browser, apertura dei lavori salvati, esportazione e importazione JSON;
- modalità presentazione con panoramica iniziale, navigazione per tappe e zoom con doppio clic;
- installazione PWA e cache offline dell'applicazione.

## Note sui file

I materiali inseriti vengono incorporati nel progetto. Il salvataggio del browser ha limiti di spazio variabili; per presentazioni con video o molti file grandi è consigliato usare spesso **Esporta**. I PDF sono visualizzati direttamente quando vengono ingranditi in presentazione; Word viene conservato come allegato apribile, mentre immagini, audio e video sono visualizzati direttamente.
