import type { BodyData, BodyId, OrbitalElements, Quantity, Source, Unit } from '../src/data/contracts.ts';
import type { DatasetDraft } from '../src/data/dataset.ts';

// SYNTHETIC TEST DATA ONLY. None of these numbers describe astronomical bodies.
// Never imported from app/src entrypoints or copied to the static release.
export const sources: Source[] = [{
  id: 'synthetic-test', title: 'FICTIONAL validator fixture', institution: 'Automated tests',
  url: 'https://example.org/synthetic-test', publishedOrVersion: 'test-only-1',
  accessedOn: '2026-10-03', locator: 'tests/fixtures.ts', artifactSha256: null
}];
export function quantity(value: number, unit: Unit): Quantity {
  return { value, unit, definition: 'SYNTHETIC TEST ONLY', uncertainty: null,
    provenance: { sourceIds: ['synthetic-test'], originalValue: String(value), originalUnit: unit,
      transformations: [], status: 'reported', review: 'pending', limitations: ['Not scientific data'] } };
}
export function body(id: BodyId = 'earth'): BodyData {
  return {
    schemaVersion: '1.0', recordStatus: 'draft', id, name: `TEST ${id}`, internationalName: `TEST ${id}`,
    kind: id === 'sun' ? 'star' : id === 'moon' ? 'satellite' : 'planet',
    centralBody: id === 'sun' ? null : id === 'moon' ? 'earth' : 'sun',
    naifId: { sun: 10, earth: 399, moon: 301, mars: 499 }[id],
    physical: { mass: null, gm: quantity(400, 'm3/s2'), meanRadius: quantity(10, 'm'), equatorialRadius: quantity(11, 'm'), polarRadius: quantity(9, 'm'), gravity: null, density: null, temperatures: [], composition: [] },
    motion: id === 'sun' ? { kind: 'origin', center: 'sun' } : id === 'mars' ? { kind: 'kepler', orbitId: 'mars-sun' } : { kind: 'earth-moon-member', member: id, barycenterOrbitId: 'emb-sun', relativeOrbitId: 'moon-earth' },
    rotation: {
      kind: 'fixed-pole-uniform-spin', epoch: { jd: 2451545, scale: 'TDB' }, poleFrame: 'J2000-equatorial',
      poleRa: quantity(0, 'rad'), poleDec: quantity(1, 'rad'), primeMeridianAtEpoch: quantity(0, 'rad'),
      spinRate: quantity(1, 'rad/s'), siderealPeriod: quantity(2 * Math.PI, 's'), direction: 'positive-about-pole',
      obliquityAtEpoch: quantity(.1, 'rad'), obliquityReference: id === 'sun' ? 'ecliptic-north' : id === 'earth' ? 'emb-sun-normal' : id === 'moon' ? 'moon-earth-normal' : 'mars-sun-normal',
      provenance: quantity(1, '1').provenance
    },
    missingReasons: Object.fromEntries(['mass', 'gravity', 'density', 'temperatures', 'composition'].map(key => [`/physical/${key}`, 'Not required by this synthetic test']))
  };
}
export function orbit(id: 'emb-sun' | 'mars-sun' | 'moon-earth' = 'emb-sun'): OrbitalElements {
  return { id, target: id === 'emb-sun' ? 'emb' : id === 'mars-sun' ? 'mars' : 'moon', center: id === 'moon-earth' ? 'earth' : 'sun', frame: 'ECLIPJ2000', epoch: { jd: 2451545, scale: 'TDB' }, valid: { startTdbSeconds: -1296000, endTdbSeconds: 1296000 }, convention: 'osculating-frozen-two-body', a: quantity(10, 'm'), e: quantity(.1, '1'), i: quantity(.2, 'rad'), ascendingNode: quantity(.3, 'rad'), argumentOfPeriapsis: quantity(.4, 'rad'), anomalyAtEpoch: { kind: 'mean', angle: quantity(.5, 'rad') }, mu: quantity(1000, 'm3/s2') };
}
export function dataset(): DatasetDraft {
  return { schemaVersion: '1.0', version: 'synthetic-test-only', valid: { startTdbSeconds: -1296000, endTdbSeconds: 1296000 }, sources,
    bodies: { sun: body('sun'), earth: body(), moon: body('moon'), mars: body('mars') },
    nodes: { emb: { id: 'emb', naifId: 3, members: ['earth', 'moon'] } },
    orbits: { 'emb-sun': orbit(), 'mars-sun': orbit('mars-sun'), 'moon-earth': orbit('moon-earth') }, constants: {},
    validationReport: { status: 'unvalidated', reportId: null } };
}
