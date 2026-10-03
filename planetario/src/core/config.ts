export interface AppConfig {
  readonly version: string;
  readonly basePath: string;
  readonly phase: 4;
  readonly renderer: 'webgl2';
}
export function createConfig(basePath: string): AppConfig {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)+$/.test(basePath)) {
    throw new Error('Il base path deve essere una sottocartella assoluta con slash finale.');
  }
  return Object.freeze({ version: '0.5.0', basePath, phase: 4, renderer: 'webgl2' });
}
