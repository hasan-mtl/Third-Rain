(function () {
  'use strict';

  const PHASE_PCT = [20, 45, 90, 100];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initFlowPhases() {
    const phases = document.querySelectorAll('.flow-phase');
    const panels = document.querySelectorAll('.flow-phase-panel');
    const tideFill = document.querySelector('[data-tide-fill]');
    const tideGlow = document.querySelector('[data-tide-glow]');
    const tidePct = document.querySelector('[data-tide-pct]');
    if (!phases.length) return;

    function activate(idx) {
      phases.forEach((p, i) => {
        const on = i === idx;
        p.classList.toggle('is-active', on);
        p.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        const on = Number(panel.dataset.panel) === idx;
        panel.classList.toggle('is-active', on);
        panel.hidden = !on;
      });
      const pct = PHASE_PCT[idx] || 20;
      if (tideFill) tideFill.style.height = pct + '%';
      if (tideGlow) tideGlow.style.height = Math.max(8, pct * 0.12) + '%';
      if (tidePct) tidePct.textContent = pct + '%';
    }

    phases.forEach((phase, i) => {
      phase.addEventListener('click', () => activate(i));
    });

    activate(0);
  }

  function initFlowRiver() {
    const river = document.querySelector('.flow-river');
    const layer = document.getElementById('rain-ripple-layer');
    if (!river) return;

    river.addEventListener('click', (e) => {
      const host = layer || document.body;
      const d = document.createElement('div');
      d.style.cssText =
        'position:fixed;left:' +
        e.clientX +
        'px;top:' +
        e.clientY +
        'px;width:160px;height:160px;margin:-80px;border:2px solid var(--accent);border-radius:50%;opacity:0.7;pointer-events:none;animation:clickRipple .9s ease-out forwards;z-index:48;';
      host.appendChild(d);
      setTimeout(() => d.remove(), 950);
    });
  }

  function initFlowParallax() {
    if (RM) return;
    document.querySelectorAll('[data-flow-parallax]').forEach((el) => {
      const parent = el.closest('.flow-river, .flow-zone--founder') || el;
      parent.addEventListener('mousemove', (e) => {
        const r = parent.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'translate(' + x * 12 + 'px, ' + y * 8 + 'px)';
      });
      parent.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  function initFlowPipeline() {
    const root = document.querySelector('[data-flow-pipeline]');
    if (!root || RM) return;
    const nodes = root.querySelectorAll('[data-pipe-node]');
    let idx = 0;

    setInterval(() => {
      nodes.forEach((n) => n.classList.remove('is-live'));
      nodes[idx]?.classList.add('is-live');
      if (nodes[idx + 1]) nodes[idx + 1].classList.add('is-live');
      idx = (idx + 1) % nodes.length;
    }, 2200);
  }

  function initFormPressure() {
    const fill = document.querySelector('[data-form-pressure]');
    if (!fill) return;
    const card = fill.closest('.flow-form-card');
    const fields = card?.querySelectorAll('input, textarea');
    if (!fields?.length) return;

    const update = () => {
      let score = 0;
      fields.forEach((f) => {
        if (f.value.trim()) score += 1;
        if (f.type === 'email' && f.value.includes('@')) score += 0.5;
        if (f.tagName === 'TEXTAREA' && f.value.trim().length > 20) score += 0.5;
      });
      const chips = card.querySelectorAll('.flow-chips-select button.is-selected');
      if (chips.length) score += 0.5;
      const pct = Math.min(100, Math.round((score / (fields.length + 0.5)) * 100));
      fill.style.height = Math.max(12, pct) + '%';
    };

    fields.forEach((f) => {
      f.addEventListener('input', update);
      f.addEventListener('focus', update);
    });
    card.addEventListener('click', () => setTimeout(update, 50));
    update();
  }

  window.RainFlow = {
    init: function () {
      initFlowPhases();
      initFlowRiver();
      initFlowParallax();
      initFlowPipeline();
      initFormPressure();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.RainFlow.init());
  }
})();
