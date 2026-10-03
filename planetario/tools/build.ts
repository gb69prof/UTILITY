import { build } from 'vite';
import { resolve } from 'node:path';
import { projectRoot } from './paths.ts';
import { inspectStaging, resetStaging } from './static-release.ts';

await resetStaging(projectRoot);
await build({ configFile: resolve(projectRoot, 'vite.config.ts') });
console.log('Staging verificato:', await inspectStaging(projectRoot));
