/**
 * Frame by Frame
 * Mobile navigation, topbar controls and motherboard chapter cards
 */

(() => {
  'use strict';

  const ICONS = {
    musicOn: `
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    `,
    musicOff: `
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
        <path d="M3 3l18 18"/>
      </svg>
    `,
    effectsOn: `
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
      </svg>
    `,
    effectsOff: `
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    `
  };

  const init = () => {
    const sidebar = document.querySelector('.sidebar');

    if (!sidebar || document.querySelector('.mobile-topbar')) {
      return;
    }

    const mobileQuery = window.matchMedia('(max-width: 960px)');

    sidebar.id ||= 'site-sidebar';
    sidebar.setAttribute('aria-label', 'Навігація сайту');

    const chapterLinks = [
      ...sidebar.querySelectorAll('.chapter-nav a.menu-link[href]')
    ];
    const activeIdx = chapterLinks.findIndex(link =>
      link.classList.contains('active')
    );
    const nextLink = chapterLinks.length
      ? chapterLinks[(activeIdx >= 0 ? activeIdx + 1 : 1) % chapterLinks.length]
      : null;
    const nextHref = nextLink?.getAttribute('href') || 'cpu.html';
    const nextName =
      nextLink?.querySelector('.menu-item')?.textContent?.trim() || 'Далі';

    // Create mobile header

    const bar = document.createElement('header');
    bar.className = 'mobile-topbar';

    const currentSection =
      document.querySelector('.sidebar .menu-link.active .menu-item')
        ?.textContent?.trim() || 'Інтерактивний довідник';

    bar.innerHTML = `
      <button
        class="mobile-menu-toggle"
        type="button"
        aria-label="Відкрити меню розділів"
        aria-controls="site-sidebar"
        aria-expanded="false"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
      </button>

      <div class="mobile-topbar-copy">
        <span class="mobile-topbar-name">Frame by Frame</span>
        <span class="mobile-topbar-section"></span>
      </div>

      <div class="mobile-topbar-actions">
        <button
          class="mobile-topbar-btn mobile-audio-btn"
          data-audio="music"
          type="button"
          aria-label="Вимкнути фонову музику"
          title="Фонова музика"
        >${ICONS.musicOn}</button>

        <button
          class="mobile-topbar-btn mobile-audio-btn"
          data-audio="effects"
          type="button"
          aria-label="Вимкнути звукові ефекти"
          title="Звукові ефекти"
        >${ICONS.effectsOn}</button>

        <a
          class="mobile-topbar-btn mobile-topbar-next"
          href="${nextHref}"
          aria-label="Далі: ${nextName}"
          title="Далі: ${nextName}"
        >→</a>
      </div>
    `;

    bar.querySelector('.mobile-topbar-section').textContent =
      currentSection;

    document.body.insertBefore(bar, sidebar);

    const musicBtn = bar.querySelector('[data-audio="music"]');
    const effectsBtn = bar.querySelector('[data-audio="effects"]');

    const syncTopbarAudio = () => {
      if (typeof SoundEngine === 'undefined') return;
      const musicMuted = SoundEngine.getMusicMuted();
      const effectsMuted = SoundEngine.getEffectsMuted();

      musicBtn.innerHTML = musicMuted ? ICONS.musicOff : ICONS.musicOn;
      musicBtn.classList.toggle('is-muted', musicMuted);
      musicBtn.setAttribute('aria-pressed', String(!musicMuted));
      musicBtn.setAttribute(
        'aria-label',
        musicMuted ? 'Увімкнути фонову музику' : 'Вимкнути фонову музику'
      );

      effectsBtn.innerHTML = effectsMuted ? ICONS.effectsOff : ICONS.effectsOn;
      effectsBtn.classList.toggle('is-muted', effectsMuted);
      effectsBtn.setAttribute('aria-pressed', String(!effectsMuted));
      effectsBtn.setAttribute(
        'aria-label',
        effectsMuted ? 'Увімкнути звукові ефекти' : 'Вимкнути звукові ефекти'
      );
    };

    musicBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (typeof SoundEngine !== 'undefined') {
        SoundEngine.toggleMusic();
        syncTopbarAudio();
      }
    });

    effectsBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      if (typeof SoundEngine !== 'undefined') {
        SoundEngine.toggleEffects();
        syncTopbarAudio();
      }
    });

    window.addEventListener('fbf-mute-changed', syncTopbarAudio);
    syncTopbarAudio();

    const toggle = bar.querySelector('.mobile-menu-toggle');

    toggle.setAttribute('aria-controls', sidebar.id);

    // Close button

    const closeButton = document.createElement('button');

    closeButton.type = 'button';
    closeButton.className = 'mobile-menu-close';

    closeButton.setAttribute(
      'aria-label',
      'Закрити меню розділів'
    );

    closeButton.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <path d="M5 5l14 14M19 5L5 19"/>
      </svg>
    `;

    sidebar.prepend(closeButton);

    // Backdrop

    const backdrop = document.createElement('div');

    backdrop.className = 'mobile-backdrop';
    backdrop.hidden = true;

    document.body.insertBefore(backdrop, sidebar);

    let opened = false;

    const focusableSelector = `
      a[href],
      button:not([disabled]),
      input:not([disabled]),
      [tabindex]:not([tabindex="-1"])
    `;

    // Update layout depending on screen size

    const updateLayout = () => {
      if (!mobileQuery.matches) {
        opened = false;

        document.body.classList.remove('mobile-menu-open');

        toggle.setAttribute('aria-expanded', 'false');

        sidebar.removeAttribute('aria-hidden');
        sidebar.inert = false;

        backdrop.hidden = true;

      } else if (!opened) {
        sidebar.inert = true;
        sidebar.setAttribute('aria-hidden', 'true');
      }
    };

    // Close mobile menu

    const closeMenu = (restoreFocus = true) => {
      if (!opened) return;

      opened = false;

      if (
        restoreFocus &&
        sidebar.contains(document.activeElement)
      ) {
        toggle.focus();
      }

      document.body.classList.remove('mobile-menu-open');

      toggle.setAttribute('aria-expanded', 'false');

      toggle.setAttribute(
        'aria-label',
        'Відкрити меню розділів'
      );

      backdrop.hidden = true;

      if (mobileQuery.matches) {
        sidebar.inert = true;
        sidebar.setAttribute('aria-hidden', 'true');
      }
    };

    // Open mobile menu

    const openMenu = () => {
      if (!mobileQuery.matches || opened) return;

      opened = true;

      sidebar.inert = false;
      sidebar.removeAttribute('aria-hidden');

      document.body.classList.add('mobile-menu-open');

      toggle.setAttribute('aria-expanded', 'true');

      toggle.setAttribute(
        'aria-label',
        'Закрити меню розділів'
      );

      backdrop.hidden = false;

      closeButton.focus();
    };

    // Menu events

    toggle.addEventListener('click', () => {
      opened ? closeMenu(true) : openMenu();
    });

    closeButton.addEventListener('click', () => {
      closeMenu(true);
    });

    backdrop.addEventListener('click', () => {
      closeMenu(true);
    });

    sidebar.querySelectorAll('a[href]').forEach(link => {
      link.addEventListener('click', () => closeMenu(false));
    });

    // Keyboard navigation

    document.addEventListener('keydown', (event) => {
      if (!opened) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = [
        ...sidebar.querySelectorAll(focusableSelector)
      ].filter(item => item.getClientRects().length > 0);

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();

      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    });

    mobileQuery.addEventListener('change', () => {
      if (!mobileQuery.matches && opened) {
        closeMenu(false);
      }

      updateLayout();
    });

    updateLayout();

    // Motherboard component navigation

    const board =
      document.getElementById('mb-container') ||
      document.querySelector('.motherboard-container');

    if (
      !board ||
      board.parentElement.querySelector('.mobile-chapters')
    ) {
      return;
    }

    const spots = [
      ...board.querySelectorAll('a.interactive-zone[href]')
    ];

    if (!spots.length) return;

    const section = document.createElement('section');

    section.className = 'mobile-chapters';

    section.setAttribute(
      'aria-label',
      'Список компонентів материнської плати'
    );

    section.innerHTML = `
      <h2>Дослідити компоненти</h2>

      <p>
        Оберіть розділ зі списку — з телефона так зручніше.
      </p>

      <div class="mobile-chapters-list"></div>
    `;

    const list = section.querySelector('.mobile-chapters-list');

    spots.forEach(spot => {
      const link = document.createElement('a');

      link.href = spot.getAttribute('href');
      link.className = 'mobile-chapter-link';

      const accent = {
        'slot-cooling': '#f97316',
        'slot-gpu': '#a855f7',
        'slot-ram': '#eab308',
        'slot-storage': '#10b981'
      };

      for (const [className, color] of Object.entries(accent)) {
        if (spot.classList.contains(className)) {
          link.style.borderLeftColor = color;
        }
      }

      const info = document.createElement('span');
      info.className = 'mobile-chapter-info';

      const title = document.createElement('span');
      title.className = 'mobile-chapter-name';

      title.textContent =
        spot.querySelector('.hotspot-tag')
          ?.textContent?.trim() ||
        spot.dataset.title ||
        'Компонент';

      const description = document.createElement('span');
      description.className = 'mobile-chapter-description';

      description.textContent = spot.dataset.title || '';

      const arrow = document.createElement('span');
      arrow.className = 'mobile-chapter-arrow';

      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';

      info.append(title, description);
      link.append(info, arrow);

      list.appendChild(link);
    });

    board.insertAdjacentElement('afterend', section);
  };

  // Start after DOM is loaded

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {
      once: true
    });
  } else {
    init();
  }
})();