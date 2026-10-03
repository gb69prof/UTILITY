# Planetario — Modello dei dati e contratti scientifici

**Fase 2 · Specifica normativa v1 · 3 ottobre 2026**

Questa specifica consolida [ARCHITECTURE.md](ARCHITECTURE.md). Definisce contratti da implementare nelle fasi successive, senza introdurre applicazione, dipendenze o dataset operativi. I frammenti TypeScript e JSON sono specifiche documentali. I criteri di verifica sono in [ACCEPTANCE-TESTS.md](ACCEPTANCE-TESTS.md).

## 1. Decisioni scientifiche chiuse

| Voce | Convenzione v1 |
| --- | --- |
| Corpi visibili | `sun`, `earth`, `moon`, `mars`; identificatori NAIF 10, 399, 301, 499 |
| Nodo scientifico ausiliario | `emb`, baricentro Terra–Luna, NAIF 3; nessuna superficie o raggio |
| Output del provider | Coordinate geometriche eliocentriche, centro fisico del Sole, senza correzione del tempo luce o aberrazione |
| Frame | `ECLIPJ2000`: orientamento eclittico fisso J2000, destrorso; non eclittica della data |
| Assi scientifici | X secondo l'asse X equatoriale J2000/ICRF nella convenzione Horizons; Z verso il polo nord eclittico; Y completa la terna destrorsa |
| Unità | m, s, kg, rad; GM in m³/s², densità kg/m³, temperatura K, gravità m/s² |
| Numeri | IEEE-754 binary64 nel dominio; nessun vettore Babylon o Float32 come dato scientifico |
| Epoca dinamica | `t0 = JD 2451545.0 TDB`; nel progetto `tTdbSeconds = 0` |
| Intervallo v1 | Inclusivo `−1296000 ≤ tTdbSeconds ≤ +1296000`: ±15 giorni da t0, 30 giorni totali |
| Modello iniziale | Tre ellissi osculatrici congelate a t0: EMB/Sole, Marte/Sole, Luna/Terra; composizione baricentrica Terra–Luna |
| Validità dichiarata | Modello educativo a due corpi; intervallo ammesso dal software, ancora da qualificare mediante confronto JPL |
| Rotazione | Polo fisso e rotazione uniforme con inizializzazione IAU/NAIF; limitazioni esplicite per Luna, Terra e Sole |

Il centro eliocentrico è una scelta di rappresentazione degli stati: non si afferma che il Sole sia fermo in un sistema inerziale esatto dell'Universo. Il modello omette accelerazioni perturbatrici, relatività e moto riflesso del Sole. `sun` restituisce posizione e velocità nulle per definizione del centro di output.

Il frame spaziale e l'epoca dei dati sono proprietà distinte. Nel progetto si adotta la trasformazione Horizons con obliquità fissa `ε = 84381.448 arcsec`, senza sostituirla con una diversa costante IAU moderna. Un vettore equatoriale diventa eclittico mediante la rotazione attiva `Rx(−ε)`. Registrare il frame esatto all'importazione [R1, R3].

### 1.1 Perché J2000 e perché 30 giorni

J2000-TDB permette un riferimento fisso, coerente con il tempo ET di SPICE e con gli input JD di Horizons; il conteggio di secondi resta piccolo [R2]. Una data corrente migliorerebbe la familiarità iniziale, ma cambierebbe il dataset al trascorrere del tempo. Un'epoca mobile rende meno riproducibili confronto e reset. J2050 non offre vantaggi per questa prima milestone.

Il limite di ±15 giorni è una decisione prudente per il modello lunare osculatore, che risente delle perturbazioni solari. Non è una validità dichiarata da JPL e non è una garanzia di errore massimo. I 30 giorni consentono di studiare buona parte di un ciclo lunare; non consentono di animare un anno terrestre o marziano. La curva completa dell'ellisse può essere mostrata come **orbita del modello**, distinta dalla traiettoria storica. Estendere il calendario richiederà una revisione esplicita del provider e nuove verifiche; non sbloccare date arbitrarie con lo stesso modello.

### 1.2 Epoca interna e calendario civile

Il termine J2000 usato con TT e quello usato con TDB non vanno trattati come lo stesso istante esatto. Qui il valore numerico dell'epoca è esplicitamente `2451545.0 TDB`, secondo la convenzione del conteggio SPICE; non `2000-01-01T12:00:00Z`.

Rappresentare il tempo con secondi relativi, calcolando `JD_TDB = 2451545.0 + t/86400` soltanto all'interfaccia con file/API. Per conversioni di calendario accurate mantenere il JD in due parti, invece di sommare continuamente piccoli delta a un JD grande.

UI iniziale obbligatoria: «Tempo del modello: ±N giorni da J2000 (TDB)», con moltiplicatore. Una data civile UTC è **opzionale e inizialmente disabilitata**. Quando introdotta: UTC → TAI mediante tabella dei secondi intercalari versionata; TT = TAI + 32,184 s; conversione TT↔TDB con routine verificata SOFA/SPICE e condizioni dichiarate. Conversione inversa per la visualizzazione; nessun offset UTC fisso generalizzato. Test con riferimenti indipendenti, inclusi i secondi intercalari, prima di attivare la funzione [R2, R4]. `Date` può formattare una data già convertita, mai propagare un'orbita o interpretare autonomamente TDB.

