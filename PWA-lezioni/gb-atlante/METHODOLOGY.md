# Metodo, migrazione e limiti

## Separazione delle affermazioni

Il checkpoint GBATLANTE_MAP10_1.0.1 mantiene entità, persone, relazioni, spatial assertions, fonti, schema e issues originali. I 19 file importati sono verificabili contro l'archivio fornito; gli strumenti originali restano disponibili. `atlas.json` è un'aggiunta e non sostituisce il database approvato.

La geometria è un supporto spaziale. Sovranità, controllo effettivo, amministrazione, occupazione, appartenenze e relazione napoleonica sono proprietà distinte. Un'alleanza non diventa annessione; un'unione personale non fonde due Stati. Il Sacro Romano Impero è disegnato come contorno istituzionale, senza riempimento unitario.

## Acquisizione e derivati

L'estrazione OpenHistoricalMap del 12 settembre 2026 considera relazioni amministrative temporalizzate per il periodo 1796–1816. Conserva ID della relazione, tag della fonte, licenza, intervallo temporale e SHA-256 della geometria prima delle trasformazioni. Le relazioni incomplete e le geometrie non poligonali non sono promosse a territori.

Le geometrie canoniche sono ritagliate al riquadro cartografico [-26,33,46,72]. I bordi del riquadro non sono confini storici. Le riparazioni GEOS sono registrate nelle note. Il derivato usa tolleranza 0,008 gradi con preservazione della topologia: non è una garanzia di adiacenza perfetta tra entità indipendenti. Il dato non è adatto a misure catastali, localizzazione puntuale di frontiere o calcoli demografici di precisione.

Tutti i perimetri OHM restano `certainty: low`, `boundary_type: approximate` e tratteggiati. Molti tag della fonte chiedono ancora una fonte per la frontiera; alcune carte citate sono posteriori al periodo rappresentato. Il solo confronto visivo con IEG non sana questi problemi.

La selezione temporale usa intervalli con estremo finale esclusivo. Anni e mesi incompleti sono interpretati come intervalli conservativi, non come date storiche esatte. Il filtro non interpola confini mancanti e non trasferisce silenziosamente le relazioni del 1812 ad altre date.

## Casi del checkpoint 1812

| Caso | Trattamento | Limite residuo |
|---|---|---|
| Catalogna | Differenza spaziale tra due perimetri OHM, come amministrazione francese separata; Francia visualizzata col perimetro precedente | Ricostruzione approssimativa; non prova sovranità né controllo totale |
| Reno | Evidenziati i membri collegati alle relazioni originali | Mancano perimetri di alcuni piccoli membri; nessuno Stato territoriale «Reno» inventato |
| Waldeck/Pyrmont | Entità e geometrie distinte | IEG a fine 1812 non va applicata automaticamente al 1 giugno |
| Province Illiriche | Entità distinta, sovranità francese | Generalizzazione del confine |
| Moldavia/Valacchia | Schede di sovranità e controllo originali | Nessuna anticipazione automatica della ratifica di Bucarest |
| Bessarabia | Scheda del trasferimento accessibile | Geometria autonoma della transizione non ricostruita |
| Malta | Entità speciale e scheda del controllo | Sovranità giuridica e occupazione britannica non assimilate |
| Isole Ionie | Entità del checkpoint consultabili | Controllo insulare frammentato non ricostruito geometricamente |
| Pomerania svedese | Scheda del checkpoint sovrapposta al perimetro OHM | Il nome svedese non equivale a controllo svedese nel 1812 |
| Helgoland | Isola e scheda distinte | Costa generalizzata |
| Erfurt | Dominio imperiale distinto dai membri del Reno | Perimetro da corroborare |
| Spagna | Schede concorrenti; area segnalata come contestata | Nessuna frontiera operativa franco-spagnola inventata |
| Sardegna | Sola componente insulare derivata dal perimetro sabaudo OHM, controllata visivamente su IEG 1812 | Costa generalizzata; non riutilizza il continente preannessione |

## Vienna e copertura degli altri anni

MAP_13 è dichiarata normativa e cita l'edizione ufficiale dell'Atto del 9 giugno 1815 della Wienbibliothek. Il governo effettivo francese dei Cento Giorni non è identificato con la restaurazione diplomatica. Il perimetro francese deriva dalla sistemazione del 1814, prima del secondo trattato di Parigi.

**La copertura normativa di MAP_13 è ancora incompleta.** Le altre entità seguono gli intervalli proposti da OHM, non un'estrazione articolo per articolo dell'Atto. Anche MAP_14 presenta lacune sostanziali: l'estrazione non contiene un perimetro pertinente di Austria e Baviera alla fine del 1815. Non sono stati sostituiti con i confini del 1816 o 1820. Esistono inoltre sovrapposizioni temporali upstream, per esempio nella transizione svizzera.

Le quattordici carte esterne al checkpoint sono esplorabili ma hanno profili politici incompleti. La classificazione «Rapporto politico da integrare» non significa neutralità. Le schede spiegano la mancanza dei dati; questa lacuna è una condizione di rilascio scientifico non superata.

## Eventi, campagne e documento originale

Le sintesi italiane degli eventi sono originali e rimandano alle cronologie e fonti diplomatiche. Le coordinate provengono da Natural Earth o dalla trascrizione Minard: indicano una località orientativa, non il campo di battaglia. Dove manca una coordinata verificata l'evento è testuale.

Le campagne senza itinerario verificato mostrano tappe, non linee decorative. La Russia usa i tre gruppi e le due direzioni A/R della trascrizione della carta statistica Minard 1869. Non si attribuiscono date precise a tutti i vertici, non si assimila la larghezza del tratto a una nuova stima delle perdite. Le consistenze della fonte sono conservate nel GeoJSON.

Stockdale 1812 è una carta coeva verificata nel catalogo Library of Congress, datata 25 luglio; non mostra operazioni militari. È consultabile offline come documento originale con ingrandimento, senza georeferenziazione né assimilazione al nostro confine ricostruito.

## Validazione e rilascio

Il validator controlla schemi, riferimenti, vocabolari, intervalli, provenienza, geometrie GEOS, anelli e coordinate. I mutation tests corrompono copie in memoria e devono essere respinti. La validazione del checkpoint è eseguita separatamente e non riscrive il rapporto congelato.

Il report distingue validità tecnica e completezza scientifica. Un esito strutturale positivo **non** autorizza `READY FOR CLASSROOM USE: YES`. Il registro conserva le lacune e le fonti necessarie per risolverle. Priorità: completare MAP_10 e MAP_14, risolvere la copertura normativa di Vienna, estendere i profili temporali, poi corroborare le geometrie delle altre date.
