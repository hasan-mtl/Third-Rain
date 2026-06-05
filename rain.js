/* ============================================================
   RAIN — cinematic interactions
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  // progress of an element through the viewport: 0 when its top hits bottom, 1 when its bottom hits top
  function scrollProgress(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    return clamp((vh - r.top) / (vh + r.height), 0, 1);
  }
  // progress within a tall sticky scene: 0 at scene top aligned, 1 when scrolled through
  function stickyProgress(scene) {
    var r = scene.getBoundingClientRect();
    var scrollable = scene.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return clamp(-r.top / scrollable, 0, 1);
  }

  /* ---------- INTRO ---------- */
  function startIntro() {
    var minHold = reduce ? 200 : 1900;
    var t0 = performance.now();
    function done() {
      var wait = Math.max(0, minHold - (performance.now() - t0));
      setTimeout(function () { document.body.classList.add("intro-done"); kick(); }, wait);
    }
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done);
    // safety
    setTimeout(function () { if (!document.body.classList.contains("intro-done")) { document.body.classList.add("intro-done"); kick(); } }, 4200);
  }

  /* ---------- RAIN CANVAS ---------- */
  function rainCanvas() {
    var canvas = document.querySelector(".rain-canvas");
    if (!canvas || reduce) { if (canvas) canvas.style.display = "none"; return; }
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, drops;
    function size() {
      W = canvas.width = Math.floor(innerWidth * dpr);
      H = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      var count = Math.floor((innerWidth * innerHeight) / 14000);
      drops = [];
      for (var i = 0; i < count; i++) drops.push(newDrop(true));
    }
    function newDrop(init) {
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : -20 * dpr,
        len: (10 + Math.random() * 22) * dpr,
        spd: (6 + Math.random() * 9) * dpr,
        w: (Math.random() < 0.25 ? 1.4 : 0.8) * dpr,
        a: 0.06 + Math.random() * 0.18
      };
    }
    var slant = 1.1 * dpr;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        ctx.strokeStyle = "rgba(216,236,210," + d.a + ")";
        ctx.lineWidth = d.w;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - slant * (d.len / (8 * dpr)), d.y + d.len);
        ctx.stroke();
        d.y += d.spd;
        d.x -= slant * (d.spd / (8 * dpr));
        if (d.y > H + 30 * dpr) drops[i] = newDrop(false);
      }
      requestAnimationFrame(frame);
    }
    size();
    window.addEventListener("resize", size);
    requestAnimationFrame(frame);
  }

  /* ---------- REVEALS ---------- */
  function reveals() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    // reveal anything already within (or near) the viewport immediately
    function revealVisible() {
      var vh = window.innerHeight;
      els = els.filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) { el.classList.add("in"); return false; }
        return true;
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
    revealVisible();
    // a couple of follow-up passes catch late layout/font shifts
    requestAnimationFrame(revealVisible);
    setTimeout(revealVisible, 400);
  }

  /* ---------- HERO ROTATOR ---------- */
  function heroRotator() {
    var items = document.querySelectorAll(".hero__rotator li");
    if (!items.length) return;
    var i = 0;
    items[0].classList.add("is-active");
    if (reduce) return;
    setInterval(function () {
      items[i].classList.remove("is-active");
      i = (i + 1) % items.length;
      items[i].classList.add("is-active");
    }, 1600);
  }

  /* ---------- HEADER STUCK + NAV SPY + MOBILE ---------- */
  function header() {
    var h = document.querySelector(".site-header");
    var links = Array.prototype.slice.call(document.querySelectorAll(".desktop-nav a[data-target]"));
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute("data-target")); });
    function onScroll() {
      if (h) h.classList.toggle("is-stuck", window.scrollY > 40);
      var mid = window.scrollY + window.innerHeight * 0.42;
      var active = -1;
      sections.forEach(function (s, idx) { if (s && s.offsetTop <= mid) active = idx; });
      links.forEach(function (a, idx) { a.classList.toggle("is-active", idx === active); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    // mobile toggle: simple smooth-scroll list via prompt-free menu
    var toggle = document.querySelector(".mobile-toggle");
    var menu = document.querySelector(".mobile-nav");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var open = menu.style.display === "grid";
        menu.style.display = open ? "none" : "grid";
      });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { menu.style.display = "none"; });
      });
    }
  }

  /* ---------- ENTRANCE SCENE ---------- */
  function entranceScene() {
    var scene = document.querySelector(".entrance");
    if (!scene) return;
    var img = scene.querySelector(".entrance__img");
    var bloom = scene.querySelector(".entrance__bloom");
    var copy = scene.querySelector(".scene__copy");
    function update() {
      var p = stickyProgress(scene);
      if (img) img.style.transform = "scale(" + (1.18 - p * 0.18).toFixed(3) + ") translateY(" + (-p * 4).toFixed(2) + "%)";
      if (bloom) bloom.style.opacity = (0.15 + p * 0.7).toFixed(3);
      if (copy) {
        var cp = clamp((p - 0.15) / 0.4, 0, 1);
        copy.style.opacity = cp.toFixed(3);
        copy.style.transform = "translateY(" + ((1 - cp) * 40).toFixed(1) + "px)";
      }
    }
    register(update);
  }

  /* ---------- PORTAL SCENE ---------- */
  function portalScene() {
    var scene = document.querySelector(".portal");
    if (!scene) return;
    var sky = scene.querySelector(".portal__sky");
    var cloudL = scene.querySelector(".portal__cloud--left");
    var cloudR = scene.querySelector(".portal__cloud--right");
    var cloudM = scene.querySelector(".portal__cloud--main");
    var video = scene.querySelector(".portal__video");
    var frame = scene.querySelector(".portal__frame");
    var copy = scene.querySelector(".scene__copy");
    var vid = video ? video.querySelector("video") : null;
    if (vid) { vid.play().catch(function () {}); }
    function update() {
      var p = stickyProgress(scene);
      if (sky) sky.style.transform = "scale(" + (1.06 + p * 0.06).toFixed(3) + ") translateY(" + (-p * 3).toFixed(2) + "%)";
      // clouds part outward as we descend
      if (cloudL) cloudL.style.transform = "translateX(" + (-p * 40).toFixed(1) + "%)";
      if (cloudR) cloudR.style.transform = "translateX(" + (p * 40).toFixed(1) + "%)";
      if (cloudM) cloudM.style.opacity = (1 - clamp((p - 0.2) / 0.4, 0, 1)).toFixed(3);
      // rain video fades in mid-scene, then fades to clearing
      if (video) {
        var vo = clamp((p - 0.25) / 0.25, 0, 1) * (1 - clamp((p - 0.75) / 0.2, 0, 1));
        video.style.opacity = vo.toFixed(3);
      }
      if (frame) {
        frame.style.transform = "scale(" + (1 + p * 0.12).toFixed(3) + ")";
        frame.style.opacity = clamp((p - 0.5) / 0.3, 0, 1).toFixed(3);
      }
      if (copy) {
        var cp = clamp((p - 0.2) / 0.3, 0, 1) * (1 - clamp((p - 0.82) / 0.15, 0, 1));
        copy.style.opacity = cp.toFixed(3);
        copy.style.transform = "translateY(" + ((1 - clamp((p - 0.2) / 0.3, 0, 1)) * 40).toFixed(1) + "px)";
      }
    }
    register(update);
  }

  /* ---------- RIVER SCENE (cards distribute left/right; intro scrolls) ---------- */
  function riverScene() {
    var scene = document.querySelector(".river");
    if (!scene) return;
    var img = scene.querySelector(".river__img img");
    var video = scene.querySelector(".river__img video");
    if (video) {
      if (reduce) { video.removeAttribute("autoplay"); video.pause(); } // honor reduced-motion: hold the poster frame
      else { video.muted = true; var pp = video.play(); if (pp && pp.catch) pp.catch(function () {}); }
    }
    var intro = scene.querySelector(".river__intro");
    var points = Array.prototype.slice.call(scene.querySelectorAll(".river-point"));
    function update() {
      var top = scene.getBoundingClientRect().top;
      var introH = intro ? intro.offsetHeight : 0;
      var range = scene.offsetHeight - introH - window.innerHeight;
      // progress across only the pinned (sticky) portion, after the intro has scrolled away
      var p = range > 0 ? clamp((-top - introH) / range, 0, 1) : 0;
      if (img) img.style.setProperty("--river-pan", (p * 100).toFixed(1) + "%");
      points.forEach(function (pt, idx) {
        // first card animates in just after the scene pins; rest spread across the scroll
        var trigger = 0.06 + (idx / points.length) * 0.7;
        pt.classList.toggle("in", p >= trigger - 0.02);
      });
    }
    register(update);
  }

  /* ---------- ORBIT PULSES (energy travels lines, nodes light up on hit) ---------- */
  function orbitPulses() {
    var svg = document.querySelector(".orbit__lines");
    if (!svg) return;
    var paths = Array.prototype.slice.call(svg.querySelectorAll("path"));
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".orbit__node"));
    var group = svg.querySelector(".orbit__pulses");
    if (!group) { group = document.createElementNS("http://www.w3.org/2000/svg", "g"); group.setAttribute("class", "orbit__pulses"); svg.appendChild(group); }
    group.innerHTML = "";
    var SVGNS = "http://www.w3.org/2000/svg";
    var pulses = paths.map(function (path, i) {
      var c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("r", "1.3"); c.setAttribute("class", "orbit__pulse");
      group.appendChild(c);
      return { c: c, path: path, len: path.getTotalLength(), phase: i / paths.length, prev: 0 };
    });
    function place(p, t) {
      var pt = p.path.getPointAtLength(p.len * t);
      p.c.setAttribute("cx", pt.x.toFixed(2)); p.c.setAttribute("cy", pt.y.toFixed(2));
    }
    pulses.forEach(function (p) { place(p, p.phase); });
    if (reduce) { pulses.forEach(function (p) { place(p, 0.5); }); return; }
    var hitTimers = [];
    function hit(i) {
      var n = nodes[i]; if (!n) return;
      n.classList.add("is-hit");
      clearTimeout(hitTimers[i]);
      hitTimers[i] = setTimeout(function () { n.classList.remove("is-hit"); }, 620);
    }
    var dur = 2860;
    function frame(now) {
      for (var i = 0; i < pulses.length; i++) {
        var p = pulses[i];
        var t = ((now / dur) + p.phase) % 1;
        if (t < p.prev) hit(i); // wrapped past the node end
        p.prev = t;
        place(p, t);
        var op = t < 0.1 ? t / 0.1 : (t > 0.86 ? Math.max(0, (1 - t) / 0.14) : 1);
        p.c.style.opacity = op.toFixed(2);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- KINETIC TYPEWRITER ---------- */
  function typeKinetic() {
    var box = document.querySelector(".kinetic[data-typing]");
    if (!box) return;
    var lines = Array.prototype.slice.call(box.querySelectorAll(".kinetic-line"));
    lines.forEach(function (line) {
      line.innerHTML = '<span class="kt"></span><span class="kt-accent"></span><b class="kt-caret"></b>';
    });
    function fill(line) {
      line.querySelector(".kt").textContent = line.getAttribute("data-plain");
      line.querySelector(".kt-accent").textContent = line.getAttribute("data-accent");
      var c = line.querySelector(".kt-caret"); if (c) c.parentNode.removeChild(c);
    }
    if (reduce) { lines.forEach(fill); return; }
    var started = false;
    function run() {
      if (started) return; started = true;
      var li = 0;
      function typeLine() {
        if (li >= lines.length) return;
        var line = lines[li];
        line.classList.add("is-typing");
        var plain = line.getAttribute("data-plain");
        var accent = line.getAttribute("data-accent");
        var ktp = line.querySelector(".kt");
        var kta = line.querySelector(".kt-accent");
        var i = 0;
        function stepPlain() {
          if (i <= plain.length) { ktp.textContent = plain.slice(0, i); i++; setTimeout(stepPlain, 34); return; }
          var j = 0;
          (function stepAccent() {
            if (j <= accent.length) { kta.textContent = accent.slice(0, j); j++; setTimeout(stepAccent, 46); return; }
            line.classList.remove("is-typing");
            var c = line.querySelector(".kt-caret"); if (c) c.parentNode.removeChild(c);
            li++; setTimeout(typeLine, 280);
          })();
        }
        stepPlain();
      }
      typeLine();
    }
    function check() {
      var r = box.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.82 && r.bottom > 0) run();
    }
    register(check);
    window.addEventListener("scroll", check, { passive: true });
    check();
  }

  /* ---------- SYSTEM nodes (auto cycle highlight) ---------- */
  function systemNodes() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".orbit__node"));
    if (!nodes.length || reduce) return;
    var i = 0;
    setInterval(function () {
      nodes.forEach(function (n) { n.classList.remove("is-active"); });
      nodes[i].classList.add("is-active");
      i = (i + 1) % nodes.length;
    }, 1800);
  }

  /* ---------- SCROLL PROGRESS ---------- */
  function scrollProgress() {
    var bar = document.querySelector(".scroll-progress i");
    if (!bar) return;
    function upd() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? (window.scrollY || doc.scrollTop) / max : 0;
      bar.style.width = (clamp(p, 0, 1) * 100).toFixed(2) + "%";
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd, { passive: true });
    upd();
  }

  /* ---------- MARQUEE duplicate for seamless loop ---------- */
  function marquees() {
    document.querySelectorAll(".marquee__track").forEach(function (track) {
      track.innerHTML = track.innerHTML + track.innerHTML;
    });
  }

  /* ---------- CONTACT FORM ---------- */
  function contactForm() {
    var form = document.querySelector(".contact-form");
    if (!form) return;
    var note = form.querySelector(".form-note");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();
      var msg = form.querySelector('[name="message"]').value.trim();
      var ok = name && /.+@.+\..+/.test(email) && msg.length > 4;
      note.className = "form-note show " + (ok ? "ok" : "err");
      note.textContent = ok
        ? "Thank you — your first drop is on its way. We'll be in touch shortly."
        : "Please add your name, a valid email, and a short message.";
      if (ok) form.reset();
    });
  }

  /* ---------- SMOOTH ANCHORS ---------- */
  function anchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href").slice(1);
        var t = id && document.getElementById(id);
        if (t) { e.preventDefault(); window.scrollTo({ top: t.offsetTop, behavior: reduce ? "auto" : "smooth" }); }
      });
    });
  }

  /* ---------- rAF scroll dispatcher ---------- */
  var updaters = [];
  function register(fn) { updaters.push(fn); }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      for (var i = 0; i < updaters.length; i++) updaters[i]();
      ticking = false;
    });
  }
  function runUpdaters() { for (var i = 0; i < updaters.length; i++) updaters[i](); }

  function kick() { runUpdaters(); }

  /* ---------- HERO VIDEO COVER (crop 16:9 iframe to fill container, no letterbox) ---------- */
  function coverHero() {
    var media = document.querySelector(".hero__media");
    var v = document.querySelector(".hero__video");
    if (!media || !v) return;
    var cw = media.offsetWidth, ch = media.offsetHeight;
    if (!cw || !ch) return;
    var ar = 16 / 9, w, h;
    if (cw / ch > ar) { w = cw; h = cw / ar; }
    else { h = ch; w = ch * ar; }
    v.style.width = Math.ceil(w) + "px";
    v.style.height = Math.ceil(h) + "px";
  }

  /* ---------- BOOT ---------- */
  function boot() {
    coverHero();
    rainCanvas();
    reveals();
    heroRotator();
    header();
    entranceScene();
    portalScene();
    riverScene();
    orbitPulses();
    typeKinetic();
    marquees();
    scrollProgress();
    contactForm();
    anchors();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("resize", coverHero, { passive: true });
    runUpdaters();
    startIntro();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
