
const PcbPulse = (() => {
    const NS = 'http://www.w3.org/2000/svg';

    const paths = [
        'M0 48 H38 L72 82 V174 L109 211 H168',
        'M300 25 H267 L239 53 V138 L203 174 H171',
        'M300 264 H254 L222 296 H189 L162 323 V375',
        'M0 541 H47 L81 575 V648 L118 685 H164',
        'M300 732 H268 L237 763 H205 L176 792 H132'
    ];

    function createSvgElement(tag) {
        return document.createElementNS(NS, tag);
    }

    function init() {
        const sidebar = document.querySelector('.sidebar');

        if (!sidebar || sidebar.querySelector('.pcb-pulse-layer')) {
            return;
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const svg = createSvgElement('svg');
        svg.classList.add('pcb-pulse-layer');

        svg.setAttribute('viewBox', '0 0 300 850');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('aria-hidden', 'true');

        const signals = [];

        paths.forEach((pathData, index) => {
            const path = createSvgElement('path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'none');

            const glow = createSvgElement('circle');
            glow.setAttribute('r', '4');
            glow.setAttribute('fill', '#6CA9F2');
            glow.setAttribute('opacity', '0.25');

            const dot = createSvgElement('circle');
            dot.setAttribute('r', '1.5');
            dot.setAttribute('fill', '#6CA9F2');

            svg.appendChild(path);
            svg.appendChild(glow);
            svg.appendChild(dot);

            signals.push({
                path,
                glow,
                dot,
                length: path.getTotalLength(),
                duration: 2200 + index * 450,
                delay: index * 1300
            });
        });

        sidebar.appendChild(svg);

        let startTime = null;

        function animate(timestamp) {
            if (startTime === null) {
                startTime = timestamp;
            }

            const elapsed = timestamp - startTime;

            signals.forEach(signal => {
                const cycle = signal.duration + 4500;
                const localTime =
                    (elapsed - signal.delay + cycle) % cycle;

                if (elapsed < signal.delay ||
                    localTime > signal.duration) {
                    signal.dot.setAttribute('opacity', '0');
                    signal.glow.setAttribute('opacity', '0');
                    return;
                }

                const progress = localTime / signal.duration;
                const point = signal.path.getPointAtLength(
                    progress * signal.length
                );

                signal.dot.setAttribute('cx', point.x);
                signal.dot.setAttribute('cy', point.y);
                signal.dot.setAttribute('opacity', '0.55');

                signal.glow.setAttribute('cx', point.x);
                signal.glow.setAttribute('cy', point.y);
                signal.glow.setAttribute('opacity', '0.12');
            });

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();
