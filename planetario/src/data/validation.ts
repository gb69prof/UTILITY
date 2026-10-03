import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ErrorObject, ValidateFunction } from 'ajv';
import schema from './scientific.schema.json' with { type: 'json' };
import type { BodyData, BodyId, OrbitalElements, Provenance, Source } from './contracts.ts';
import type { DatasetDraft } from './dataset.ts';

export interface ValidationIssue { readonly code: string; readonly path: string; readonly message: string }
export type ValidationResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly issues: readonly ValidationIssue[] };
export type ReviewMode = 'draft' | 'reviewed';
const ajv = new Ajv2020({ allErrors: true, strict: true, strictNumbers: true });
ajv.addFormat('http-url', value => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !!url.hostname; }
  catch { return false; }
});
ajv.addFormat('calendar-date', value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
});
ajv.addSchema(schema);
const validator = <T>(name: string): ValidateFunction<T> => ajv.compile<T>({ $ref: `${schema.$id}#/$defs/${name}` });
const bodyShape = validator<BodyData>('body');
const sourceShape = validator<Source>('source');
const orbitShape = validator<OrbitalElements>('orbit');
const datasetShape = validator<DatasetDraft>('dataset');
const escapePointer = (value: string): string => value.replaceAll('~', '~0').replaceAll('/', '~1');
function shapeIssues(errors: ErrorObject[] | null | undefined, prefix = ''): ValidationIssue[] {
  return (errors ?? []).map(error => {
    const property = error.keyword === 'required' ? error.params['missingProperty'] : error.keyword === 'additionalProperties' ? error.params['additionalProperty'] : undefined;
    return { code: 'V01', path: prefix + error.instancePath + (property === undefined ? '' : `/${escapePointer(String(property))}`), message: error.message ?? 'Schema non valido' };
  });
}
function finish<T>(value: T, issues: ValidationIssue[]): ValidationResult<T> {
  return issues.length ? { ok: false, issues } : { ok: true, value };
}
function issue(issues: ValidationIssue[], code: string, path: string, message: string): void {
  issues.push({ code, path, message });
}
function validateSources(sources: readonly unknown[], mode: ReviewMode, issues: ValidationIssue[]): Map<string, Source> {
  const registry = new Map<string, Source>();
  if (sources.length === 0) issue(issues, 'V03', '/sources', 'Registro delle fonti assente.');
  sources.forEach((source, index) => {
    const path = `/sources/${index}`;
    if (!sourceShape(source)) { issues.push(...shapeIssues(sourceShape.errors, path)); return; }
    if (registry.has(source.id)) issue(issues, 'V03', `${path}/id`, 'ID fonte duplicato.');
    if (mode === 'reviewed' && !source.artifactSha256) issue(issues, 'V03', `${path}/artifactSha256`, 'Snapshot sorgente non acquisito.');
    registry.set(source.id, source);
  });
  return registry;
}
function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function provenanceChecks(value: unknown, sources: Map<string, Source>, mode: ReviewMode, issues: ValidationIssue[], path = ''): void {
  if (Array.isArray(value)) { value.forEach((item: unknown, index: number) => provenanceChecks(item, sources, mode, issues, `${path}/${index}`)); return; }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    const next = `${path}/${escapePointer(key)}`;
    if (key === 'provenance') {
      // Only called after JSON Schema has checked the complete enclosing shape.
      const p = child as Provenance;
      for (const id of p.sourceIds) if (!sources.has(id)) issue(issues, 'V03', `${next}/sourceIds`, `Fonte non risolta: ${id}`);
      if (mode === 'reviewed' && p.review !== 'reviewed') issue(issues, 'V03', `${next}/review`, 'Revisione ancora pending.');
      if (p.status !== 'reported' && p.transformations.length === 0) issue(issues, 'V03', `${next}/transformations`, 'Derivazione/approssimazione senza trasformazione descritta.');
      if (typeof value['unit'] === 'string' && value['unit'] !== p.originalUnit && p.transformations.length === 0) issue(issues, 'V03', `${next}/transformations`, 'Conversione di unità senza trasformazione registrata.');
    } else provenanceChecks(child, sources, mode, issues, next);
  }
}
const identity: Record<BodyId, readonly [number, BodyData['kind'], BodyId | null, string]> = {
  sun: [10, 'star', null, 'ecliptic-north'], earth: [399, 'planet', 'sun', 'emb-sun-normal'],
  moon: [301, 'satellite', 'earth', 'moon-earth-normal'], mars: [499, 'planet', 'sun', 'mars-sun-normal']
};
function bodyChecks(body: BodyData, mode: ReviewMode, issues: ValidationIssue[]): void {
  const [naifId, kind, centralBody, obliquityReference] = identity[body.id];
  for (const [key, expected] of Object.entries({ naifId, kind, centralBody })) {
    if (body[key as 'naifId' | 'kind' | 'centralBody'] !== expected) issue(issues, 'V05', `/${key}`, 'Identità incoerente con BodyId.');
  }
  const motion = body.motion;
  const motionOK = body.id === 'sun' ? motion.kind === 'origin'
    : body.id === 'mars' ? motion.kind === 'kepler'
    : motion.kind === 'earth-moon-member' && motion.member === body.id;
  if (!motionOK) issue(issues, 'V05', '/motion', 'Grafo del moto incoerente con BodyId.');
  const missing = new Set<string>();
  for (const [key, value] of Object.entries(body.physical)) {
    if (value === null || (Array.isArray(value) && value.length === 0)) missing.add(`/physical/${key}`);
  }
  if (body.rotation === null) missing.add('/rotation');
  for (const path of missing) if (!body.missingReasons[path]) issue(issues, 'V14', `/missingReasons/${escapePointer(path)}`, 'Motivo del dato assente obbligatorio.');
  for (const path of Object.keys(body.missingReasons)) if (!missing.has(path)) issue(issues, 'V14', `/missingReasons/${escapePointer(path)}`, 'Motivo riferito a un campo presente o sconosciuto.');
  if (mode === 'reviewed' || body.recordStatus === 'reviewed') {
    if (body.recordStatus !== 'reviewed') issue(issues, 'V03', '/recordStatus', 'Record draft non ammesso alla revisione operativa.');
    for (const key of ['gm', 'meanRadius'] as const) if (!body.physical[key]) issue(issues, 'V04', `/physical/${key}`, 'Dato necessario al provider assente.');
    if (!body.rotation) issue(issues, 'V04', '/rotation', 'Rotazione necessaria al provider assente.');
  }
  const { polarRadius: polar, meanRadius: mean, equatorialRadius: equatorial } = body.physical;
  if (polar && mean && polar.value > mean.value) issue(issues, 'V09', '/physical/polarRadius', 'Raggio polare superiore al medio.');
  if (mean && equatorial && mean.value > equatorial.value) issue(issues, 'V09', '/physical/equatorialRadius', 'Raggio equatoriale inferiore al medio.');
  const rotation = body.rotation;
  if (rotation) {
    const product = Math.abs(rotation.spinRate.value) * rotation.siderealPeriod.value;
    if (!Number.isFinite(product) || Math.abs(product / (2 * Math.PI) - 1) > 1e-10) issue(issues, 'V10', '/rotation/siderealPeriod', 'Periodo e spin incompatibili.');
    if ((rotation.spinRate.value > 0) !== (rotation.direction === 'positive-about-pole') || rotation.spinRate.value === 0) issue(issues, 'V10', '/rotation/direction', 'Verso e spin incompatibili.');
    if (rotation.obliquityReference !== obliquityReference) issue(issues, 'V05', '/rotation/obliquityReference', 'Normale di riferimento incoerente con il corpo.');
  }
  body.physical.composition.forEach((composition, index) => {
    const sum = composition.components.reduce((total, component) => total + component.fraction.value, 0);
    if (sum > 1.001 || (composition.completeness === 'complete' && Math.abs(sum - 1) > .001)) issue(issues, 'V11', `/physical/composition/${index}`, 'Somma delle frazioni incoerente.');
  });
}
export function validateBodyData(input: unknown, sources: readonly unknown[], mode: ReviewMode = 'draft'): ValidationResult<BodyData> {
  const issues: ValidationIssue[] = [];
  if (!bodyShape(input)) return { ok: false, issues: shapeIssues(bodyShape.errors) };
  const effectiveMode = input.recordStatus === 'reviewed' ? 'reviewed' : mode;
  const registry = validateSources(sources, effectiveMode, issues);
  provenanceChecks(input, registry, effectiveMode, issues);
  bodyChecks(input, mode, issues);
  return finish(input, issues);
}
function orbitChecks(orbit: OrbitalElements, issues: ValidationIssue[]): void {
  const expected = { 'emb-sun': ['emb', 'sun'], 'mars-sun': ['mars', 'sun'], 'moon-earth': ['moon', 'earth'] } as const;
  const pair = expected[orbit.id as keyof typeof expected];
  if (orbit.target !== pair[0] || orbit.center !== pair[1]) issue(issues, 'V06', '/center', 'Target/centro non coerenti con ID orbita.');
  if (orbit.e.value === 0 && orbit.argumentOfPeriapsis.value !== 0) issue(issues, 'V07', '/argumentOfPeriapsis', 'Caso circolare non normalizzato.');
  if ((orbit.i.value === 0 || orbit.i.value === Math.PI) && orbit.ascendingNode.value !== 0) issue(issues, 'V07', '/ascendingNode', 'Caso equatoriale non normalizzato.');
}
export function validateOrbitalElements(input: unknown, sources: readonly unknown[], mode: ReviewMode = 'draft'): ValidationResult<OrbitalElements> {
  const issues: ValidationIssue[] = [];
  if (!orbitShape(input)) return { ok: false, issues: shapeIssues(orbitShape.errors) };
  provenanceChecks(input, validateSources(sources, mode, issues), mode, issues);
  orbitChecks(input, issues);
  return finish(input, issues);
}
// V08 is an import cross-check, not an orbital propagator. Reference values must come from the source.
export function validateOrbitalImport(orbit: OrbitalElements, importedMeanMotion: number, importedPeriod: number): ValidationResult<OrbitalElements> {
  const issues: ValidationIssue[] = [];
  const motion = Math.sqrt(orbit.mu.value / orbit.a.value ** 3);
  for (const [path, expected, actual] of [['meanMotionRadPerSecond', motion, importedMeanMotion], ['periodSeconds', 2 * Math.PI / motion, importedPeriod]] as const) {
    if (!Number.isFinite(expected) || expected <= 0 || !Number.isFinite(actual) || actual <= 0 || Math.abs(actual / expected - 1) > 1e-8) issue(issues, 'V08', `/${path}`, 'Riferimento importato incompatibile con a e mu.');
  }
  return finish(orbit, issues);
}
export function validateDatasetDraft(input: unknown): ValidationResult<DatasetDraft> {
  if (!datasetShape(input)) return { ok: false, issues: shapeIssues(datasetShape.errors) };
  const issues: ValidationIssue[] = [];
  const registry = validateSources(input.sources, 'draft', issues);
  provenanceChecks(input.constants, registry, 'draft', issues, '/constants');
  for (const [id, body] of Object.entries(input.bodies)) {
    if (body.id !== id) issue(issues, 'V05', `/bodies/${id}/id`, 'Chiave diversa da BodyId.');
    const result = validateBodyData(body, input.sources);
    if (!result.ok) issues.push(...result.issues.map(item => ({ ...item, path: `/bodies/${id}${item.path}` })));
  }
  for (const [id, orbit] of Object.entries(input.orbits)) {
    if (orbit.id !== id) issue(issues, 'V05', `/orbits/${id}/id`, 'Chiave diversa da ID orbita.');
    if (orbit.valid.startTdbSeconds > input.valid.startTdbSeconds || orbit.valid.endTdbSeconds < input.valid.endTdbSeconds) issue(issues, 'V06', `/orbits/${id}/valid`, 'Copertura insufficiente.');
    const result = validateOrbitalElements(orbit, input.sources);
    if (!result.ok) issues.push(...result.issues.map(item => ({ ...item, path: `/orbits/${id}${item.path}` })));
  }
  return finish(input, issues);
}
// Deliberately closed until independent V12/V13 reports exist (Phase 5+).
// A valid shape or a caller-provided "reviewed" flag is not scientific qualification.
export function loadOperationalDataset(input: unknown): ValidationResult<never> {
  const checked = validateDatasetDraft(input);
  if (!checked.ok) return checked;
  return { ok: false, issues: [{ code: 'NOT_QUALIFIED', path: '/validationReport', message: 'Fase 3: qualificazione indipendente V12/V13 non implementata; dataset escluso dal runtime.' }] };
}
