export class Lifetime {
  private cleanup: (() => void)[] = [];
  disposed = false;
  own(dispose: () => void): void { if (this.disposed) dispose(); else this.cleanup.push(dispose); }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const errors: unknown[] = [];
    for (const dispose of this.cleanup.reverse()) { try { dispose(); } catch (error) { errors.push(error); } }
    this.cleanup = [];
    if (errors.length) throw new AggregateError(errors, 'Disposal incomplete');
  }
}
