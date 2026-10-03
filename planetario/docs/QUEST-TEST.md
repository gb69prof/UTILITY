# Prova Quest e iPad — Planetario gbprof, Fase 4

La pagina è una prova tecnica: non è ancora il Sistema solare. I passaggi sotto devono essere eseguiti sul dispositivo fisico. Non sono risultati già acquisiti.

## Quest: procedura breve

1. Indossa il visore in uno spazio libero, restando seduto o fermo. Apri nel browser del Quest **https://gbprof.it/UTILITY/planetario/**. Annota modello del Quest e versione del browser.
2. Prima di entrare in VR devi vedere una sfera a scacchi, la scritta **OGGETTO TECNICO DI PROVA** e i comandi. Se la pagina è rimasta alla Fase 3, ricaricala.
3. Premi **Entra in VR**. Il pulsante appare solo se il browser conferma il supporto immersivo e la preparazione riesce. Accetta la richiesta del browser se intendi iniziare la prova. Se il pulsante manca, segnala il testo sotto i comandi e la voce WebXR della diagnostica.
4. Guarda davanti a te: la sfera deve rimanere ferma a circa due metri dalla posizione iniziale, all'altezza iniziale degli occhi. Muovi delicatamente la testa: scena stabile, visione stereo naturale, nessuno spostamento automatico. Interrompi se avverti disagio.
5. Punta il raggio di un controller sulla sfera e premi brevemente il **trigger**. Deve comparire una sola scheda con nome, stato Selezionato e Chiudi. Punta Chiudi e premi il trigger: scompare la scheda, resta la selezione. Ripeti con l'altro controller.
6. Esci dalla modalità immersiva usando il comando di uscita del browser/menu del Quest. La vista precedente sullo schermo deve tornare utilizzabile. L'app offre anche **Esci dalla VR** quando il browser rende accessibile la pagina durante la sessione.
7. Ripeti ingresso e uscita tre volte. Il raggio e le schede non devono moltiplicarsi.

## Registrazione B03, B05, B06, B07 e B08

- Per B03, annota il contatore **selezioni** nella diagnostica prima dell'ingresso. Esegui 20 pressioni brevi e distinte sul bersaglio con il controller sinistro e 20 con il destro: dopo l'uscita il contatore deve essere aumentato esattamente di 40. Evita di puntare la scheda, che ha priorità sul bersaglio. Le semplici pressioni/rilasci non devono produrre doppie selezioni.
- Per B05 annota l'esito di ogni ciclo (1, 2, 3), la conservazione della selezione e il ritorno alla camera precedente.
- Per B06 verifica che una piccola traslazione reale della testa dia una traslazione visiva equivalente, senza moltiplicazioni di scala. Il testo deve essere leggibile con entrambi gli occhi. Una valutazione numerica metrica/stereo richiede una prova strumentata: la sola sensazione visiva non la certifica.
- Per B07 annota refresh del visore e profilo, osserva per almeno cinque minuti dopo il warm-up, e usa strumenti del browser/compositor per contare i frame mancati. Obiettivo: refresh scelto sostenuto, frame mancati <1%, nessun degrado progressivo. La misura HTML a 60 Hz non certifica il compositor XR.
- Per B08 servono 20 cicli, con conteggi delle risorse confrontati nello stesso stato (prima/dopo, sessione chiusa). I pannelli e i raggi XR aumentano temporaneamente i conteggi; non devono accumularsi. Prova anche a rifiutare l'ingresso: la scena sullo schermo deve restare utilizzabile.

Non è prevista locomozione continua, né teleport, né movimento con lo stick. Il pannello XR espone soltanto nome, stato e chiusura; la spiegazione tecnica completa resta nella pagina HTML.

## iPad: procedura breve

1. Apri lo stesso indirizzo in Safari e annota modello iPad, versione iPadOS e Safari.
2. Tocca la sfera 20 volte: il contatore selezioni deve aumentare di 20. La scheda deve aprirsi e Chiudi scheda deve funzionare.
3. Trascina con un dito, pizzica con due dita, poi sposta entrambe le dita insieme. Deve cambiare la vista senza nuove selezioni al rilascio. Dopo un pinch, togli un dito e poi l'altro: nessuna selezione indesiderata.
4. Ripeti in orizzontale e verticale. I comandi devono essere raggiungibili; la pagina e la scheda devono scorrere fuori dal canvas. Prova anche uno zoom della pagina fuori dal canvas.
5. In Diagnostica e collaudo prova Auto e Prestazioni, poi Prova ripristino grafico: dopo una breve interruzione deve tornare la stessa griglia leggibile. Esegui Misura 5 minuti lasciando la pagina visibile; non ruotare il dispositivo durante quella misura.

## Cosa riferire

Copia questo schema e compila soltanto ciò che hai provato:

- Dispositivo / sistema / browser e versione:
- Data e URL / build visualizzata:
- Sfera e griglia corrette: sì/no; screenshot se utile:
- Selezioni iniziali/finali e numero di tocchi/trigger:
- Rotazione / zoom / spostamento / annullamento:
- VR: pulsante presente, ingresso, ray sinistro/destro, scheda, chiusura:
- Uscita e tre cicli:
- Fluidità cinque minuti, refresh, eventuale misura frame mancati:
- Problema e passaggi esatti per ripeterlo:

Stato iniziale del rapporto: **NON VERIFICATO SU HARDWARE FISICO** per iPad e Quest. I test automatici e la viewport simulata non cambiano questo stato.
