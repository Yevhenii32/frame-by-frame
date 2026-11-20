
/**
 * Frame by Frame
 * Mobile navigation and motherboard chapter cards
 */

(() => {
    'use strict';
  
    const init = () => {
      const sidebar = document.querySelector('.sidebar');
  
      if (!sidebar || document.querySelector('.mobile-topbar')) {
        return;
      }
  
      const mobileQuery = window.matchMedia('(max-width: 960px)');
  
      sidebar.id ||= 'site-sidebar';
      sidebar.setAttribute('aria-label', 'Навігація сайту');
  
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
      `;
  
      bar.querySelector('.mobile-topbar-section').textContent =
        currentSection;
  
      document.body.insertBefore(bar, sidebar);
  
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
  