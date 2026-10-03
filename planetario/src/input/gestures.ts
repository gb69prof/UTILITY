import type { Action } from '../core/interaction.ts';
interface Point { x: number; y: number; startX: number; startY: number; moved: boolean }
// No DOM or Babylon dependency: one gesture stream, release-only tap, CSS-pixel threshold.
export class Gestures {
  private points = new Map<number, Point>();
  private multi = false;
  down(id: number, x: number, y: number): void {
    this.points.set(id, { x, y, startX: x, startY: y, moved: false });
    if (this.points.size > 1) this.multi = true;
  }
  move(id: number, x: number, y: number): Action[] {
    const p = this.points.get(id); if (!p) return [];
    const dx = x - p.x, dy = y - p.y;
    const before = [...this.points.values()];
    const oldDistance = before.length === 2 ? Math.hypot(before[0]!.x - before[1]!.x, before[0]!.y - before[1]!.y) : 0;
    p.x = x; p.y = y; p.moved ||= Math.hypot(x - p.startX, y - p.startY) >= 8;
    if (this.points.size === 2) {
      const distance = Math.hypot(before[0]!.x - before[1]!.x, before[0]!.y - before[1]!.y);
      return [{ type: 'panView', right: -dx * 0.0007, up: dy * 0.0007 }, ...(distance > 4 && oldDistance > 4 ? [{ type: 'zoomView' as const, logDistanceDelta: Math.log(oldDistance / distance) }] : [])];
    }
    return !this.multi && p.moved ? [{ type: 'orbitView', deltaYawRad: -dx * 0.006, deltaPitchRad: -dy * 0.006 }] : [];
  }
  up(id: number, x: number, y: number): boolean {
    const p = this.points.get(id);
    const tap = !!p && !this.multi && !p.moved && Math.hypot(x - p.startX, y - p.startY) < 8;
    this.points.delete(id); if (this.points.size === 0) this.multi = false; return tap;
  }
  cancel(): void { this.points.clear(); this.multi = false; }
}
