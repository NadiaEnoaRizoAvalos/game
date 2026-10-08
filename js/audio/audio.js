"use strict";

/** Sonidos sintetizados con WebAudio; no necesita archivos externos. */
(() => {
  'use strict';

  const Game = window.RainGame;
  const AudioFX = {
    enabled: false,
    context: null,
    rain: null,
    rainGain: null,
    /** Prepara el contexto de audio después de un gesto del jugador. */
    init() {
      if (!this.context) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          this.context = new AC();
        }
      }
      this.context?.resume().catch(() => {});
    },
    /** Sintetiza una nota breve con frecuencia, duración y volumen. */
    tone(freq = 500, duration = .12, type = 'sine', volume = .05) {
      if (!this.enabled || !this.context) {
        return;
      }
      const a = this.context;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq * .7, a.currentTime + duration);
      g.gain.setValueAtTime(volume, a.currentTime);
      g.gain.exponentialRampToValueAtTime(.001, a.currentTime + duration);
      o.connect(g).connect(a.destination);
      o.start();
      o.stop(a.currentTime + duration);
    },
    /** Genera ruido filtrado para lluvia o trueno. */
    noise(duration, volume) {
      if (!this.enabled || !this.context) {
        return;
      }
      const a = this.context;
      const b = a.createBuffer(1, a.sampleRate * duration, a.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      }
      const s = a.createBufferSource();
      const f = a.createBiquadFilter();
      const g = a.createGain();
      s.buffer = b;
      f.type = 'lowpass';
      f.frequency.value = 380;
      g.gain.value = volume;
      s.connect(f).connect(g).connect(a.destination);
      s.start();
    },
    /** Ajusta el volumen de la lluvia continua según su intensidad. */
    weather(intensity) {
      if (!this.context) {
        return;
      }
      if (intensity > 0 && this.enabled && !this.rain) {
        const a = this.context;
        const b = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) {
          d[i] = Math.random() * 2 - 1;
        }
        this.rain = a.createBufferSource();
        this.rain.buffer = b;
        this.rain.loop = true;
        this.rainGain = a.createGain();
        const f = a.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 1600;
        this.rain.connect(f).connect(this.rainGain).connect(a.destination);
        this.rain.start();
      }
      if (this.rainGain) {
        this.rainGain.gain.setTargetAtTime(this.enabled ? intensity * .045 : 0, this.context.currentTime, .1);
      }
    },
    /** Detiene la fuente de lluvia y libera sus referencias. */
    stop() {
      if (this.rain) {
        this.rain.stop();
        this.rain = null;
        this.rainGain = null;
      }
    },
    /** Selecciona el sonido de feedback por su nombre. */
    play(name) {
      if (name === 'collect') {
        this.tone(720);
      }
      if (name === 'full') {
        this.tone(180, .22, 'triangle');
      }
      if (name === 'deposit') {
        this.tone(650, .2);
        setTimeout(() => this.tone(980, .2), 100);
      }
      if (name === 'thunder') {
        this.noise(1.3, .3);
      }
      if (name === 'rain') {
        this.noise(.6, .08);
      }
      if (name === 'lightning') {
        this.tone(90, .15, 'sawtooth', .025);
      }
      if (name === 'finish') {
        [440, 550, 660, 880].forEach((v, i) => setTimeout(() => this.tone(v, .2), i * 120));
      }
    }
  };
  Game.audio = AudioFX;
})();
