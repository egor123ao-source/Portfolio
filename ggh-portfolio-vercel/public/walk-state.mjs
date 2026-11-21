export const PROMPT_DELAY = 4.2;
export const LOWER_DURATION = 2.6;
export const SURVEY_DURATION = 3.4;
export const LOOK_DURATION = 4;
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

function keyframes(t, frames) {
  for (let i = 1; i < frames.length; i++) {
    if (t <= frames[i][0]) {
      const previous = frames[i - 1];
      return lerp(previous[1], frames[i][1], smooth((t - previous[0]) / (frames[i][0] - previous[0])));
    }
  }
  return frames.at(-1)[1];
}

export class WinterWalk {
  constructor({ intro = true, random = Math.random, distance = 0, paused = false } = {}) {
    this.random = random;
    this.phase = intro ? 'waking' : 'walking';
    this.time = 0;
    this.distance = distance;
    this.walkTime = 0;
    this.snowTime = 0;
    this.paused = paused;
    this.nextLook = this.randomDelay();
    this.lookCount = 0;
    this.lookDirection = 1;
  }
  randomDelay() { return 30 + clamp(this.random()) * 30; }
  interact() {
    if (this.phase !== 'waiting') return false;
    this.phase = 'lowering';
    this.time = 0;
    return true;
  }
  skip() {
    this.phase = 'walking';
    this.time = 0;
    this.nextLook = this.randomDelay();
  }
  replay() {
    this.phase = 'waking';
    this.time = 0;
    this.paused = false;
  }
  step(dt) {
    if (this.paused) return;
    // Small steps keep distance integration and transitions stable after a slow frame.
    let remaining = Math.max(0, Math.min(dt, 120));
    while (remaining > 0) {
      const step = Math.min(remaining, 1 / 30);
      this.advance(step);
      remaining -= step;
    }
  }
  advance(dt) {
    this.time += dt;
    this.snowTime += dt;
    if (this.phase === 'waking' && this.time >= PROMPT_DELAY) {
      this.phase = 'waiting'; this.time = 0;
    } else if (this.phase === 'lowering' && this.time >= LOWER_DURATION) {
      this.phase = 'surveying'; this.time = 0;
    } else if (this.phase === 'surveying' && this.time >= SURVEY_DURATION) {
      this.phase = 'walking'; this.time = 0;
    } else if (this.phase === 'walking') {
      this.distance += 1.65 * smooth(this.time / 1.1) * dt;
      this.walkTime += dt;
      if (this.time >= this.nextLook) {
        this.phase = 'looking'; this.time = 0;
        this.lookDirection = this.random() > .5 ? 1 : -1;
        this.lookCount++;
      }
    } else if (this.phase === 'looking' && this.time >= LOOK_DURATION) {
      this.phase = 'walking'; this.time = 0;
      this.nextLook = this.randomDelay();
    }
  }
  pose() {
    let pitch = .018, yaw = 0, roll = 0, bob = 0, sway = 0;
    if (this.phase === 'waking' || this.phase === 'waiting') {
      pitch = 1.43 + Math.sin(this.snowTime * .3) * .012;
      yaw = Math.sin(this.snowTime * .14) * .025;
    } else if (this.phase === 'lowering') {
      pitch = lerp(1.43, .018, smooth(this.time / LOWER_DURATION));
    } else if (this.phase === 'surveying') {
      yaw = keyframes(this.time, [[0, 0], [.9, .66], [1.35, .66], [2.5, -.58], [3.4, 0]]);
      pitch = .018 + Math.sin(this.time * Math.PI / SURVEY_DURATION) * -.025;
    } else if (this.phase === 'looking') {
      yaw = this.lookDirection * keyframes(this.time, [[0, 0], [.55, 1.18], [1.1, 1.18], [2.4, -.64], [2.9, -.64], [4, 0]]);
      pitch = keyframes(this.time, [[0, .018], [.55, .045], [2.4, -.035], [4, .018]]);
      roll = this.lookDirection * Math.sin(Math.min(this.time / .7, 1) * Math.PI) * .018;
    } else if (!this.paused) {
      const walking = smooth(this.time / 1.1);
      bob = Math.sin(this.walkTime * 8) * .017 * walking;
      sway = Math.sin(this.walkTime * 4) * .017 * walking;
      roll = Math.sin(this.walkTime * 4) * .0015 * walking;
    }
    return { pitch, yaw, roll, bob, sway, distance: this.distance };
  }
}