## 2. Acquisizione del futuro dataset

Questa fase definisce la ricetta; non introduce campioni JPL come se fossero già acquisiti. Nella Fase 5 l'importatore conserverà richiesta, risposta integrale, versione API/effemeride indicata da Horizons, data di acquisizione e SHA-256. Tutte le richieste del dataset devono essere coerenti per versione, epoca, unità e riferimento.

| Orbita | Target Horizons | Centro Horizons | GM della dinamica |
| --- | --- | --- | --- |
| `emb-sun` | `3` | `500@10` | GM Sole + GM Terra + GM Luna |
| `mars-sun` | `499` | `500@10` | GM Sole + GM del centro Marte |
| `moon-earth` | `301` | `500@399` | GM Terra + GM Luna |

Acquisire `EPHEM_TYPE=ELEMENTS`, `TLIST=2451545.0`, `TLIST_TYPE=JD`, `TIME_TYPE=TDB`, `REF_SYSTEM=ICRF`, `REF_PLANE=ECLIPTIC`, `OUT_UNITS=KM-S`, `CSV_FORMAT=YES`. Registrare dall'output EC, A, IN, OM, W, MA e il GM usato. Convertire distanze ×1000, GM ×10⁹ e angoli ×π/180; preservare tutte le cifre sorgenti. Il mean motion e il periodo della risposta servono da controllo, non come secondo orologio [R5].

Acquisire separatamente vettori geometrici per i riferimenti di test: `EPHEM_TYPE=VECTORS`, `VEC_TABLE=2`, `VEC_CORR=NONE`, stesse unità/frame/tempo, con target 3, 399, 301, 499 rispetto a `500@10` e target 301 rispetto a `500@399`. Un vettore apparente corretto per luce non può essere confrontato con uno stato geometrico simultaneo [R1].

Se il GM della risposta differisce da quello del registro, non mescolarli: registrare e riconciliare il set prima dell'importazione. Il GM del **sistema Marte** non va assegnato silenziosamente al corpo NAIF 499. Verificare il valore per il centro e gli eventuali contributi dei satelliti. I GM pubblicati da JPL costituiscono riferimenti, non sostituiscono il controllo del dataset [R6].

## 3. BodyData, OrbitalElements e provenienza

**Scelta:** file JSON con JSON Schema draft 2020-12 per forma/tipi e validatori semantici TypeScript per relazioni fisiche e provenienza. I tipi seguenti definiscono la struttura da tradurre nello schema nella Fase 3; il controllo TypeScript da solo non valida un JSON esterno. Nessun validatore è ancora implementato.

```ts
type BodyId = 'sun' | 'earth' | 'moon' | 'mars';
type NodeId = BodyId | 'emb';
type FrameId = 'ECLIPJ2000';
type Vec3 = readonly [number, number, number];
type Quaternion = readonly [number, number, number, number]; // x,y,z,w
type Unit = 'm' | 's' | 'kg' | 'rad' | 'rad/s' | 'm3/s2'
  | 'm/s2' | 'kg/m3' | 'K' | '1';
type Interval = Readonly<{ startTdbSeconds: number; endTdbSeconds: number }>;
type SourceId = string;
type Source = Readonly<{
  id: SourceId; title: string; institution: string; url: string;
  publishedOrVersion: string | null; accessedOn: string;
  locator: string; artifactSha256: string | null;
}>;
type Provenance = Readonly<{
  sourceIds: readonly SourceId[];
  originalValue: string; originalUnit: string;
  transformations: readonly string[];
  status: 'reported' | 'derived' | 'educational-approximation';
  review: 'pending' | 'reviewed'; limitations: readonly string[];
}>;
type Quantity = Readonly<{
  value: number; unit: Unit; definition: string;
  uncertainty: Readonly<{ plusMinus: number; coverage: string }> | null;
  provenance: Provenance;
}>;
type Temperature = Readonly<{
  kind: 'surface' | 'effective' | 'photosphere' | 'atmosphere';
  value: Quantity; context: string;
  statistic: 'mean' | 'minimum' | 'maximum' | 'representative';
}>;
type Composition = Readonly<{
  region: string; basis: 'mass-fraction' | 'mole-fraction' | 'volume-fraction';
  completeness: 'partial' | 'complete';
  components: readonly Readonly<{ species: string; fraction: Quantity }>[];
}>;
type OrbitalElements = Readonly<{
  id: string; target: 'emb' | 'mars' | 'moon'; center: 'sun' | 'earth';
  frame: FrameId; epoch: Readonly<{ jd: 2451545; scale: 'TDB' }>;
  valid: Interval; convention: 'osculating-frozen-two-body';
  a: Quantity; e: Quantity; i: Quantity; ascendingNode: Quantity;
  argumentOfPeriapsis: Quantity;
  anomalyAtEpoch: Readonly<{ kind: 'mean'; angle: Quantity }>;
  mu: Quantity; // parametro relativo; non il GM del solo corpo centrale
}>;
type Motion =
  | Readonly<{ kind: 'origin'; center: 'sun' }>
  | Readonly<{ kind: 'kepler'; orbitId: 'mars-sun' }>
  | Readonly<{ kind: 'earth-moon-member'; member: 'earth' | 'moon';
      barycenterOrbitId: 'emb-sun'; relativeOrbitId: 'moon-earth' }>;
type RotationData = Readonly<{
  kind: 'fixed-pole-uniform-spin';
  epoch: Readonly<{ jd: 2451545; scale: 'TDB' }>;
  poleFrame: 'J2000-equatorial';
  poleRa: Quantity; poleDec: Quantity; primeMeridianAtEpoch: Quantity;
  spinRate: Quantity; siderealPeriod: Quantity;
  direction: 'positive-about-pole' | 'negative-about-pole';
  obliquityAtEpoch: Quantity;
  obliquityReference: 'emb-sun-normal' | 'mars-sun-normal'
    | 'moon-earth-normal' | 'ecliptic-north';
  provenance: Provenance;
}>;
type BodyData = Readonly<{
  schemaVersion: '1.0'; recordStatus: 'draft' | 'reviewed';
  id: BodyId; name: string; internationalName: string;
  kind: 'star' | 'planet' | 'satellite'; centralBody: BodyId | null;
  naifId: number;
  physical: Readonly<{
    mass: Quantity | null; gm: Quantity | null;
    meanRadius: Quantity | null; equatorialRadius: Quantity | null;
    polarRadius: Quantity | null; gravity: Quantity | null;
    density: Quantity | null;
    temperatures: readonly Temperature[];
    composition: readonly Composition[];
  }>;
  motion: Motion; rotation: RotationData | null;
  missingReasons: Readonly<Record<string, string>>; // JSON Pointer -> motivo
}>;
```

