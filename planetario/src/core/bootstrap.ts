import { createConfig } from './config.ts';
import { browserProbe, detectCapabilities } from './capabilities.ts';
import { Store, actionChannel, technicalId, type Quality } from './interaction.ts';
import { renderDiagnostics } from '../ui/diagnostics.ts';
import { createRenderer, Engine } from '../rendering/babylon.ts';
import { prepareXR } from '../xr/session.ts';
import { EngineStore } from '@babylonjs/core/Engines/engineStore.js';

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id); if (!found) throw new Error(`Elemento assente: ${id}`); return found as T;
}
export async function bootstrap(): Promise<void> {
  const config = createConfig(import.meta.env.BASE_URL);
  const capabilities = await detectCapabilities(browserProbe());
  renderDiagnostics(config, capabilities, Engine.Version);
  const canvas = element<HTMLCanvasElement>('render-canvas');
  const store = new Store(capabilities.webxr.status === 'available');
  const send = actionChannel(store, 'ui');
  const controller = new AbortController(); const options = { signal: controller.signal };
  const notice = (message: string) => { element('status').textContent = message; };
  let renderer: ReturnType<typeof createRenderer> | undefined;
  let xr: Awaited<ReturnType<typeof prepareXR>> | undefined;
  let opener: HTMLElement = element('open-info'); let previousInfo = false;
  let disposed = false; let busy = false; let generation = 0;
  const enter = element<HTMLButtonElement>('enter-xr'), exit = element<HTMLButtonElement>('exit-xr');
  const quality = element<HTMLSelectElement>('quality');
  const close = element<HTMLButtonElement>('close-info');
  const on = (id: string, action: () => void) => element(id).addEventListener('click', action, options);
  on('select-object', () => { send({ type: 'selectBody', bodyId: technicalId }); });
  on('focus-object', () => { send({ type: 'focusBody', bodyId: technicalId }); });
  on('overview', () => { send({ type: 'overview' }); });
  on('open-info', () => { send({ type: 'openInfo', bodyId: technicalId, level: 'observe' }); });
  on('close-info', () => { send({ type: 'closeInfo' }); });
  on('zoom-in', () => { send({ type: 'zoomView', logDistanceDelta: -0.15 }); });
  on('zoom-out', () => { send({ type: 'zoomView', logDistanceDelta: 0.15 }); });
  quality.addEventListener('change', () => { if (!store.quality(quality.value as Quality)) quality.value = store.state.qualityProfile; }, options);
  element('info').addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); send({ type: 'closeInfo' }); } }, options);
  on('enter-xr', () => { void xr?.enter(); }); on('exit-xr', () => { void xr?.exit(); });
  const unsubscribe = store.subscribe(state => {
    if (state.info && !previousInfo && document.activeElement instanceof HTMLElement) opener = document.activeElement;
    const returnFocus = !state.info && previousInfo && element('info').contains(document.activeElement);
    element('info').hidden = !state.info;
    if (returnFocus) opener.focus({ preventScroll: true });
    previousInfo = !!state.info;
    element('selection-status').textContent = state.selectedBody ? 'Selezionato' : 'Non selezionato';
    element('camera-state').textContent = `${state.cameraMode} · ${state.camera.distance.toFixed(2)} u`;
    canvas.dataset['yaw'] = String(state.camera.yaw); canvas.dataset['pitch'] = String(state.camera.pitch); canvas.dataset['distance'] = String(state.camera.distance);
    element('selection-status').dataset['count'] = String(state.selectionCount);
    const inXR = ['active', 'entering', 'exiting'].includes(state.xrSessionState);
    quality.disabled = inXR; enter.disabled = inXR || !xr; exit.hidden = state.xrSessionState !== 'active';
    for (const id of ['focus-object', 'overview', 'zoom-in', 'zoom-out', 'restart', 'benchmark', 'context-loss']) element<HTMLButtonElement>(id).disabled = inXR;
    if (renderer && inXR) renderer.sample.invalid ||= renderer.sample.running;
  });
  element('browser-version').textContent = `Browser dichiarato: ${navigator.userAgent}. Rilevamento capacità indipendente dalla versione dichiarata.`;
  element('xr-help').textContent = capabilities.webxr.status === 'available' ? 'VR disponibile: il pulsante apparirà quando l’integrazione sarà pronta. Prove fisiche Quest ancora richieste.' : 'VR immersiva non disponibile o non verificabile in questo browser. La scena sullo schermo resta utilizzabile.';
  async function start(): Promise<void> {
    if (busy || disposed) return; busy = true; const current = ++generation;
    element<HTMLButtonElement>('restart').disabled = true;
    try {
      await xr?.dispose(); xr = undefined; enter.hidden = true;
      if (disposed) return;
      renderer?.dispose(); renderer = undefined;
      element('error').hidden = true;
      renderer = createRenderer(canvas, store, notice);
      notice('Fase 4 — scena 3D attiva · seleziona la sfera per aprire la scheda');
      if (capabilities.webxr.status === 'available') {
        try {
          const ready = await prepareXR(renderer.content, store, notice);
          if (disposed || current !== generation) { await ready.dispose(); return; }
          xr = ready; store.xr('idle'); enter.hidden = false; enter.disabled = false;
        } catch (error) { store.xr('error', String(error)); notice('Preparazione XR non riuscita. La scena desktop resta attiva.'); }
      }
    } catch (error) {
      element('error').hidden = false; element('error').textContent = String(error);
      notice('Scena non avviata. Puoi usare Apri scheda oppure riprovare con Riavvia scena.');
    } finally { busy = false; element<HTMLButtonElement>('restart').disabled = false; }
  }
  on('restart', () => { void start(); });
  on('context-loss', () => renderer?.testContextLoss());
  on('benchmark', () => renderer?.sample.start(performance.now()));
  document.addEventListener('visibilitychange', () => { if (renderer?.sample.running && document.visibilityState !== 'visible') renderer.sample.invalid = true; }, options);
  const timer = setInterval(() => {
    if (!renderer) return;
    const { engine, content, sample } = renderer;
    element('runtime').textContent = [
      `WebGL ${engine.webGLVersion} · Babylon ${Engine.Version} · ${engine.getFps().toFixed(1)} FPS · intervallo ${engine.getDeltaTime().toFixed(1)} ms`,
      `Buffer ${engine.getRenderWidth()} × ${engine.getRenderHeight()} · hardware scaling ${engine.getHardwareScalingLevel().toFixed(2)} · profilo ${store.state.qualityProfile}`,
      `Mesh ${content.scene.meshes.length} · materiali ${content.scene.materials.length} · texture ${content.scene.textures.length} · triangoli ${content.scene.getActiveIndices() / 3} · draw call ${renderer.instrumentation.drawCallsCounter.current}`,
      `Camera ${store.state.cameraMode} · selezioni ${store.state.selectionCount} · azioni ${store.state.acceptedActions} · XR ${store.state.xrSessionState}`,
      `Motori registrati ${EngineStore.Instances.length} · scene registrate ${EngineStore.Instances.reduce((total, instance) => total + instance.scenes.length, 0)}`,
      'Texture griglia: 512 × 512 RGBA, 1 MiB nominale senza mipmap. VRAM totale e disponibile: non misurabili.'
    ].join('\n');
    element('benchmark-result').textContent = sample.summary();
  }, 1000);
  const dispose = () => {
    if (disposed) return; disposed = true; generation++; clearInterval(timer); controller.abort(); unsubscribe(); send.dispose();
    const oldRenderer = renderer; const oldXR = xr; renderer = undefined; xr = undefined;
    if (oldXR) void oldXR.dispose().finally(() => oldRenderer?.dispose()); else oldRenderer?.dispose();
  };
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); }, options);
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  await start();
  // The close button is part of a non-modal panel; keyboard focus is never trapped.
  close.setAttribute('aria-controls', 'info');
}
