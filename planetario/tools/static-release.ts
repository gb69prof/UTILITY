import { lstat, mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { basePath } from './paths.ts';

const allowedAsset = /^build\/[A-Za-z0-9_][A-Za-z0-9_.-]*-[A-Za-z0-9_-]{8,}\.(?:js|css|jpg)$/;
async function checkedRoot(root: string): Promise<string> {
  const absolute = resolve(root);
  if ((await lstat(absolute)).isSymbolicLink()) throw new Error('Project root must not be a link.');
  return realpath(absolute);
}
function inside(root: string, name: string): string {
  const target = resolve(root, name);
  const rel = relative(root, target);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error('Path escapes project root.');
  return target;
}
async function noLinks(path: string): Promise<void> {
  let stat;
  try { stat = await lstat(path); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error; }
  if (stat.isSymbolicLink()) throw new Error(`Link refused: ${path}`);
  if (stat.isDirectory()) for (const child of await readdir(path)) await noLinks(resolve(path, child));
  else if (!stat.isFile()) throw new Error(`Non-regular file: ${path}`);
}
export async function resetStaging(root: string): Promise<void> {
  const canonical = await checkedRoot(root);
  const staging = inside(canonical, '.staging');
  await noLinks(staging);
  // Only this fixed, verified child may be recursively removed. No CLI destination override.
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging);
}
export async function inspectStaging(root: string): Promise<readonly string[]> {
  const canonical = await checkedRoot(root);
  const staging = inside(canonical, '.staging');
  await noLinks(staging);
  const files: string[] = [];
  for (const item of await readdir(staging, { withFileTypes: true })) {
    if (item.name === 'index.html' && item.isFile()) files.push(item.name);
    else if (item.name === 'build' && item.isDirectory()) {
      for (const asset of await readdir(resolve(staging, 'build'), { withFileTypes: true })) {
        const name = `build/${asset.name}`;
        if (!asset.isFile() || !allowedAsset.test(name)) throw new Error(`Static allowlist rejected ${name}`);
        files.push(name);
      }
    } else throw new Error(`Static allowlist rejected ${item.name}`);
  }
  if (!files.includes('index.html') || !files.some(f => f.endsWith('.js'))) throw new Error('Incomplete staging.');
  const html = await readFile(resolve(staging, 'index.html'), 'utf8');
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]!);
  if (!references.some(url => url.endsWith('.js'))) throw new Error('Missing JS entry.');
  for (const url of references) {
    if (url === 'data:,') continue;
    if (!url.startsWith(basePath) || !files.includes(url.slice(basePath.length))) {
      throw new Error(`Invalid subfolder asset reference: ${url}`);
    }
  }
  return files.sort();
}
export async function promoteStatic(root: string): Promise<readonly string[]> {
  const canonical = await checkedRoot(root);
  const files = await inspectStaging(canonical);
  await noLinks(inside(canonical, 'build'));
  await noLinks(inside(canonical, 'index.html'));
  // Validate every destination before the first write. Existing hash-named assets are immutable.
  const pending: { name: string; data: Buffer }[] = [];
  for (const name of files) {
    const data = await readFile(inside(canonical, `.staging/${name}`));
    if (name !== 'index.html') {
      try {
        const prior = await readFile(inside(canonical, name));
        if (!prior.equals(data)) throw new Error(`Hash filename collision: ${name}`);
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    pending.push({ name, data });
  }
  // HTML last: keep the previous entry usable until all its new dependencies exist.
  pending.sort((a, b) => Number(a.name === 'index.html') - Number(b.name === 'index.html'));
  for (const { name, data } of pending) {
    const destination = inside(canonical, name);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, data);
  }
  return files;
}
