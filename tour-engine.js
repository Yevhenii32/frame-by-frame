const TourEngine = (() => {
    const SCENES = [
        { file: 'index.html', step: 'Сцена 01', title: 'Архітектура материнської плати', next: 'cpu.html', nextLabel: 'Далі: Сцена 02 (CPU) →' },
        { file: 'cpu.html', step: 'Сцена 02', title: 'Еволюція центрального процесора', next: 'cooling.html', nextLabel: 'Далі: Сцена 03 (Охолодження) →' },
        { file: 'cooling.html', step: 'Сцена 03', title: 'Теплові та звукові режими охолодження', next: 'gpu.html', nextLabel: 'Далі: Сцена 04 (GPU та RTX) →' },
        { file: 'gpu.html', step: 'Сцена 04', title: 'Графічний конвеєр та трасування променів', next: 'ram.html', nextLabel: 'Далі: Сцена 05 (Оперативна пам\'ять) →' },
        { file: 'ram.html', step: 'Сцена 05', title: 'Швидкість шин DDR та енергозалежність', next: 'storage.html', nextLabel: 'Далі: Сцена 06 (Накопичувачі) →' },
        { file: 'storage.html', step: 'Сцена 06', title: 'Механіка HDD проти флеш-пам\'яті NVMe', next: 'index.html', nextLabel: 'Завершити огляд системи ✓' }
    ];

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const currentScene = SCENES.find(s => s.file === currentFile) || SCENES[0];

    // Відстеження прогресу
    let visited = JSON.parse(localStorage.getItem('fbf_visited') || '[]');
    if (currentFile !== 'index.html' && !visited.includes(currentFile)) {
        visited.push(currentFile);
        localStorage.setItem('fbf_visited', JSON.stringify(visited));
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .team-btn {
                margin-top: auto;
                padding: 10px 14px;
                background: rgba(59, 130, 246, 0.12);
                border: 1px solid #3b82f6;
                color: #93c5fd;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                text-align: left;
                transition: 0.2s;
            }
            .team-btn:hover { background: #2563eb; color: #fff; }
            .progress-widget {
                background: #1e293b;
                padding: 12px;
                border-radius: 8px;
                margin-top: 12px;
                border: 1px solid #334155;
            }
            .progress-bar-mini {
                height: 6px;
                background: #0f172a;
                border-radius: 3px;
                overflow: hidden;
                margin-top: 8px;
            }
            .progress-fill-mini {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #10b981);
                transition: width 0.4s ease;
            }
            .scenario-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid #334155;
                border-left: 4px solid #38bdf8;
                padding: 10px 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                gap: 12px;
            }
            .scenario-next-btn {
                background: #2563eb;
                color: #fff;
                text-decoration: none;
                padding: 8px 14px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 600;
                white-space: nowrap;
                transition: 0.2s;
            }
            .scenario-next-btn:hover { background: #1d4ed8; }
            .modal-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(2, 6, 23, 0.82);
                backdrop-filter: blur(4px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 20px;
            }
            .modal-backdrop.open { display: flex; }
            .modal-card {
                background: #0f172a;
                border: 1px solid #334155;
                border-radius: 12px;
                max-width: 680px;
                width: 100%;
                padding: 28px;
                color: #f8fafc;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
            }
            .role-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 14px;
                margin: 18px 0;
            }
            .role-box {
                background: #1e293b;
                padding: 14px;
                border-radius: 8px;
                border-top: 3px solid #3b82f6;
            }
        `;
        document.head.appendChild(style);
    }

    function renderUI() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            const count = visited.length;
            const pct = Math.round((count / 5) * 100);

            const prog = document.createElement('div');
            prog.className = 'progress-widget';
            prog.innerHTML = `
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#94a3b8;">
                    <span>Прогрес сценарію</span>
                    <strong style="color:#10b981;">${count} / 5</strong>
                </div>
                <div class="progress-bar-mini">
                    <div class="progress-fill-mini" style="width:${pct}%"></div>
                </div>
            `;
            sidebar.appendChild(prog);

            const teamBtn = document.createElement('button');
            teamBtn.type = 'button';
            teamBtn.className = 'team-btn';
            teamBtn.textContent = 'Паспорт проєкту та команда';
            teamBtn.onclick = () => document.getElementById('team-modal').classList.add('open');
            sidebar.appendChild(teamBtn);
        }

        // Додаємо плашку поточного кроку сценарію у робочу область
        const container = document.querySelector('.main-content, .cpu-dashboard, .gpu-dashboard, .cooling-dashboard, .ram-dashboard, .storage-dashboard');
        if (container) {
            const bar = document.createElement('div');
            bar.className = 'scenario-bar';
            bar.innerHTML = `
                <div style="font-size:13px; color:#cbd5e1;">
                    <span style="color:#38bdf8; font-weight:bold; text-transform:uppercase; margin-right:8px;">${currentScene.step}</span>
                    ${currentScene.title}
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button type="button" id="global-mute-btn" style="background:#1e293b; border:1px solid #334155; color:#e2e8f0; padding:7px 12px; border-radius:6px; cursor:pointer; font-size:12px; transition:0.2s;">
                        🔊 Звук: Увімк.
                    </button>
                    <a href="${currentScene.next}" class="scenario-next-btn">${currentScene.nextLabel}</a>
                </div>
            `;
            if (container.classList.contains('main-content')) {
                container.insertBefore(bar, container.firstChild);
            } else {
                const center = container.querySelector('.center-panel, .left-panel');
                if (center) center.insertBefore(bar, center.firstChild);
            }

            const gMute = bar.querySelector('#global-mute-btn');
            if (gMute) {
                const updateMuteButton = () => {
                    const isMuted = (typeof SoundEngine !== 'undefined')
                        ? SoundEngine.getMuted()
                        : localStorage.getItem('fbf_muted') === 'true';
                    gMute.textContent = isMuted ? '🔇 Звук: Вимк.' : '🔊 Звук: Увімк.';
                    gMute.style.borderColor = isMuted ? '#ef4444' : '#334155';
                    gMute.style.color = isMuted ? '#fca5a5' : '#e2e8f0';
                };
                updateMuteButton();

                gMute.onclick = (e) => {
                    e.stopPropagation();
                    if (typeof SoundEngine !== 'undefined') {
                        SoundEngine.toggleMute();
                    } else {
                        const next = !(localStorage.getItem('fbf_muted') === 'true');
                        localStorage.setItem('fbf_muted', String(next));
                        window.dispatchEvent(new CustomEvent('fbf-mute-changed', { detail: { muted: next } }));
                    }
                    updateMuteButton();
                };
            }
        }

        // Модальне вікно паспорта проєкту 
        const modal = document.createElement('div');
        modal.id = 'team-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2 style="margin:0; font-size:20px;">Frame by Frame — Мультимедійний довідник ПК</h2>
                    <button type="button" id="close-team-modal" style="background:none; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">✕</button>
                </div>
                <p style="color:#94a3b8; font-size:14px; line-height:1.5; margin-top:10px;">
                    Інтерактивний освітній вебпроєкт, що демонструє еволюцію та принципи роботи апаратних компонентів комп'ютера через поєднання графіки, анімації, звуку, тексту, відео та інтерактивних симуляцій.
                </p>
                <div class="role-grid">
                    <div class="role-box">
                        <div style="font-weight:bold; color:#38bdf8; margin-bottom:6px;">Євгеній Коваленко</div>
                        <div style="font-size:12px; color:#cbd5e1; line-height:1.4;">
                            - Архітектура вебдодатка та верстка<br>
                            - Інтерактивні симуляції (JS / Canvas)<br>
                            - Web Audio API та інклюзивність (WCAG)
                        </div>
                    </div>
                    <div class="role-box" style="border-top-color:#10b981;">
                        <div style="font-weight:bold; color:#10b981; margin-bottom:6px;">Василь Апостолов</div>
                        <div style="font-size:12px; color:#cbd5e1; line-height:1.4;">
                            - Візуальний дизайн та графіка компонентів<br>
                            - Моушн-анімація та відеомонтаж<br>
                            - Звуковий супровід та саунд-дизайн
                        </div>
                    </div>
                </div>
                <div style="background:#1e293b; padding:12px; border-radius:8px; font-size:12px; color:#94a3b8;">
                    <strong style="color:#e2e8f0;">Складові мультимедіа в проєкті:</strong> Графіка (карта плати, схеми кристалів), Анімація (еволюція CPU, потоки даних), Звук (ембієнт, охолодження, HDD), Відео (оглядовий ролик), Текст (телеметрія та транскрипти), Інтерактив (таймлайн, RTX-перемикач, бенчмарк).
                </div>
                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:18px;">
                    <button type="button" id="reset-progress-btn" style="padding:8px 14px; background:transparent; border:1px solid #475569; color:#94a3b8; border-radius:6px; cursor:pointer; font-size:13px;">Скинути прогрес</button>
                    <button type="button" id="start-tour-btn" style="padding:8px 18px; background:#2563eb; border:none; color:#fff; border-radius:6px; cursor:pointer; font-weight:bold; font-size:13px;">Почати демонстрацію за сценарієм</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-team-modal').onclick = () => modal.classList.remove('open');
        document.getElementById('start-tour-btn').onclick = () => modal.classList.remove('open');
        document.getElementById('reset-progress-btn').onclick = () => {
            localStorage.removeItem('fbf_visited');
            window.location.href = 'index.html';
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        renderUI();
    });
})();