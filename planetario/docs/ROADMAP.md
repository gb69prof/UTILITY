# Planetario — Roadmap

**3 ottobre 2026 · Fase 5: quattro corpi ed effemeridi verificate; qualificazione hardware aperta**

Il progetto parte da un osservatorio dedicato a Sole, Terra, Luna e Marte. La prima milestone deve provare qualità visiva, correttezza del modello, input e VR prima di estendere il numero dei corpi. La base tecnica è descritta in [ARCHITECTURE.md](ARCHITECTURE.md).

**Punto di arresto attuale:** Fase 5 implementata su richiesta di proseguire alla fase successiva; fermarsi prima della Fase 6. La revisione del provider e le verifiche sono in [ADR-005](ADR-005-EPHEMERIS.md) e [PHASE-5-VERIFICATION](PHASE-5-VERIFICATION.md). Restano aperte le qualificazioni fisiche iPad/Quest e browser autonomi.

## 1. Regole comuni

- Tutti gli interventi rimangono sotto `planetario/`; conservare `gitkeep`. Indice del sito, workflow, altre PWA e server richiedono autorizzazione separata.
- Commit piccoli e descrittivi, dedicati a una decisione o funzionalità. Controllare l'elenco dei file modificati prima di ogni commit.
- Ogni fase aggiorna la documentazione e registra controlli, esiti e limiti. Dalla prima fase eseguibile: avvio del progetto, verifica errori, correzione e regressioni pertinenti.
- Distinguere quattro evidenze: test automatizzato, browser locale, simulazione/emulazione e dispositivo fisico. Una viewport iPad o un emulatore XR non sono un test iPad o Quest.
- Le fonti scientifiche e le condizioni d'uso devono precedere l'integrazione dei dati e degli asset.
- Nessuna promessa di data di consegna o velocità su hardware non provato. I budget di ARCHITECTURE sono obiettivi da misurare.

## 2. Fasi e criteri di uscita

### Fase 1 — Analisi tecnica

**Conclusa**, commit `fc2fae1eeb58e9b9980d4c1f6fbd2cd4afd8396a`.

Consegne: `docs/ARCHITECTURE.md` e `docs/ROADMAP.md`. Comprendono audit del repository, confronto Three.js/Babylon.js, decisione WebGL 2/WebXR, architettura proposta, scale, asset, input e prestazioni.

Evidenze raccolte: albero GitHub completo, `planetario/gitkeep` come unico file iniziale, workflow senza compilazione, documentazione ufficiale dei motori e fonti scientifiche candidate. Revisione sul commit iniziale `bba355def087d956218ba1748a95d6cda8ce567c`.

Criterio di uscita: due documenti coerenti, fonti collegate, confini e verifiche future espliciti; diff limitato ai due percorsi richiesti. Nessun test di esecuzione applicabile perché non esiste un'applicazione.

### Fase 2 — Consolidamento dell'architettura

**Conclusa documentalmente con questo aggiornamento.** Ripresa autorizzata dall'incarico di Fase 2. Letti integralmente ARCHITECTURE e ROADMAP e verificati albero e cronologia GitHub: alla ripresa `main` coincideva ancora con il commit della Fase 1, senza interventi successivi nel Planetario.

Consegne: aggiornati ARCHITECTURE e ROADMAP; creati DATA-MODEL e ACCEPTANCE-TESTS. Nessun file applicativo o asset. Confermati Babylon.js, TypeScript, Vite, WebGL 2 e WebXR; nessuna riapertura del confronto motori.

Decisioni chiuse: SI e radianti, Float64, frame ECLIPJ2000 destrorso con output eliocentrico, epoca JD 2451545.0 TDB, intervallo ±15 giorni, tre coniche osculatrici congelate e composizione Terra–Luna dal baricentro, rotazione IAU semplificata con inizializzazione completa. Formalizzati provider, clock, proiezione/origini, azioni, stato e lifecycle. Fissati preset delle scale, soglie scientifiche e condizioni di qualificazione Babylon.

