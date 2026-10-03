import { fileURLToPath } from 'node:url';
export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const stagingRoot = fileURLToPath(new URL('../.staging/', import.meta.url));
export const basePath = '/UTILITY/planetario/';
