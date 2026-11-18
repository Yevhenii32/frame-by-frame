const SoundEngine = (() => {
    let ctx = null;
    let masterGain = null;
    let ambientOsc = null;
    let coolingOsc = null;
    let coolingGain = null;
    let lastCoolingType = null;
    let isMuted = localStorage.getItem('fbf_muted') === 'true';

    function init() {
        if (!ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return false;
            ctx = new AudioCtx();
            masterGain = ctx.createGain();
            masterGain.gain.value = isMuted ? 0 : 1;
            masterGain.connect(ctx.destination);
        }
        if (ctx && ctx.state === 'suspended' && !isMuted) {
            ctx.resume().catch(() => {});
        }
        return Boolean(ctx);
    }

    function stopCooling() {
        if (coolingOsc) {
            try { coolingOsc.stop(); } catch (e) {}
            coolingOsc = null;
            coolingGain = null;
        }
    }

    function setMuted(muteState) {
        isMuted = Boolean(muteState);
        localStorage.setItem('fbf_muted', String(isMuted));

        if (masterGain && ctx) {
            masterGain.gain.setValueAtTime(isMuted ? 0 : 1, ctx.currentTime);
        }
        if (isMuted) {
            if (ambientOsc) {
                try { ambientOsc.stop(); } catch (e) {}
                ambientOsc = null;
            }
            stopCooling();
        } else if (lastCoolingType) {
            playCooling(lastCoolingType);
        }

        window.dispatchEvent(new CustomEvent('fbf-mute-changed', { detail: { muted: isMuted } }));
        return isMuted;
    }

    function toggleMute() {
        init();
        const state = setMuted(!isMuted);
        if (!state) playClick();
        return state;
    }

    function getMuted() {
        return isMuted;
    }

    function playAmbient() {
        if (isMuted) return;
        init();
        if (!ctx || ambientOsc) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(58, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.025, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        ambientOsc = osc;
    }

    function playClick() {
        if (isMuted) return;
        init();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.045);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }

    function playHddClick() {
        if (isMuted) return;
        init();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1400 + Math.random() * 500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.022);

        gain.gain.setValueAtTime(0.045, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.022);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.025);
    }

    function playPowerDown() {
        if (isMuted) return;
        init();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.55);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.56);
    }

    function playCooling(type) {
        lastCoolingType = type;
        if (isMuted) {
            stopCooling();
            return true;
        }
        if (!init() || !ctx) return false;

        stopCooling();

        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        if (type === 'old') {
            // Гучний високочастотний гул старого кулера (5000 RPM)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(165, ctx.currentTime);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(620, ctx.currentTime);
            gain.gain.setValueAtTime(0.075, ctx.currentTime);
        } else {
            // Тихе м'яке шурхотіння помпи та СРО
            osc.type = 'sine';
            osc.frequency.setValueAtTime(68, ctx.currentTime);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(180, ctx.currentTime);
            gain.gain.setValueAtTime(0.028, ctx.currentTime);
        }

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        osc.start();

        coolingOsc = osc;
        coolingGain = gain;
        return true;
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('button, a') && !e.target.closest('#global-mute-btn')) {
            playClick();
        }
    });

    return {
        init,
        setMuted,
        toggleMute,
        getMuted,
        playAmbient,
        playClick,
        playHddClick,
        playPowerDown,
        playCooling
    };
})();