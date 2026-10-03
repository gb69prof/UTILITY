import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, rmdir, symlink, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { basePath, projectRoot } from '../tools/paths.ts';
import { inspectStaging, promoteStatic, resetStaging } from '../tools/static-release.ts';
import config from '../vite.config.ts';

async function sandbox(run: (root: string, outside: string) => Promise<void>): Promise<void> {
  const temporaryRoot = resolve(projectRoot, '.tmp');
  await mkdir(temporaryRoot, { recursive: true });
  const fixture = await mkdtemp(resolve(temporaryRoot, 'release-test-'));
  const rel = relative(temporaryRoot, fixture);
  assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel));
  const root = resolve(fixture, 'planetario');
  await mkdir(root); await writeFile(resolve(fixture, 'other-project.txt'), 'untouched');
  await writeFile(resolve(root, 'gitkeep'), '\n');
  await mkdir(resolve(root, 'docs')); await writeFile(resolve(root, 'docs/spec.md'), 'normative');
  try { await run(root, fixture); }
  finally {
    assert.equal(await readFile(resolve(fixture, 'other-project.txt'), 'utf8'), 'untouched');
    assert.equal(await readFile(resolve(root, 'docs/spec.md'), 'utf8'), 'normative');
    assert.equal(await readFile(resolve(root, 'gitkeep'), 'utf8'), '\n');
    // Only a checked child of this project's ignored test directory is removed.
    await rm(fixture, { recursive: true, force: true });
  }
}
async function staged(root: string): Promise<void> {
  await resetStaging(root);
  await mkdir(resolve(root, '.staging/build'));
  await writeFile(resolve(root, '.staging/build/entry-12345678.js'), 'export const testOnly = true;');
  await writeFile(resolve(root, '.staging/index.html'), `<script type="module" src="${basePath}build/entry-12345678.js"></script>`);
}
test('Vite never empties output implicitly and points only to internal staging', () => {
  assert.equal(config.build?.emptyOutDir, false);
  assert.equal(resolve(config.build?.outDir ?? ''), resolve(projectRoot, '.staging'));
  assert.equal(config.base, basePath);
  assert.equal(config.publicDir, false);
});
test('release promotes allowlisted files, is repeatable, and preserves unrelated files', async () => sandbox(async root => {
  await staged(root);
  await mkdir(resolve(root, 'build'));
  await writeFile(resolve(root, 'build/previous-12345678.js'), 'previous asset retained');
  const list = await promoteStatic(root);
  assert.deepEqual(list, ['build/entry-12345678.js', 'index.html']);
  assert.deepEqual(await promoteStatic(root), list);
  assert.equal(await readFile(resolve(root, 'build/previous-12345678.js'), 'utf8'), 'previous asset retained');
  await resetStaging(root);
  assert.deepEqual(await readdir(resolve(root, '.staging')), []);
  assert.ok((await readFile(resolve(root, 'index.html'), 'utf8')).includes(basePath));
}));
test('unexpected files, nested directories and wrong URLs reject before promotion', async () => sandbox(async root => {
  await staged(root);
  await writeFile(resolve(root, '.staging/leaked-source.ts'), 'must not ship');
  await assert.rejects(promoteStatic(root), /allowlist/);
  await assert.rejects(readFile(resolve(root, 'index.html')), /ENOENT/);
  await staged(root);
  await mkdir(resolve(root, '.staging/build/nested'));
  await assert.rejects(inspectStaging(root), /allowlist/);
  await staged(root);
  await writeFile(resolve(root, '.staging/index.html'), '<script src="/build/entry-12345678.js"></script>');
  await assert.rejects(promoteStatic(root), /subfolder/);
}));
test('link destinations and staging junctions cannot redirect writes or cleanup', async () => sandbox(async (root, outside) => {
  await staged(root);
  const linked = resolve(outside, 'link-target'); await mkdir(linked);
  await symlink(linked, resolve(root, 'build'), 'junction');
  await assert.rejects(promoteStatic(root), /Link refused/);
  await rm(resolve(root, 'build')); // remove junction only, never its target
  await resetStaging(root);
  await rmdir(resolve(root, '.staging'));
  await symlink(linked, resolve(root, '.staging'), 'junction');
  await assert.rejects(resetStaging(root), /Link refused/);
  await assert.rejects(promoteStatic(root), /Link refused/);
  await rm(resolve(root, '.staging')); // prevent test cleanup following a junction
  assert.deepEqual(await readdir(linked), []);
}));
test('immutable asset collision fails before changing HTML', async () => sandbox(async root => {
  await staged(root); await promoteStatic(root);
  await writeFile(resolve(root, '.staging/build/entry-12345678.js'), 'different content');
  await assert.rejects(promoteStatic(root), /collision/);
  assert.equal(await readFile(resolve(root, 'build/entry-12345678.js'), 'utf8'), 'export const testOnly = true;');
}));
