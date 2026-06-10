/* ============================================================
   RAIN — "Liquid Midnight" interactions
   One shared rAF dispatcher · one cyan current · reduced-motion first-class
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mqSmall = window.matchMedia("(max-width: 760px)");
  var smallScreen = mqSmall.matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  // modules register a refresher so a breakpoint change (e.g. phone rotation) can re-apply their state
  var railRefresh = function () {};
  var videoRefresh = function () {};

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // progress within a tall sticky scene: 0 when its top aligns, 1 when scrolled through
  function stickyProgress(scene) {
    var r = scene.getBoundingClientRect();
    var scrollable = scene.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return clamp(-r.top / scrollable, 0, 1);
  }

  /* ---------- shared rAF scroll dispatcher ---------- */
  var updaters = [];
  function register(fn) { updaters.push(fn); }
  function runUpdaters() { for (var i = 0; i < updaters.length; i++) updaters[i](); }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { runUpdaters(); ticking = false; });
  }

  // shared scroll-velocity → graded-media response
  var media = { vel: 0, cur: 0, lastY: window.scrollY || 0 };
  function velocityUpdater() {
    var y = window.scrollY || 0;
    media.vel = clamp(Math.abs(y - media.lastY) / 60, 0, 1);
    media.lastY = y;
  }

  /* ---------- INTRO ---------- */
  function intro() {
    var el = qs(".intro");
    if (!el) { kick(); return; }
    if (reduce) { finish(); return; }
    var min = 1800, t0 = performance.now(), done = false;
    function finish() {
      if (done) return; done = true;
      document.body.classList.add("intro-done");
      kick();
    }
    function ready() {
      var wait = Math.max(0, min - (performance.now() - t0));
      setTimeout(finish, wait);
    }
    if (document.readyState === "complete") ready();
    else window.addEventListener("load", ready);
    // allow skipping
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (ev) {
      window.addEventListener(ev, function () { if (performance.now() - t0 > 500) finish(); }, { passive: true, once: true });
    });
    setTimeout(finish, 4200); // safety
  }

  /* ---------- RAIN CANVAS (cyan) + media velocity easing ---------- */
  function rainCanvas() {
    var canvas = qs(".rain-canvas");
    if (!canvas || reduce) { if (canvas) canvas.style.display = "none"; return; }
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, drops, slant;
    function size() {
      W = canvas.width = Math.floor(innerWidth * dpr);
      H = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      slant = 1.1 * dpr;
      var count = Math.floor((innerWidth * innerHeight) / 16000);
      drops = [];
      for (var i = 0; i < count; i++) drops.push(newDrop(true));
    }
    function newDrop(init) {
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : -20 * dpr,
        len: (10 + Math.random() * 20) * dpr,
        spd: (6 + Math.random() * 9) * dpr,
        w: (Math.random() < 0.22 ? 1.4 : 0.8) * dpr,
        a: 0.05 + Math.random() * 0.16
      };
    }
    var running = true, lastBright = -1;
    function frame() {
      if (!running) return;
      // ease graded-media velocity response — only touch the CSS vars when they actually move,
      // so the full-screen video filters aren't re-invalidated every idle frame
      media.cur = lerp(media.cur, media.vel, 0.08);
      media.vel *= 0.9;
      if (media.cur < 0.0015) media.cur = 0;
      if (Math.abs(media.cur - lastBright) > 0.002) {
        lastBright = media.cur;
        var root = document.documentElement.style;
        root.setProperty("--media-bright", (0.62 + media.cur * 0.14).toFixed(3));
        root.setProperty("--media-contrast", (1.18 + media.cur * 0.12).toFixed(3));
      }
      var boost = 1 + media.cur * 0.8;

      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        ctx.strokeStyle = "rgba(125,235,255," + d.a + ")";
        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - slant * (d.len * boost / (8 * dpr)), d.y + d.len * boost);
        ctx.stroke();
        d.y += d.spd * boost;
        d.x -= slant * (d.spd / (8 * dpr));
        if (d.y > H + 30 * dpr) drops[i] = newDrop(false);
      }
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) running = false;
      else if (!running) { running = true; requestAnimationFrame(frame); }
    });
    requestAnimationFrame(frame);
  }

  /* ---------- REVEALS ---------- */
  function reveals() {
    var els = qsa("[data-reveal]");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    function revealVisible() {
      var vh = window.innerHeight;
      els = els.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) { el.classList.add("in"); return false; }
        return true;
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
    revealVisible();
    requestAnimationFrame(revealVisible);
    setTimeout(revealVisible, 400);
  }

  // fire a one-shot callback when an element scrolls into view
  function onView(el, cb, margin) {
    if (!el) return;
    if (reduce || !("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { cb(); io.disconnect(); } });
    }, { threshold: 0.2, rootMargin: margin || "0px 0px -10% 0px" });
    io.observe(el);
  }

  /* ---------- HERO ROTATOR ---------- */
  function heroRotator() {
    var items = qsa(".rotator__word");
    if (!items.length) return;
    var i = 0;
    items[0].classList.add("is-active");
    if (reduce) return;
    setInterval(function () {
      items[i].classList.remove("is-active");
      i = (i + 1) % items.length;
      items[i].classList.add("is-active");
    }, 1900);
  }

  /* ---------- KINETIC THESIS PIVOT ---------- */
  function kineticThesis() {
    var b = qs(".thesis__b");
    if (!b) return;
    if (reduce) { b.classList.add("lit"); return; }
    onView(qs(".thesis"), function () { setTimeout(function () { b.classList.add("lit"); }, 420); });
  }

  /* ---------- ERAS RAIL (fill + counters + sequential ignite) ---------- */
  function eraRail() {
    var rail = qs(".rail");
    if (!rail) return;
    var fill = qs(".rail__fill", rail);
    var nodes = qsa(".rail__node", rail);
    var nums = qsa(".rail__num", rail);
    var lit = false;
    // the rail runs horizontally on desktop (fill width) and vertically on mobile (fill height)
    function applyFill() {
      if (!fill || !lit) return;
      if (mqSmall.matches) { fill.style.width = ""; fill.style.height = "100%"; }
      else { fill.style.height = ""; fill.style.width = "100%"; }
    }
    railRefresh = applyFill;
    function countTo(el, target) {
      var dur = 700, t0 = null;
      function step(now) {
        if (!t0) t0 = now;
        var p = clamp((now - t0) / dur, 0, 1);
        var v = Math.round(p * target);
        el.textContent = (v < 10 ? "0" : "") + v;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = (target < 10 ? "0" : "") + target;
      }
      requestAnimationFrame(step);
    }
    if (reduce) { nodes.forEach(function (n) { n.classList.add("lit"); }); lit = true; applyFill(); return; }
    onView(rail, function () {
      lit = true; applyFill();
      nodes.forEach(function (n, idx) {
        setTimeout(function () {
          n.classList.add("lit");
          var num = nums[idx];
          if (num) countTo(num, idx + 1);
        }, 240 + idx * 230);
      });
    });
  }

  /* ---------- GAP BRIDGE (connector draws, ticks cascade) ---------- */
  function gapBridge() {
    var grid = qs(".gap__grid");
    if (!grid) return;
    var ticks = qsa(".gap-card--rain li", grid);
    if (reduce) { grid.classList.add("lit"); ticks.forEach(function (li) { li.classList.add("lit"); }); return; }
    onView(grid, function () {
      grid.classList.add("lit");
      ticks.forEach(function (li, idx) { setTimeout(function () { li.classList.add("lit"); }, 480 + idx * 90); });
    });
  }

  /* ---------- PROCESS (pinned scene + travelling droplet) ---------- */
  function processScene() {
    var scene = qs(".process");
    if (!scene) return;
    var fill = qs(".process__fill", scene);
    var drop = qs(".process__drop", scene);
    var steps = qsa(".process-step", scene);
    // precompute each step's activation threshold from its --top (% of viewport)
    var thresholds = steps.map(function (s) {
      var top = parseFloat(s.style.getPropertyValue("--top")) || 50;
      return clamp((top - 13) / 78, 0, 1);
    });
    function staticState() {
      steps.forEach(function (s) { s.classList.add("is-active"); });
      if (fill) fill.style.height = "100%";
      if (drop) drop.style.display = "none";
    }
    if (reduce) { staticState(); return; }
    // read the breakpoint live each frame so rotating across 760px revives/retires the pinned scene
    function update() {
      if (mqSmall.matches) { staticState(); return; }
      if (drop && drop.style.display === "none") drop.style.display = "";
      var p = stickyProgress(scene);
      var t = clamp((p - 0.05) / 0.9, 0, 1);
      if (fill) fill.style.height = (t * 100).toFixed(2) + "%";
      if (drop) drop.style.top = (t * 100).toFixed(2) + "%";
      steps.forEach(function (s, idx) { s.classList.toggle("is-active", t >= thresholds[idx] - 0.01); });
    }
    register(update);
  }

  /* ---------- ORBIT PULSES (inward to the core) ---------- */
  function orbitPulses() {
    var svg = qs(".orbit__lines");
    if (!svg) return;
    var paths = qsa("path", svg);
    var nodes = qsa(".orbit__node");
    var group = qs(".orbit__pulses", svg);
    if (!group) { group = document.createElementNS("http://www.w3.org/2000/svg", "g"); group.setAttribute("class", "orbit__pulses"); svg.appendChild(group); }
    group.innerHTML = "";
    var NS = "http://www.w3.org/2000/svg";
    var pulses = paths.map(function (path, i) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("r", "1.1");
      group.appendChild(c);
      return { c: c, path: path, len: path.getTotalLength(), phase: i / paths.length, prev: 0 };
    });
    function place(p, t) {
      var pt = p.path.getPointAtLength(p.len * (1 - t)); // travel node -> core
      p.c.setAttribute("cx", pt.x.toFixed(2));
      p.c.setAttribute("cy", pt.y.toFixed(2));
    }
    pulses.forEach(function (p) { place(p, p.phase); });
    if (reduce) { pulses.forEach(function (p) { place(p, 0.5); }); return; }
    var timers = [];
    function flash(i) {
      var n = nodes[i]; if (!n) return;
      n.classList.add("is-hit");
      clearTimeout(timers[i]);
      timers[i] = setTimeout(function () { n.classList.remove("is-hit"); }, 600);
    }
    var dur = 3200;
    function frame(now) {
      for (var i = 0; i < pulses.length; i++) {
        var p = pulses[i];
        var t = ((now / dur) + p.phase) % 1;
        if (t < p.prev) flash(i);
        p.prev = t;
        place(p, t);
        var op = t < 0.1 ? t / 0.1 : (t > 0.85 ? Math.max(0, (1 - t) / 0.15) : 1);
        p.c.style.opacity = op.toFixed(2);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- MARQUEES (seamless loop) ---------- */
  function marquees() {
    qsa(".marquee__track").forEach(function (track) { track.innerHTML = track.innerHTML + track.innerHTML; });
  }

  /* ---------- CONTACT HEADLINE ASSEMBLE ---------- */
  function assembleHeadline() {
    var h = qs("[data-assemble]");
    if (!h) return;
    var words = h.textContent.trim().split(/\s+/);
    h.textContent = "";
    words.forEach(function (w, i) {
      var span = document.createElement("span");
      span.className = "word";
      span.style.setProperty("--w", i);
      span.textContent = w;
      h.appendChild(span);
      h.appendChild(document.createTextNode(" "));
    });
    if (reduce) { h.classList.add("assembled"); return; }
    onView(h, function () { h.classList.add("assembled"); });
  }

  /* ---------- HEADER (stuck + nav-spy + mobile) ---------- */
  function header() {
    var h = qs(".site-header");
    var links = qsa(".desktop-nav a[data-target]");
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute("data-target")); });
    function update() {
      if (h) h.classList.toggle("is-stuck", window.scrollY > 40);
      var mid = window.scrollY + window.innerHeight * 0.42;
      var active = -1;
      sections.forEach(function (s, idx) { if (s && s.offsetTop <= mid) active = idx; });
      links.forEach(function (a, idx) { a.classList.toggle("is-active", idx === active); });
    }
    register(update);

    var toggle = qs(".mobile-toggle");
    var menu = qs(".mobile-nav");
    if (toggle && menu) {
      // background regions made inert while the drawer is open (not .header-actions — it holds the toggle)
      var bg = qsa("main, .site-footer, .site-header .brand");
      function setOpen(open) {
        menu.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        bg.forEach(function (el) { if (open) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
        if (open) { var first = menu.querySelector("a"); if (first) first.focus(); }
        else { toggle.focus(); }
      }
      toggle.addEventListener("click", function () { setOpen(!menu.classList.contains("open")); });
      menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("open")) setOpen(false); });
    }
  }

  /* ---------- SCROLL THREAD (top progress) ---------- */
  function scrollThread() {
    var bar = qs(".scroll-thread i");
    if (!bar) return;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY || doc.scrollTop) / max : 0;
      bar.style.width = (clamp(p, 0, 1) * 100).toFixed(2) + "%";
    }
    register(update);
  }

  /* ---------- GRADED VIDEO GATING ---------- */
  function videos() {
    var vids = qsa("video.media__el");
    function apply() {
      var allow = !reduce && !mqSmall.matches && !saveData;
      vids.forEach(function (v) {
        if (allow) {
          v.muted = true;
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          try { v.pause(); } catch (e) {}
          v.preload = "none"; // keep the graded poster, skip the download
        }
      });
    }
    videoRefresh = apply;
    apply();
  }

  /* ---------- CONTACT FORM ---------- */
  function contactForm() {
    var form = qs(".contact-form");
    if (!form) return;
    var note = qs(".form-note", form);
    var drop = qs(".form-drop", form);
    var nameEl = form.querySelector('[name="name"]');
    var emailEl = form.querySelector('[name="email"]');
    var msgEl = form.querySelector('[name="message"]');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameBad = !nameEl.value.trim();
      var emailBad = !/.+@.+\..+/.test(emailEl.value.trim());
      var msgBad = msgEl.value.trim().length <= 4;
      var ok = !nameBad && !emailBad && !msgBad;
      [[nameEl, nameBad], [emailEl, emailBad], [msgEl, msgBad]].forEach(function (p) {
        if (ok) p[0].removeAttribute("aria-invalid");
        else p[0].setAttribute("aria-invalid", p[1] ? "true" : "false");
      });
      // errors should interrupt; success can wait politely
      note.setAttribute("role", ok ? "status" : "alert");
      note.setAttribute("aria-live", ok ? "polite" : "assertive");
      note.className = "form-note show " + (ok ? "ok" : "err");
      note.textContent = ok
        ? "Thank you — your first drop is on its way. We'll be in touch shortly."
        : "Please add your name, a valid email, and a short message.";
      if (ok) {
        form.reset();
        [nameEl, emailEl, msgEl].forEach(function (el) { el.removeAttribute("aria-invalid"); });
        if (drop && !reduce) {
          drop.classList.remove("fall");
          void drop.offsetWidth; // restart animation
          drop.classList.add("fall");
        }
      } else {
        (nameBad ? nameEl : emailBad ? emailEl : msgEl).focus();
      }
    });
  }

  /* ---------- SMOOTH ANCHORS ---------- */
  function anchors() {
    qsa('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href").slice(1);
        if (!id) return;
        var t = document.getElementById(id);
        if (t) {
          e.preventDefault();
          window.scrollTo({ top: t.offsetTop, behavior: reduce ? "auto" : "smooth" });
          // move keyboard focus into the destination (fixes the skip link + every in-page jump)
          if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
          t.focus({ preventScroll: true });
        }
      });
    });
  }

  function kick() { runUpdaters(); }

  /* ---------- BOOT ---------- */
  function boot() {
    rainCanvas();
    reveals();
    heroRotator();
    kineticThesis();
    eraRail();
    gapBridge();
    processScene();
    orbitPulses();
    marquees();
    assembleHeadline();
    header();
    scrollThread();
    videos();
    contactForm();
    anchors();
    if (!reduce) register(velocityUpdater);
    // re-apply breakpoint-dependent state when crossing 760px (e.g. phone rotation, window resize)
    function onBreakpoint() { smallScreen = mqSmall.matches; railRefresh(); videoRefresh(); onScroll(); }
    if (mqSmall.addEventListener) mqSmall.addEventListener("change", onBreakpoint);
    else if (mqSmall.addListener) mqSmall.addListener(onBreakpoint);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    runUpdaters();
    intro();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
