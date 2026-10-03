import { build } from 'vite';
import { resolve } from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import { projectRoot } from './paths.ts';
import { inspectStaging, resetStaging } from './static-release.ts';

await resetStaging(projectRoot);
await build({ configFile: resolve(projectRoot, 'vite.config.ts') });
// Match Git's canonical text bytes even when the source HTML was edited on Windows.
const entry=resolve(projectRoot,'.staging/index.html');
await writeFile(entry,(await readFile(entry,'utf8')).replaceAll('\r\n','\n'));
console.log('Staging verificato:', await inspectStaging(projectRoot));
