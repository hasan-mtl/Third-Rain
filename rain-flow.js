(function () {
  'use strict';

  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initPlunge() {
    const nums = document.querySelectorAll('.plunge-num');
    const lead = document.querySelector('[data-plunge-lead]');
    const sub = document.querySelector('.plunge__lead-l');
    const layer = document.getElementById('rain-ripple-layer');
    nums.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        nums.forEach((n) => n.classList.remove('is-hit'));
        btn.classList.add('is-hit');
        if (lead && btn.dataset.plungeN) lead.textContent = btn.dataset.plungeN;
        if (sub && btn.dataset.plungeL) sub.textContent = btn.dataset.plungeL;
        const host = layer || document.body;
        const d = document.createElement('div');
        d.style.cssText =
          'position:fixed;left:' +
          e.clientX +
          'px;top:' +
          e.clientY +
          'px;width:220px;height:220px;margin:-110px;border:2px solid var(--accent);border-radius:50%;opacity:.75;pointer-events:none;animation:clickRipple .95s ease-out forwards;z-index:48;';
        host.appendChild(d);
        setTimeout(() => d.remove(), 1000);
      });
    });
  }

  function initCurrent() {
    const stations = document.querySelectorAll('[data-station]');
    const fill = document.querySelector('[data-current-fill]');
    const pctEl = document.querySelector('[data-current-pct]');
    if (!stations.length) return;

    const mark = (el) => {
      stations.forEach((s) => s.classList.toggle('is-here', s === el));
      const pct = el.getAttribute('data-pct') || '20';
      if (fill) fill.style.height = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
    };

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) mark(visible.target);
      },
      { threshold: [0.35, 0.55, 0.75], rootMargin: '-15% 0px -25% 0px' }
    );

    stations.forEach((s) => io.observe(s));
    mark(stations[0]);
  }

  function initMachine() {
    const hits = [...document.querySelectorAll('.machine-hit')];
    if (!hits.length) return;
    let i = 0;
    hits[0].classList.add('is-live');
    if (RM) return;
    setInterval(() => {
      hits.forEach((h) => h.classList.remove('is-live'));
      hits[i].classList.add('is-live');
      if (window.innerWidth > 740) {
        hits[(i + 2) % hits.length].classList.add('is-live');
      }
      i = (i + 1) % hits.length;
    }, 2600);
  }

  function initLandfall() {
    const form = document.querySelector('.landfall-form');
    if (!form) return;
    const fields = form.querySelectorAll('input, textarea');
    const sync = () => {
      let lv = 0;
      fields.forEach((f) => {
        if (f.value.trim()) lv += 1;
        if (f.tagName === 'TEXTAREA' && f.value.trim().length > 24) lv += 0.4;
      });
      const chips = form.querySelectorAll('[data-chip][data-on="1"]');
      if (chips.length) lv += 0.4;
      const pct = Math.min(100, Math.round((lv / (fields.length + 0.4)) * 100));
      form.style.setProperty('--tide', Math.max(0, pct) + '%');
    };
    fields.forEach((f) => f.addEventListener('input', sync));
    form.addEventListener('click', () => setTimeout(sync, 40));
    sync();
  }

  window.RainFlow = {
    init: function () {
      initPlunge();
      initCurrent();
      initMachine();
      initLandfall();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.RainFlow.init());
  }
})();