Criterio di uscita documentale: quattro documenti coerenti e diff limitato ai percorsi autorizzati; nessuna pretesa di aver acquisito/qualificato il dataset o provato l'hardware. La matrice usa `DA DEFINIRE CON TEST REALE` per i modelli non noti. La conformità delle future implementazioni ai contratti rimane da verificare nelle fasi eseguibili.

### Fase 3 — Struttura e build system

Dipendenza: contratti consolidati e successivo incarico. **Conclusa con l'incarico di Fase 3.** Base verificata: `99107d1ae7a3393c1bdd39fcbda97413aa4f49c8`, senza cambi incompatibili dopo la Fase 2.

Consegnati struttura modulare TypeScript/Vite/Babylon, versioni esatte e lockfile, bootstrap separato, canvas predisposto e diagnostica delle capacità. Nessun Inspector o renderer avviato. Creati `README.md`, `docs/SCIENTIFIC-SOURCES.md` e `docs/ASSET-SOURCES.md`; tutte le fonti/risorse future restano candidate, nessun dataset astronomico acquisito.

Tradotti i tipi di DATA-MODEL, aggiunti schema JSON 2020-12 e validatori semantici, senza cambiare frame/unità/epoca/intervallo. Fixture solo sintetiche, escluse dalla build. La verifica di forma e revisione non attribuisce qualificazione astronomica: il caricamento operativo resta bloccato fino ai rapporti indipendenti V12/V13. Norme dei quaternion/poli degli stati e comportamento di provider/clock/proiezione restano alle fasi applicative.

Preparati staging ignorato e rilascio statico tramite allowlist; `emptyOutDir:false` e pulizia circoscritta alla sola `.staging`, con rifiuto di link/junction. Versionati soltanto gli output previsti (`index.html`, `build/`) oltre ai sorgenti e documenti. Workflow invariato. URL locali per dev/preview disponibili; URL HTTPS e test dei dispositivi rimangono da qualificare separatamente.

Criterio di uscita soddisfatto: `npm ci`, TypeScript, 19 test e build/release riusciti; pagina avviata nel browser integrato Codex dalla sottocartella `/UTILITY/planetario/`, console senza errori/warning; 27/27 file HTTP identici allo staging e al rilascio. Diff finale confinato a `planetario/`, gitkeep conservato. Il [rapporto](PHASE-3-VERIFICATION.md) distingue prove locali, simulate e non eseguite. La pagina minima è un controllo tecnico, non il Planetario completo.

### Fase 4 — Motore 3D minimo e verifica dei rischi

Dipendenza soddisfatta: Fase 3 verificata su `main` al commit `53c9aa18ffcc5ff1ee8f768e5d3da094099b7450`. **Implementazione minima conclusa; qualificazione fisica e browser autonomi ancora aperti.**

Consegnati engine WebGL 2, scena destrorsa con una sfera tecnica, griglia 512 px locale, camera, azioni/picking, scheda HTML, touch simulato e tastiera, diagnostica, profili e gestione del contesto. WebXR implementato con sessione reale su richiesta, raggi semantic select, pannello mesh, tracciamento in metri e osservatorio fermo. Nessuna sessione immersiva fisica eseguita.

Decisione: **BABYLON CONFERMATO per la prova nel browser integrato su Windows, provvisoriamente rispetto a Chrome/Edge autonomi, iPad e Quest.** Nessun difetto bloccante del motore dimostrato. Gli esiti parziali e le misure sono nel rapporto; hardware assente non è un pass né un fallimento Babylon. Questo era lo stato alla chiusura della Fase 4; la Fase 5 è ora implementata con la revisione ADR-005.

Obiettivi normativi conservati:

Creare engine WebGL 2, camera, un oggetto di prova, luce, ciclo di rendering, selezione e gestione errori. Introdurre diagnostica di frame, memoria stimata, profilo grafico e ripristino del contesto. UI HTML minima separata dalla scena.

**Anticipare qui una prova WebXR limitata**: ingresso/uscita, controller, selezione e pannello su un visore disponibile. La Fase 8 rimane l'integrazione completa; rinviare ogni verifica XR fino a quel punto aumenterebbe inutilmente il rischio architetturale.

