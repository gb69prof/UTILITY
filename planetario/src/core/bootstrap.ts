import { createConfig } from './config.ts';
import { browserProbe, detectCapabilities } from './capabilities.ts';
import { renderDiagnostics } from '../ui/diagnostics.ts';

export async function bootstrap(): Promise<void> {
  const config = createConfig(import.meta.env.BASE_URL);
  const canvas = document.getElementById('render-canvas');
  if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Canvas di destinazione assente.');
  const [{ prepareRenderer }, capabilities] = await Promise.all([
    import('../rendering/babylon.ts'), detectCapabilities(browserProbe())
  ]);
  const renderer = prepareRenderer(canvas);
  renderDiagnostics(config, capabilities, renderer.version);
}
