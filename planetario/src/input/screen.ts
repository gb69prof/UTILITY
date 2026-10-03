import { actionChannel, technicalId, type Store } from '../core/interaction.ts';
import { Gestures } from './gestures.ts';
export function attachScreenInput(canvas: HTMLCanvasElement, store: Store, pick: (x: number, y: number) => boolean): () => void {
  const life = new AbortController(); const options = { signal: life.signal };
  const gestures = new Gestures();
  const mouse = actionChannel(store, 'mouse'), touch = actionChannel(store, 'touch'), keyboard = actionChannel(store, 'keyboard');
  const channel = (event: PointerEvent) => event.pointerType === 'touch' ? touch : mouse;
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId); gestures.down(event.pointerId, event.clientX, event.clientY);
  }, options);
  canvas.addEventListener('pointermove', event => { for (const action of gestures.move(event.pointerId, event.clientX, event.clientY)) channel(event)(action); }, options);
  canvas.addEventListener('pointerup', event => {
    if (gestures.up(event.pointerId, event.clientX, event.clientY) && pick(event.clientX, event.clientY)) channel(event)({ type: 'selectBody', bodyId: technicalId });
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }, options);
  canvas.addEventListener('pointercancel', () => gestures.cancel(), options);
  canvas.addEventListener('lostpointercapture', () => gestures.cancel(), options);
  canvas.addEventListener('blur', () => gestures.cancel(), options);
  window.addEventListener('blur', () => gestures.cancel(), options);
  canvas.addEventListener('wheel', event => { event.preventDefault(); mouse({ type: 'zoomView', logDistanceDelta: event.deltaY * (event.deltaMode === 1 ? 0.025 : 0.0015) }); }, { ...options, passive: false });
  canvas.addEventListener('keydown', event => {
    const actions = {
      ArrowLeft: { type: 'orbitView', deltaYawRad: -0.12, deltaPitchRad: 0 }, ArrowRight: { type: 'orbitView', deltaYawRad: 0.12, deltaPitchRad: 0 },
      ArrowUp: { type: 'orbitView', deltaYawRad: 0, deltaPitchRad: -0.12 }, ArrowDown: { type: 'orbitView', deltaYawRad: 0, deltaPitchRad: 0.12 },
      '+': { type: 'zoomView', logDistanceDelta: -0.12 }, '=': { type: 'zoomView', logDistanceDelta: -0.12 }, '-': { type: 'zoomView', logDistanceDelta: 0.12 },
      Enter: { type: 'selectBody', bodyId: technicalId }, Escape: { type: 'closeInfo' }, Home: { type: 'overview' }
    } as const;
    const action = actions[event.key as keyof typeof actions]; if (action) { event.preventDefault(); keyboard(action); }
  }, options);
  return () => { gestures.cancel(); life.abort(); mouse.dispose(); touch.dispose(); keyboard.dispose(); };
}
