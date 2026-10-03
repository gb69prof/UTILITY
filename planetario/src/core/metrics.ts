export class FrameSample {
  private last = 0;
  private started = 0;
  private samples: number[] = [];
  invalid = false;
  running = false;
  elapsed = 0;
  start(now: number): void { this.started = now; this.last = 0; this.samples = []; this.invalid = false; this.running = true; this.elapsed = 0; }
  frame(now: number, visible: boolean): void {
    if (!this.running) return;
    if (!visible) this.invalid = true;
    this.elapsed = now - this.started;
    if (this.elapsed >= 10000 && this.last) this.samples.push(now - this.last);
    this.last = now;
    if (this.elapsed >= 310000) this.running = false;
  }
  summary(): string {
    if (!this.started) return 'Non avviata';
    const sorted = [...this.samples].sort((a, b) => a - b);
    const percentile = (q: number) => (sorted[Math.floor((sorted.length - 1) * q)] ?? 0).toFixed(1);
    const missed = sorted.filter(n => n > 25).length;
    return `${this.running ? 'IN CORSO' : 'TERMINATA'} · ${Math.max(0, Math.min(300, (this.elapsed - 10000) / 1000)).toFixed(0)}/300 s · ${sorted.length} frame · p50/p95/p99 ${percentile(0.5)}/${percentile(0.95)}/${percentile(0.99)} ms · intervalli >25 ms ${sorted.length ? (100 * missed / sorted.length).toFixed(2) : '0'}%${this.invalid ? ' · INVALIDA: pagina nascosta o configurazione cambiata' : ''}`;
  }
}