Eseguire il protocollo B01–B08 di ACCEPTANCE-TESTS: una sfera con texture tecnica leggera, nessun corpo astronomico definitivo. Sono definite sia le condizioni di successo sia quelle sufficienti a giustificare un riesame del motore. Hardware assente significa prova bloccata, non Babylon fallito.

Criterio di uscita: motore stabile su Chromium/Edge e prima verifica touch; nessun errore bloccante noto nel ciclo XR di prova. Se il Quest non è disponibile, registrare il rischio aperto e non dichiarare validata la scelta su hardware. Rivalutare il motore se la prova evidenzia difetti bloccanti.

### Fase 5 — Sole, Terra, Luna e Marte

**Implementata nella v0.5.0, con revisione esplicita del provider.** Tre coniche acquisite e collaudate; modello lunare non qualificato e conservato come evidenza. Movimento da vettori JPL con Hermite oraria; 720 controlli intermedi per cinque stati, 241 orientamenti PCK per corpo. Quattro sfere e mappe 2K, luce solare, stelle illustrative, clock e scale disponibili. Le prove realmente eseguite e le lacune sono nel rapporto. I requisiti originari seguenti restano leggibili; ADR-005 modifica soltanto la scelta del provider operativo e la semantica delle guide.

Dipendenza: nucleo minimo stabile e fonti validate per i dati utilizzati.

Integrare i quattro corpi, dataset separati, campo stellare plausibile, geometrie e texture progressive. Implementare orbite ellittiche, rotazioni, orientamento degli assi e clock condiviso. Prima la scala scientifica, quindi didattica ed esplorativa con indicazioni permanenti.

Acquisire i tre set di elementi osculatori Horizons e i vettori di riferimento secondo DATA-MODEL, registrando richieste, versioni e hash. L'intervallo iniziale è di 30 giorni centrati su J2000-TDB: non estenderlo silenziosamente per animare un anno. La curva completa è l'ellisse del modello, non una traiettoria storica qualificata fuori intervallo.

Il Sole riceve una resa della fotosfera studiata; la Terra una superficie realistica con illuminazione coerente. Luna e Marte usano risorse con provenienza registrata. Atmosfera e nuvole entrano solo entro il budget, senza rinviare la chiarezza del terminatore giorno/notte.

Criterio di uscita: pausa/ripristino riproducibili, orbite non percorse a velocità angolare uniforme, nessuna dipendenza dal frame rate, nessun salto di coordinate nelle viste locali. Tutti gli asset integrati hanno record verificato. Le semplificazioni scientifiche sono visibili; nessuna pretesa di prevedere eclissi.

### Fase 6 — Interazioni desktop e touch

Dipendenza: i quattro corpi e lo stato applicativo funzionano.

Completare orbitazione, zoom, spostamento, selezione, avvicinamento, ritorno alla vista generale, tasti e controlli temporali. Progettare landscape iPad con pannello laterale e portrait con pannello inferiore. Distinguere selezione da drag e pinch. Adeguare i controlli al ridimensionamento del viewport.

Criterio di uscita: le stesse azioni funzionano con mouse, tastiera e touch; la UI non intercetta accidentalmente i movimenti del canvas; drag e pinch non attivano viaggi. Rotazione del dispositivo e zoom del testo non nascondono i comandi essenziali. Test iPad fisico da registrare separatamente.

### Fase 7 — Contenuti scientifici

Dipendenza: dati e selezione stabili.

Creare per ogni corpo Osserva, Comprendi e Approfondisci, con fonti per le affermazioni. Collegare le prime grandi domande a ciò che l'utente vede. Mostrare unità, differenza tra distanza istantanea e semiasse maggiore, definizioni delle temperature e limiti del modello.

Implementare elenco HTML alternativo, focus, navigazione da tastiera, riduzione del movimento e presentazione delle fonti. Nessun collegamento attivo a laboratori inesistenti.

Criterio di uscita: tutti i numeri mostrati provengono da un dato validato o da un calcolo tracciabile; nessuna duplicazione incoerente tra JSON e testo; percorsi informativi comprensibili senza interazione esclusivamente visiva.

### Fase 8 — WebXR dell'osservatorio

Dipendenza: prova XR iniziale, azioni e contenuti condivisi.