Un registro separato `nodes.emb` contiene identità, NAIF 3 e riferimenti a Terra/Luna; non è un `BodyData` con dimensioni inventate. Un dataset comprende versione, intervallo, `sources`, `bodies`, `nodes`, `orbits`, costanti e rapporto di validazione. Tutti i riferimenti devono risolversi. Le unità ammesse per ogni campo sono quelle della tabella iniziale, non una libera scelta nell'enumerazione.

Ogni quantità ha una definizione: gravità `GM/R²` di una sfera non è una misura della gravità locale con rotazione; raggio nominale non è raggio medio osservato. La composizione distingue crosta, atmosfera e corpo intero. Una composizione parziale non viene normalizzata automaticamente al 100%. Valore mancante: `null` o array vuoto, con motivo in `missingReasons`. Nessun numero fittizio per soddisfare lo schema.

### 3.1 Convenzioni orbitali e casi degeneri

I, Ω e ω sono rotazioni attive destrorse, in radianti. `0 ≤ i ≤ π`; Ω, ω e M0 normalizzati in `[0,2π)`. Il pericentro è misurato dal nodo ascendente nel piano orbitale. M0 è anomalia **media**, mai longitudine media o anomalia vera. Per la v1 sono ammesse solo ellissi `a>0`, `0≤e≤0,2` e GM positivo; il limite sull'eccentricità è del provider iniziale, non una legge generale.

Nei test sintetici circolari fissare ω=0 e interpretare M0 come fase dal nodo; per orbite equatoriali fissare Ω=0 e incorporare l'orientamento in ω. Un importatore deve normalizzare il caso conservando lo stato cartesiano o rifiutarlo: non eliminare un angolo senza compensazione. Nella v1 dati iperbolici/parabolici sono rifiutati, non approssimati a ellissi.

## 4. KeplerianProvider e sistema Terra–Luna

Il provider calcola ogni stato dal tempo assoluto. Per ciascuna orbita, con `Δt=t−t0`, `n=sqrt(μ/a³)`:

```text
M = wrapToPi(M0 + n Δt)
risolvere E − e sin(E) = M
r = a(1 − e cos(E))
ν = atan2(sqrt(1−e²) sin(E), cos(E)−e)
rPQW = [a(cos(E)−e), a sqrt(1−e²) sin(E), 0]
vPQW = (a n)/(1−e cos(E)) · [−sin(E), sqrt(1−e²) cos(E), 0]
Q = Rz(Ω) Rx(i) Rz(ω)
rRel = Q rPQW; vRel = Q vPQW
```

Per vettori colonna, `Rz(θ)=[[cosθ,−sinθ,0],[sinθ,cosθ,0],[0,0,1]]`; `Rx(θ)=[[1,0,0],[0,cosθ,−sinθ],[0,sinθ,cosθ]]`. L'ordine è parte del contratto. Non copiare matrici passive da altre librerie senza conversione. Le convenzioni possono essere confrontate con SPICE `oscelt`/`conics`, adattando unità e parametri [R7, R8].

Solver previsto: Newton con `E0=M`, fino a residuo assoluto ≤10⁻¹² rad, massimo 16 iterazioni. Se non converge, bisezione monotona su `[−π,π]` fino allo stesso residuo, massimo 64 iterazioni; poi errore esplicito. I limiti scelti sono adeguati al dominio v1 da verificare; mai restituire l'ultimo iterato come successo. `atan2` restituisce ν con quadrante corretto. Non integrare la posizione a passi e non usare `n t` come anomalia vera.

