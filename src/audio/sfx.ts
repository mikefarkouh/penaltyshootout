/**
 * All match audio is synthesised with the Web Audio API, so the prototype
 * ships without any binary sound assets.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let crowdGain: GainNode | null = null;
let enabled = true;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function setAudioEnabled(on: boolean) {
  enabled = on;
  if (master) master.gain.value = on ? 0.85 : 0;
  if (on) audio();
}

export const isAudioEnabled = () => enabled;

/** A continuous murmur that swells on demand. */
export function startCrowd() {
  const c = audio();
  if (!c || !master || crowdGain) return;

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 4);
  src.loop = true;

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 620;
  lp.Q.value = 0.6;

  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 130;

  crowdGain = c.createGain();
  crowdGain.gain.value = 0.05;

  // Slow drift so the ambience never sounds static.
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.13;
  lfoGain.gain.value = 0.018;
  lfo.connect(lfoGain).connect(crowdGain.gain);
  lfo.start();

  src.connect(hp).connect(lp).connect(crowdGain).connect(master);
  src.start();
}

/** Lifts the crowd noise to a roar, then settles it back down. */
export function crowdSwell(intensity = 1, duration = 2.2) {
  const c = audio();
  if (!c || !crowdGain) return;
  const now = c.currentTime;
  const peak = 0.05 + 0.3 * intensity;
  crowdGain.gain.cancelScheduledValues(now);
  crowdGain.gain.setValueAtTime(crowdGain.gain.value, now);
  crowdGain.gain.linearRampToValueAtTime(peak, now + 0.18);
  crowdGain.gain.exponentialRampToValueAtTime(0.05, now + duration);
}

function envTone(
  c: AudioContext,
  type: OscillatorType,
  from: number,
  to: number,
  duration: number,
  gain: number,
) {
  if (!master) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), c.currentTime + duration);
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(g).connect(master);
  osc.start();
  osc.stop(c.currentTime + duration + 0.05);
}

function burst(c: AudioContext, duration: number, freq: number, gain: number, type: BiquadFilterType = "bandpass") {
  if (!master) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, duration + 0.05);
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = 1.2;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  src.connect(filter).connect(g).connect(master);
  src.start();
  src.stop(c.currentTime + duration + 0.05);
}

export function sfxKick(power: number) {
  const c = audio();
  if (!c) return;
  envTone(c, "sine", 150 + power * 90, 48, 0.14, 0.32);
  burst(c, 0.09, 1500 + power * 1400, 0.3);
}

export function sfxNet() {
  const c = audio();
  if (!c) return;
  burst(c, 0.34, 2600, 0.16, "highpass");
}

export function sfxSave() {
  const c = audio();
  if (!c) return;
  burst(c, 0.13, 900, 0.34);
  envTone(c, "triangle", 320, 120, 0.16, 0.18);
}

export function sfxPost() {
  const c = audio();
  if (!c) return;
  envTone(c, "triangle", 1180, 700, 0.7, 0.3);
  envTone(c, "sine", 2360, 1500, 0.45, 0.12);
}

export function sfxMiss() {
  const c = audio();
  if (!c) return;
  burst(c, 0.5, 500, 0.12, "lowpass");
}

export function sfxWhistle() {
  const c = audio();
  if (!c || !master) return;
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const g = c.createGain();
  const vib = c.createOscillator();
  const vibGain = c.createGain();

  osc.type = "square";
  osc2.type = "square";
  osc.frequency.value = 2280;
  osc2.frequency.value = 2410;
  vib.frequency.value = 34;
  vibGain.gain.value = 70;
  vib.connect(vibGain);
  vibGain.connect(osc.frequency);
  vibGain.connect(osc2.frequency);

  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.12, c.currentTime + 0.04);
  g.gain.setValueAtTime(0.12, c.currentTime + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.42);

  osc.connect(g);
  osc2.connect(g);
  g.connect(master);
  vib.start();
  osc.start();
  osc2.start();
  osc.stop(c.currentTime + 0.45);
  osc2.stop(c.currentTime + 0.45);
  vib.stop(c.currentTime + 0.45);
}

export function sfxClick() {
  const c = audio();
  if (!c) return;
  envTone(c, "square", 620, 420, 0.06, 0.07);
}

export function sfxDrum() {
  const c = audio();
  if (!c) return;
  envTone(c, "sine", 120, 45, 0.3, 0.28);
}
