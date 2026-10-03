export interface AppConfig {
  readonly version: string;
  readonly basePath: string;
  readonly phase: 3;
  readonly renderer: 'webgl2';
}
export function createConfig(basePath: string): AppConfig {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)+$/.test(basePath)) {
    throw new Error('Il base path deve essere una sottocartella assoluta con slash finale.');
  }
  return Object.freeze({ version: '0.3.0', basePath, phase: 3, renderer: 'webgl2' });
}
