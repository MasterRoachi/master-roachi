// A very small tween runner for the library. Everything that moves by itself
// (a case sliding out of its rack, a lid opening, a page turning) is a tween
// stepped from the one render loop, so nothing animates on its own timer and
// everything stops together when the page is hidden.

export const ease = {
  linear: (t: number) => t,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  in: (t: number) => t * t * t,
};

interface Running {
  start: number;
  duration: number;
  step: (t: number) => void;
  done: () => void;
  curve: (t: number) => number;
}

export class Tweens {
  private running: Running[] = [];
  private now = 0;

  /** Runs `step` with t from 0 to 1 over `seconds`; resolves when finished. */
  run(seconds: number, step: (t: number) => void, curve = ease.inOut): Promise<void> {
    return new Promise((done) => {
      this.running.push({ start: this.now, duration: Math.max(seconds, 1e-3), step, done, curve });
    });
  }

  /** Advances every tween to `now` (seconds). */
  update(now: number) {
    this.now = now;
    // Work on a snapshot: a finished tween's promise can start the next one,
    // and that one must survive into the next frame rather than be dropped.
    const batch = this.running;
    this.running = [];
    for (const r of batch) {
      const raw = Math.min(1, (now - r.start) / r.duration);
      r.step(r.curve(raw));
      if (raw >= 1) r.done();
      else this.running.push(r);
    }
  }
}
