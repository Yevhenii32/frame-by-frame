
const TourEngine = (() => {
    const SCENES = [
        {
            file: 'index.html',
            step: 'Сцена 01',
            title: 'Архітектура материнської плати',
            next: 'cpu.html',
            nextLabel: 'Далі: CPU'
        },
        {
            file: 'cpu.html',
            step: 'Сцена 02',
            title: 'Еволюція центрального процесора',
            next: 'cooling.html',
            nextLabel: 'Далі: Охолодження'
        },
        {
            file: 'cooling.html',
            step: 'Сцена 03',
            title: 'Теплові та звукові режими охолодження',
            next: 'gpu.html',
            nextLabel: 'Далі: GPU та RTX'
        },
        {
            file: 'gpu.html',
            step: 'Сцена 04',
            title: 'Графічний конвеєр та трасування променів',
            next: 'ram.html',
            nextLabel: 'Далі: RAM'
        },
        {
            file: 'ram.html',
            step: 'Сцена 05',
            title: 'Швидкість шин DDR та енергозалежність',
            next: 'storage.html',
            nextLabel: 'Далі: Накопичувачі'
        },
        {
            file: 'storage.html',
            step: 'Сцена 06',
            title: 'Механіка HDD проти флеш-пам’яті NVMe',
            next: 'index.html',
            nextLabel: 'Завершити огляд'
        }
    ];

    const currentFile =
        window.location.pathname.split('/').pop() || 'index.html';

    const currentScene =
        SCENES.find(scene => scene.file === currentFile) || SCENES[0];

    const PROGRESS_KEY = 'fbf_visited';

    let visited;

    try {
        visited = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');

        if (!Array.isArray(visited)) {
            visited = [];
        }
    } catch (error) {
        visited = [];
    }

    const chapterFiles = SCENES
        .filter(scene => scene.file !== 'index.html')
        .map(scene => scene.file);

    visited = [...new Set(visited)]
        .filter(file => chapterFiles.includes(file));

    if (chapterFiles.includes(currentFile) &&
        !visited.includes(currentFile)) {
        visited.push(currentFile);
    }

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(visited));

    function injectStyles() {
        const style = document.createElement('style');

        style.textContent = `
            /* ======================================
               TOUR ENGINE — FRAME BY FRAME
               ====================================== */

            .sidebar {
                display: flex;
                flex-direction: column;
            }

            /* Прогрес проходження */

            .progress-widget {
                margin-top: 24px;
                padding: 15px;
                background: #171d28;
                border: 1px solid #2b3544;
                border-radius: 5px;
            }
            /* Панель сценарію на всю робочу ширину */

.has-scenario-bar {
    flex-wrap: wrap;
    align-content: flex-start;
}

.has-scenario-bar > .scenario-bar {
    flex: 0 0 100%;
    width: 100%;
    margin-bottom: 0;
}

.has-scenario-bar > .center-panel,
.has-scenario-bar > .left-panel {
    flex: 1 1 0;
    min-width: 0;
}

.has-scenario-bar > .right-panel {
    flex: 0 0 305px;
    width: 305px;
    padding-top: 0;
}

@media (max-width: 1150px) {
    .has-scenario-bar > .center-panel,
    .has-scenario-bar > .left-panel,
    .has-scenario-bar > .right-panel {
        flex: 0 0 100%;
        width: 100%;
    }
}
            .progress-widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
            }

            .progress-widget-title {
                color: #9ba8bb;
                font-size: 11px;
            }

            .progress-widget-count {
                color: #e9edf4;
                font: 600 12px Consolas, monospace;
            }

            .progress-bar-mini {
                width: 100%;
                height: 5px;
                overflow: hidden;
                background: #293548;
                border-radius: 3px;
            }

            .progress-fill-mini {
                height: 100%;
                background: #4d91e8;
                border-radius: inherit;
                transition: width 0.4s ease;
            }

            .progress-widget-caption {
                margin-top: 10px;
                color: #8190a5;
                font-size: 10px;
                line-height: 1.5;
            }

            /* Кнопка паспорта */

            .team-btn {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                width: 100%;
                margin-top: 12px;
                padding: 13px 14px;
                background: transparent;
                border: 1px solid #344153;
                border-radius: 5px;
                color: #cbd5e1;
                cursor: pointer;
                text-align: left;
                font-size: 12px;
                font-weight: 600;
                transition: background 0.2s, border-color 0.2s;
            }

            .team-btn:hover {
                background: #202a39;
                border-color: #4d91e8;
                color: #f1f5f9;
            }

            .team-btn-arrow {
                color: #7caeea;
                font: 16px Consolas, monospace;
            }

            /* Верхня панель сценарію */

            .scenario-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                width: 100%;
                margin-bottom: 26px;
                padding: 13px 17px;
                background: #171d28;
                border: 1px solid #2b3544;
                border-left: 3px solid #4d91e8;
                border-radius: 5px;
            }

            .scenario-info {
                display: flex;
                flex-direction: column;
                gap: 5px;
                min-width: 0;
            }

            .scenario-step {
                color: #7caeea;
                font: 600 10px Consolas, monospace;
                letter-spacing: 1px;
                text-transform: uppercase;
            }

            .scenario-title {
                color: #dbe3ee;
                font-size: 12px;
                line-height: 1.5;
            }

            .scenario-actions {
                display: flex;
                align-items: center;
                gap: 9px;
                flex-shrink: 0;
            }

            .scenario-mute-btn {
                padding: 10px 12px;
                background: #101722;
                border: 1px solid #344153;
                border-radius: 4px;
                color: #cbd5e1;
                font-size: 11px;
                cursor: pointer;
                white-space: nowrap;
            }

            .scenario-mute-btn:hover {
                background: #202a39;
            }

            .scenario-next-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                padding: 10px 14px;
                background: #315d91;
                border: 1px solid #4779b3;
                border-radius: 4px;
                color: #f1f5f9;
                text-decoration: none;
                font-size: 11px;
                font-weight: 600;
                white-space: nowrap;
                transition: background 0.2s;
            }

            .scenario-next-btn:hover {
                background: #3b70aa;
            }

            /* Модальне вікно паспорта */

            .modal-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(5, 9, 16, 0.88);
                backdrop-filter: blur(5px);
            }

            .modal-backdrop.open {
                display: flex;
            }

            .modal-card {
                width: 100%;
                max-width: 720px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 28px;
                background: #141b26;
                border: 1px solid #344153;
                border-radius: 7px;
                color: #e9edf4;
                box-shadow: 0 25px 65px rgba(0, 0, 0, 0.45);
            }

            .modal-top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 20px;
            }

            .modal-eyebrow {
                margin-bottom: 10px;
                color: #7caeea;
                font: 11px Consolas, monospace;
                letter-spacing: 1.3px;
            }

            .modal-title {
                margin: 0;
                color: #f1f5f9;
                font-size: 27px;
                font-weight: 650;
                letter-spacing: -0.7px;
            }

            .modal-close {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                width: 34px;
                height: 34px;
                background: #202a39;
                border: 1px solid #344153;
                border-radius: 4px;
                color: #cbd5e1;
                font-size: 19px;
                cursor: pointer;
            }

            .modal-close:hover {
                background: #2c394b;
                color: white;
            }

            .modal-description {
                margin: 16px 0 24px;
                max-width: 620px;
                color: #aab8ca;
                font-size: 13px;
                line-height: 1.75;
            }

            .modal-section-label {
                margin-bottom: 12px;
                color: #8190a5;
                font: 10px Consolas, monospace;
                letter-spacing: 1.2px;
            }

            /* Команда */

            .role-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px;
                margin-bottom: 25px;
            }

            .role-box {
                padding: 18px;
                background: #101722;
                border: 1px solid #2b3544;
                border-radius: 5px;
            }

            .role-number {
                display: block;
                margin-bottom: 15px;
                color: #7caeea;
                font: 11px Consolas, monospace;
            }

            .role-name {
                margin-bottom: 8px;
                color: #e9edf4;
                font-size: 16px;
                font-weight: 600;
            }

            .role-title {
                margin-bottom: 15px;
                color: #9ba8bb;
                font-size: 11px;
                line-height: 1.5;
            }

            .role-list {
                margin: 0;
                padding-left: 17px;
                color: #acb9ca;
                font-size: 12px;
                line-height: 1.85;
            }

            .role-list li {
                margin-bottom: 4px;
            }

            /* Технології */

            .project-tech {
                margin-bottom: 22px;
                padding: 17px;
                background: #101722;
                border: 1px solid #2b3544;
                border-radius: 5px;
            }

            .tech-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 7px;
            }

            .tech-tag {
                padding: 7px 10px;
                background: #202a39;
                border: 1px solid #344153;
                border-radius: 3px;
                color: #b8c7da;
                font: 11px Consolas, monospace;
            }

            .project-tech-note {
                margin: 14px 0 0;
                color: #9ba8bb;
                font-size: 12px;
                line-height: 1.65;
            }

            /* Складові мультимедіа */

            .multimedia-list {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
                margin-bottom: 24px;
            }

            .multimedia-item {
                padding: 12px 14px;
                background: #171d28;
                border: 1px solid #2b3544;
                border-radius: 4px;
            }

            .multimedia-item strong {
                display: block;
                margin-bottom: 5px;
                color: #e9edf4;
                font-size: 12px;
            }

            .multimedia-item span {
                color: #9ba8bb;
                font-size: 11px;
                line-height: 1.6;
            }

            /* Кнопки паспорта */

            .modal-actions {
                display: flex;
                justify-content: flex-end;
                flex-wrap: wrap;
                gap: 10px;
                padding-top: 18px;
                border-top: 1px solid #2b3544;
            }

            .modal-secondary-btn,
            .modal-primary-btn {
                padding: 11px 15px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }

            .modal-secondary-btn {
                background: transparent;
                border: 1px solid #475569;
                color: #aab8ca;
            }

            .modal-secondary-btn:hover {
                background: #202a39;
            }

            .modal-primary-btn {
                background: #315d91;
                border: 1px solid #4779b3;
                color: white;
                font-weight: 600;
            }

            .modal-primary-btn:hover {
                background: #3b70aa;
            }

            /* Доступність */

            .team-btn:focus-visible,
            .scenario-mute-btn:focus-visible,
            .scenario-next-btn:focus-visible,
            .modal-close:focus-visible,
            .modal-secondary-btn:focus-visible,
            .modal-primary-btn:focus-visible {
                outline: 2px solid #7caeea;
                outline-offset: 3px;
            }

            /* Адаптивність */

            @media (max-width: 900px) {
                .scenario-bar {
                    flex-direction: column;
                    align-items: stretch;
                }

                .scenario-actions {
                    justify-content: space-between;
                }
            }

            @media (max-width: 600px) {
                .scenario-actions {
                    flex-direction: column;
                    align-items: stretch;
                }

                .scenario-next-btn {
                    white-space: normal;
                }

                .modal-card {
                    padding: 20px;
                }

                .modal-title {
                    font-size: 23px;
                }

                .role-grid,
                .multimedia-list {
                    grid-template-columns: 1fr;
                }

                .modal-actions {
                    flex-direction: column;
                }

                .modal-actions button {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function renderUI() {
        const sidebar = document.querySelector('.sidebar');

        if (sidebar) {
            const count = visited.length;
            const pct = Math.round((count / chapterFiles.length) * 100);

            const progress = document.createElement('div');
            progress.className = 'progress-widget';

            progress.innerHTML = `
                <div class="progress-widget-header">
                    <span class="progress-widget-title">
                        Прогрес сценарію
                    </span>

                    <strong class="progress-widget-count">
                        ${count} / ${chapterFiles.length}
                    </strong>
                </div>

                <div class="progress-bar-mini"
                     role="progressbar"
                     aria-label="Прогрес проходження розділів"
                     aria-valuemin="0"
                     aria-valuemax="100"
                     aria-valuenow="${pct}">
                    <div class="progress-fill-mini"
                         style="width:${pct}%">
                    </div>
                </div>

                <div class="progress-widget-caption">
                    Відвідано ${count} із ${chapterFiles.length}
                    тематичних розділів
                </div>
            `;

            sidebar.appendChild(progress);

            const teamBtn = document.createElement('button');
            teamBtn.type = 'button';
            teamBtn.className = 'team-btn';

            teamBtn.innerHTML = `
                <span>Паспорт проєкту та команда</span>
                <span class="team-btn-arrow">↗</span>
            `;

            sidebar.appendChild(teamBtn);

            teamBtn.addEventListener('click', openModal);
        }

        // Панель сценарію

        const container = document.querySelector(
            '.main-content, .cpu-dashboard, .gpu-dashboard, ' +
            '.cooling-dashboard, .ram-dashboard, .storage-dashboard'
        );

        if (container) {
            const bar = document.createElement('div');
            bar.className = 'scenario-bar';

            bar.innerHTML = `
                <div class="scenario-info">
                    <span class="scenario-step">
                        ${currentScene.step}
                    </span>

                    <span class="scenario-title">
                        ${currentScene.title}
                    </span>
                </div>

                <div class="scenario-actions">

                <button type="button"
                        id="music-mute-btn"
                        class="scenario-mute-btn"
                        aria-label="Увімкнути або вимкнути фонову музику">
                    🎵 Фон: Увімк.
                </button>

                <button type="button"
                        id="effects-mute-btn"
                        class="scenario-mute-btn"
                        aria-label="Увімкнути або вимкнути звукові ефекти">
                    🔊 Ефекти: Увімк.
                </button>


                    <a href="${currentScene.next}"
                       class="scenario-next-btn">
                        ${currentScene.nextLabel}
                        <span aria-hidden="true">→</span>
                    </a>
                </div>
            `;

            // Панель сценарію над обома колонками
            container.insertBefore(bar, container.firstChild);

            // Для внутрішніх сторінок розміщуємо
            // панель окремим рядком flex-контейнера
            if (!container.classList.contains('main-content')) {
                container.classList.add('has-scenario-bar');
            }

            // Незалежне керування фоном і звуковими ефектами.

            const musicBtn = bar.querySelector('#music-mute-btn');
            const effectsBtn = bar.querySelector('#effects-mute-btn');

            function updateAudioButtons() {
                if (typeof SoundEngine === 'undefined') return;

                const musicMuted = SoundEngine.getMusicMuted();
                const effectsMuted = SoundEngine.getEffectsMuted();

                musicBtn.textContent = musicMuted
                    ? '🎵 Фон: Вимк.'
                    : '🎵 Фон: Увімк.';

                effectsBtn.textContent = effectsMuted
                    ? '🔇 Ефекти: Вимк.'
                    : '🔊 Ефекти: Увімк.';

                musicBtn.setAttribute('aria-pressed', String(!musicMuted));
                effectsBtn.setAttribute('aria-pressed', String(!effectsMuted));

                musicBtn.style.borderColor = musicMuted
                    ? '#8b4444'
                    : '#4779b3';

                effectsBtn.style.borderColor = effectsMuted
                    ? '#8b4444'
                    : '#4779b3';

                musicBtn.style.color = musicMuted
                    ? '#e6a3a3'
                    : '#cbd5e1';

                effectsBtn.style.color = effectsMuted
                    ? '#e6a3a3'
                    : '#cbd5e1';
            }

            musicBtn.addEventListener('click', () => {
                SoundEngine.toggleMusic();
                updateAudioButtons();
            });

            effectsBtn.addEventListener('click', () => {
                SoundEngine.toggleEffects();
                updateAudioButtons();
            });

            window.addEventListener(
                'fbf-mute-changed',
                updateAudioButtons
            );

            updateAudioButtons();

        }

        // Паспорт проєкту

        const modal = document.createElement('div');
        modal.id = 'team-modal';
        modal.className = 'modal-backdrop';

        modal.innerHTML = `
            <div class="modal-card"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="team-modal-title"
                 tabindex="-1">

                <div class="modal-top">
                    <div>
                        <div class="modal-eyebrow">
                            FRAME BY FRAME / ПРО ПРОЄКТ
                        </div>

                        <h2 id="team-modal-title"
                            class="modal-title">
                            Паспорт проєкту
                        </h2>
                    </div>

                    <button type="button"
                            id="close-team-modal"
                            class="modal-close"
                            aria-label="Закрити паспорт">
                        ×
                    </button>
                </div>

                <p class="modal-description">
                    <strong>Frame by Frame</strong> — інтерактивний
                    мультимедійний довідник, присвячений будові
                    комп'ютера та принципам роботи його компонентів.
                    Проєкт поєднує текстові пояснення, графіку,
                    Canvas-анімації, звуковий супровід і навчальні
                    симуляції.
                </p>

                <div class="modal-section-label">
                    01 / КОМАНДА ПРОЄКТУ
                </div>

                <div class="role-grid">
                    <div class="role-box">
                        <span class="role-number">УЧАСНИК 01</span>

                        <div class="role-name">
                            Євгеній Коваленко
                        </div>

                        <div class="role-title">
                            Архітектура та програмна реалізація
                        </div>

                        <ul class="role-list">
                            <li>Архітектура вебдодатка та верстка</li>
                            <li>Інтерактивні симуляції JavaScript / Canvas</li>
                            <li>Web Audio API та доступність інтерфейсу</li>
                        </ul>
                    </div>

                    <div class="role-box">
                        <span class="role-number">УЧАСНИК 02</span>

                        <div class="role-name">
                            Василь Апостолов
                        </div>

                        <div class="role-title">
                            Візуальний дизайн і мультимедіа
                        </div>

                        <ul class="role-list">
                            <li>Візуальний дизайн і графіка компонентів</li>
                            <li>Моушн-анімація та відеомонтаж</li>
                            <li>Звуковий супровід і саунд-дизайн</li>
                        </ul>
                    </div>
                </div>

                <div class="modal-section-label">
                    02 / ТЕХНОЛОГІЇ
                </div>

                <div class="project-tech">
                    <div class="tech-tags">
                        <span class="tech-tag">HTML5</span>
                        <span class="tech-tag">CSS3</span>
                        <span class="tech-tag">JavaScript</span>
                        <span class="tech-tag">Canvas API</span>
                        <span class="tech-tag">Web Audio API</span>
                        <span class="tech-tag">Responsive UI</span>
                    </div>

                    <p class="project-tech-note">
                        Шість взаємопов'язаних сцен із навігацією,
                        інтерактивними елементами, візуальними
                        поясненнями та можливістю проходження
                        за сценарієм.
                    </p>
                </div>

                <div class="modal-section-label">
                    03 / МУЛЬТИМЕДІЙНІ СКЛАДОВІ
                </div>

                <div class="multimedia-list">
                    <div class="multimedia-item">
                        <strong>Графіка</strong>
                        <span>
                            Карта материнської плати,
                            схеми та візуалізації компонентів
                        </span>
                    </div>

                    <div class="multimedia-item">
                        <strong>Анімація</strong>
                        <span>
                            Еволюція CPU, охолодження,
                            передавання даних і робота накопичувачів
                        </span>
                    </div>

                    <div class="multimedia-item">
                        <strong>Звук</strong>
                        <span>
                            Звукові ефекти охолодження,
                            накопичувачів та керування звуком
                        </span>
                    </div>

                    <div class="multimedia-item">
                        <strong>Відео</strong>
                        <span>
                            Оглядові відеоматеріали
                            мультимедійного проєкту
                        </span>
                    </div>

                    <div class="multimedia-item">
                        <strong>Текст</strong>
                        <span>
                            Характеристики, описи архітектур,
                            пояснення та текстовий супровід
                        </span>
                    </div>

                    <div class="multimedia-item">
                        <strong>Інтерактивність</strong>
                        <span>
                            Таймлайн CPU, перемикач RTX,
                            порівняння DDR та тест HDD/SSD
                        </span>
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button"
                            id="reset-progress-btn"
                            class="modal-secondary-btn">
                        Скинути прогрес
                    </button>

                    <button type="button"
                            id="start-tour-btn"
                            class="modal-primary-btn">
                        Почати огляд →
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = document.getElementById('close-team-modal');
        const startBtn = document.getElementById('start-tour-btn');
        const resetBtn = document.getElementById('reset-progress-btn');

        closeBtn.addEventListener('click', closeModal);

        startBtn.addEventListener('click', () => {
            closeModal();
            window.location.href = 'index.html';
        });

        resetBtn.addEventListener('click', () => {
            localStorage.removeItem(PROGRESS_KEY);
            window.location.href = 'index.html';
        });

        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', event => {
            if (!modal.classList.contains('open')) {
                return;
            }

            if (event.key === 'Escape') {
                closeModal();
            }

            if (event.key === 'Tab') {
                const focusable = Array.from(
                    modal.querySelectorAll(
                        'button:not(:disabled), a[href]'
                    )
                );

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (event.shiftKey &&
                    document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey &&
                           document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }

    let previousFocus = null;

    function openModal() {
        const modal = document.getElementById('team-modal');

        if (!modal) {
            return;
        }

        previousFocus = document.activeElement;
        modal.classList.add('open');

        document.body.style.overflow = 'hidden';

        const closeBtn = document.getElementById('close-team-modal');
        closeBtn.focus();
    }

    function closeModal() {
        const modal = document.getElementById('team-modal');

        if (!modal) {
            return;
        }

        modal.classList.remove('open');
        document.body.style.overflow = '';

        if (previousFocus &&
            typeof previousFocus.focus === 'function') {
            previousFocus.focus();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        renderUI();
    });

    return {
        openModal,
        closeModal
    };
})();
