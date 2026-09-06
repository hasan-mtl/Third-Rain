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

  function initBasin() {
    const section = document.querySelector('[data-basin]');
    if (!section) return;
    const quote = section.querySelector('[data-basin-quote]');
    const pin = section.querySelector('.basin__pin');
    if (!quote || !pin) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      section.classList.add('basin--static', 'is-signed');
      return;
    }

    let words = [];
    const split = () => {
      words = [];
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.nodeValue.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
                return;
              }
              const s = document.createElement('span');
              s.className = 'basin__w';
              s.textContent = part;
              frag.appendChild(s);
              words.push(s);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1) {
            if (n.classList.contains('basin__w')) words.push(n);
            else walk(n);
          }
        });
      };
      walk(quote);
    };
    split();

    let ticking = false;
    const update = () => {
      ticking = false;
      const r = pin.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight);
      // Small pre-roll so the first words catch light as the stage settles.
      const p = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.1) / total));
      const lit = Math.round(p * 1.1 * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
      section.classList.toggle('is-signed', p > 0.88);
    };

    // CMS hydration can replace the quote's text nodes — re-split when it does.
    const mo = new MutationObserver(() => {
      mo.disconnect();
      split();
      update();
      mo.observe(quote, { childList: true, subtree: true });
    });
    mo.observe(quote, { childList: true, subtree: true });

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  }

  window.RainFlow = {
    init: function () {
      initDispatch();
      initStormline();
      initGale();
      initBasin();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.RainFlow.init());
  }
})();
