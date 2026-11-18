// The library's sound effects, synthesised rather than recorded: a jewel
// case's two-stage click, a DVD case's snap, a book's soft thump, paper
// turning, a tray's motor. Made with Web Audio from noise and a few
// oscillators, so there are no sound files to source, license or credit.
//
// The AudioContext is made on the first sound, which always follows a click,
// so the browser's autoplay rule is met.

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function ac() {
  if (!ctx) {
    ctx = new AudioContext();
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** A burst of filtered noise: clicks, snaps, rustles. */
function burst(opts: {
  at?: number;
  dur: number;
  freq: number;
  to?: number;
  q?: number;
  gain: number;
  type?: BiquadFilterType;
  attack?: number;
}) {
  const c = ac();
  const t = c.currentTime + (opts.at ?? 0);
  const src = c.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = opts.type ?? 'bandpass';
  f.Q.value = opts.q ?? 1.2;
  f.frequency.setValueAtTime(opts.freq, t);
  if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + opts.dur);
  const g = c.createGain();
  const attack = opts.attack ?? 0.002;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t, Math.random() * 0.5);
  src.stop(t + opts.dur + 0.05);
}

/** A short pitched knock: the body of a snap or a thump. */
function knock(at: number, freq: number, dur: number, gain: number) {
  const c = ac();
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  /** The jewel case's hinge: a click as it unlatches, a second as it opens. */
  cdOpen() {
    burst({ dur: 0.03, freq: 3800, q: 3, gain: 0.5 });
    burst({ at: 0.09, dur: 0.045, freq: 2600, q: 2, gain: 0.35 });
  },
  cdClose() {
    burst({ dur: 0.02, freq: 2400, q: 2, gain: 0.25 });
    burst({ at: 0.05, dur: 0.035, freq: 4200, q: 3, gain: 0.55 });
  },
  /** A keep case: the clasp snaps and the plastic flexes. */
  dvdOpen() {
    burst({ dur: 0.05, freq: 1600, q: 1.5, gain: 0.6 });
    knock(0, 180, 0.08, 0.35);
    burst({ at: 0.06, dur: 0.18, freq: 900, to: 500, q: 0.8, gain: 0.12, attack: 0.02 });
  },
  dvdClose() {
    burst({ dur: 0.06, freq: 1300, q: 1.2, gain: 0.55 });
    knock(0, 140, 0.1, 0.45);
  },
  /** A book: the cover's soft thump, then the pages settling. */
  bookOpen() {
    knock(0, 110, 0.14, 0.4);
    burst({ dur: 0.12, freq: 600, q: 0.7, gain: 0.25, type: 'lowpass' });
    burst({ at: 0.05, dur: 0.4, freq: 2200, to: 3800, q: 0.6, gain: 0.12, attack: 0.06 });
  },
  bookClose() {
    knock(0, 95, 0.16, 0.5);
    burst({ dur: 0.1, freq: 500, q: 0.7, gain: 0.3, type: 'lowpass' });
  },
  /** Paper turning: a rustle that rises as the page lifts and falls as it lands. */
  page() {
    burst({ dur: 0.42, freq: 1800, to: 4200, q: 0.7, gain: 0.16, attack: 0.08 });
    burst({ at: 0.32, dur: 0.12, freq: 900, q: 0.8, gain: 0.08 });
  },
  /** Something sliding against something: a booklet, a case out of its rack. */
  slide() {
    burst({ dur: 0.35, freq: 3000, to: 2200, q: 0.5, gain: 0.07, attack: 0.05, type: 'highpass' });
  },
  /** A player's tray motor. */
  tray() {
    const c = ac();
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(95, t);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 500;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
    g.gain.setValueAtTime(0.05, t + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    o.connect(f).connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.6);
    burst({ at: 0.5, dur: 0.03, freq: 2000, q: 2, gain: 0.2 });
  },
  /** The screen's motor, rolling it down or up. */
  screen(seconds = 2.2) {
    const c = ac();
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(70, t);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 320;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.15);
    g.gain.setValueAtTime(0.04, t + seconds - 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    o.connect(f).connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + seconds + 0.05);
    burst({ at: seconds - 0.05, dur: 0.05, freq: 900, q: 1, gain: 0.25 });
  },
  /** Wood taking weight: stepping on a ladder. */
  ladder() {
    knock(0, 160, 0.12, 0.35);
    burst({ dur: 0.25, freq: 700, to: 400, q: 4, gain: 0.08, attack: 0.03 });
  },
  /** The ladder's wheels on the floor and its hooks on the rail. */
  roll(seconds = 0.25) {
    burst({ dur: seconds, freq: 1200, q: 0.6, gain: 0.025, attack: 0.04, type: 'lowpass' });
  },
  /** A hidden catch: the book tips, something heavy unlatches behind the wall. */
  lever() {
    burst({ dur: 0.08, freq: 900, q: 0.8, gain: 0.25, type: 'lowpass' });
    knock(0.18, 70, 0.25, 0.6);
    burst({ at: 0.18, dur: 0.05, freq: 2400, q: 2, gain: 0.3 });
  },
  /** A heavy bookcase door swinging on old hinges: a low rumble and a creak. */
  hiddenDoor(seconds = 2.2) {
    burst({ dur: seconds, freq: 140, to: 90, q: 0.7, gain: 0.12, attack: 0.3, type: 'lowpass' });
    burst({ at: 0.2, dur: seconds * 0.6, freq: 700, to: 1100, q: 9, gain: 0.05, attack: 0.25 });
    knock(seconds - 0.05, 60, 0.3, 0.5);
  },
  button() {
    burst({ dur: 0.015, freq: 5000, q: 3, gain: 0.25 });
  },
};
