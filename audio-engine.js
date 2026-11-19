
const SoundEngine = (() => {
    let ctx = null;
    let masterGain = null;

    // Зберігаємо сумісність зі старим налаштуванням.
    const legacyMuted = localStorage.getItem('fbf_muted') === 'true';

    let musicMuted = localStorage.getItem('fbf_music_muted') === null
        ? legacyMuted
        : localStorage.getItem('fbf_music_muted') === 'true';

    let effectsMuted = localStorage.getItem('fbf_effects_muted') === null
        ? legacyMuted
        : localStorage.getItem('fbf_effects_muted') === 'true';

    let lastCoolingType = null;
    let hddActive = false;
    let ambientReady = false;
    let ambientPending = false;

    const VOLUME = {
        ambient: 0.08,
        ambientDuck: 0.01,
        cooling: 0.20,
        hdd: 0.50
    };

    const sounds = {
        ambient: new Audio('assets/audio/ambient.mp3'),
        cooling: new Audio('assets/audio/fan-old.mp3'),
        hdd: new Audio('assets/audio/hdd.mp3')
    };

    const fades = {};

    Object.values(sounds).forEach(audio => {
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0;
    });

    const POSITION_KEY = 'fbf_ambient_position';

    function init() {
        if (!ctx) {
            const AudioCtx =
                window.AudioContext || window.webkitAudioContext;

            if (!AudioCtx) return false;

            ctx = new AudioCtx();
            masterGain = ctx.createGain();
            masterGain.gain.value = effectsMuted ? 0 : 1;
            masterGain.connect(ctx.destination);
        }

        if (ctx.state === 'suspended' && !effectsMuted) {
            ctx.resume().catch(() => {});
        }

        return true;
    }

    function fade(name, target, duration = 500, pauseAfter = false) {
        const audio = sounds[name];
        if (!audio) return;

        if (fades[name] !== undefined) {
            cancelAnimationFrame(fades[name]);
            delete fades[name];
        }

        const startVolume = audio.volume;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min(
                (now - startTime) / Math.max(duration, 1),
                1
            );

            audio.volume = Math.max(0, Math.min(1,
                startVolume + (target - startVolume) * progress
            ));

            if (progress < 1) {
                fades[name] = requestAnimationFrame(step);
            } else {
                delete fades[name];

                if (pauseAfter && target === 0) {
                    audio.pause();
                    if (name !== 'ambient') {
                        audio.currentTime = 0;
                    }
                }
            }
        }

        fades[name] = requestAnimationFrame(step);
    }

    function stopImmediately(name) {
        const audio = sounds[name];

        if (fades[name] !== undefined) {
            cancelAnimationFrame(fades[name]);
            delete fades[name];
        }

        audio.pause();
        audio.volume = 0;

        if (name !== 'ambient') {
            audio.currentTime = 0;
        }
    }

    function playFile(name) {
        const audio = sounds[name];

        if (!audio.paused) {
            return Promise.resolve();
        }

        return audio.play();
    }

    function updateAmbientVolume() {
        if (musicMuted || sounds.ambient.paused) return;

        const effectActive =
            !effectsMuted &&
            (lastCoolingType === 'old' || hddActive);

        fade(
            'ambient',
            effectActive ? VOLUME.ambientDuck : VOLUME.ambient,
            600
        );
    }

    function playAmbient() {
        if (musicMuted || ambientPending) return;

        if (!sounds.ambient.paused) {
            ambientReady = true;
            updateAmbientVolume();
            return;
        }

        ambientPending = true;

        playFile('ambient')
            .then(() => {
                ambientPending = false;

                // Користувач міг вимкнути фон під час запуску.
                if (musicMuted) {
                    stopImmediately('ambient');
                    return;
                }

                ambientReady = true;
                updateAmbientVolume();
            })
            .catch(error => {
                ambientPending = false;
                ambientReady = false;

                // Autoplay може бути заблокований браузером.
                console.debug('Ambient waiting for interaction:', error);
            });
    }

    function playCooling(type) {
        lastCoolingType = type;

        if (type === 'old' && !effectsMuted) {
            playFile('cooling')
                .then(() => {
                    if (lastCoolingType === 'old' && !effectsMuted) {
                        fade('cooling', VOLUME.cooling, 1300);
                    } else {
                        stopImmediately('cooling');
                    }
                })
                .catch(error => console.debug(error));
        } else {
            fade('cooling', 0, 600, true);
        }

        updateAmbientVolume();
        return true;
    }

    function stopCooling() {
        lastCoolingType = null;
        fade('cooling', 0, 500, true);
        updateAmbientVolume();
    }

    function startHdd() {
        hddActive = true;

        if (!effectsMuted) {
            sounds.hdd.currentTime = 0;

            playFile('hdd')
                .then(() => {
                    if (hddActive && !effectsMuted) {
                        fade('hdd', VOLUME.hdd, 400);
                    } else {
                        stopImmediately('hdd');
                    }
                })
                .catch(error => console.debug(error));
        }

        updateAmbientVolume();
    }

    function stopHdd() {
        hddActive = false;
        fade('hdd', 0, 400, true);
        updateAmbientVolume();
    }

    function setMusicMuted(muted) {
        musicMuted = Boolean(muted);
        localStorage.setItem('fbf_music_muted', String(musicMuted));

        if (musicMuted) {
            stopImmediately('ambient');
            ambientReady = false;
        } else {
            playAmbient();
        }

        notify();
        return musicMuted;
    }

    function setEffectsMuted(muted) {
        effectsMuted = Boolean(muted);
        localStorage.setItem('fbf_effects_muted', String(effectsMuted));

        if (masterGain && ctx) {
            masterGain.gain.setValueAtTime(
                effectsMuted ? 0 : 1,
                ctx.currentTime
            );
        }

        if (effectsMuted) {
            stopImmediately('cooling');
            stopImmediately('hdd');
        } else {
            init();

            if (lastCoolingType === 'old') {
                playCooling('old');
            }

            if (hddActive) {
                startHdd();
            }
        }

        updateAmbientVolume();
        notify();
        return effectsMuted;
    }

    function notify() {
        window.dispatchEvent(new CustomEvent('fbf-mute-changed', {
            detail: {
                musicMuted,
                effectsMuted,
                muted: musicMuted && effectsMuted
            }
        }));
    }

    function toggleMusic() {
        return setMusicMuted(!musicMuted);
    }

    function toggleEffects() {
        return setEffectsMuted(!effectsMuted);
    }

    function getMusicMuted() {
        return musicMuted;
    }

    function getEffectsMuted() {
        return effectsMuted;
    }

    // Старий API залишено для сумісності.
    function getMuted() {
        return musicMuted && effectsMuted;
    }

    function setMuted(muted) {
        setMusicMuted(muted);
        setEffectsMuted(muted);
        return getMuted();
    }

    function toggleMute() {
        return setMuted(!getMuted());
    }

    function playTone(type, startFreq, endFreq, volume, duration) {
        if (effectsMuted || !init()) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
            endFreq,
            ctx.currentTime + duration
        );

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + duration
        );

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start();
        osc.stop(ctx.currentTime + duration + 0.01);
    }

    function playClick() {
        playTone('triangle', 620, 180, 0.08, 0.045);
    }

    function playHddClick() {
        // Реальний HDD-запис замінює синтезовані клацання.
    }

    function playPowerDown() {
        playTone('sawtooth', 240, 38, 0.1, 0.55);
    }

    // Позиція ambient між HTML-сторінками.
    function savePosition() {
        if (Number.isFinite(sounds.ambient.currentTime)) {
            sessionStorage.setItem(
                POSITION_KEY,
                String(sounds.ambient.currentTime)
            );
        }
    }

    sounds.ambient.addEventListener('loadedmetadata', () => {
        const position = Number(
            sessionStorage.getItem(POSITION_KEY)
        );

        if (
            Number.isFinite(position) &&
            position >= 0 &&
            position < sounds.ambient.duration
        ) {
            sounds.ambient.currentTime = position;
        }
    });

    sounds.ambient.addEventListener('timeupdate', savePosition);
    window.addEventListener('pagehide', savePosition);

    // Пробуємо відновити фон під час відкриття сторінки.
    // Якщо браузер заборонить autoplay, чекаємо взаємодії.
    playAmbient();

    function unlockAudio() {
        if (!musicMuted && sounds.ambient.paused) {
            playAmbient();
        }
    }

    document.addEventListener('pointerdown', unlockAudio);

    document.addEventListener('keydown', event => {
        if (!event.repeat && (
            event.key === 'Enter' ||
            event.key === ' '
        )) {
            unlockAudio();
        }
    });

    document.addEventListener('click', event => {
        const target = event.target;

        if (
            target instanceof Element &&
            target.closest('button, a') &&
            !target.closest(
                '#global-mute-btn, #music-mute-btn, #effects-mute-btn'
            )
        ) {
            playClick();
        }
    });

    return {
        init,
        getMuted,
        setMuted,
        toggleMute,
        getMusicMuted,
        getEffectsMuted,
        setMusicMuted,
        setEffectsMuted,
        toggleMusic,
        toggleEffects,
        playAmbient,
        playCooling,
        stopCooling,
        startHdd,
        stopHdd,
        playClick,
        playHddClick,
        playPowerDown
    };
})();
