// Todo o audio do jogo e sintetizado em codigo via Web Audio API —
// osciladores pra motor/turbo/menu/vitoria/derrota, ruido branco
// filtrado pra colisao. Isso evita depender de arquivos de audio
// externos (que poderiam ter direitos autorais) e mantem o pacote
// leve — mesma abordagem usada no RUSH DRIVE. Os volumes vem do
// PlayerProfile (Etapa 17: musicVolume/sfxVolume).

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let unlocked = false;

function ensureContext() {
  if (audioCtx) return audioCtx;

  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;

  audioCtx = new Ctx();
  masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);

  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.7;
  musicGain.connect(masterGain);

  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 0.8;
  sfxGain.connect(masterGain);

  return audioCtx;
}

// Navegadores so deixam o audio tocar depois de um gesto do usuario.
// Chamado uma vez no primeiro toque/clique da pagina (ver main.js).
export function unlockAudio() {
  const ctx = ensureContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  unlocked = true;
}

export function isAudioUnlocked() {
  return unlocked;
}

export function setVolumes({ musicVolume, sfxVolume }) {
  const ctx = ensureContext();
  if (!ctx) return;
  musicGain.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.05);
  sfxGain.gain.setTargetAtTime(sfxVolume, ctx.currentTime, 0.05);
}

function playTone({ freq = 440, duration = 0.15, type = 'square', volume = 0.3, sweepTo = null } = {}) {
  const ctx = ensureContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, ctx.currentTime + duration);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoiseBurst({ duration = 0.25, volume = 0.4, filterFreq = 1200 } = {}) {
  const ctx = ensureContext();
  if (!ctx) return;

  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);
  src.start();
}

const SFX = {
  boost: () => playTone({ freq: 200, duration: 0.28, type: 'sawtooth', volume: 0.2, sweepTo: 480 }),
  jump: () => playTone({ freq: 300, duration: 0.14, type: 'square', volume: 0.18, sweepTo: 560 }),
  collision: () => playNoiseBurst({ duration: 0.16, volume: 0.4, filterFreq: 1000 }),
  ballBounce: () => playTone({ freq: 220, duration: 0.08, type: 'sine', volume: 0.15, sweepTo: 160 }),
  turboPad: () => playTone({ freq: 700, duration: 0.12, type: 'triangle', volume: 0.2, sweepTo: 1100 }),
  goal: () => {
    [660, 880, 1100].forEach((freq, i) =>
      setTimeout(() => playTone({ freq, duration: 0.16, type: 'triangle', volume: 0.28 }), i * 90)
    );
  },
  victory: () => {
    [523, 659, 784, 1046].forEach((freq, i) =>
      setTimeout(() => playTone({ freq, duration: 0.25, type: 'triangle', volume: 0.3 }), i * 110)
    );
  },
  defeat: () => {
    [440, 392, 330].forEach((freq, i) =>
      setTimeout(() => playTone({ freq, duration: 0.35, type: 'triangle', volume: 0.25 }), i * 160)
    );
  },
  click: () => playTone({ freq: 500, duration: 0.06, type: 'square', volume: 0.15 })
};

// Compativel com o stub das etapas anteriores: playSfx(scene, 'boost')
// etc. O parametro scene nao e necessario (audio e global, nao por
// cena), mas mantido pra nao precisar mudar quem ja chama.
export function playSfx(_scene, key) {
  SFX[key]?.();
}

// Som de motor continuo, com tom subindo conforme a velocidade. Uma
// instancia por carro que precisa de som de motor (so o jogador, pra
// nao virar uma cacofonia com o bot tambem).
export class EngineSound {
  constructor() {
    const ctx = ensureContext();
    this.ctx = ctx;
    if (!ctx) return;

    this.osc = ctx.createOscillator();
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 55;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 700;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0;

    this.osc.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(sfxGain);
    this.osc.start();
  }

  // speedRatio: 0..1 da velocidade em relacao ao maximo do carro.
  update(speedRatio, audible = true) {
    if (!this.ctx) return;
    const freq = 55 + speedRatio * 260;
    const targetGain = audible ? 0.05 + speedRatio * 0.09 : 0;
    this.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.06);
    this.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
  }

  stop() {
    if (!this.ctx) return;
    this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    const osc = this.osc;
    setTimeout(() => {
      try {
        osc.stop();
      } catch {
        // ja parado
      }
    }, 300);
  }
}

// Musica simples: sequencia de notas curtas tocando em loop. `notes`
// aceita `null` pra um silencio (pausa ritmica).
export class MusicLoop {
  constructor(notes, stepMs, { type = 'triangle', volume = 0.12 } = {}) {
    this.notes = notes;
    this.stepMs = stepMs;
    this.type = type;
    this.volume = volume;
    this.index = 0;
    this.timerId = null;
  }

  start() {
    this.stop();
    const ctx = ensureContext();
    if (!ctx) return;

    const step = () => {
      const freq = this.notes[this.index % this.notes.length];
      if (freq) {
        playTone({ freq, duration: this.stepMs / 1000 + 0.05, type: this.type, volume: this.volume });
      }
      this.index += 1;
      this.timerId = setTimeout(step, this.stepMs);
    };

    step();
  }

  stop() {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    this.index = 0;
  }
}

const MENU_NOTES = [392, null, 523, 587, null, 523, 466, null];
const MATCH_NOTES = [220, 220, 330, 220, 262, 220, 330, 294];

export function createMenuMusic() {
  return new MusicLoop(MENU_NOTES, 260, { type: 'triangle', volume: 0.1 });
}

export function createMatchMusic() {
  return new MusicLoop(MATCH_NOTES, 180, { type: 'square', volume: 0.06 });
}
