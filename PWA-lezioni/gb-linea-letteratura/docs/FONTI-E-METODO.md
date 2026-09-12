# Fonti, metodo e manutenzione

Catalogo: 84 autori senza duplicazioni, 43 correnti o aree culturali. Verifica dei materiali: 12 settembre 2026.

## Criteri storico-letterari

Le sintesi sono testi redazionali originali. Le fasce degli autori rappresentano la vita, non la durata di appartenenza a una corrente. Le relazioni con le correnti sono esplicitate nel pannello. I periodi culturali hanno limiti orientativi; le aree trasversali non sono presentate come scuole organizzate. La questione della lingua e la poesia dialettale hanno una storia più lunga dell'intervallo scelto per visualizzarne una fase significativa.

Le date incerte dei primi autori sono segnalate con ≈ e una nota. Per Elena Ferrante si rappresenta esclusivamente l'attività editoriale dal 1992; non si attribuiscono nascita, identità o ritratto. Le opere sotto gli autori sono richiami senza datazione, non una cronologia delle pubblicazioni.

Riferimenti di controllo per le eccezioni e il presente:

- [Francesco d'Assisi — Treccani](https://www.treccani.it/enciclopedia/santo-francesco-d-assisi_%28Enciclopedia-Italiana%29/)
- [Giacomo da Lentini — Federiciana, Treccani](https://www.treccani.it/enciclopedia/giacomo-da-lentini_%28Federiciana%29/)
- [Elena Ferrante — Treccani](https://www.treccani.it/enciclopedia/elena-ferrante/)
- [Stefano Benni — ANSA, 9 settembre 2025](https://www.ansa.it/sito/notizie/cultura/2025/09/09/e-morto-stefano-benni-lo-scrittore-di-bar-sport_4cafdb64-fd96-44e2-ab65-73b0813d09c8.html)
- [Dacia Maraini — Treccani](https://www.treccani.it/enciclopedia/dacia-maraini/)
- [Claudio Magris — Treccani Libri](https://www.treccanilibri.it/autori/claudio-magris/)
- [Erri De Luca — Treccani](https://www.treccani.it/enciclopedia/erri-de-luca/)
- [Roberto Saviano — Treccani](https://www.treccani.it/enciclopedia/roberto-saviano/)
- [Paolo Giordano — Treccani](https://www.treccani.it/enciclopedia/paolo-giordano/)

Le fonti specifiche disponibili sono inoltre associate ai record degli autori. Per gli autori trattati nei repository didattici si sono consultati i testi delle relative lezioni.

## Collegamenti alle lezioni

`data/existing-pwa-map.json` conserva l'inventario: repository, percorso, titolo, URL pubblico, verifica del titolo e del manifest, eventuale associazione. `data/pwa-links.json` contiene soltanto i materiali collegati. Non si derivano pulsanti da nomi di directory senza verifica. I collegamenti si aprono in una nuova scheda.

Gli indici dei repository possono indicare materiali non ancora esistenti. In III-anno le cartelle annunciate per Petrarca, Boccaccio, Machiavelli, Ariosto e Tasso non hanno una PWA verificata. Non vengono inseriti URL presunti. Dante dispone invece di `Dante-corpus` e `inferno`, fuori da Letteratura.

Materiali esaminati ma non collegati: Eloisa e Abelardo (antecedente del XII secolo, fuori dal catalogo autori); la precedente versione di Amor cortese in `Letteratura/Lezioni`; il corpus Illuminismo nella cartella `prova` (titolo pertinente ma collocazione di prova); Fallaci (PWA valida, autrice non compresa nel catalogo richiesto). I percorsi senza manifest e i materiali senza pagina iniziale completa non sono conteggiati come PWA.

Non sono state trovate PWA autonome per Verismo e Decadentismo. Le opere e gli autori collegati restano distinti dalle correnti. Il contesto del Settecento illuminista è un approfondimento anche per Alfieri, non una sua PWA dedicata.

## Immagini

Si privilegiano copie locali delle immagini già usate nelle lezioni. I file sono ridimensionati e compressi per la distribuzione offline. Gli originali nei repository fonte non vengono modificati. Alcuni ritratti dell'archivio didattico sono ricostruzioni illustrative: la scheda lo segnala e rimanda alla fonte.

Le immagini aggiuntive da Wikimedia Commons conservano il collegamento alla pagina del file e i dati di attribuzione e licenza verificabili nel record `imageCredit`. In assenza di un'immagine locale verificata si usa un monogramma, senza inventare volti.

La fascia panoramica `assets/hero.webp` è stata generata con ImageGen integrato, senza API o chiavi esterne. Prompt: panorama 3:1 nello stile della copertina fornita, da Dante e Firenze al manoscritto con penna, al contemplatore romantico fra montagne e mare e alla macchina da scrivere; pittura realistica, ombre blu notte e toni oro/seppia, nessun testo o elemento di interfaccia. È un'evocazione, non un documento storico.

## Manutenzione e offline

Modificare i JSON in `data`, eseguire `npm run build` e `npm test`. La build calcola la versione della cache dai contenuti e genera il service worker. La cache è limitata alla cartella di questa PWA. Tutte le risorse fondamentali, inclusi i ritratti locali, sono precaricate; se una risorsa manca, la nuova versione non viene attivata. L'aggiornamento attende la chiusura delle schede della vecchia versione per evitare di mescolare dati e interfaccia.

Nessun tracciamento o servizio remoto è necessario per consultare la timeline. L'accesso a lezioni esterne, fonti e crediti online richiede rete. Il presente della timeline si aggiorna con l'anno del dispositivo; le informazioni biografiche vanno mantenute editorialmente.
