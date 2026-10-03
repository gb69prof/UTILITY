import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createConfig } from '../src/core/config.ts';
import { detectCapabilities } from '../src/core/capabilities.ts';
import type { CapabilityProbe } from '../src/core/capabilities.ts';
import { basePath } from '../tools/paths.ts';

test('configuration requires a subfolder and agrees with package version', async () => {
  const config = createConfig(basePath);
  assert.equal(config.basePath, '/UTILITY/planetario/');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
  assert.equal(config.version, pkg.version);
  assert.equal(config.renderer, 'webgl2');
  for (const invalid of ['/', 'planetario/', '/planetario', '//evil/', '/a/../']) assert.throws(() => createConfig(invalid));
});
const probe: CapabilityProbe = { webgl2: () => true, touch: () => false, pointer: () => true, secureContext: true, gpu: false };
test('capability detection distinguishes absence, query success and unverified APIs', async () => {
  const absent = await detectCapabilities(probe);
  assert.equal(absent.webgl2.status, 'available');
  assert.equal(absent.webxr.status, 'unavailable');
  assert.equal(absent.touch.status, 'unavailable');
  const supported = await detectCapabilities({ ...probe, gpu: true, xr: { isSessionSupported: async mode => { assert.equal(mode, 'immersive-vr'); return true; } } });
  assert.equal(supported.webxr.status, 'available');
  assert.equal(supported.webgpu.status, 'unverified');
  const failed = await detectCapabilities({ ...probe, webgl2: () => { throw new Error('driver'); }, xr: { isSessionSupported: async () => { throw new Error('denied'); } } });
  assert.equal(failed.webgl2.status, 'unverified');
  assert.equal(failed.webxr.status, 'unverified');
});
test('insecure context does not query XR and an unsupported session is explicit', async () => {
  let queried = false;
  const unsupported = { isSessionSupported: async () => { queried = true; return false; } };
  assert.equal((await detectCapabilities({ ...probe, secureContext: false, xr: unsupported })).webxr.status, 'unavailable');
  assert.equal(queried, false);
  assert.equal((await detectCapabilities({ ...probe, xr: unsupported })).webxr.status, 'unavailable');
});
