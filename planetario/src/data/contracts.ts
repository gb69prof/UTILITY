// Normative contracts: docs/DATA-MODEL.md sections 3, 6, 7, 8. No runtime physics.

export type BodyId = 'sun' | 'earth' | 'moon' | 'mars';
export type NodeId = BodyId | 'emb';
export type FrameId = 'ECLIPJ2000';
export type Vec3 = readonly [number, number, number];
export type Quaternion = readonly [number, number, number, number]; // x,y,z,w
export type Unit = 'm' | 's' | 'kg' | 'rad' | 'rad/s' | 'm3/s2'
  | 'm/s2' | 'kg/m3' | 'K' | '1';
export type Interval = Readonly<{ startTdbSeconds: number; endTdbSeconds: number }>;
export type SourceId = string;
export type Source = Readonly<{
  id: SourceId; title: string; institution: string; url: string;
  publishedOrVersion: string | null; accessedOn: string;
  locator: string; artifactSha256: string | null;
}>;
export type Provenance = Readonly<{
  sourceIds: readonly SourceId[];
  originalValue: string; originalUnit: string;
  transformations: readonly string[];
  status: 'reported' | 'derived' | 'educational-approximation';
  review: 'pending' | 'reviewed'; limitations: readonly string[];
}>;
export type Quantity = Readonly<{
  value: number; unit: Unit; definition: string;
  uncertainty: Readonly<{ plusMinus: number; coverage: string }> | null;
  provenance: Provenance;
}>;
export type Temperature = Readonly<{
  kind: 'surface' | 'effective' | 'photosphere' | 'atmosphere';
  value: Quantity; context: string;
  statistic: 'mean' | 'minimum' | 'maximum' | 'representative';
}>;
export type Composition = Readonly<{
  region: string; basis: 'mass-fraction' | 'mole-fraction' | 'volume-fraction';
  completeness: 'partial' | 'complete';
  components: readonly Readonly<{ species: string; fraction: Quantity }>[];
}>;
export type OrbitalElements = Readonly<{
  id: string; target: 'emb' | 'mars' | 'moon'; center: 'sun' | 'earth';
  frame: FrameId; epoch: Readonly<{ jd: 2451545; scale: 'TDB' }>;
  valid: Interval; convention: 'osculating-frozen-two-body';
  a: Quantity; e: Quantity; i: Quantity; ascendingNode: Quantity;
  argumentOfPeriapsis: Quantity;
  anomalyAtEpoch: Readonly<{ kind: 'mean'; angle: Quantity }>;
  mu: Quantity; // parametro relativo; non il GM del solo corpo centrale
}>;
export type Motion =
  | Readonly<{ kind: 'origin'; center: 'sun' }>
  | Readonly<{ kind: 'kepler'; orbitId: 'mars-sun' }>
  | Readonly<{ kind: 'earth-moon-member'; member: 'earth' | 'moon';
      barycenterOrbitId: 'emb-sun'; relativeOrbitId: 'moon-earth' }>;
export type RotationData = Readonly<{
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
export type BodyData = Readonly<{
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

export type Accuracy = Readonly<{
  model: string; datasetVersion: string; sourceIds: readonly SourceId[];
  status: 'unvalidated' | 'validated-educational' | 'validated-ephemeris';
  valid: Interval; reportId: string | null;
  maxPositionErrorM: number | null;
  maxVelocityErrorMps: number | null;
  maxOrientationErrorRad: number | null;
  limitations: readonly string[];
}>;
export type BodyState = Readonly<{
  id: BodyId; tTdbSeconds: number;
  center: 'sun'; frame: FrameId; correction: 'geometric';
  positionM: Vec3; velocityMps: Vec3;
  bodyToFrame: Quaternion;
  rotation: Readonly<{ spinAngleRad: number; spinRateRadPerSecond: number;
    poleUnit: Vec3 }>;
  accuracy: Accuracy;
}>;
export type StateError = Readonly<{
  code: 'UNKNOWN_BODY' | 'OUT_OF_RANGE' | 'NOT_READY' | 'INVALID_DATA'
    | 'NO_CONVERGENCE' | 'NO_COVERAGE'; message: string;
}>;
export type Result<T> = Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: StateError }>;
export type Snapshot = Readonly<{
  tTdbSeconds: number; states: Readonly<Record<BodyId, BodyState>>;
}>;
export interface BodyStateProvider {
  readonly id: string;
  readonly datasetVersion: string;
  readonly valid: Interval;
  initialize(signal: AbortSignal): Promise<Result<void>>;
  getState(id: BodyId, tTdbSeconds: number): Result<BodyState>;
  getSnapshot(tTdbSeconds: number): Result<Snapshot>;
  dispose(): void;
}

export type TimeRate = 1 | 10 | 100 | 1000 | 10000 | 100000;
export type PauseReason = 'user' | 'hidden' | 'suspended' | 'xr-transition' | 'view-transition'
  | 'tracking-unavailable' | 'range-end';
export type ClockSnapshot = Readonly<{
  tTdbSeconds: number; rate: TimeRate;
  status: 'paused' | 'running'; reasons: readonly PauseReason[];
}>;
export interface SimulationClock {
  sample(realNowMs: number): ClockSnapshot;
  play(realNowMs: number): ClockSnapshot;
  pause(reason: PauseReason, realNowMs: number): ClockSnapshot;
  clearBlock(reason: Exclude<PauseReason, 'user' | 'range-end'>,
    realNowMs: number): ClockSnapshot;
  setRate(rate: TimeRate, realNowMs: number): ClockSnapshot;
  reset(realNowMs: number): ClockSnapshot;
}

export type ScaleMode = 'scientific' | 'didactic' | 'exploratory';
export type ViewContext = 'system' | 'near-body' | 'local';
export type ProjectionSettings = Readonly<{
  mode: ScaleMode; context: ViewContext; originM: Vec3;
  metersPerUnit: number;
  radiusFactors: Readonly<Record<BodyId, number>>;
  anchorRender: Vec3; // metri della scena XR, unità equivalenti su schermo
}>;
export type ProjectedBody = Readonly<{
  id: BodyId; position: Vec3; radius: number;
  bodyToRender: Quaternion;
  marker: Readonly<{ label: string; scientificRadiusUnchanged: boolean }>;
}>;
export type ProjectionResult = Readonly<{
  bodies: readonly ProjectedBody[]; settings: ProjectionSettings;
  disclosures: readonly string[];
}>;
export interface ScaleProjection {
  project(snapshot: Snapshot, settings: ProjectionSettings,
    radiiM: Readonly<Record<BodyId, number>>): Result<ProjectionResult>;
  projectPoint(pointM: Vec3, settings: ProjectionSettings): Vec3;
}