Integrare sessioni, controller, raggio, selezione, pannelli spaziali, pausa e cambio destinazione. Prevedere ricentratura, uso seduto/in piedi, perdita di tracking, disconnessione del controller e ritorno alla modalità schermo. Testare la separazione tra metri del tracking e scale astronomiche.

Navigazione iniziale da postazioni con dissolvenza. Niente volo continuo obbligatorio. Hand tracking, pinch e teletrasporto su superfici reali dell'ambiente sono estensioni successive.

Criterio di uscita: prova nel Meta Quest Browser reale con un'azione per pressione, pannelli leggibili, testa non guidata dalla camera, ingresso/uscita ripetuti senza perdita dello stato. L'emulazione può verificare logica e flussi, ma non chiude questo criterio.

### Fase 9 — Ottimizzazione iPad, mobile e Quest

Dipendenza: esperienza completa da profilare.

Misurare CPU, GPU ove disponibili, frame persi, memoria stimata e traffico. Introdurre KTX2/Basis, LOD, caricamento su richiesta e rilascio delle risorse; verificare anche il fallback senza compressione GPU. Definire Auto, Qualità e Prestazioni con isteresi.

Ottimizzare in base ai colli di bottiglia: risoluzione, trasparenze, texture, draw call e postproduzione. Multiview/foveazione soltanto dopo rilevamento del supporto e prova. Nessuna riduzione silenziosa dell'accuratezza scientifica per recuperare frame.

Criterio di uscita: obiettivi prestazionali soddisfatti sui dispositivi dichiarati, con rapporto riproducibile e sessione continuativa di almeno 15 minuti. Stabilità di memoria nei cambi ripetuti del corpo e del livello di dettaglio. Un dispositivo non disponibile resta «non verificato».

### Fase 10 — Rifinitura grafica

Dipendenza: budget prestazionali misurati.

Rifinire illuminazione, colore, esposizione, terminatore, atmosfera, fotosfera, antialiasing, etichette e transizioni. Confrontare le superfici con immagini di riferimento e controllare cuciture, poli, verso delle mappe e scala dei rilievi. Verificare entrambi gli occhi in VR, non soltanto screenshot monoscopici.

Criterio di uscita: nessun effetto introduce una spiegazione falsa; testi e selezione restano leggibili, soprattutto in landscape e nel visore. Ripetere i controlli prestazionali dopo ogni modifica grafica significativa.

### Fase 11 — Verifica scientifica e chiusura della prima milestone

Dipendenza: esperienza rifinita.

Rivedere dataset, unità, fonti, validità temporale, geometria e contenuti. Confrontare campioni di posizione con JPL usando stesso centro, frame e tempo. Registrare gli scostamenti e stabilire quali sono compatibili con un modello educativo; non adattare retroattivamente la tolleranza per nascondere un errore.

Preparare `docs/VERIFICATION.md` con versioni, dispositivi, procedure, risultati e limiti. Aggiornare README e roadmap. La pubblicazione funzionale, quando richiesta, deve distinguere build locale, commit, workflow, risposta HTTP e parità dei file.

Criterio di uscita: nessun errore bloccante scientifico o d'interazione; fonti e condizioni d'uso complete; matrice di test compilata. Se manca una prova fisica obbligatoria, consegnare una versione candidata con quel limite e non dichiarare pieno supporto al dispositivo.

## 3. Prima milestone: perimetro concreto

| Incluso | Verifica di accettazione |
| --- | --- |
| Spazio 3D e stelle plausibili | Sfondo direzionale orientato, esposizione dichiarata, assenza di parallasse locale |
| Sole, Terra, Luna e Marte | Identità, texture e fonti verificabili per ciascun corpo |
| Orbite, rotazioni e inclinazioni | Modello, epoca e limiti dichiarati; test di direzione e trasformazioni |
| Luce e superfici | Lato illuminato coerente con posizione fisica del Sole |
| Tre scale | Stato fisico invariato, etichette esplicite, viste locali senza tremolio |
| Tempo | Pausa, play, fattori previsti e reset riproducibili |
| Desktop e touch | Selezione, osservazione, avvicinamento e ritorno funzionanti |
| Informazioni | Tre livelli progressivi con contenuti concisi e fonti |
| UI responsive e accessibile | Landscape/portrait, tastiera, contrasto e testo ingrandito |
| Primo WebXR | Controller, pannello e osservatorio confortevole; prova fisica distinta |
| Caricamento progressivo | App utilizzabile prima delle texture di maggior dettaglio |

