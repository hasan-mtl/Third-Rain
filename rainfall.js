/* Rainfall CMS hydration for rain.ceo.
 * Fetches published copy from the Rainfall content API and swaps it into
 * elements tagged with data-rf / data-rf-pre / data-rf-post.
 * Also listens for Payload Live Preview postMessage so the admin iframe
 * updates the page as you type (no save required).
 * In the admin preview iframe, clicking copy posts rainfall-select-slot
 * so the left editor jumps to that field.
 */
(function () {
  'use strict';
  if (window.__rainfall) return;
  var state = (window.__rainfall = { status: 'loading', applied: 0, slots: null, preview: false });

  var API = 'https://rainfall-lime.vercel.app/api/v1/rain-ceo/home';
  var POLL_MS = 150;
  var POLL_MAX_MS = 20000;
  var PREVIEW_ORIGINS = [
    'https://rainfall-lime.vercel.app',
    'https://rainfall-defyinglogics-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:3344',
  ];
  var inIframe = false;
  var adminOrigin = null;
  try {
    inIframe = window.parent && window.parent !== window;
  } catch (e) {
    inIframe = true;
  }

  function firstTextNode(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.nodeValue.replace(/\s/g, '').length) return n;
    }
    return null;
  }
  function lastTextNode(el) {
    for (var n = el.lastChild; n; n = n.previousSibling) {
      if (n.nodeType === 3 && n.nodeValue.replace(/\s/g, '').length) return n;
    }
    return null;
  }

  function setPostText(el, t) {
    var first = firstTextNode(el);
    var last = lastTextNode(el);
    var hasPre = el.hasAttribute('data-rf-pre');
    if (last && last.nodeValue === t) return;
    if (hasPre && last && last === first) {
      el.appendChild(document.createTextNode(t));
      return;
    }
    if (last) {
      last.nodeValue = t;
      return;
    }
    el.appendChild(document.createTextNode(t));
  }

  function slotFromEl(el) {
    if (!el || !el.getAttribute) return null;
    return (
      el.getAttribute('data-rf') ||
      el.getAttribute('data-rf-pre') ||
      el.getAttribute('data-rf-post') ||
      null
    );
  }

  function applyAll(slots) {
    var root = document.getElementById('dc-root');
    if (!root) return 0;
    var count = 0;
    root.querySelectorAll('[data-rf]').forEach(function (el) {
      var t = slots[el.getAttribute('data-rf')];
      if (typeof t !== 'string') return;
      if (el.textContent !== t) el.textContent = t;
      count++;
    });
    root.querySelectorAll('[data-rf-pre]').forEach(function (el) {
      var t = slots[el.getAttribute('data-rf-pre')];
      if (typeof t !== 'string') return;
      var n = firstTextNode(el);
      if (n) { if (n.nodeValue !== t) n.nodeValue = t; }
      else el.insertBefore(document.createTextNode(t), el.firstChild);
      count++;
    });
    root.querySelectorAll('[data-rf-post]').forEach(function (el) {
      var t = slots[el.getAttribute('data-rf-post')];
      if (typeof t !== 'string') return;
      setPostText(el, t);
      count++;
    });
    return count;
  }

  function start(slots) {
    state.slots = slots;
    var waited = 0;
    var timer = setInterval(function () {
      waited += POLL_MS;
      var root = document.getElementById('dc-root');
      var ready = root && root.querySelector('[data-rf], [data-rf-pre], [data-rf-post]');
      if (ready) {
        clearInterval(timer);
        try {
          state.applied = applyAll(slots);
          state.status = 'applied';
          if (inIframe) enablePreviewEditing();
        } catch (e) {
          state.status = 'error';
        }
      } else if (waited >= POLL_MAX_MS) {
        clearInterval(timer);
        state.status = 'no-root';
      }
    }, POLL_MS);
  }

  function slotsFromBlocks(blocks) {
    var slots = {};
    if (!Array.isArray(blocks)) return slots;
    blocks.forEach(function (b) {
      if (!b) return;
      var slot = b.slot || (b.content && b.content.slot);
      var text = typeof b.text === 'string' ? b.text : (b.content && b.content.text);
      if (typeof slot === 'string' && typeof text === 'string') slots[slot] = text;
    });
    return slots;
  }

  function applyPreview(blocks) {
    var slots = slotsFromBlocks(blocks);
    state.slots = slots;
    state.preview = true;
    try {
      state.applied = applyAll(slots);
      state.status = 'preview';
      if (inIframe) enablePreviewEditing();
    } catch (e) {
      state.status = 'error';
    }
  }

  function postToAdmin(payload) {
    var targets = adminOrigin ? [adminOrigin] : PREVIEW_ORIGINS;
    targets.forEach(function (origin) {
      try {
        window.parent.postMessage(payload, origin);
      } catch (e) {}
    });
  }

  var editingEnabled = false;
  var stickySlot = null;
  var hintEl = null;

  function humanSlot(slot) {
    if (!slot) return 'this text';
    var parts = slot.split('.');
    var section = parts[0] || '';
    var names = {
      nav: 'the menu',
      hero: 'the hero',
      services: 'services',
      forecast: 'the forecast',
      ai: 'AI',
      work: 'selected work',
      founder: 'the founder story',
      contact: 'contact',
      footer: 'the footer',
    };
    var last = parts[parts.length - 1] || '';
    var sec = names[section] || section;
    if (last === 'pre' || last === 'post' || last === 'word') return 'the headline in ' + sec;
    if (last === 'cta' || last === 'primary' || last === 'secondary') return 'a button in ' + sec;
    return 'this copy in ' + sec;
  }

  function ensureHint() {
    if (hintEl) return hintEl;
    hintEl = document.createElement('div');
    hintEl.id = 'rf-edit-hint';
    hintEl.textContent = 'Click to edit this';
    document.documentElement.appendChild(hintEl);
    return hintEl;
  }

  function moveHint(el, slot) {
    var hint = ensureHint();
    if (!el) {
      hint.classList.remove('rf-edit-hint-on');
      return;
    }
    var r = el.getBoundingClientRect();
    hint.textContent = 'Click to change ' + humanSlot(slot);
    hint.style.left = Math.max(12, r.left + window.scrollX) + 'px';
    hint.style.top = Math.max(12, r.top + window.scrollY - 36) + 'px';
    hint.classList.add('rf-edit-hint-on');
  }

  function highlightSlot(slot, sticky) {
    var root = document.getElementById('dc-root') || document;
    root.querySelectorAll('.rf-active, .rf-flash').forEach(function (n) {
      n.classList.remove('rf-active');
      n.classList.remove('rf-flash');
    });
    if (sticky) stickySlot = slot || null;
    if (!slot) {
      moveHint(null);
      return;
    }
    var nodes = root.querySelectorAll('[data-rf], [data-rf-pre], [data-rf-post]');
    for (var i = 0; i < nodes.length; i++) {
      if (slotFromEl(nodes[i]) === slot) {
        nodes[i].classList.add('rf-active');
        nodes[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        moveHint(nodes[i], slot);
        return;
      }
    }
  }

  function enablePreviewEditing() {
    if (editingEnabled || !inIframe) return;
    editingEnabled = true;

    var style = document.createElement('style');
    style.textContent = [
      'html.rf-preview-edit [data-rf],',
      'html.rf-preview-edit [data-rf-pre],',
      'html.rf-preview-edit [data-rf-post] {',
      '  cursor: pointer;',
      '  outline: 1px dashed transparent;',
      '  outline-offset: 3px;',
      '  transition: outline-color .15s ease, background-color .15s ease;',
      '}',
      'html.rf-preview-edit [data-rf]:hover,',
      'html.rf-preview-edit [data-rf-pre]:hover,',
      'html.rf-preview-edit [data-rf-post]:hover {',
      '  outline-color: rgba(86,185,255,.9);',
      '  background-color: rgba(86,185,255,.08);',
      '}',
      'html.rf-preview-edit .rf-flash,',
      'html.rf-preview-edit .rf-active {',
      '  outline: 2px solid rgba(86,185,255,.95) !important;',
      '  background-color: rgba(86,185,255,.14) !important;',
      '}',
      '#rf-edit-hint {',
      '  position: absolute;',
      '  z-index: 2147483646;',
      '  pointer-events: none;',
      '  opacity: 0;',
      '  transform: translateY(4px);',
      '  transition: opacity .15s ease, transform .15s ease;',
      '  font: 600 12px/1.2 ui-sans-serif, system-ui, sans-serif;',
      '  letter-spacing: .02em;',
      '  color: #04101c;',
      '  background: #56b9ff;',
      '  padding: 7px 10px;',
      '  border-radius: 999px;',
      '  box-shadow: 0 8px 24px rgba(5,12,24,.35);',
      '}',
      '#rf-edit-hint.rf-edit-hint-on { opacity: 1; transform: none; }',
      'html.rf-preview-edit::after {',
      '  content: "Click any words to change them";',
      '  position: fixed;',
      '  left: 50%;',
      '  bottom: 18px;',
      '  transform: translateX(-50%);',
      '  z-index: 2147483645;',
      '  pointer-events: none;',
      '  font: 600 13px/1.2 ui-sans-serif, system-ui, sans-serif;',
      '  color: #e8f1ff;',
      '  background: rgba(5,12,24,.82);',
      '  border: 1px solid rgba(86,185,255,.45);',
      '  padding: 10px 14px;',
      '  border-radius: 999px;',
      '  backdrop-filter: blur(10px);',
      '}',
    ].join('\n');
    document.head.appendChild(style);
    document.documentElement.classList.add('rf-preview-edit');

    document.addEventListener(
      'mouseover',
      function (event) {
        var t = event.target;
        if (!t || !t.closest) return;
        var el = t.closest('[data-rf], [data-rf-pre], [data-rf-post]');
        if (!el) return;
        moveHint(el, slotFromEl(el));
      },
      true,
    );
    document.addEventListener(
      'mouseout',
      function (event) {
        var t = event.target;
        if (!t || !t.closest) return;
        var el = t.closest('[data-rf], [data-rf-pre], [data-rf-post]');
        if (!el) return;
        if (stickySlot) {
          var root = document.getElementById('dc-root') || document;
          var active = root.querySelector('.rf-active');
          if (active) moveHint(active, stickySlot);
          else moveHint(null);
        } else {
          moveHint(null);
        }
      },
      true,
    );

    document.addEventListener(
      'click',
      function (event) {
        var t = event.target;
        if (!t || !t.closest) return;
        var el = t.closest('[data-rf], [data-rf-pre], [data-rf-post]');
        if (!el) return;
        var slot = slotFromEl(el);
        if (!slot) return;
        event.preventDefault();
        event.stopPropagation();
        stickySlot = slot;
        highlightSlot(slot, true);
        postToAdmin({ type: 'rainfall-select-slot', slot: slot });
      },
      true,
    );
  }

  function scrollToSection(section) {
    if (!section || typeof section !== 'string') return;
    var root = document.getElementById('dc-root') || document;
    var nodes = root.querySelectorAll('[data-rf], [data-rf-pre], [data-rf-post]');
    var prefix = section + '.';
    for (var i = 0; i < nodes.length; i++) {
      var slot = slotFromEl(nodes[i]);
      if (slot && (slot === section || slot.indexOf(prefix) === 0)) {
        nodes[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        nodes[i].classList.add('rf-flash');
        setTimeout(
          (function (el) {
            return function () { el.classList.remove('rf-flash'); };
          })(nodes[i]),
          1200,
        );
        return;
      }
    }
  }

  // Payload Live Preview handshake + live updates + section scroll.
  window.addEventListener('message', function (event) {
    if (!event.data || typeof event.data !== 'object') return;
    if (event.data.type === 'rainfall-highlight-slot') {
      if (PREVIEW_ORIGINS.indexOf(event.origin) === -1 &&
          !(typeof event.origin === 'string' && event.origin.indexOf('vercel.app') !== -1)) {
        return;
      }
      highlightSlot(event.data.slot || null, Boolean(event.data.sticky));
      return;
    }
    if (event.data.type === 'rainfall-scroll-section') {
      if (PREVIEW_ORIGINS.indexOf(event.origin) === -1) return;
      scrollToSection(event.data.section);
      return;
    }
    if (PREVIEW_ORIGINS.indexOf(event.origin) === -1 &&
        !(typeof event.origin === 'string' && event.origin.indexOf('rainfall') !== -1 && event.origin.indexOf('vercel.app') !== -1)) {
      return;
    }
    if (event.data.type === 'payload-live-preview') {
      adminOrigin = event.origin;
      if (event.data.ready) return;
      if (event.source && typeof event.source.postMessage === 'function') {
        try {
          event.source.postMessage({ type: 'payload-live-preview', ready: true }, event.origin);
        } catch (e) {}
      }
      if (event.data.data && event.data.data.blocks) {
        applyPreview(event.data.data.blocks);
      }
    }
  });

  // Tell a parent iframe (admin) we're ready if already embedded.
  try {
    if (inIframe) {
      PREVIEW_ORIGINS.forEach(function (origin) {
        try {
          window.parent.postMessage({ type: 'payload-live-preview', ready: true }, origin);
        } catch (e) {}
      });
    }
  } catch (e) {}

  function run() {
    var ctrl;
    var timeout;
    try {
      ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (ctrl) timeout = setTimeout(function () { ctrl.abort(); }, 5000);
      fetch(API, ctrl ? { signal: ctrl.signal } : undefined)
        .then(function (res) {
          if (timeout) clearTimeout(timeout);
          if (!res.ok) throw new Error('bad status ' + res.status);
          return res.json();
        })
        .then(function (data) {
          if (!data || !Array.isArray(data.blocks)) throw new Error('bad payload');
          // Don't clobber an active live-preview session with the CDN fetch.
          if (state.preview) return;
          start(slotsFromBlocks(data.blocks));
        })
        .catch(function () {
          if (timeout) clearTimeout(timeout);
          if (!state.preview) state.status = 'fetch-failed';
        });
    } catch (e) {
      if (!state.preview) state.status = 'fetch-failed';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // If already embedded, enable click-to-edit as soon as the DOM has slots.
  if (inIframe) {
    var waitEdit = setInterval(function () {
      var root = document.getElementById('dc-root');
      if (root && root.querySelector('[data-rf], [data-rf-pre], [data-rf-post]')) {
        clearInterval(waitEdit);
        enablePreviewEditing();
      }
    }, 200);
    setTimeout(function () { clearInterval(waitEdit); }, 20000);
  }
})();
