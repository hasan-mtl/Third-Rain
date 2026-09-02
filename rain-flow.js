(function () {
  'use strict';

  function initFlowSteps() {
    const steps = document.querySelectorAll('.flow-step');
    if (!steps.length) return;

    steps.forEach((step, i) => {
      const btn = step.querySelector('.flow-step__head');
      const fill = step.querySelector('.flow-meter__fill');
      if (fill && step.classList.contains('is-open')) {
        fill.style.width = fill.dataset.width || '100%';
      }

      btn?.addEventListener('click', () => {
        const wasOpen = step.classList.contains('is-open');
        steps.forEach((s) => {
          s.classList.remove('is-open');
          const b = s.querySelector('.flow-step__head');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          step.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          if (fill) {
            fill.style.width = '0%';
            requestAnimationFrame(() => {
              fill.style.width = fill.dataset.width || '100%';
            });
          }
        }
      });

      if (i === 0 && btn) btn.setAttribute('aria-expanded', 'true');
    });
  }

  function initFlowRiver() {
    const river = document.querySelector('.flow-river');
    if (!river) return;
    const layer =
      document.querySelector('div[style*="z-index:47"]') ||
      document.querySelector('div[style*="z-index: 47"]');
    river.addEventListener('click', (e) => {
      const host = layer || document.body;
      const d = document.createElement('div');
      d.style.cssText =
        'position:fixed;left:' +
        e.clientX +
        'px;top:' +
        e.clientY +
        'px;width:140px;height:140px;margin:-70px;border:2px solid var(--accent);border-radius:50%;opacity:0.65;pointer-events:none;animation:clickRipple .85s ease-out forwards;z-index:48;';
      host.appendChild(d);
      setTimeout(() => d.remove(), 900);
    });
  }

  window.RainFlow = {
    init: function () {
      initFlowSteps();
      initFlowRiver();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.RainFlow.init());
  }
})();
