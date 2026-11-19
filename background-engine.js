
const BackgroundEngine = (() => {
    const SELECTOR = [
        '.cpu-dashboard',
        '.cpu-page',
        '.ram-page',
        '.gpu-page',
        '.cooling-page',
        '.storage-page',
        '.main-content'
    ].join(', ');

    function init() {
        const container = document.querySelector(SELECTOR);

        if (!container || container.querySelector('.server-background')) {
            return;
        }

        const background = document.createElement('div');
        background.className = 'server-background';
        background.setAttribute('aria-hidden', 'true');

        const image = document.createElement('div');
        image.className = 'server-background-image';
        background.appendChild(image);

        // Невеликі світлодіоди на серверних стійках.
        const positions = [
            [20, 26], [24, 39], [28, 52], [32, 67],
            [42, 31], [47, 46], [52, 59], [56, 73],
            [67, 25], [72, 38], [76, 54], [80, 69],
            [17, 58], [36, 42], [60, 36], [84, 47],
            [25, 75], [49, 25], [69, 63], [78, 78]
        ];

        positions.forEach(([x, y], index) => {
            const led = document.createElement('span');
            led.className = 'server-led';

            if (index % 3 === 0) {
                led.classList.add('server-led-green');
            }

            led.style.left = `${x}%`;
            led.style.top = `${y}%`;
            led.style.animationDelay = `${-(index * 0.71)}s`;
            led.style.animationDuration =
                `${1.8 + (index % 7) * 0.43}s`;

            background.appendChild(led);
        });

        container.prepend(background);
        container.classList.add('has-server-background');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();
