import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store, technicalId, actionChannel, resolutionRatio, type Action, type Envelope } from '../src/core/interaction.ts';
import { Gestures } from '../src/input/gestures.ts';
import { Lifetime } from '../src/core/lifecycle.ts';
import { FrameSample } from '../src/core/metrics.ts';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { createTechnicalScene } from '../src/rendering/technical-scene.ts';
import { Ray } from '@babylonjs/core/Culling/ray.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { localReference, SemanticSelectGate } from '../src/xr/contracts.ts';

const envelope = (action: Action, sequence = 1): Envelope => ({ action, source: 'touch', actionId: `test:${sequence}`, inputSessionId: 'test', sequence, realNowMs: 1 });
test('XR reference prefers local-floor, falls back only to local and propagates denial', async () => {
  const calls: string[] = [];
  assert.equal(await localReference(async kind => { calls.push(kind); if (kind === 'local-floor') throw new Error('unsupported'); return 'local-origin'; }), 'local-origin');
  assert.deepEqual(calls, ['local-floor', 'local']);
  await assert.rejects(localReference(async () => { throw new Error('denied'); }), /denied/);
});
test('XR select gate excludes start/end/gamepad and duplicate semantic events for each controller', () => {
  const gate = new SemanticSelectGate(); let accepted = 0;
  for (const controller of ['left', 'right']) for (let i = 0; i < 20; i++) {
    const event = { controller, i };
    for (const kind of ['selectstart', 'gamepad', 'selectend', 'select', 'select']) if (gate.accept(event, kind, true)) accepted++;
  }
  assert.equal(accepted, 40); assert.equal(gate.accept({}, 'select', false), false);
});
test('selection, focus, overview and close preserve their distinct state contracts', () => {
  const s = new Store(false); const send = actionChannel(s, 'ui'); const camera = { ...s.state.camera };
  send({ type: 'selectBody', bodyId: technicalId }); assert.deepEqual(s.state.camera, camera); assert.equal(s.state.info?.bodyId, technicalId);
  send({ type: 'focusBody', bodyId: technicalId }); assert.equal(s.state.focusedBody, technicalId); assert.equal(s.state.cameraMode, 'orbit');
  send({ type: 'overview' }); assert.equal(s.state.focusedBody, null); assert.equal(s.state.selectedBody, technicalId); assert.ok(s.state.info);
  send({ type: 'closeInfo' }); assert.equal(s.state.info, null); assert.equal(s.state.selectedBody, technicalId);
  send({ type: 'openInfo', bodyId: technicalId, level: 'observe' }); assert.deepEqual(s.state.camera, camera); assert.ok(s.state.info);
});
test('input envelopes reject repeats, out of order, nonfinite values and unknown objects', () => {
  const s = new Store(false); const e = envelope({ type: 'selectBody', bodyId: technicalId }, 3);
  assert.equal(s.dispatch(e).accepted, true); assert.equal(s.dispatch(e).reason, 'duplicate-or-stale');
  assert.equal(s.dispatch({ ...e, sequence: 2, actionId: 'test:2' }).accepted, false);
  assert.equal(s.dispatch({ ...e, actionId: 'invalid' }).accepted, false);
  assert.equal(s.dispatch(envelope({ type: 'zoomView', logDistanceDelta: NaN }, 4)).reason, 'non-finite');
  assert.equal(s.dispatch(envelope({ type: 'orbitView' } as Action, 4)).reason, 'non-finite');
  assert.equal(s.dispatch(envelope({ type: 'selectBody', bodyId: 'earth' } as unknown as Action, 4)).reason, 'unknown-body');
  assert.equal(s.state.selectionCount, 1);
  const channel = actionChannel(s, 'mouse'); channel.dispose();
  assert.equal(channel({ type: 'selectBody', bodyId: technicalId }).reason, 'disposed-input');
  assert.equal(s.state.selectionCount, 1);
});
test('20 semantic confirmations per source yield exactly 20 selections even on duplicate delivery', () => {
  for (const source of ['mouse', 'touch', 'xr'] as const) {
    const s = new Store(true);
    for (let i = 1; i <= 20; i++) { const e = { ...envelope({ type: 'selectBody', bodyId: technicalId }, i), source }; s.dispatch(e); s.dispatch(e); }
    assert.equal(s.state.selectionCount, 20); assert.equal(s.state.acceptedActions, 20);
  }
});
test('camera commands are bounded and never alter native XR head state', () => {
  const s = new Store(true); const send = actionChannel(s, 'keyboard');
  send({ type: 'zoomView', logDistanceDelta: -100 }); assert.equal(s.state.camera.distance, 0.55);
  send({ type: 'orbitView', deltaYawRad: 1, deltaPitchRad: 100 }); assert.ok(s.state.camera.pitch < Math.PI);
  const before = { ...s.state.camera }; s.xr('entering'); assert.equal(send({ type: 'overview' }).reason, 'transition');
  s.xr('active'); assert.equal(s.state.cameraMode, 'xr-observatory');
  for (const a of [{ type: 'overview' }, { type: 'zoomView', logDistanceDelta: 1 }, { type: 'focusBody', bodyId: technicalId }] as Action[]) assert.equal(send(a).accepted, false);
  send({ type: 'selectBody', bodyId: technicalId }); assert.ok(s.state.info);
  s.xr('idle'); assert.deepEqual(s.state.camera, before); assert.equal(s.state.cameraMode, 'overview');
});
test('profiles alter actual resolution ratios and cannot change during XR', () => {
  assert.equal(resolutionRatio('auto', 3), 1.5); assert.equal(resolutionRatio('quality', 3), 2); assert.equal(resolutionRatio('performance', 3), 0.8);
  assert.throws(() => resolutionRatio('auto', NaN));
  const s = new Store(true); assert.ok(s.quality('performance')); s.xr('active'); assert.equal(s.quality('quality'), false); assert.equal(s.state.qualityProfile, 'performance');
});
test('20 simulated taps select; drag, multitouch, cancellation and released second finger cannot click', () => {
  const g = new Gestures();
  for (let i = 0; i < 20; i++) { g.down(1, 10, 10); assert.equal(g.up(1, 12, 12), true); }
  g.down(1, 0, 0); assert.equal(g.move(1, 5, 0).length, 0); assert.equal(g.move(1, 10, 0)[0]?.type, 'orbitView'); assert.equal(g.up(1, 0, 0), false);
  g.down(1, 0, 0); g.down(2, 100, 0); assert.ok(g.move(2, 120, 20).some(a => a.type === 'zoomView'));
  assert.equal(g.up(2, 120, 20), false); assert.equal(g.up(1, 0, 0), false);
  g.down(1, 0, 0); g.cancel(); assert.equal(g.up(1, 0, 0), false);
  g.down(1, 0, 0); assert.equal(g.up(1, 100, 0), false);
});
test('gesture pinch and centroid pan have the expected directions', () => {
  const g = new Gestures(); g.down(1, 0, 0); g.down(2, 100, 0);
  const actions = g.move(2, 200, 0);
  const zoom = actions.find(a => a.type === 'zoomView'); assert.ok(zoom && zoom.logDistanceDelta < 0);
  const pan = actions.find(a => a.type === 'panView'); assert.ok(pan && pan.right < 0);
});
test('resource disposal is reversed, idempotent, handles late async resources and cleans after errors', () => {
  const life = new Lifetime(); const calls: number[] = [];
  life.own(() => calls.push(1)); life.own(() => { calls.push(2); throw new Error('test'); }); life.own(() => calls.push(3));
  assert.throws(() => life.dispose(), AggregateError); life.dispose(); life.own(() => calls.push(4)); assert.deepEqual(calls, [3, 2, 1, 4]);
});
test('20 real Babylon scene creation/disposal cycles leave no scenes or mesh/material growth (NullEngine, not GPU)', () => {
  const engine = new NullEngine();
  try {
    for (let i = 0; i < 20; i++) {
      const c = createTechnicalScene(engine, false); const store = new Store(false); c.apply(store.state); c.scene.render();
      assert.equal(c.scene.meshes.length, 1); assert.equal(c.scene.materials.length, 1); assert.equal(engine.scenes.length, 1);
      const pick = c.scene.pickWithRay(new Ray(new Vector3(0, 0, -2), new Vector3(0, 0, 1)), mesh => mesh === c.sphere);
      assert.equal(pick?.hit, true); assert.equal(c.scene.useRightHandedSystem, true);
      c.dispose(); c.dispose(); assert.equal(engine.scenes.length, 0);
    }
  } finally { engine.dispose(); }
});
test('5 minute sampling excludes warmup and marks hidden runs invalid', () => {
  const sample = new FrameSample(); sample.start(1);
  sample.frame(5000, true); assert.match(sample.summary(), /0 frame/);
  sample.frame(10001, true); sample.frame(10017, false); assert.equal(sample.invalid, true);
  sample.frame(310001, true); assert.equal(sample.running, false); assert.match(sample.summary(), /300\/300 s/);
});
