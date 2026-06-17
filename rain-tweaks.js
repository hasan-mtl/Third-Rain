/* ============================================================
   RAIN - Tweaks panel (native, vanilla)
   Controls the hero "dawn arc" + copy->water coupling that live in
   rain.js (window.__heroTweak). Wires the host Tweaks protocol so the
   toolbar toggle shows/hides this panel, and persists changes to the
   editmode block in index.html.
   ============================================================ */
(function () {
  "use strict";

  var HERO = window.__heroTweak;
  if (!HERO) return; // engine not present (shouldn't happen)

  var defaults = window.__RAIN_TWEAKS || {};
  var state = {
    dawnArc: defaults.dawnArc !== false,
    dawnIntensity: typeof defaults.dawnIntensity === "number" ? defaults.dawnIntensity : 0.9,
    storyPaceMs: typeof defaults.storyPaceMs === "number" ? defaults.storyPaceMs : 3600,
    rippleOnSwap: defaults.rippleOnSwap !== false
  };

  // push current state into the live engine
  function apply() {
    HERO.dawnOn = !!state.dawnArc;
    HERO.dawnMax = state.dawnIntensity;
    HERO.cycleMs = state.storyPaceMs;
    HERO.couple = !!state.rippleOnSwap;
  }
  apply();

  function persist(edits) {
    try {
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: edits }, "*");
    } catch (e) {}
  }

  /* ---------- build the panel ---------- */
  var panel = document.createElement("aside");
  panel.className = "tw-panel";
  panel.setAttribute("aria-label", "Tweaks");
  panel.hidden = true;
  panel.innerHTML = [
    '<header class="tw-panel__head">',
    '  <span class="tw-panel__title">Tweaks</span>',
    '  <button type="button" class="tw-panel__x" data-tw-close aria-label="Close tweaks">',
    '    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    '  </button>',
    '</header>',
    '<p class="tw-panel__note">The hero, live. Changes save as you go.</p>',

    '<div class="tw-row">',
    '  <div class="tw-row__label"><strong>Dawn arc</strong><small>Night breaks to first light as the line cycles</small></div>',
    '  <button type="button" class="tw-switch" data-tw="dawnArc" role="switch"></button>',
    '</div>',

    '<div class="tw-row tw-row--col" data-tw-when="dawnArc">',
    '  <div class="tw-row__label"><strong>Dawn intensity</strong><small><span data-tw-out="dawnIntensity"></span></small></div>',
    '  <input type="range" class="tw-range" data-tw="dawnIntensity" min="0.2" max="1" step="0.05" />',
    '</div>',

    '<div class="tw-row tw-row--col">',
    '  <div class="tw-row__label"><strong>Story pace</strong><small><span data-tw-out="storyPaceMs"></span> between outcomes</small></div>',
    '  <input type="range" class="tw-range" data-tw="storyPaceMs" min="2000" max="6000" step="200" />',
    '</div>',

    '<div class="tw-row">',
    '  <div class="tw-row__label"><strong>Ripple on swap</strong><small>Each phrase lands on the water</small></div>',
    '  <button type="button" class="tw-switch" data-tw="rippleOnSwap" role="switch"></button>',
    '</div>'
  ].join("");
  document.body.appendChild(panel);

  /* ---------- reflect state into controls ---------- */
  function fmtPace(ms) { return (ms / 1000).toFixed(1).replace(/\.0$/, "") + "s"; }
  function fmtPct(v) { return Math.round(v * 100) + "%"; }

  function sync() {
    panel.querySelectorAll("[data-tw]").forEach(function (el) {
      var key = el.getAttribute("data-tw");
      if (el.classList.contains("tw-switch")) {
        var on = !!state[key];
        el.classList.toggle("is-on", on);
        el.setAttribute("aria-checked", on ? "true" : "false");
      } else if (el.classList.contains("tw-range")) {
        el.value = state[key];
      }
    });
    var io = panel.querySelector('[data-tw-out="dawnIntensity"]');
    if (io) io.textContent = fmtPct(state.dawnIntensity);
    var po = panel.querySelector('[data-tw-out="storyPaceMs"]');
    if (po) po.textContent = fmtPace(state.storyPaceMs);
    // gate dependent rows on the dawn toggle
    panel.querySelectorAll("[data-tw-when]").forEach(function (el) {
      el.classList.toggle("is-disabled", !state[el.getAttribute("data-tw-when")]);
    });
  }

  /* ---------- wire interactions ---------- */
  panel.addEventListener("click", function (e) {
    var sw = e.target.closest(".tw-switch");
    if (sw) {
      var key = sw.getAttribute("data-tw");
      state[key] = !state[key];
      apply(); sync();
      var edit = {}; edit[key] = state[key]; persist(edit);
      return;
    }
    if (e.target.closest("[data-tw-close]")) {
      hide();
      try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch (err) {}
    }
  });

  panel.addEventListener("input", function (e) {
    var rng = e.target.closest(".tw-range");
    if (!rng) return;
    var key = rng.getAttribute("data-tw");
    state[key] = key === "storyPaceMs" ? parseInt(rng.value, 10) : parseFloat(rng.value);
    apply(); sync();
  });
  panel.addEventListener("change", function (e) {
    var rng = e.target.closest(".tw-range");
    if (!rng) return;
    var key = rng.getAttribute("data-tw");
    var edit = {}; edit[key] = state[key]; persist(edit);
  });

  /* ---------- host protocol ---------- */
  function show() { panel.hidden = false; void panel.offsetWidth; panel.classList.add("is-open"); sync(); }
  function hide() { panel.classList.remove("is-open"); window.setTimeout(function () { panel.hidden = true; }, 240); }

  // register the listener BEFORE announcing availability
  window.addEventListener("message", function (e) {
    var t = e.data && e.data.type;
    if (t === "__activate_edit_mode") show();
    else if (t === "__deactivate_edit_mode") hide();
  });
  try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}

  sync();
})();