Fuori dalla prima milestone: tutti gli altri pianeti e satelliti, asteroidi individuali, comete, effemeridi ad alta accuratezza per date arbitrarie, previsioni di eclissi, viaggio a velocità fisica, simulazione gravitazionale N-body del Sistema solare, campo magnetico terrestre, laboratori completi, audio e installazione/offline PWA.

Il clock, i dati e i contratti devono consentire tali ampliamenti senza implementarli anticipatamente.

## 4. Piano di verifica

### Test automatici scientifici e applicativi

- Conversioni di unità e invarianti; raggi/diametri coerenti; nessun `NaN`, massa negativa o fonte mancante.
- Keplero: residuo dell'equazione, pericentro e apocentro, variazione della velocità e riproducibilità all'epoca. Residuo numerico e accuratezza astronomica sono due controlli distinti.
- Frame, centro e tempo: casi noti per assi e orientamento; separazione centro terrestre/baricentro; campioni di riferimento conservati con query e provenienza.
- Scale: rapporti uniformi in modalità scientifica; fattori didattici dichiarati; misure numeriche identiche cambiando visualizzazione.
- Clock: stesso stato alla stessa data con frame rate differenti, pausa e reset; nessun salto dopo sospensione.
- Input: click singolo, annullamento del drag, cambio pointer, tastiera e un evento di selezione per trigger.
- Asset: campi obbligatori, file e hash presenti, varianti referenziate esistenti, caricamento fallito gestito.
- Browser: caricamento in sottocartella, nessun errore in console, layout, lifecycle, entrata/uscita XR emulata quando disponibile.

Le tolleranze astronomiche quantitative sono fissate in ACCEPTANCE-TESTS, sezione 3. Il dataset deve superarle prima della qualifica: non sono errori già misurati né garanzie JPL. I test non devono confrontare il modello con numeri generati dalla medesima implementazione.

### Matrice dei dispositivi

**Fase 3:** eseguiti controlli automatici dei contratti/build e diagnostica nel browser integrato, descritti in PHASE-3-VERIFICATION. Le prove del Planetario/renderer e i dispositivi fisici della tabella seguente restano non eseguiti. La matrice normativa con identificatori, hardware da definire e tipo di evidenza è in ACCEPTANCE-TESTS, sezione 2; la tabella seguente conserva la panoramica dei requisiti.

| Piattaforma | Prova prevista | Evidenza richiesta |
| --- | --- | --- |
| Windows Chrome/Chromium | Rendering, input, console, qualità e build | Versione browser/GPU, procedura e risultati |
| Windows Edge | Stesse funzioni con browser reale | Test distinto, anche se condivide Chromium |
| Firefox desktop | Rendering WebGL 2 e controlli; XR solo se disponibile | Esito oppure limite esplicito se non disponibile |
| iPad Safari | Landscape/portrait, gesture, pannelli, memoria, sospensione | Modello e iPadOS reali; WebKit emulato non sostituisce la prova |
| Android Chromium | Multitouch, memoria, caricamento e orientamento | Modello/OS/browser reali |
| Smartphone | Percorso compatto e qualità ridotta | Verificare utilità e leggibilità, senza obbligare all'esperienza completa |
| Meta Quest Browser | Stereo, controller, comfort, frame e session lifecycle | Modello, OS/browser e test in visore |

Su iPad il percorso garantibile dal progetto è il 3D touch quando WebGL 2 funziona; non promettere VR immersiva sulla base della disponibilità di WebGPU. Su qualsiasi browser mostrare l'accesso VR soltanto dopo verifica delle capacità.

### Procedura manuale minima su hardware

