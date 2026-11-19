
const SoundEngine = (() => {
    let ctx = null;
    let masterGain = null;

    // Сумісність зі старим налаштуванням звуку.
    const legacyMuted =
        localStorage.getItem('fbf_muted') === 'true';

    let musicMuted =
        localStorage.getItem('fbf_music_muted') === null
            ? legacyMuted
            : localStorage.getItem('fbf_music_muted') === 'true';

    let effectsMuted =
        localStorage.getItem('fbf_effects_muted') === null
            ? legacyMuted
            : localStorage.getItem('fbf_effects_muted') === 'true';

    let lastCoolingType = null;
    let hddActive = false;
    let ambientPending = false;

    const VOLUME = {
        ambient: 0.08,
        ambientDuck: 0.01,
        cooling: 0.20,
        hdd: 0.50,
        powerDown: 0.45
    };

    const sounds = {
        ambient: new Audio('assets/audio/ambient.mp3'),
        cooling: new Audio('assets/audio/fan-old.mp3'),
        hdd: new Audio('assets/audio/hdd.mp3'),
        powerDown: new Audio('assets/audio/power-down.mp3')
    };

    const fades = {};
    const POSITION_KEY = 'fbf_ambient_position';

    // Налаштування аудіофайлів.
    Object.entries(sounds).forEach(([name, audio]) => {
        audio.loop =
            name === 'ambient' ||
            name === 'cooling';

        audio.preload = 'auto';
        audio.volume = 0;
    });

    // Ініціалізація Web Audio API для звуків кнопок.
    function init() {
        if (!ctx) {
            const AudioCtx =
                window.AudioContext ||
                window.webkitAudioContext;

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

    // Плавна зміна гучності аудіофайлу.
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

            audio.volume = Math.max(
                0,
                Math.min(
                    1,
                    startVolume +
                    (target - startVolume) * progress
                )
            );

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

    // Миттєва зупинка звуку.
    function stopImmediately(name) {
        const audio = sounds[name];
        if (!audio) return;

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

    // Запуск аудіофайлу без дублювання відтворення.
    function playFile(name) {
        const audio = sounds[name];

        if (!audio) {
            return Promise.reject(
                new Error(`Audio file not found: ${name}`)
            );
        }

        if (!audio.paused) {
            return Promise.resolve();
        }

        return audio.play();
    }

    // Зменшуємо гучність фону під час демонстрацій.
    function updateAmbientVolume() {
        if (musicMuted || sounds.ambient.paused) return;

        const effectActive =
            !effectsMuted &&
            (lastCoolingType === 'old' || hddActive);

        const target = effectActive
            ? VOLUME.ambientDuck
            : VOLUME.ambient;

        fade('ambient', target, 600);
    }

    // Фоновий звук серверної.
    function playAmbient() {
        if (musicMuted || ambientPending) return;

        if (!sounds.ambient.paused) {
            updateAmbientVolume();
            return;
        }

        ambientPending = true;

        playFile('ambient')
            .then(() => {
                ambientPending = false;

                if (musicMuted) {
                    stopImmediately('ambient');
                    return;
                }

                updateAmbientVolume();
            })
            .catch(error => {
                ambientPending = false;

                // Браузер може блокувати autoplay.
                console.debug(
                    'Ambient waiting for interaction:',
                    error
                );
            });
    }

    // Звук старого кулера.
    function playCooling(type) {
        lastCoolingType = type;

        if (type === 'old' && !effectsMuted) {
            playFile('cooling')
                .then(() => {
                    if (
                        lastCoolingType === 'old' &&
                        !effectsMuted
                    ) {
                        fade(
                            'cooling',
                            VOLUME.cooling,
                            1300
                        );
                    } else {
                        stopImmediately('cooling');
                    }
                })
                .catch(error => {
                    console.debug(
                        'Cooling playback failed:',
                        error
                    );
                });
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

    // Звук жорсткого диска.
    function startHdd() {
        if (hddActive) return;

        hddActive = true;

        if (!effectsMuted) {
            stopImmediately('hdd');

            playFile('hdd')
                .then(() => {
                    if (hddActive && !effectsMuted) {
                        fade('hdd', VOLUME.hdd, 400);
                    } else {
                        stopImmediately('hdd');
                    }
                })
                .catch(error => {
                    console.debug(
                        'HDD playback failed:',
                        error
                    );
                });
        }

        updateAmbientVolume();
    }

    function stopHdd() {
        hddActive = false;
        fade('hdd', 0, 400, true);
        updateAmbientVolume();
    }

    // Окреме керування фоновою музикою.
    function setMusicMuted(muted) {
        musicMuted = Boolean(muted);

        localStorage.setItem(
            'fbf_music_muted',
            String(musicMuted)
        );

        if (musicMuted) {
            stopImmediately('ambient');
        } else {
            playAmbient();
        }

        notify();
        return musicMuted;
    }

    // Окреме керування звуковими ефектами.
    function setEffectsMuted(muted) {
        effectsMuted = Boolean(muted);

        localStorage.setItem(
            'fbf_effects_muted',
            String(effectsMuted)
        );

        if (masterGain && ctx) {
            masterGain.gain.setValueAtTime(
                effectsMuted ? 0 : 1,
                ctx.currentTime
            );
        }

        if (effectsMuted) {
            stopImmediately('cooling');
            stopImmediately('hdd');
            stopImmediately('powerDown');
        } else {
            init();

            if (lastCoolingType === 'old') {
                playCooling('old');
            }

            if (hddActive) {
                hddActive = false;
                startHdd();
            }
        }

        updateAmbientVolume();
        notify();

        return effectsMuted;
    }

    // Повідомлення інтерфейсу про зміну стану звуку.
    function notify() {
        window.dispatchEvent(
            new CustomEvent('fbf-mute-changed', {
                detail: {
                    musicMuted,
                    effectsMuted,
                    muted: musicMuted && effectsMuted
                }
            })
        );
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

    // Старий API для сумісності з іншими сторінками.
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

    // Генерація коротких звукових сигналів.
    function playTone(
        type,
        startFreq,
        endFreq,
        volume,
        duration
    ) {
        if (effectsMuted || !init()) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;

        osc.frequency.setValueAtTime(
            startFreq,
            ctx.currentTime
        );

        osc.frequency.exponentialRampToValueAtTime(
            endFreq,
            ctx.currentTime + duration
        );

        gain.gain.setValueAtTime(
            volume,
            ctx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + duration
        );

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start();
        osc.stop(ctx.currentTime + duration + 0.01);
    }

    // Звук натискання кнопок.
    function playClick() {
        playTone(
            'triangle',
            620,
            180,
            0.08,
            0.045
        );
    }

    // Залишено для сумісності.
    function playHddClick() {
        // HDD використовує реальний аудіозапис.
    }

    // Реальний звук вимкнення живлення.
    function playPowerDown() {
        if (effectsMuted) return;

        const audio = sounds.powerDown;

        // Скасовуємо попередній запуск.
        stopImmediately('powerDown');

        audio.volume = VOLUME.powerDown;

        playFile('powerDown')
            .catch(error => {
                console.warn(
                    'Power Down playback failed:',
                    error
                );
            });
    }

    // Зберігаємо позицію ambient між HTML-сторінками.
    function savePosition() {
        if (Number.isFinite(sounds.ambient.currentTime)) {
            sessionStorage.setItem(
                POSITION_KEY,
                String(sounds.ambient.currentTime)
            );
        }
    }

    sounds.ambient.addEventListener(
        'loadedmetadata',
        () => {
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
        }
    );

    sounds.ambient.addEventListener(
        'timeupdate',
        savePosition
    );

    window.addEventListener(
        'pagehide',
        savePosition
    );

    // Спроба автоматичного запуску фону.
    playAmbient();

    // Повторна спроба після взаємодії користувача.
    function unlockAudio() {
        if (!musicMuted && sounds.ambient.paused) {
            playAmbient();
        }

        if (!effectsMuted) {
            init();
        }
    }

    document.addEventListener(
        'pointerdown',
        unlockAudio
    );

    document.addEventListener('keydown', event => {
        if (
            !event.repeat &&
            (
                event.key === 'Enter' ||
                event.key === ' '
            )
        ) {
            unlockAudio();
        }
    });

    // Звуки натискання кнопок.
    document.addEventListener('click', event => {
        const target = event.target;

        if (
            target instanceof Element &&
            target.closest('button, a') &&
            !target.closest(
                '#global-mute-btn, ' +
                '#music-mute-btn, ' +
                '#effects-mute-btn'
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
