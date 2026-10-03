# ADR-005 — Provider operativo della Fase 5

Data: 3 ottobre 2026. Ambito: soltanto `planetario/`, v0.5.0. Decisione conseguente all’incarico di proseguire alla fase successiva.

## Problema verificato

I tre elementi osculatori sono stati acquisiti da Horizons all’epoca JD 2451545.0 TDB, con centri 10/399 e target 3/499/301. Il propagatore TypeScript è stato confrontato con CSPICE `conics`: errori relativi massimi di posizione e velocità inferiori a 1,2×10⁻¹², entro 10⁻¹⁰. All’epoca gli stati ricostruiti coincidono con i vettori Horizons entro un millimetro e 10⁻¹⁰ m/s. Non emerge un errore di unità, frame, centro, fase o solver.

Sui 241 campioni di ±15 giorni la conica Luna/Terra raggiunge **45.233.494,282 m** di errore, contro **30.000.000 m** ammessi. La velocità relativa raggiunge 99,151 m/s, appena entro il limite di 100 m/s. Il modello a due corpi congelato non descrive abbastanza bene il moto lunare perturbato in questo intervallo. Il rapporto `data/qualification.json` conserva FAIL, senza ritoccare soglie o parametri per farlo passare.

## Decisione

Attivare l’`EphemerisProvider` già specificato in DATA-MODEL §6.1. Usare campioni geometrici JPL orari di EMB/Sole, Marte/Sole e Luna/Terra. Hermite cubica usa posizione e velocità agli estremi; la velocità è la derivata dello stesso polinomio. Terra e Luna vengono ricostruite dal baricentro con i GM coerenti. Il Sole resta l’origine. Il dataset operativo incorpora 721 nodi per ciascuna delle tre serie, senza dipendere dalla rete.

Il confronto usa 720 campioni JPL alla mezz’ora **non presenti nei nodi**, per ciascuna delle cinque serie EMB/Sole, Terra/Sole, Marte/Sole, Luna/Terra e Luna/Sole. Applicare le soglie già previste per le effemeridi: 1000 m e 0,01 m/s per gli stati eliocentrici, 100 m e 0,01 m/s per Luna/Terra. Tutte passano. Questo anticipa un servizio tecnico previsto, senza avviare contenuti, laboratori o integrazione XR delle fasi successive.

## Cosa resta invariato

SI, binary64, centro Sole, frame destrorso ECLIPJ2000, TDB, epoca J2000, dominio chiuso ±1296000 s, blocco dell’estrapolazione. Orientamento PCK00011 completo a t0, poi polo fisso e spin secolare, confrontato con il PCK completo ai 241 istanti. Clock ancorato a tempo monotono, pause e reset. Preset di scala e raggi fisici. I dati fisici non vengono deformati dal renderer.

Il caricatore di bozze continua a rifiutare l’uso operativo. Il nuovo provider controlla rapporto, hash e copertura. La build rigenera entrambi i rapporti: quello delle coniche deve conservare solo il fallimento noto, quello delle effemeridi deve passare. Nessun interruttore dell’interfaccia abilita il modello respinto.

## Conseguenze visibili

- Le ellissi EMB e Marte sono **ellissi di riferimento del modello congelato**, non tracce esatte del provider operativo; quella EMB non è etichettata come orbita della Terra.
- In prossimità di Terra/Luna, la guida mostra il percorso relativo lunare di 30 giorni traslato sul centro terrestre corrente. Non è una traiettoria eliocentrica né una curva qualificata fuori intervallo.
- Movimento e rotazione non si aggiornano per incremento angolare a ogni frame: sono valutati allo stesso istante del clock.
- Il report misura errori di interpolazione rispetto a JPL, non l’incertezza fisica assoluta di JPL. Non consente previsioni di eclissi o orientamento terrestre ITRF.
- La scheda iniziale preseleziona Terra come punto di ingresso, mantenendo panoramica scientifica e tempo fermo; questa piccola revisione UI è dichiarata rispetto al precedente stato iniziale con selezione nulla.

Alternativa valutata: restringere l’intervallo della conica. Scartata come impostazione predefinita perché ridurrebbe i 30 giorni didattici e conserverebbe un errore lunare elevato. Nessuna autorizzazione aggiuntiva è necessaria per innalzare l’accuratezza entro il lavoro richiesto; la revisione è esplicita e verificabile, non un allargamento nascosto delle soglie.
