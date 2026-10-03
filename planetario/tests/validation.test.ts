import { test } from 'node:test';
import assert from 'node:assert/strict';
import { body, dataset, orbit, quantity, sources } from './fixtures.ts';
import { loadOperationalDataset, validateBodyData, validateDatasetDraft, validateOrbitalElements, validateOrbitalImport } from '../src/data/validation.ts';
import type { ValidationResult } from '../src/data/validation.ts';

function rejected(result: ValidationResult<unknown>, path?: string): void {
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.issues.length > 0);
    assert.ok(result.issues.every(i => i.code && i.message && (i.path === '' || i.path.startsWith('/'))));
    if (path) assert.ok(result.issues.some(i => i.path.includes(path)), JSON.stringify(result.issues));
  }
}
test('accepts a structurally and semantically valid synthetic BodyData draft', () => {
  assert.equal(validateBodyData(body(), sources).ok, true);
});
test('missing, unresolved, duplicated or invalid source records are rejected', () => {
  rejected(validateBodyData(body(), []), '/sources');
  rejected(validateBodyData(body(), [{ ...sources[0], id: 'wrong' }]), '/sourceIds');
  rejected(validateBodyData(body(), [...sources, ...sources]), '/sources');
  rejected(validateBodyData(body(), [{ ...sources[0], locator: '' }]), '/locator');
  rejected(validateBodyData(body(), [{ ...sources[0], url: 'javascript:alert(1)' }]), '/url');
  rejected(validateBodyData(body(), [{ ...sources[0], accessedOn: '2026-02-30' }]), '/accessedOn');
});
test('units are mandatory and field-specific; non-finite, negative and extra values fail', () => {
  const original = body();
  for (const value of [NaN, Infinity, -Infinity, -1, 0]) {
    rejected(validateBodyData({ ...original, physical: { ...original.physical, gm: quantity(value, 'm3/s2') } }, sources), '/gm');
  }
  for (const unit of [undefined, 'km', 'kg']) {
    rejected(validateBodyData({ ...original, physical: { ...original.physical, meanRadius: { ...quantity(10, 'm'), unit } } }, sources), '/unit');
  }
  rejected(validateBodyData({ ...original, unknownField: true }, sources));
  rejected(validateBodyData({ ...original, schemaVersion: '2.0' }, sources), '/schemaVersion');
});
test('identity, motion graph and enums are enforced', () => {
  rejected(validateBodyData({ ...body(), id: 'emb' }, sources), '/id');
  rejected(validateBodyData({ ...body(), naifId: 3 }, sources), '/naifId');
  rejected(validateBodyData({ ...body(), kind: 'star' }, sources), '/kind');
  rejected(validateBodyData({ ...body(), centralBody: 'moon' }, sources), '/centralBody');
  rejected(validateBodyData({ ...body(), motion: { kind: 'origin', center: 'sun' } }, sources), '/motion');
});
test('unit conversion cannot discard its provenance', () => {
  const b = body(); const gm = quantity(400, 'm3/s2');
  rejected(validateBodyData({ ...b, physical: { ...b.physical, gm: { ...gm, provenance: { ...gm.provenance, originalUnit: 'km3/s2' } } } }, sources), '/transformations');
});
test('radii ordering, missing reasons and composition fractions are protected', () => {
  const b = body();
  rejected(validateBodyData({ ...b, physical: { ...b.physical, polarRadius: quantity(12, 'm') } }, sources), '/polarRadius');
  rejected(validateBodyData({ ...b, missingReasons: {} }, sources), '/missingReasons');
  rejected(validateBodyData({ ...b, missingReasons: { ...b.missingReasons, '/foo': 'unknown' } }, sources), '/missingReasons');
  const { '/physical/composition': _unused, ...reasons } = b.missingReasons;
  for (const [completeness, fraction] of [['complete', .5], ['partial', 1.1]] as const) {
    rejected(validateBodyData({ ...b, missingReasons: reasons, physical: { ...b.physical, composition: [{ region: 'TEST', basis: 'mass-fraction', completeness, components: [{ species: 'TEST', fraction: quantity(fraction, '1') }] }] } }, sources), '/composition');
  }
});
test('rotation epoch, frame, units, period and spin direction are checked', () => {
  const b = body(); assert.ok(b.rotation);
  for (const change of [{ epoch: { jd: 2451545, scale: 'UTC' } }, { epoch: { jd: 2451544, scale: 'TDB' } }, { poleFrame: 'ECLIPJ2000' }, { siderealPeriod: quantity(100, 's') }, { direction: 'negative-about-pole' }, { spinRate: quantity(1, 'rad') }, { obliquityReference: 'moon-earth-normal' }]) {
    rejected(validateBodyData({ ...b, rotation: { ...b.rotation, ...change } }, sources), '/rotation');
  }
});
test('draft cannot masquerade as reviewed; source acquisition and core data are required', () => {
  rejected(validateBodyData(body(), sources, 'reviewed'));
  rejected(validateBodyData({ ...body(), recordStatus: 'reviewed' }, sources), '/artifactSha256');
  const reviewed = JSON.parse(JSON.stringify(body()).replaceAll('"pending"', '"reviewed"').replace('"recordStatus":"draft"', '"recordStatus":"reviewed"')) as unknown;
  const acquired = [{ ...sources[0], artifactSha256: 'a'.repeat(64) }];
  assert.equal(validateBodyData(reviewed, acquired, 'reviewed').ok, true);
  const b = body();
  rejected(validateBodyData({ ...b, recordStatus: 'reviewed', rotation: null, missingReasons: { ...b.missingReasons, '/rotation': 'Not acquired' } }, acquired), '/rotation');
});
test('orbital frame, epoch, domain, center, eccentricity and normalized angles fail closed', () => {
  assert.equal(validateOrbitalElements(orbit(), sources).ok, true);
  for (const change of [{ frame: 'ICRF' }, { epoch: { jd: 2451545, scale: 'TT' } }, { epoch: { jd: 0, scale: 'TDB' } }, { center: 'earth' }, { valid: { startTdbSeconds: 0, endTdbSeconds: 1296000 } }, { e: quantity(.3, '1') }, { ascendingNode: quantity(2 * Math.PI, 'rad') }, { mu: quantity(-1, 'm3/s2') }, { a: quantity(1, 's') }]) rejected(validateOrbitalElements({ ...orbit(), ...change }, sources));
});
test('source mean motion and period checked independently at import', () => {
  assert.equal(validateOrbitalImport(orbit(), 1, 2 * Math.PI).ok, true);
  rejected(validateOrbitalImport(orbit(), 2, 2 * Math.PI), '/meanMotion');
  rejected(validateOrbitalImport(orbit(), 1, 86400), '/periodSeconds');
});
test('complete synthetic envelope resolves identities and orbits but remains non-operational', () => {
  assert.equal(validateDatasetDraft(dataset()).ok, true);
  rejected(loadOperationalDataset(dataset()), '/validationReport');
  rejected(validateDatasetDraft({ ...dataset(), validationReport: { status: 'validated-educational', reportId: 'self-certified' } }), '/validationReport');
  const d = dataset();
  rejected(validateDatasetDraft({ ...d, bodies: { ...d.bodies, earth: body('moon') } }), '/bodies/earth/id');
  rejected(validateDatasetDraft({ ...d, orbits: { ...d.orbits, 'moon-earth': orbit('mars-sun') } }), '/orbits/moon-earth/id');
});