Siano B e Vb lo stato EMB/Sole; ρ e ρdot lo stato relativo Luna meno Terra. Con `f = GM_luna/(GM_terra+GM_luna)`:

```text
rEarth = B − f ρ                 vEarth = Vb − f ρdot
rMoon  = B + (1−f) ρ             vMoon  = Vb + (1−f) ρdot
rMars  = r(mars-sun)             vMars  = v(mars-sun)
rSun   = [0,0,0]                 vSun   = [0,0,0]
```

Queste relazioni sono la definizione baricentrica del modello. Il rapporto GM equivale al rapporto delle masse per G comune. È vietato aggiungere l'orbita lunare alla posizione EMB chiamando quel risultato «Luna rispetto alla Terra». Il grafo dei calcoli non coincide con `centralBody`: per l'identità la Luna orbita la Terra, ma per la composizione entrambi dipendono da EMB. Nessun ciclo di dipendenze.

## 5. Rotazione, poli e orientamento

Adottare `pck00011.tpc` NAIF come fonte di inizializzazione delle orientazioni IAU e conservarne la versione/hash nella successiva acquisizione. La prima milestone usa **un'approssimazione dichiarata**: valutare il modello completo a t0 per α0, δ0, W0, poi congelare il polo e usare la velocità secolare di W. È essenziale valutare anche i termini periodici a t0: per Marte leggere soltanto i primi coefficienti del PCK produce un polo diverso [R9, R10].

Per ogni corpo, W(t)=wrap(W0+ωt); `period=2π/abs(ω)`. Spin rate convertito da gradi/giorno a rad/s. Non applicare inclinazione assiale una seconda volta: è derivata dal polo e dalla normale di riferimento.

In coordinate equatoriali, con α0 e δ0:

```text
k = [cosδ cosα, cosδ sinα, sinδ]          # polo
u = [−sinα, cosα, 0]                    # nodo sull'equatore
v = k × u
xBody = cosW u + sinW v                 # meridiano zero
yBody = −sinW u + cosW v
QbodyToEquatorial = [xBody yBody k]       # colonne
QbodyToEcliptic = Rx(−ε) QbodyToEquatorial
```

Il frame del corpo è destrorso: +X meridiano zero/equatore, +Y longitudine est +90°, +Z polo. Quaternione attivo `[x,y,z,w]` porta corpo→ECLIPJ2000; normalizzato, `q` e `−q` equivalenti. Per output deterministico scegliere `w≥0`, con tie-break sul primo componente non nullo. L'adattatore della mesh converte assi e coordinate UV senza modificare il polo scientifico.

| Corpo | Scelta v1 e limite |
| --- | --- |
| Sole | Orientamento IAU e velocità del sistema cartografico di riferimento; non simula la rotazione differenziale della fotosfera |
| Terra | Inizializzazione PCK, polo congelato e spin uniforme; non è ITRF con UT1, moto polare e nutazione accurati |
| Luna | Inizializzazione PCK e velocità secolare media; sincronia approssimata, nessun `lookAt(Earth)` che forzi la stessa faccia istante per istante; librazioni accurate escluse |
| Marte | Inizializzazione completa PCK, poi polo fisso e spin secolare; termini periodici non propagati nella v1 |