1. Aprire l'URL HTTPS dalla build esatta e registrare dispositivo/versioni/profilo.
2. Selezionare ogni corpo; avvicinarsi, osservare e tornare alla vista generale.
3. Alternare scale e tempo, controllando etichette e mantenimento della selezione.
4. Su tablet ruotare lo schermo, eseguire drag/pinch/pan e scorrere un pannello; verificare che non si attivino azioni accidentali.
5. Su Quest entrare/uscire tre volte, provare entrambi i controller, pannelli, ricentratura e cambio destinazione; controllare stereo e comfort.
6. Ripetere cambi di corpo e qualità per almeno 15 minuti; registrare degrado termico, frame mancati e stabilità della memoria stimata.
7. Provare sospensione/ripresa e un caricamento fallito; registrare ripristino o difetto riproducibile.

Se l'hardware manca, lasciare la procedura aperta con stato «da verificare sul dispositivo». Non convertirla in un risultato simulato.

## 5. Espansioni dopo la prima milestone

| Passo | Contenuto | Prerequisito |
| --- | --- | --- |
| Misurare e confrontare | Terra–Luna, Terra–Sole, Terra–Marte, tempi della luce e dimensioni affiancate | Scale e unità validate; distinguere distanza istantanea e media |
| Sistema solare ampliato | Altri pianeti, principali satelliti, fasce, pianeti nani e comete | Asset a richiesta e budget già verificati |
| Date e fenomeni | Effemeridi campionate, ombre, occultazioni ed eclissi | Provider accurato, conversioni temporali ed errori d'interpolazione verificati |
| Gravity Lab | Masse, velocità, orbite e fuga con parametri modificabili | Integratore e controllo di conservazione separati dal modello canonico |
| Light Lab | Spettro, lunghezza d'onda, Doppler e propagazione | Modelli con unità e limiti espliciti |
| Energy Lab | Trasformazioni, calore, radiazione e fusione | Distinzione fra analogia visiva e modello quantitativo |
| Earth Lab | Atmosfera, clima, acqua, geologia e magnetismo | Dataset dedicati e scala terrestre adeguata |
| Life Lab | Chimica, cellule, DNA, evoluzione e biodiversità | Fonti biologiche e distinzione tra fatti, modelli e questioni aperte |

Il percorso Universo → Sistema solare → gravità → luce → energia → materia → Terra → vita → evoluzione → essere umano è una struttura di esplorazione. Ogni nuovo laboratorio richiede una propria verifica scientifica; non è una semplice estensione grafica della scena iniziale.

## 6. Decisioni chiuse e attività residue

Non restano scelte scientifiche implicite per iniziare la costruzione dei contratti: epoca, intervallo, unità, frame, centri, modello orbitale, rotazione, convenzioni del tempo, scale e origini sono definiti in DATA-MODEL. Soglie e prove sono definite in ACCEPTANCE-TESTS; input, stato e lifecycle sono in ARCHITECTURE, sezioni 3.2–3.4.

Restano attività esecutive, senza impedire la conclusione documentale della Fase 2:

- Inventario e prove dei dispositivi reali: modelli e versioni ancora `DA DEFINIRE CON TEST REALE`.
- Dipendenze bloccate e build qualificate nella Fase 3; rendering/touch/XR ancora da qualificare nella Fase 4.
- Acquisizione dei valori del dataset, inizializzazione PCK e confronto JPL: ricetta e soglie già decise, risultati non ancora disponibili.
- File definitivi delle texture, condizioni d'uso, trasformazioni e risoluzioni.
- Affinamento dei profili grafici sulle misure hardware; budget iniziali già espliciti.
- Verifica del percorso HTTP e del rilascio statico prima della pubblicazione funzionale.

Rischi aperti: il modello lunare osculatore potrebbe non superare le soglie fissate; le rotazioni semplificate non hanno accuratezza osservativa; iPad/Quest devono qualificare precisione visiva, input e comfort. Una soglia fallita richiede correzione o revisione motivata del contratto, non accettazione automatica.

**Arresto alla Fase 3.** Il passo successivo sarà la Fase 4, soltanto su un nuovo incarico. Consegnato il nucleo tecnico; nessuna scena, corpo astronomico o sessione XR costruita in questa consegna.
