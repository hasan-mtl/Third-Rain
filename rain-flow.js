(function () {
  'use strict';

  function initDispatch() {
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

  function initStormline() {
    const track = document.querySelector('[data-stormline]');
    if (!track) return;
    const fill = track.querySelector('[data-stormline-fill]');
    const drop = track.querySelector('[data-stormline-drop]');
    const steps = [...track.querySelectorAll('[data-stormline-step]')];
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress: 0 when track top hits 75% of viewport, 1 when track bottom hits 45%.
      const start = vh * 0.75;
      const end = vh * 0.45;
      const total = r.height + (start - end);
      const done = Math.min(1, Math.max(0, (start - r.top) / Math.max(1, total)));
      const px = done * r.height;
      if (fill) fill.style.height = px.toFixed(1) + 'px';
      if (drop) {
        drop.style.transform = 'translate(-50%,' + px.toFixed(1) + 'px)';
        drop.style.opacity = done > 0.005 && done < 0.995 ? '1' : '0';
      }
      steps.forEach((st) => {
        const sr = st.getBoundingClientRect();
        const nodeY = sr.top - r.top + 6;
        st.classList.toggle('is-lit', nodeY <= px);
      });
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  }

  function initGale() {
    const strip = document.querySelector('[data-gale]');
    if (!strip) return;
    const fill = document.querySelector('[data-gale-fill]');
    const meter = () => {
      if (!fill) return;
      const max = strip.scrollWidth - strip.clientWidth;
      const p = max > 0 ? strip.scrollLeft / max : 0;
      fill.style.width = (8 + p * 92).toFixed(2) + '%';
    };
    strip.addEventListener('scroll', meter, { passive: true });
    addEventListener('resize', meter);
    meter();
    // Drag-to-scroll for mouse users.
    let down = false, startX = 0, startL = 0, moved = false;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false;
      startX = e.clientX; startL = strip.scrollLeft;
      strip.classList.add('is-grabbing');
    });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      strip.scrollLeft = startL - dx;
    });
    addEventListener('pointerup', () => {
      down = false;
      strip.classList.remove('is-grabbing');
    });
    strip.addEventListener('click', (e) => { if (moved) e.preventDefault(); }, true);
  }

  window.RainFlow = {
    init: function () {
      initDispatch();
      initStormline();
      initGale();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.RainFlow.init());
  }
})();