Obliquità a t0: `acos(clamp(kEcl · hRef,−1,1))`. Per Terra usare normale EMB/Sole, per Marte Marte/Sole, per Luna Luna/Terra, per Sole nord eclittico (etichetta «inclinazione sull'eclittica»). Non confondere l'inclinazione del polo lunare rispetto all'eclittica con quella rispetto alla sua orbita.

## 6. BodyState e BodyStateProvider

```ts
type Accuracy = Readonly<{
  model: string; datasetVersion: string; sourceIds: readonly SourceId[];
  status: 'unvalidated' | 'validated-educational' | 'validated-ephemeris';
  valid: Interval; reportId: string | null;
  maxPositionErrorM: number | null;
  maxVelocityErrorMps: number | null;
  maxOrientationErrorRad: number | null;
  limitations: readonly string[];
}>;
type BodyState = Readonly<{
  id: BodyId; tTdbSeconds: number;
  center: 'sun'; frame: FrameId; correction: 'geometric';
  positionM: Vec3; velocityMps: Vec3;
  bodyToFrame: Quaternion;
  rotation: Readonly<{ spinAngleRad: number; spinRateRadPerSecond: number;
    poleUnit: Vec3 }>;
  accuracy: Accuracy;
}>;
type StateError = Readonly<{
  code: 'UNKNOWN_BODY' | 'OUT_OF_RANGE' | 'NOT_READY' | 'INVALID_DATA'
    | 'NO_CONVERGENCE' | 'NO_COVERAGE'; message: string;
}>;
type Result<T> = Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: StateError }>;
type Snapshot = Readonly<{
  tTdbSeconds: number; states: Readonly<Record<BodyId, BodyState>>;
}>;
interface BodyStateProvider {
  readonly id: string;
  readonly datasetVersion: string;
  readonly valid: Interval;
  initialize(signal: AbortSignal): Promise<Result<void>>;
  getState(id: BodyId, tTdbSeconds: number): Result<BodyState>;
  getSnapshot(tTdbSeconds: number): Result<Snapshot>;
  dispose(): void;
}
```

Inizializzazione asincrona, interrogazione sincrona su dati già residenti. Nessuna rete durante `getState`; stessa richiesta e dataset danno lo stesso risultato entro tolleranza numerica. `getSnapshot` è atomico: quattro corpi allo stesso tempo, o errore unico. Non rendere un corpo a una data e gli altri alla precedente. Errori non producono zeri sostitutivi o extrapolazioni; UI mantiene l'ultimo snapshot completo con indicazione di blocco.

Gli errori massimi `null` significano «non misurato», mai errore zero. Se il rapporto misura soltanto posizione, la rotazione rimane qualificata separatamente; `validated-ephemeris` non autorizza a dichiarare accurata una rotazione educativa.

### 6.1 EphemerisProvider futuro

Stesso contratto e stesso centro/frame/tempo/unità in uscita. Campioni Horizons geometrici versionati, conversione in fase di importazione; se il dataset nasce baricentrico, sottrarre posizione **e velocità** del Sole allo stesso istante. Nessun campo visuale deve dipendere dal nome del provider.

Interpolazione futura scelta: Hermite cubica tra posizione e velocità degli estremi; velocità restituita come derivata dello stesso polinomio. Passo iniziale candidato 1 ora, da ridurre finché il confronto con campioni intermedi indipendenti supera le soglie in ACCEPTANCE-TESTS. Intervalli senza campioni restituiscono `NO_COVERAGE`; fuori dominio `OUT_OF_RANGE`. Niente extrapolazione.

Orientamento resta un servizio interno conforme alla stessa convenzione; è ammesso inizialmente lo stesso modello IAU semplificato, riportato nei metadati. Un futuro dataset orientativo usa interpolazione di quaternioni con segno coerente e tolleranza dedicata. La selezione del provider è una decisione dell'applicazione all'inizializzazione, non del renderer.

### 6.2 Grandezze derivate

- Distanza tra centri: `norm(rB−rA)`; distanza tra superfici sferiche: `max(0,d−RA−RB)`, esplicitamente approssimata.
- Velocità relativa: `vB−vA`; velocità orbitale scalare: norma della velocità rispetto al centro pertinente.
- Diametro da raggio: `2R`, con definizione di raggio mantenuta; gravità sferica: `GM/R²`; densità sferica: `mass/(4πR³/3)` se gli input sono disponibili.
- Tempo della luce iniziale: `d/c`, istantaneo geometrico; non un tempo di emissione/ricezione risolto per corpi in movimento.
- Non derivare massa «esatta» da GM/G; la relativa incertezza e la derivazione devono comparire.

Ogni risultato conserva ID/tempo degli input, formula, unità e limiti. La pipeline delle misure non accetta `ProjectedBody` al posto di `BodyState`.

## 7. SimulationClock

```ts
type TimeRate = 1 | 10 | 100 | 1000 | 10000 | 100000;
type PauseReason = 'user' | 'hidden' | 'suspended' | 'xr-transition' | 'view-transition'
  | 'tracking-unavailable' | 'range-end';
type ClockSnapshot = Readonly<{
  tTdbSeconds: number; rate: TimeRate;
  status: 'paused' | 'running'; reasons: readonly PauseReason[];
}>;
interface SimulationClock {
  sample(realNowMs: number): ClockSnapshot;
  play(realNowMs: number): ClockSnapshot;
  pause(reason: PauseReason, realNowMs: number): ClockSnapshot;
  clearBlock(reason: Exclude<PauseReason, 'user' | 'range-end'>,
    realNowMs: number): ClockSnapshot;
  setRate(rate: TimeRate, realNowMs: number): ClockSnapshot;
  reset(realNowMs: number): ClockSnapshot;
}
```

Il clock è l'unico proprietario del tempo. L'applicazione espone il suo snapshot nello stato UI, senza mantenere un secondo accumulatore. Stato iniziale: t=0, ×1, pausa; reset ripristina questi tre valori. La simulazione parte con un comando esplicito.

`clearBlock` è riservato ai servizi di lifecycle dopo la risoluzione della causa; rimuove il motivo indicato e riancora, ma conserva lo stato paused. Non equivale a Play. `play` può rimuovere `user` e `suspended`, ma non i blocchi ambientali ancora presenti né `range-end`. Focus, overview e cambio scala usano `view-transition`, poi `clearBlock` a transizione conclusa; la successiva ripresa è esplicita.

Formula ancorata: `t = tAnchor + rate*(realNowMs−realAnchorMs)/1000`. `realNowMs` proviene da un unico adattatore monotono basato su `performance.now()`. Al cambio rate o pausa: campionare all'istante del comando e riancorare. Il numero di frame non entra nella formula; il tempo UI delle transizioni non viene moltiplicato. Timestamp XR di previsione delle pose non sostituiscono la base del clock.

| Evento | Regola deterministica |
| --- | --- |
| Play | Rimuove la pausa utente/sospensione già risolta e riancora; non avvia se resta un blocco di visibilità, tracking o intervallo |
| Pausa | Conserva t e rate; idempotente |
| Cambia rate in pausa | Aggiorna il fattore, non avvia |
| Scheda nascosta | Campiona al timestamp dell'evento, poi pausa `hidden`; al ritorno richiede Play |
| Sospensione senza evento affidabile | Se il gap fra due tick supera 1000 ms, conserva l'ultimo istante pubblicato, pausa `suspended`, non recupera il gap |
| Ritorno in primo piano | Rimuove il blocco di visibilità, resta fermo in attesa di Play; nessun tempo di background recuperato |
| Ingresso/uscita XR | Pausa prima della transizione, conserva t/rate/selezione, resta in pausa dopo; serve Play esplicito |
| Perdita tracking/visibilità XR | Pausa; recupero del tracking non avvia automaticamente il tempo |
| Limite temporale | Clamp esatto al limite, pausa `range-end`, avviso; niente loop, extrapolazione o reset implicito |
| Reset | t=0, rate=1, pausa; non cambia selezione/scala; blocchi ambientali ancora attivi restano tali |

L'utente ha solo rate positivi nella v1. Il provider accetta anche i tempi negativi entro l'intervallo per verifiche e future selezioni di data. Dopo aver raggiunto il limite superiore, Play non riparte finché non si esegue reset. La soglia di sospensione è esplicita: un blocco superiore a 1 s privilegia la continuità dell'esperienza rispetto al recupero del tempo perso.

## 8. ScaleProjection e sistema delle origini

Coordinate scientifiche e coordinate di rendering hanno tipi e responsabilità distinti. La scelta delle scale non altera gli snapshot. Nella prima milestone non si comprime logaritmicamente alcuna distanza.

```ts
type ScaleMode = 'scientific' | 'didactic' | 'exploratory';
type ViewContext = 'system' | 'near-body' | 'local';
type ProjectionSettings = Readonly<{
  mode: ScaleMode; context: ViewContext; originM: Vec3;
  metersPerUnit: number;
  radiusFactors: Readonly<Record<BodyId, number>>;
  anchorRender: Vec3; // metri della scena XR, unità equivalenti su schermo
}>;
type ProjectedBody = Readonly<{
  id: BodyId; position: Vec3; radius: number;
  bodyToRender: Quaternion;
  marker: Readonly<{ label: string; scientificRadiusUnchanged: boolean }>;
}>;
type ProjectionResult = Readonly<{
  bodies: readonly ProjectedBody[]; settings: ProjectionSettings;
  disclosures: readonly string[];
}>;
interface ScaleProjection {
  project(snapshot: Snapshot, settings: ProjectionSettings,
    radiiM: Readonly<Record<BodyId, number>>): Result<ProjectionResult>;
  projectPoint(pointM: Vec3, settings: ProjectionSettings): Vec3;
}
```

`B(x,y,z)=(x,z,−y)` è la conversione fissa destrorsa Y-up. Babylon va configurato destrorso; nessuna seconda inversione di Z nell'adattatore XR. Con L=`metersPerUnit`, O=`originM` e A=`anchorRender`:

```text
pRender = A + B(rScientific − O)/L
radiusRender = radiusPhysical * factor(body)/L
orientationRender = quaternion(B) * bodyToFrame
```

Quaternioni usano composizione attiva; la geometria della mesh è prima allineata al frame canonico del corpo. Valori predefiniti v1, costanti di presentazione modificabili solo con revisione dei preset:

| Modalità/contesto | L (metri scientifici per unità) | Origine | Fattori dei raggi |
| --- | --- | --- | --- |
| Scientifica/sistema | 149597870700 | Sole | Tutti 1 |
| Scientifica/vista del corpo | `10 Rfocus` vicino; `2 Rfocus` locale | Centro del corpo osservato | Tutti 1 |
| Didattica/sistema | 149597870700 | Sole | Sole 5, Terra 1000, Luna 1000, Marte 1000 |
| Didattica/vista del corpo | `10 Rfocus` vicino; `2 Rfocus` locale | Centro del corpo | Tutti 1; mantiene l'etichetta della modalità con fattori correnti |
| Esplorativa | L della panoramica o della vista del corpo secondo il contesto | Sole o corpo osservato | Tutti 1; cambio di contesto dichiarato |

In panoramica didattica, Terra e Luna ingrandite possono sovrapporsi: non spostarle di nascosto. Mostrare un indicatore di gruppo con elenco di selezione e un comando per la vista locale Terra–Luna. La vicinanza usa il raggio fisico medio, mai il raggio già ingrandito. Nella vista locale Sole e corpi remoti fuori volume sono rappresentati da direzioni/indicatori, non da giganti lontani caricati nella stessa scena di dettaglio.

### 8.1 Floating origin e observer-relative rendering

Sono strategie complementari: viste locali limitano l'ampiezza; sottrazione dell'origine in Float64 evita la cancellazione in Float32; il rebase mantiene camera e oggetti renderizzabili vicino allo zero. Non basta spostare un nodo GPU che contiene ancora coordinate astronomiche in Float32.

Per una vista con scala L fissa, quando l'osservatore virtuale desktop supera 32 unità da O, scegliere una nuova origine sulla griglia di 8L metri nel frame scientifico. Riproiettare tutti i vertici dinamici e la camera dalla loro rappresentazione in doppia precisione nello stesso frame. Vietata la reproiezione ripetuta di coordinate già arrotondate.

La conservazione al rebase `O' = O + ΔO` richiede, a L costante, `A' = A + B(ΔO)/L`, se la camera resta invariata. Sul desktop si preferisce A fisso e `cameraRender' = cameraRender − B(ΔO)/L`, trasformando allo stesso modo il target della camera: così camera e oggetti tornano vicini all'origine. Verificare l'identità dello spazio osservato. Per viste centrate su un corpo in movimento, l'inseguimento dell'origine è una scelta esplicita di camera: si conserva la posizione relativa al corpo, non una camera eliocentrica fissa.

### 8.2 Separazione WebXR

Radice XR, camere dei due occhi e controller restano in metri, scala 1. Il nodo del mondo astronomico è separato: riceve coordinate già ridotte da ScaleProjection, non contiene come figli le camere XR. A è un ancoraggio metrico nell'osservatorio.

Un rebase tecnico deve rispettare l'identità precedente con A compensato: testa e controller non si muovono artificialmente. Il movimento fisico della testa non riscrive coordinate planetarie né altera L; produce soltanto la normale parallasse nel mondo rappresentato. In XR non effettuare rebase continuamente inseguendo la testa. Per cambiare il corpo di osservazione o L: dissolvenza, nuova proiezione e nuovo ancoraggio davanti all'osservatore. Non cambiare IPD, pose o scala della testa. Eventi di reset del reference space sono gestiti dall'adattatore XR con ripristino/ricentratura dell'ancoraggio, non modificando gli stati astronomici [R11].

Su schermo una transizione dura al massimo 400 ms reali, interrompibile, con istante astronomico congelato per il cambio scala; `prefers-reduced-motion` la rende immediata. In XR: dissolvenza 150 ms in uscita, cambio invisibile, 150 ms in ingresso, tempo in pausa. Durante il passaggio disabilitare picking e mostrare «cambio scala»; non mescolare due proiezioni per le misure. A transizione conclusa resta in pausa, ripresa esplicita. Questo impedisce che una misura cambi per avanzamento del tempo durante il confronto delle scale.

### 8.3 Marker, hit area e orbite

Marker ed etichette sono overlay identificabili come indicatori, non superfici. Hit area minima su schermo: diametro 44 CSS px, senza modificare la mesh. In XR: cono di tolleranza iniziale di 1° di semiapertura rispetto al raggio del controller, da verificare nel visore. UI spaziale ha precedenza; poi impatto geometrico più vicino; poi marker più vicino angularmente. Se più corpi candidati differiscono meno di 0,1° aprire la scelta esplicita. Nessun corpo nascosto diventa improvvisamente selezionato senza etichetta.

Le curve orbitali usano `projectPoint` con stessa origine, istante e scala del corpo. Orbite eliocentriche EMB/Marte sono ellissi del modello. La curva lunare è relativa alla Terra all'istante corrente e traslata coerentemente; non è un'intera traiettoria eliocentrica della Luna. La Terra eliocentrica ricostruita non è esattamente l'ellisse EMB: distinguere la guida del baricentro da una traccia terrestre. In una vista fuori scala, le orbite non generano misure o fenomeni d'ombra.

## 9. Esempio JSON di corpo celeste

Record **draft**, completo nella forma ma intenzionalmente privo dei dati non acquisiti. Mostra un dato reale con provenienza e il collegamento al modello baricentrico; non è un dataset utilizzabile dal provider. Il controllo di produzione deve respingerlo per raggio e rotazione mancanti.

```json
{
  "schemaVersion": "1.0",
  "recordStatus": "draft",
  "id": "earth",
  "name": "Terra",
  "internationalName": "Earth",
  "kind": "planet",
  "centralBody": "sun",
  "naifId": 399,
  "physical": {
    "mass": null,
    "gm": {
      "value": 398600435507000,
      "unit": "m3/s2",
      "definition": "GM della Terra, valore riportato nella tabella JPL DE440",
      "uncertainty": null,
      "provenance": {
        "sourceIds": ["jpl-astro-de440"],
        "originalValue": "398600.435507",
        "originalUnit": "km3/s2",
        "transformations": ["moltiplicazione per 1000000000"],
        "status": "reported",
        "review": "pending",
        "limitations": ["Da riconciliare con il set Horizons del dataset operativo"]
      }
    },
    "meanRadius": null,
    "equatorialRadius": null,
    "polarRadius": null,
    "gravity": null,
    "density": null,
    "temperatures": [],
    "composition": []
  },
  "motion": {
    "kind": "earth-moon-member",
    "member": "earth",
    "barycenterOrbitId": "emb-sun",
    "relativeOrbitId": "moon-earth"
  },
  "rotation": null,
  "missingReasons": {
    "/physical/mass": "Acquisizione del dataset non ancora eseguita",
    "/physical/meanRadius": "Acquisizione del dataset non ancora eseguita",
    "/physical/equatorialRadius": "Acquisizione del dataset non ancora eseguita",
    "/physical/polarRadius": "Acquisizione del dataset non ancora eseguita",
    "/physical/gravity": "Definizione e acquisizione da registrare",
    "/physical/density": "Acquisizione del dataset non ancora eseguita",
    "/physical/temperatures": "Contesto fisico da acquisire con la misura",
    "/physical/composition": "Regione e frazioni da acquisire",
    "/rotation": "Inizializzazione completa PCK rinviata alla fase dati"
  }
}
```

Nel registro delle fonti, `jpl-astro-de440` corrisponde a NASA JPL, “Astrodynamic Parameters”, URL [R6], versione `DE440`, consultazione `2026-10-03`, locator `Planetary Masses / Earth`; `artifactSha256=null` fino all'acquisizione del dataset. «Pending» riguarda la validazione dell'import operativo, non trasforma il numero in un'invenzione.

## 10. Regole di validazione e arresto

JSON Schema applicherà `additionalProperties:false`, campi richiesti, enumerazioni, lunghezze dei vettori, limiti dei numeri e versioni. La validazione del formato URL/data va configurata esplicitamente: `format` non è una verifica fisica [R12].

| ID | Controllo obbligatorio | Esito in caso di errore |
| --- | --- | --- |
| V01 | Numeri finiti, tipi, versione, chiavi note | Rifiuto record con JSON Pointer e motivo |
| V02 | Unità per campo, range fisici; temperatura ≥0 K; frazioni in [0,1] | Rifiuto, nessuna conversione euristica |
| V03 | Fonte risolvibile, locator, unità originale, trasformazioni, revisione; hash dello snapshot sorgente per il dataset operativo | Record resta draft; non entra nel runtime |
| V04 | GM, raggio medio e rotazione presenti per i quattro corpi; tre orbite valide | Rifiuto dataset incompleto |
| V05 | NAIF/id/tipo/centralBody coerenti; EMB distinto dalla Terra | Rifiuto grafo incoerente |
| V06 | Epoca TDB, frame e centri esatti; intervalli coprono il dominio comune | Rifiuto; mai allargare automaticamente la validità |
| V07 | a>0, 0≤e≤0,2, 0≤i≤π, angoli normalizzati, μ>0 | Rifiuto orbita non supportata |
| V08 | n=sqrt(μ/a³), periodo e mean motion importati coerenti entro 10⁻⁸ relativo | Rifiuto e verifica unità/GM, non correzione silenziosa |
| V09 | Raggi positivi; se presenti, raggio polare ≤medio≤equatoriale per questi quattro modelli oblati | Revisione dei dati e delle definizioni |
| V10 | |ω|·periodo=2π entro 10⁻¹⁰ relativo; polo unitario e quaternion normalizzato entro 10⁻¹² | Rifiuto orientamento |
| V11 | Composizione completa somma a 1 entro 10⁻³; parziale ≤1+10⁻³; regione e base esplicite | Rifiuto frazioni incoerenti |
| V12 | Calcoli baricentrici e rotazioni superano test indipendenti | Dataset non qualificato |
| V13 | Confronto JPL e soglie di ACCEPTANCE-TESTS superati | Niente stato validated; correggere modello o rivedere esplicitamente il contratto |
| V14 | Campi null/vuoti con motivo; nessun numero UI senza dato o formula | Nascondere dato non disponibile, mai mostrare zero |

Schema corretto non significa dato scientificamente corretto. I massimi d'errore e le tolleranze sono distinti dalla precisione del numero. Il loader fallisce in modo visibile; conserva eventuale dataset precedente completo, senza unire versioni incompatibili.

## 11. Riferimenti primari

Consultati il 3 ottobre 2026. Formule applicative, soglie, nomi dei contratti e intervallo v1 sono decisioni del progetto; non raccomandazioni attribuite alle istituzioni.

- **R1** — [JPL Horizons, frame e vettori](https://ssd.jpl.nasa.gov/horizons/manual.html).
- **R2** — [NAIF/SPICE, tempo e J2000-TDB](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/time.html).
- **R3** — [NAIF/SPICE, sistemi di riferimento](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/frames.html).
- **R4** — [IAU SOFA, routine e documentazione](https://www.iausofa.org/current-software).
- **R5** — [JPL Horizons API, parametri delle richieste](https://ssd-api.jpl.nasa.gov/doc/horizons.html).
- **R6** — [JPL, costanti e GM DE440](https://ssd.jpl.nasa.gov/astro_par.html).
- **R7** — [NAIF, propagazione conica](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/conics_c.html).
- **R8** — [NAIF, elementi osculatori e casi degeneri](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/cspice/oscelt_c.html).
- **R9** — [NAIF, convenzioni dei kernel PCK](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/pck.html).
- **R10** — [NAIF, pck00011.tpc](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc).
- **R11** — [W3C, WebXR Device API](https://www.w3.org/TR/webxr/).
- **R12** — [JSON Schema, validazione draft 2020-12](https://json-schema.org/draft/2020-12/json-schema-validation).
