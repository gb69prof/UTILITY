import { Engine } from '@babylonjs/core/Engines/engine.js';
import { createTechnicalScene } from './technical-scene.ts';
import { resolutionRatio, type Store } from '../core/interaction.ts';
import { Lifetime } from '../core/lifecycle.ts';
import { FrameSample } from '../core/metrics.ts';
import { attachScreenInput } from '../input/screen.ts';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation.js';
export { Engine };
export function createRenderer(canvas: HTMLCanvasElement, store: Store, notice: (message: string) => void) {
  const life = new Lifetime();
  try {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, powerPreference: 'high-performance' });
    life.own(() => engine.dispose());
    if (engine.webGLVersion !== 2) throw new Error('WebGL 2 non disponibile. La scena richiede WebGL 2; la scheda HTML resta accessibile.');
    const content = createTechnicalScene(engine); life.own(content.dispose);
    const instrumentation = new SceneInstrumentation(content.scene); life.own(() => instrumentation.dispose());
    if (content.textureError) notice('Texture tecnica non creata: attivo il materiale di riserva.');
    let profile = ''; let lost = false;
    const sample = new FrameSample();
    const resize = () => { sample.invalid ||= sample.running; engine.resize(); };
    const observer = new ResizeObserver(resize); observer.observe(canvas); life.own(() => observer.disconnect());
    window.addEventListener('resize', resize); life.own(() => window.removeEventListener('resize', resize));
    life.own(store.subscribe(state => {
      content.apply(state);
      if (profile !== state.qualityProfile) { profile = state.qualityProfile; sample.invalid ||= sample.running; engine.setHardwareScalingLevel(1 / resolutionRatio(state.qualityProfile, window.devicePixelRatio)); engine.resize(); }
    }));
    life.own(attachScreenInput(canvas, store, (x, y) => {
      const rect = canvas.getBoundingClientRect();
      return !!content.scene.pick(x - rect.left, y - rect.top, mesh => mesh === content.sphere)?.hit;
    }));
    const onLost = engine.onContextLostObservable.add(() => { lost = true; sample.invalid = true; notice('Contesto grafico perso. Attendo il ripristino; i comandi HTML restano disponibili.'); });
    const onRestored = engine.onContextRestoredObservable.add(() => { lost = false; content.apply(store.state); engine.resize(); notice('Contesto WebGL 2 ripristinato.'); });
    life.own(() => { engine.onContextLostObservable.remove(onLost); engine.onContextRestoredObservable.remove(onRestored); });
    const frame = () => {
      if (lost || life.disposed) return;
      try { content.scene.render(); sample.frame(performance.now(), document.visibilityState === 'visible'); }
      catch (error) { engine.stopRenderLoop(frame); notice(`Rendering interrotto: ${String(error)}. Usa Riavvia scena.`); }
    };
    engine.runRenderLoop(frame); life.own(() => engine.stopRenderLoop(frame));
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;
    life.own(() => clearTimeout(restoreTimer));
    return { engine, content, sample, instrumentation, dispose: () => life.dispose(),
      testContextLoss: () => {
        const gl = canvas.getContext('webgl2'); const extension = gl?.getExtension('WEBGL_lose_context');
        if (!extension) { notice('Estensione di simulazione del contesto assente.'); return; }
        extension.loseContext(); restoreTimer = setTimeout(() => extension.restoreContext(), 1500);
      }
    };
  } catch (error) { life.dispose(); throw error; }
}
