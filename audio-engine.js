// audio-engine.js
const SoundEngine = (() => {
    let ctx = null;
    let activeNodes = [];
    let isMuted = localStorage.getItem('fbf_muted') === 'true';
  
    function init() {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    }
  
    function stopAll() {
      activeNodes.forEach(node => {
        try { node.stop(); } catch (e) {}
        try { node.disconnect(); } catch (e) {}
      });
      activeNodes = [];
    }
  
    function setMuted(mute) {
      isMuted = mute;
      localStorage.setItem('fbf_muted', String(mute));
      if (isMuted) stopAll();
      return isMuted;
    }
  
    function getMuted() {
      return isMuted;
    }
  
    // Генератор білого/рожевого шуму для потоку повітря
    function createNoiseBuffer(duration = 2) {
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.05;
      }
      return buffer;
    }
  
    // 1. Головна сторінка: легкий фоновий ембієнт ПК
    function playAmbient() {
      stopAll();
      if (isMuted || !init()) return true;
  
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 62; // Низьке гудіння блока живлення
      gain.gain.value = 0.03;
  
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      activeNodes.push(osc, gain);
      return true;
    }
  
    // 2. Охолодження: кулер 1998 (5000 RPM) або водянка 2024
    function playCooling(mode) {
      stopAll();
      if (isMuted) return true;
      if (!init()) return false;
  
      if (mode === '1998') {
        // Високочастотний гул підшипника + потік повітря
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const oscGain = ctx.createGain();
  
        osc1.type = 'sawtooth';
        osc1.frequency.value = 166; // ~5000 RPM гармоніка
        osc2.type = 'triangle';
        osc2.frequency.value = 334;
        oscGain.gain.value = 0.035;
  
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer();
        noise.loop = true;
  
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 950;
        filter.Q.value = 1.2;
  
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.18;
  
        osc1.connect(oscGain);
        osc2.connect(oscGain);
        oscGain.connect(ctx.destination);
  
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
  
        osc1.start();
        osc2.start();
        noise.start();
        activeNodes.push(osc1, osc2, oscGain, noise, filter, noiseGain);
      } else {
        // Водяне охолодження 2024: тихий шелест помпи
        const pump = ctx.createOscillator();
        const pumpGain = ctx.createGain();
        pump.type = 'sine';
        pump.frequency.value = 88;
        pumpGain.gain.value = 0.015;
  
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer();
        noise.loop = true;
  
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 280;
  
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.04;
  
        pump.connect(pumpGain);
        pumpGain.connect(ctx.destination);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
  
        pump.start();
        noise.start();
        activeNodes.push(pump, pumpGain, noise, filter, noiseGain);
      }
      return true;
    }
  
    // 3. Накопичувачі: коротке потріскування голки HDD при читанні
    function playHddClick() {
      if (isMuted || !init()) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140 + Math.random() * 180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.025);
  
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
  
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    }
  
    return { playAmbient, playCooling, playHddClick, stopAll, setMuted, getMuted };
  })();