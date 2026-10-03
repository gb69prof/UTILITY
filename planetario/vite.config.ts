import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { basePath, projectRoot, stagingRoot } from './tools/paths.ts';

export default defineConfig({
  root: resolve(projectRoot, 'app'),
  base: basePath,
  publicDir: false,
  cacheDir: resolve(projectRoot, '.cache/vite'),
  server: { strictPort: true, port: 5173, fs: { allow: [projectRoot] } },
  preview: { strictPort: true, port: 4173 },
  build: {
    outDir: stagingRoot,
    // Cleanup belongs to the guarded build script, never Vite's implicit deletion.
    emptyOutDir: false,
    assetsDir: 'build',
    target: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
    sourcemap: false
  }
});
