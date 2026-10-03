// Phase 4 binding: this identifier is deliberately NOT an astronomical BodyId.
export const technicalId = 'technical-sphere' as const;
export type TechnicalId = typeof technicalId;
export type Quality = 'auto' | 'quality' | 'performance';
export type XRState = 'unsupported' | 'idle' | 'entering' | 'active' | 'exiting' | 'error';
export type Source = 'mouse' | 'keyboard' | 'touch' | 'xr' | 'ui';
export type Action =
  | { type: 'selectBody' | 'focusBody'; bodyId: TechnicalId }
  | { type: 'openInfo'; bodyId: TechnicalId; level: 'observe' }
  | { type: 'overview' | 'closeInfo' }
  | { type: 'orbitView'; deltaYawRad: number; deltaPitchRad: number }
  | { type: 'zoomView'; logDistanceDelta: number }
  | { type: 'panView'; right: number; up: number };
export interface Envelope { actionId: string; inputSessionId: string; sequence: number; realNowMs: number; source: Source; action: Action }
export interface CameraState { yaw: number; pitch: number; distance: number; right: number; up: number }
export interface State {
  selectedBody: TechnicalId | null; focusedBody: TechnicalId | null;
  info: { bodyId: TechnicalId; level: 'observe' } | null;
  cameraMode: 'overview' | 'orbit' | 'xr-observatory'; camera: CameraState;
  qualityProfile: Quality; xrSessionState: XRState; error: string | null;
  selectionCount: number; acceptedActions: number;
}
const initialCamera = (): CameraState => ({ yaw: -Math.PI / 2, pitch: Math.PI / 2.3, distance: 1.3, right: 0, up: 0 });
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
export function resolutionRatio(profile: Quality, dpr: number): number {
  if (!Number.isFinite(dpr) || dpr <= 0) throw new Error('Invalid DPR');
  return profile === 'performance' ? Math.min(dpr, 0.8) : Math.min(dpr, profile === 'quality' ? 2 : 1.5);
}
export class Store {
  state: State;
  private sequences = new Map<string, number>();
  private listeners = new Set<(state: State) => void>();
  constructor(xrSupported: boolean) {
    this.state = { selectedBody: null, focusedBody: null, info: null, cameraMode: 'overview', camera: initialCamera(), qualityProfile: 'auto', xrSessionState: xrSupported ? 'idle' : 'unsupported', error: null, selectionCount: 0, acceptedActions: 0 };
  }
  subscribe(listener: (state: State) => void): () => void { this.listeners.add(listener); listener(this.state); return () => this.listeners.delete(listener); }
  releaseInputSession(session: string): void { this.sequences.delete(session); }
  private publish(state: State): void { this.state = state; for (const listener of this.listeners) listener(state); }
  dispatch(envelope: Envelope): { accepted: boolean; reason?: string } {
    const reject = (reason: string) => ({ accepted: false, reason });
    const { action: a, sequence, inputSessionId: session } = envelope;
    if (!session || envelope.actionId !== `${session}:${sequence}` || !Number.isSafeInteger(sequence) || sequence < 1 || !Number.isFinite(envelope.realNowMs) || !['mouse', 'keyboard', 'touch', 'xr', 'ui'].includes(envelope.source)) return reject('invalid-envelope');
    if (sequence <= (this.sequences.get(session) ?? 0)) return reject('duplicate-or-stale');
    if ('bodyId' in a && a.bodyId !== technicalId) return reject('unknown-body');
    if (Object.values(a).some(value => typeof value === 'number' && !Number.isFinite(value))) return reject('non-finite');
    const coordinates = a.type === 'orbitView' ? [a.deltaYawRad, a.deltaPitchRad] : a.type === 'zoomView' ? [a.logDistanceDelta] : a.type === 'panView' ? [a.right, a.up] : [];
    if (!coordinates.every(Number.isFinite)) return reject('non-finite');
    if (a.type === 'openInfo' && a.level !== 'observe') return reject('unsupported-info-level');
    const s = this.state;
    const locked = ['entering', 'exiting'].includes(s.xrSessionState);
    if (locked && a.type !== 'closeInfo') return reject('transition');
    if (s.xrSessionState === 'active' && ['orbitView', 'zoomView', 'panView', 'focusBody', 'overview'].includes(a.type)) return reject('xr-head-is-native');
    let next: State = { ...s, camera: { ...s.camera } };
    switch (a.type) {
      case 'selectBody': case 'openInfo': case 'focusBody':
        next.selectedBody = a.bodyId; next.info = { bodyId: a.bodyId, level: 'observe' };
        if (a.type === 'selectBody') next.selectionCount++;
        if (a.type === 'focusBody') { next.focusedBody = a.bodyId; next.cameraMode = 'orbit'; next.camera = { ...initialCamera(), distance: 0.85 }; }
        break;
      case 'overview': next.focusedBody = null; next.cameraMode = 'overview'; next.camera = initialCamera(); break;
      case 'closeInfo': next.info = null; break;
      case 'orbitView': next.camera.yaw = (next.camera.yaw + a.deltaYawRad % (2 * Math.PI)) % (2 * Math.PI); next.camera.pitch = clamp(next.camera.pitch + a.deltaPitchRad, 0.15, Math.PI - 0.15); break;
      case 'zoomView': next.camera.distance = clamp(next.camera.distance * Math.exp(clamp(a.logDistanceDelta, -2, 2)), 0.55, 4); break;
      case 'panView': next.camera.right = clamp(next.camera.right + a.right, -0.7, 0.7); next.camera.up = clamp(next.camera.up + a.up, -0.7, 0.7); break;
      default: return reject('unknown-action');
    }
    this.sequences.set(session, sequence); next.acceptedActions++; this.publish(next); return { accepted: true };
  }
  quality(profile: Quality): boolean {
    if (!['auto', 'quality', 'performance'].includes(profile) || ['entering', 'active', 'exiting'].includes(this.state.xrSessionState)) return false;
    this.publish({ ...this.state, qualityProfile: profile }); return true;
  }
  xr(state: XRState, error: string | null = null): void {
    this.publish({ ...this.state, xrSessionState: state, error, cameraMode: state === 'active' ? 'xr-observatory' : this.state.focusedBody ? 'orbit' : 'overview' });
  }
}
export function actionChannel(store: Store, source: Source, session = `${source}-${crypto.randomUUID()}`) {
  let sequence = 0; let active = true;
  const send = (action: Action) => {
    if (!active) return { accepted: false, reason: 'disposed-input' };
    sequence++; return store.dispatch({ action, source, sequence, inputSessionId: session, actionId: `${session}:${sequence}`, realNowMs: performance.now() });
  };
  return Object.assign(send, { dispose: () => { active = false; store.releaseInputSession(session); } });
}
