/**
 * WebAudio-synthesized paper sounds — quiet, warm, non-electronic.
 * All synthesis is defensive: any failure resolves to silence.
 */

let ctx: AudioContext | null = null;
let muted = false;

export const setSoundMuted = (value: boolean) => {
  muted = value;
};

const getContext = (): AudioContext | null => {
  if (muted || typeof window === 'undefined') return null;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
    }
    return ctx;
  } catch {
    return null;
  }
};

const makeNoiseBuffer = (audio: AudioContext, seconds: number): AudioBuffer => {
  const length = Math.max(1, Math.floor(audio.sampleRate * seconds));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

/** Soft paper slide — played when a new card is drawn upward. */
export const playFlip = () => {
  const audio = getContext();
  if (!audio) return;
  try {
    const t = audio.currentTime;
    const src = audio.createBufferSource();
    src.buffer = makeNoiseBuffer(audio, 0.18);
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.16);
    filter.Q.value = 0.9;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    src.start(t);
    src.stop(t + 0.2);
  } catch {
    /* silence */
  }
};

/** Low settle thud — card lands back onto the pile. */
export const playSettle = () => {
  const audio = getContext();
  if (!audio) return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(58, t + 0.14);
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.18);

    const src = audio.createBufferSource();
    src.buffer = makeNoiseBuffer(audio, 0.06);
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    const nGain = audio.createGain();
    nGain.gain.setValueAtTime(0.05, t);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(audio.destination);
    src.start(t);
    src.stop(t + 0.08);
  } catch {
    /* silence */
  }
};

/** Airy whoosh — card glides out sideways (切题/跳过). */
export const playWhoosh = () => {
  const audio = getContext();
  if (!audio) return;
  try {
    const t = audio.currentTime;
    const src = audio.createBufferSource();
    src.buffer = makeNoiseBuffer(audio, 0.24);
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(1500, t + 0.2);
    filter.Q.value = 1.4;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.08, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    src.start(t);
    src.stop(t + 0.26);
  } catch {
    /* silence */
  }
};
