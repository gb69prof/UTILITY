// Testable WebXR boundary. No viewer-space fallback: a fixed observatory requires a local origin.
export async function localReference<T>(request: (kind: 'local-floor' | 'local') => Promise<T>): Promise<T> {
  try { return await request('local-floor'); } catch { return await request('local'); }
}
export class SemanticSelectGate {
  private seen = new WeakSet<object>();
  accept(event: object, kind: string, active: boolean): boolean {
    if (kind !== 'select' || !active || this.seen.has(event)) return false;
    this.seen.add(event); return true;
  }
}
