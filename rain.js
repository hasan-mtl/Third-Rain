/* ============================================================
   RAIN - "Ink & Current" interactions · v2
   Header state · drawer w/ focus trap · scroll reveals · count-ups
   headline word cascade · console tilt · era rail · live run log
   ticker loop · contact form
   Reduced-motion is a first-class static state throughout.
   ============================================================ */
(function () {
  "use strict";

  // CSS gates entry states behind html.js so a no-JS visit sees everything.
  document.documentElement.classList.add("js");

  var reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = reduceMq.matches;
  if (reduceMq.addEventListener) {
    reduceMq.addEventListener("change", function (e) { reduce = e.matches; });
  }

  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Hero "dawn arc" + copy→water coupling. Shared across the headline-cycle
  // block and the WebGL water engine (same IIFE scope); also exposed for Tweaks.
  var HERO = {
    dawnOn: true,      // night breaks toward first light and back, on a slow loop
    dawnMax: 1,        // intensity ceiling (0..1)
    dawnTarget: 0,     // current drift value, driven continuously by the render loop
    couple: true,      // ripple across the basin on each phrase swap
    cycleMs: 3600,     // story pace between phrases (ms)
    noOcean: false,    // rain-logo-only mode: drop the WebGL ocean, rain falls into the dark
    markX: 0.5,        // horizontal center of the particle wordmark (0..1 of width)
    markY: 0,          // vertical center of the wordmark (0..1); 0 = engine default (upper)
    markScale: 1,      // size multiplier for the wordmark
    rainMul: 1,        // rain density multiplier
    splashMul: 1,      // splash/ripple size multiplier
    waterY: 0,         // splash line as a fraction of height; 0 = auto
    onCycle: null      // assigned by the water engine when it is live
  };
  window.__heroTweak = HERO;

  /* ---------- header shadow ---------- */
  var header = qs("[data-header]");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- headline word cascade ---------- */
  // Wrap each hero headline word in a span so CSS can stagger them in.
  // Skipped under reduced motion - the unsplit headline renders statically.
  var splitTarget = qs("[data-split]");
  if (splitTarget && !reduce) {
    var wi = 0;
    Array.prototype.slice.call(splitTarget.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        if (!node.textContent.trim()) return;
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) {
            frag.appendChild(document.createTextNode(tok));
            return;
          }
          var s = document.createElement("span");
          s.className = "w";
          s.style.setProperty("--wi", String(wi++));
          s.textContent = tok;
          frag.appendChild(s);
        });
        splitTarget.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        node.classList.add("w");
        node.style.setProperty("--wi", String(wi++));
      }
    });
  }

  /* ---------- console tilt (fine pointers only) ---------- */
  var tiltEl = qs("[data-tilt]");
  if (tiltEl && window.matchMedia("(pointer: fine)").matches) {
    var tiltZone = tiltEl.closest(".hero__panel") || tiltEl.parentElement;
    var tiltRaf = null;
    var tx = 0;
    var ty = 0;

    var applyTilt = function () {
      tiltRaf = null;
      tiltEl.style.transform =
        "rotateX(" + (-ty * 4).toFixed(2) + "deg) rotateY(" + (tx * 5).toFixed(2) + "deg)";
    };

    tiltZone.addEventListener("mousemove", function (e) {
      if (reduce) return;
      var r = tiltZone.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (tiltRaf === null) tiltRaf = requestAnimationFrame(applyTilt);
    });

    tiltZone.addEventListener("mouseleave", function () {
      if (tiltRaf !== null) {
        cancelAnimationFrame(tiltRaf);
        tiltRaf = null;
      }
      tiltEl.style.transform = "";
    });
  }

  /* ---------- hero outcome line: types itself out, live, phrase by phrase ---------- */
  var cycleEl = qs("[data-cycle]");
  if (cycleEl && !reduce) {
    var PHRASES = [
      "your low stock got reordered.",
      "every customer got a reply.",
      "your report arrived at 8:00.",
      "your blog posted itself."
    ];
    var N = PHRASES.length;
    cycleEl.classList.add("is-typing");
    cycleEl.textContent = "";              /* the typewriter IS this line's entrance */
    var pIdx = 0, chIdx = 0, deleting = false;
    var cycleHome = cycleEl.closest("section");
    var stalled = function () {
      return document.hidden || (cycleHome && cycleHome.classList.contains("is-offstage"));
    };
    var TYPE = 50, ERASE = 28, HOLD = 1750, GAP = 460;  /* per-char + pauses (ms) */
    var step = function () {
      if (stalled()) { window.setTimeout(step, 420); return; }   /* freeze offstage/hidden */
      var full = PHRASES[pIdx % N];
      if (!deleting) {
        chIdx += 1;
        cycleEl.textContent = full.slice(0, chIdx);
        if (chIdx >= full.length) {
          deleting = true;
          /* copy → water: each outcome that lands drops a ripple on the basin */
          if (HERO.couple && HERO.onCycle) HERO.onCycle(pIdx + 1);
          window.setTimeout(step, HOLD);
        } else {
          window.setTimeout(step, TYPE + Math.random() * 46);    /* a little human jitter */
        }
      } else {
        chIdx -= 1;
        cycleEl.textContent = full.slice(0, chIdx);
        if (chIdx <= 0) {
          deleting = false;
          pIdx += 1;
          window.setTimeout(step, GAP);
        } else {
          window.setTimeout(step, ERASE);
        }
      }
    };
    // let line 1's word cascade land, then start typing
    window.setTimeout(step, 1150);
  }

  /* ---------- hero video: gated, graded, battery-friendly ---------- */
  var heroVideo = qs(".hero__video");
  if (heroVideo) {
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    if (reduce || saveData || window.matchMedia("(max-width: 760px)").matches) {
      heroVideo.remove(); // the tint + gradients remain as the backdrop
    } else {
      var playVideo = function () {
        var p = heroVideo.play();
        if (p && p.catch) p.catch(function () {});
      };
      var videoZone = heroVideo.parentNode;
      playVideo();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !document.hidden) playVideo();
            else heroVideo.pause();
          });
        }, { threshold: 0.05 }).observe(videoZone);
      }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { heroVideo.pause(); return; }
        var r = videoZone.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) playVideo();
      });
    }
  }

  /* ---------- rain engine: layered drops + landing ripples ---------- */
  var rainCanvas = qs("[data-rain]");
  if (rainCanvas && !reduce) {
    var rctx = rainCanvas.getContext("2d");
    var rainDrops = [];
    var rainSplashes = [];
    var rainW = 0;
    var rainH = 0;
    var rainRaf = null;
    var rainLast = 0;
    var rainOn = false;
    var rainCount = window.matchMedia("(max-width: 760px)").matches ? 48 : 110;
    var rainMX = -9999;
    var rainMY = -9999;
    var rainSpray = [];
    var rainRings = [];
    var heroForRain = rainCanvas.closest(".hero");

    // the rain answers the visitor: drops part around the cursor,
    // and a click lands like a stone - spray + shockwave ring
    if (heroForRain) {
      heroForRain.addEventListener("mousemove", function (e) {
        var r = rainCanvas.getBoundingClientRect();
        rainMX = e.clientX - r.left;
        rainMY = e.clientY - r.top;
      });
      heroForRain.addEventListener("mouseleave", function () { rainMX = -9999; });
      heroForRain.addEventListener("pointerdown", function (e) {
        if (e.target.closest("a, button, input, textarea, select")) return;
        var r = rainCanvas.getBoundingClientRect();
        var bx = e.clientX - r.left;
        var by = e.clientY - r.top;
        rainRings.push({ x: bx, y: by, r: 2, max: 64, a: 0.5 });
        for (var s = 0; s < 12 && rainSpray.length < 60; s++) {
          var sprayAng = -Math.PI * (0.15 + Math.random() * 0.7);
          var spraySpd = 140 + Math.random() * 260;
          rainSpray.push({
            x: bx,
            y: by,
            vx: Math.cos(sprayAng) * spraySpd,
            vy: Math.sin(sprayAng) * spraySpd,
            life: 0.55 + Math.random() * 0.3
          });
        }
      });
    }

    var rainSize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      rainW = rainCanvas.clientWidth;
      rainH = rainCanvas.clientHeight;
      rainCanvas.width = Math.round(rainW * dpr);
      rainCanvas.height = Math.round(rainH * dpr);
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    var rainSeed = function (d, fromTop) {
      var layer = Math.random(); // 0 = far, 1 = near
      d.layer = layer;
      d.speed = 320 + layer * 520;
      d.drift = d.speed * 0.16; // wind
      d.len = 9 + layer * 16;
      d.alpha = 0.1 + layer * 0.36;
      d.width = 0.7 + layer * 0.9;
      d.x = Math.random() * (rainW * 1.2) - rainW * 0.1;
      d.y = fromTop ? -d.len - Math.random() * rainH * 0.3 : Math.random() * rainH;
      return d;
    };

    var rainStep = function (ts) {
      rainRaf = null;
      if (!rainOn) return;
      var dt = Math.min((ts - rainLast) / 1000 || 0.016, 0.05);
      rainLast = ts;
      rctx.clearRect(0, 0, rainW, rainH);
      rctx.lineCap = "round";

      for (var i = 0; i < rainDrops.length; i++) {
        var d = rainDrops[i];
        d.y += d.speed * dt;
        d.x += d.drift * dt;
        if (d.y > rainH * 0.965) {
          // near-layer drops land as a small water ripple
          if (d.layer > 0.62 && rainSplashes.length < 14) {
            rainSplashes.push({
              x: d.x,
              y: rainH * (0.955 + Math.random() * 0.035),
              r: 1,
              max: 13 + d.layer * 14,
              a: 0.5
            });
          }
          rainSeed(d, true);
          continue;
        }
        if (d.x > rainW + 40) d.x -= rainW + 80;
        if (rainMX > -999) {
          var ddx = d.x - rainMX;
          var ddy = d.y - rainMY;
          var dq = ddx * ddx + ddy * ddy;
          if (dq < 12100) { // cursor force field, 110px radius
            d.x += (ddx >= 0 ? 1 : -1) * (1 - Math.sqrt(dq) / 110) * 260 * dt;
          }
        }
        var ang = d.drift / d.speed;
        rctx.strokeStyle = "rgba(158, 222, 255," + d.alpha.toFixed(3) + ")";
        rctx.lineWidth = d.width;
        rctx.beginPath();
        rctx.moveTo(d.x, d.y);
        rctx.lineTo(d.x - ang * d.len, d.y - d.len);
        rctx.stroke();
      }

      for (var j = rainSplashes.length - 1; j >= 0; j--) {
        var sp = rainSplashes[j];
        sp.r += 46 * dt * (1 + sp.r / sp.max);
        sp.a -= 1.15 * dt;
        if (sp.a <= 0 || sp.r >= sp.max) {
          rainSplashes.splice(j, 1);
          continue;
        }
        rctx.strokeStyle = "rgba(125, 230, 255," + sp.a.toFixed(3) + ")";
        rctx.lineWidth = 1;
        rctx.beginPath();
        rctx.ellipse(sp.x, sp.y, sp.r, sp.r * 0.3, 0, 0, Math.PI * 2);
        rctx.stroke();
      }

      for (var k = rainSpray.length - 1; k >= 0; k--) {
        var sw = rainSpray[k];
        sw.life -= dt;
        if (sw.life <= 0) { rainSpray.splice(k, 1); continue; }
        sw.vy += 980 * dt; // gravity arcs
        sw.x += sw.vx * dt;
        sw.y += sw.vy * dt;
        rctx.fillStyle = "rgba(170, 230, 255," + Math.min(0.8, sw.life * 1.4).toFixed(3) + ")";
        rctx.fillRect(sw.x - 1, sw.y - 1, 2, 2.6);
      }

      for (var q = rainRings.length - 1; q >= 0; q--) {
        var rg = rainRings[q];
        rg.r += 150 * dt;
        rg.a -= 0.9 * dt;
        if (rg.a <= 0 || rg.r >= rg.max) { rainRings.splice(q, 1); continue; }
        rctx.strokeStyle = "rgba(140, 235, 255," + rg.a.toFixed(3) + ")";
        rctx.lineWidth = 1.4;
        rctx.beginPath();
        rctx.ellipse(rg.x, rg.y, rg.r, rg.r * 0.42, 0, 0, Math.PI * 2);
        rctx.stroke();
      }

      rainRaf = requestAnimationFrame(rainStep);
    };

    var rainStart = function () {
      if (rainOn) return;
      rainOn = true;
      rainLast = performance.now();
      rainSize();
      if (rainRaf === null) rainRaf = requestAnimationFrame(rainStep);
    };
    var rainStop = function () {
      rainOn = false;
      if (rainRaf !== null) { cancelAnimationFrame(rainRaf); rainRaf = null; }
    };

    for (var di = 0; di < rainCount; di++) rainDrops.push(rainSeed({}, false));

    window.addEventListener("resize", function () { if (rainOn) rainSize(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !document.hidden) rainStart();
          else rainStop();
        });
      }, { threshold: 0.02 }).observe(rainCanvas);
    } else {
      rainStart();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { rainStop(); return; }
      var r = rainCanvas.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) rainStart();
    });
  }

  /* ---------- ambient motes: droplets drifting through dark sections ---------- */
  if (!reduce) {
    qsa(".demo, .platform, .contact").forEach(function (section) {
      var wrap = document.createElement("div");
      wrap.className = "motes";
      wrap.setAttribute("aria-hidden", "true");
      for (var mi = 0; mi < 13; mi++) {
        var dot = document.createElement("i");
        dot.style.setProperty("--mx", (4 + Math.random() * 92).toFixed(1) + "%");
        dot.style.setProperty("--mt", (8 + Math.random() * 84).toFixed(1) + "%");
        dot.style.setProperty("--md", (9 + Math.random() * 12).toFixed(1) + "s");
        dot.style.setProperty("--mdel", (-Math.random() * 18).toFixed(1) + "s");
        dot.style.setProperty("--ms", (2 + Math.random() * 3).toFixed(1) + "px");
        dot.style.setProperty("--mdx", ((Math.random() - 0.5) * 70).toFixed(0) + "px");
        wrap.appendChild(dot);
      }
      section.appendChild(wrap);
    });
  }

  /* ---------- the basin: night sail (three.js) - the business sails, Rain delivers ---------- */
  var basinCanvas = qs("[data-basin]");
  var seaCanvas = qs("[data-sea]");
  if (basinCanvas && seaCanvas && !reduce && window.matchMedia("(min-width: 901px)").matches) {
    var sceneEl = basinCanvas.closest("[data-scene]");
    var bctx = basinCanvas.getContext("2d");

    // warm the module cache at idle - the ocean starts instantly when reached
    var warmThree = function () {
      var warm = document.createElement("link");
      warm.rel = "modulepreload";
      warm.href = "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.min.js";
      warm.crossOrigin = "anonymous";
      document.head.appendChild(warm);
    };
    if (window.requestIdleCallback) window.requestIdleCallback(warmThree, { timeout: 4000 });
    else window.setTimeout(warmThree, 1200);
    var bW = 0;
    var bH = 0;
    var bWy = 0;
    var bParts = [];
    var bDrops = [];
    var bRips = [];
    var bSprays = [];
    var bChips = [];
    // the services anchor in WORLD space (lateral lane wx, depth z0) and the
    // camera dolly carries them past the viewer like buoys
    var FLOAT_POS = [[0, 49], [34, 77], [21, 399], [45, 183], [-54, 245], [-41, 99]];
    var bFloat = [];
    var bFloatHits = [];
    var bFloatAge = 0;
    var bGlyphs = [];
    var bClusters = [];
    var bStreak = null;
    var bStreakAt = 4;
    var bRaf = null;
    var bOn = false;
    var bLast = 0;
    var bTime = 0;
    var bMX = -9999;
    var bMY = -9999;
    // one soft radial sprite, reused by mist and spray (never square points,
    // never a per-frame createRadialGradient)
    var bSoftSpr = null;
    var softSprite = function () {
      if (bSoftSpr) return bSoftSpr;
      bSoftSpr = document.createElement("canvas");
      bSoftSpr.width = 96;
      bSoftSpr.height = 96;
      var sc = bSoftSpr.getContext("2d");
      var sg = sc.createRadialGradient(48, 48, 0, 48, 48, 48);
      sg.addColorStop(0, "rgba(255, 255, 255, 1)");
      sg.addColorStop(0.55, "rgba(255, 255, 255, 0.42)");
      sg.addColorStop(1, "rgba(255, 255, 255, 0)");
      sc.fillStyle = sg;
      sc.fillRect(0, 0, 96, 96);
      return bSoftSpr;
    };

    var ssP = function (a, b, x) {
      var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    var bPar = 0;   // idle sway of the horizon (the camera breathing)
    var bCamX = 0;  // idle lateral sway
    var dawnLevel = 0; // eased value of the dawn arc fed to the shader

    // the camera is fixed; it only breathes - a barely perceptible ~10s sway
    var updIdle = function () {
      bPar = Math.sin(bTime * 0.6) * 1.8;
      bCamX = Math.sin(bTime * 0.63) * 1.2 + Math.sin(bTime * 0.29) * 0.8;
    };

    // shared camera model (the ocean build that earned the wow)
    var CAM_H = 14.0;
    var WORLD_SCALE = 0.07;
    var camFocal = function () { return bH * 0.95; };
    /* --- the WebGL ocean (three.js, lazy-loaded) --- */
    var seaLoadStarted = false;
    var seaReady = false;
    var seaRenderer = null;
    var seaSceneGl = null;
    var seaCam = null;
    var seaMat = null;
    var seaRipIdx = 0;

    var SEA_VERT = [
      "varying vec2 vUv;",
      "void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }"
    ].join("\n");

    var SEA_FRAG = [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform float uTime;",
      "uniform vec2 uRes;",
      "uniform float uHy;",
      "uniform float uCamH;",
      "uniform float uFocal;",
      "uniform float uScale;",
      "uniform float uCamX;",
      "uniform float uDawn;",
      "/* shore tuning - change these three, nothing else */",
      "const float DISSOLVE_HEIGHT = 0.12;",
      "const float LINE_OPACITY = 0.12;",
      "const float NOISE_AMPLITUDE = 10.0;",
      "",
      "float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
      "float vnoise(vec2 p){",
      "  vec2 i = floor(p); vec2 f = fract(p);",
      "  f = f*f*(3.0-2.0*f);",
      "  return mix(mix(hash21(i), hash21(i+vec2(1.0,0.0)), f.x),",
      "             mix(hash21(i+vec2(0.0,1.0)), hash21(i+vec2(1.0,1.0)), f.x), f.y);",
      "}",
      "float fbm(vec2 p){",
      "  return vnoise(p) * 0.6 + vnoise(p * 2.1 + 13.7) * 0.3 + vnoise(p * 4.3 + 41.0) * 0.15;",
      "}",
      "",
      "float waveH(vec2 p){",
      "  float t = uTime;",
      "  vec2 q = vec2(p.x, p.y - t * 1.0);",
      "  float h = 0.0;",
      "  h += sin(dot(q, vec2(0.9, 0.7)) + t * 0.9) * 0.42;",
      "  h += sin(dot(q, vec2(-0.6, 1.2)) + t * 0.7) * 0.3;",
      "  h += sin(dot(q, vec2(1.7, -0.4)) + t * 1.5) * 0.18;",
      "  h += (vnoise(q * 2.4 + t * 0.3) - 0.5) * 0.28;",
      "  return h;",
      "}",
      "",
      "void main(){",
      "  vec2 px = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y);",
      "  float horizon = uHy + sin(px.x * 0.01 + uTime * 0.6) * 1.0;",
      "  float dy = px.y - horizon;",
      "",
      "  if (dy <= 0.0) {",
      "    /* the night sky: two mist layers drifting apart, the horizon breathing */",
      "    float mFar = fbm(vec2(px.x * 0.004 + uTime * 0.014, px.y * 0.006 - uTime * 0.008));",
      "    float mNear = fbm(vec2(px.x * 0.0085 - uTime * 0.03, px.y * 0.011 + uTime * 0.006) + 4.7);",
      "    float horizonPull = exp(dy * 0.012);",
      "    float mist = clamp(mFar * 0.75 + mNear * 0.45, 0.0, 1.0) * horizonPull * 0.8;",
      "    vec3 col = mix(vec3(0.1, 0.2, 0.33), vec3(0.5, 0.64, 0.76), clamp(mist * 1.2, 0.0, 1.0));",
      "    col += vec3(0.36, 0.52, 0.66) * mNear * horizonPull * 0.18;",
      "    float alpha = mist * 0.42;",
      "    vec2 wordC = vec2(uRes.x * 0.5, uRes.y * 0.17);",
      "    float wglow = exp(-distance(px, wordC) * 0.005);",
      "    col += vec3(0.45, 0.75, 0.9) * wglow * 0.3;",
      "    alpha = max(alpha, wglow * 0.34);",
      "    float breathe = 0.86 + 0.14 * sin(uTime * 0.45 + vnoise(vec2(px.x * 0.002, 3.3)) * 2.6);",
      "    float horizGlow = exp(-abs(dy) * 0.07) * breathe;",
      "    col += vec3(0.5, 0.82, 0.92) * horizGlow * 0.42;",
      "    alpha = max(alpha, horizGlow * 0.5);",
      "    /* dawn: a warm band climbs from the waterline; the night sky warms */",
      "    float dHaze = exp(dy * 0.010);",
      "    float dBand = exp(dy * 0.024);",
      "    vec3 dawnLo = vec3(1.0, 0.50, 0.30);",
      "    vec3 dawnHi = vec3(1.0, 0.80, 0.52);",
      "    vec3 dawnCol = mix(dawnHi, dawnLo, dBand);",
      "    col = mix(col, col * 0.66 + dawnCol * 1.12, uDawn * dHaze * 0.92);",
      "    alpha = max(alpha, uDawn * dBand * 0.62);",
      "    gl_FragColor = vec4(col, alpha);",
      "    return;",
      "  }",
      "",
      "  /* the open ocean, full width, current running home */",
      "  float z = (uCamH * uFocal) / max(dy, 2.0);",
      "  /* the fold: the surface rolls over a soft radius and away from view */",
      "  float foldStart = uRes.y * 0.85;",
      "  float foldT = clamp((px.y - foldStart) / max(uRes.y - foldStart, 1.0), 0.0, 1.0);",
      "  float roll = foldT * foldT;",
      "  z *= 1.0 + roll * 2.5;",
      "  float wx = (px.x - uRes.x * 0.5) * z / uFocal;",
      "  vec2 wp = vec2(wx + uCamX, z) * uScale;",
      "",
      "  float eps = 0.06 + z * uScale * 0.012;",
      "  float hC = waveH(wp);",
      "  float hX = waveH(wp + vec2(eps, 0.0));",
      "  float hZ = waveH(wp + vec2(0.0, eps));",
      "  vec3 n = normalize(vec3(hC - hX, eps * 2.6, hC - hZ));",
      "  float zfade = exp(-z * uScale * 0.16);",
      "  /* two detail layers, ~6x apart in scale, different drift - close water gets texture */",
      "  vec2 dA = vec2(vnoise(wp * 5.5 + vec2(uTime * 0.34, -uTime * 0.21)) - 0.5,",
      "                 vnoise(wp * 5.5 + vec2(7.3 - uTime * 0.27, uTime * 0.31)) - 0.5);",
      "  vec2 dB = vec2(vnoise(wp * 0.9 + vec2(-uTime * 0.1, uTime * 0.14)) - 0.5,",
      "                 vnoise(wp * 0.9 + vec2(3.1 + uTime * 0.12, -uTime * 0.09)) - 0.5);",
      "  n = normalize(n + vec3(dA.x * 0.16 + dB.x * 0.1, 0.0, dA.y * 0.16 + dB.y * 0.1) * zfade);",
      "",
      "  vec3 viewPos = vec3(0.0, uCamH * uScale * 14.0, 0.0);",
      "  vec3 surfPos = vec3(wp.x * 14.0, hC, wp.y * 14.0);",
      "  vec3 viewDir = normalize(surfPos - viewPos);",
      "  vec3 lightDir = normalize(vec3(0.0, 0.6, 0.8));",
      "",
      "  float diff = max(dot(n, lightDir), 0.0);",
      "  vec3 ref = reflect(viewDir, n);",
      "  float spec = pow(max(dot(ref, lightDir), 0.0), mix(80.0, 150.0, zfade));",
      "  float gNear = 0.5 + 0.5 * step(0.55, hash21(floor(wp * 64.0) + floor(uTime * 7.0)));",
      "  float gFar = 0.55 + 0.45 * hash21(floor(wp * 140.0) + floor(uTime * 11.0));",
      "  spec *= mix(gFar, gNear, zfade);",
      "  float fres = pow(1.0 - max(dot(n, -viewDir), 0.0), 5.0);",
      "",
      "  vec3 deepCol = vec3(0.012, 0.058, 0.115);",
      "  vec3 subCol = vec3(0.03, 0.17, 0.24);",
      "  vec3 col = mix(deepCol, subCol, diff * 0.65);",
      "  vec3 skyCol = mix(vec3(0.05, 0.11, 0.2), vec3(0.3, 0.45, 0.57), 1.0 - zfade);",
      "  col = mix(col, skyCol, clamp(fres * (1.0 + (1.0 - zfade) * 0.25), 0.0, 0.9));",
      "  float path = exp(-abs(wx) * uScale * 1.1);",
      "  col += vec3(0.95, 1.0, 1.0) * spec * (0.7 + path * 0.5);",
      "  col += vec3(0.2, 0.5, 0.62) * path * (0.13 + diff * 0.12);",
      "  /* dawn on the water: warm the body, lay a gold sun-glitter down the path */",
      "  vec3 dawnWarm = vec3(1.0, 0.64, 0.40);",
      "  col = mix(col, col + dawnWarm * 0.18, uDawn);",
      "  col += dawnWarm * spec * path * uDawn * 2.2;",
      "  col += dawnWarm * path * uDawn * 0.12;",
      "",
      "  float waterMist = exp(-dy * 0.045);",
      "  col = mix(col, vec3(0.5, 0.65, 0.77), clamp(waterMist, 0.0, 1.0) * 0.7);",
      "  float alpha = 0.92;",
      "",
      "  /* the surface tilts from the light as it rolls; glass catches a sheen at the apex */",
      "  col *= 1.0 - roll * 0.16;",
      "  float apexY = foldStart + (uRes.y - foldStart) * 0.22;",
      "  float sheenS = (uRes.y - foldStart) * 0.34;",
      "  float sheen = exp(-(px.y - apexY) * (px.y - apexY) / (2.0 * sheenS * sheenS));",
      "  col += vec3(0.8, 0.88, 0.94) * sheen * foldT * 0.17 * (0.85 + 0.15 * vnoise(wp * 2.0 + vec2(uTime * 0.3, 0.0)));",
      "",
      "  /* the shore, minimal: one breathing dissolve + a hint of a waterline.",
      "     the END is pinned above the canvas edge - the bottom row is always",
      "     exact page paper, fully opaque; only the START breathes */",
      "  float shoreN = vnoise(vec2(px.x * 0.006, uTime * 0.083)) - 0.5;",
      "  float d0 = uRes.y * (1.0 - DISSOLVE_HEIGHT) + shoreN * 2.0 * NOISE_AMPLITUDE;",
      "  float d1 = uRes.y - 6.0;",
      "  float dissolve = smoothstep(d0, d1, px.y);",
      "  vec3 pageCol = vec3(0.98, 0.973, 0.961);",
      "  vec3 shoreMid = vec3(0.63, 0.68, 0.71);",
      "  float hazeT = pow(dissolve, 2.2);",
      "  col = mix(col, mix(shoreMid, pageCol, hazeT), hazeT);",
      "  alpha = mix(alpha, 1.0, dissolve);",
      "  float lm = mix(d0, d1, 0.62);",
      "  float lineBreak = smoothstep(0.3, 0.8, shoreN + 0.5);",
      "  float lineA = exp(-(px.y - lm) * (px.y - lm) * 0.9);",
      "  col = mix(col, vec3(0.72, 0.8, 0.86), lineA * lineBreak * LINE_OPACITY);",
      "",
      "  gl_FragColor = vec4(col, alpha);",
      "}"
    ].join("\n");

    var GLYPH_SET = ["</>", "{}", "01", "=>", "::", "ai"];

    var surfaceY = function (x) {
      return bWy + bPar + Math.sin(x * 0.01 + bTime * 0.6) * 1.0;
    };

    var seaResize = function () {
      if (!seaRenderer) return;
      /* bound total fragment work, not just the ratio - huge windows would
         otherwise melt integrated GPUs during the descent */
      var pr = Math.min(
        Math.min(window.devicePixelRatio || 1, 1.5),
        Math.max(0.9, Math.sqrt(2600000 / Math.max(bW * bH, 1)))
      );
      seaRenderer.setPixelRatio(pr);
      seaRenderer.setSize(bW, bH, false);
      seaMat.uniforms.uRes.value.set(bW, bH);
      seaMat.uniforms.uHy.value = bWy;
      seaMat.uniforms.uFocal.value = camFocal();
    };

    var seaInit = function (THREE) {
      try {
        seaRenderer = new THREE.WebGLRenderer({
          canvas: seaCanvas,
          alpha: true,
          antialias: false,
          premultipliedAlpha: false
        });
        seaRenderer.setClearColor(0x000000, 0);
        seaSceneGl = new THREE.Scene();
        seaCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        seaMat = new THREE.ShaderMaterial({
          transparent: true,
          depthTest: false,
          depthWrite: false,
          uniforms: {
            uTime: { value: 0 },
            uRes: { value: new THREE.Vector2(1, 1) },
            uHy: { value: 0 },
            uCamH: { value: CAM_H },
            uFocal: { value: 500 },
            uScale: { value: WORLD_SCALE },
            uCamX: { value: 0 },
            uDawn: { value: 0 }
          },
          vertexShader: SEA_VERT,
          fragmentShader: SEA_FRAG
        });
        seaSceneGl.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), seaMat));
        seaResize();
        seaReady = true;
      } catch (err) {
        seaReady = false;
      }
    };

    var basinSeedDrop = function (d, fromTop) {
      d.speed = (340 + Math.random() * 420) * (1 + ((HERO.rainMul || 1) - 1) * 0.16);
      d.drift = d.speed * 0.14;
      d.len = 9 + Math.random() * 13;
      d.alpha = 0.12 + Math.random() * 0.3;
      d.x = Math.random() * (bW * 1.15) - bW * 0.05;
      d.y = fromTop ? -d.len - Math.random() * bH * 0.4 : Math.random() * bWy;
      var t = Math.random();
      d.land = bWy + 8 + t * t * (bH - bWy - 48);
      d.scaleF = 0.3 + 0.7 * ((d.land - bWy) / Math.max(bH - bWy - 40, 1));
      return d;
    };

    var basinBuild = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      bW = basinCanvas.clientWidth;
      bH = basinCanvas.clientHeight;
      basinCanvas.width = Math.round(bW * dpr);
      basinCanvas.height = Math.round(bH * dpr);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bWy = bH * (HERO.waterY || (HERO.noOcean ? 0.94 : 0.52));

      bParts = [];
      var fontPx = Math.min(bW * 0.155, bH * 0.3, 225) * (HERO.markScale || 1);
      var off = document.createElement("canvas");
      off.width = bW;
      off.height = bH;
      var octx = off.getContext("2d");
      octx.font = "italic 600 " + Math.round(fontPx) + "px 'Cormorant Garamond', Georgia, serif";
      octx.textBaseline = "alphabetic";
      var met = octx.measureText("rain.");
      octx.fillStyle = "#fff";
      var baseY = HERO.markY ? bH * HERO.markY + fontPx * 0.35 : Math.max(bH * 0.25, fontPx * 0.78 + 28);
      octx.fillText("rain.", bW * (HERO.markX || 0.5) - met.width / 2, baseY);
      var img = octx.getImageData(0, 0, bW, bH).data;
      for (var yy = 0; yy < bH; yy += 3) {
        for (var xx = 0; xx < bW; xx += 3) {
          if (img[(yy * bW + xx) * 4 + 3] > 128) {
            bParts.push({
              tx: xx,
              ty: yy,
              x: Math.random() * bW,
              y: -Math.random() * bH * 1.6,
              fall: 280 + Math.random() * 340,
              hue: Math.random(),
              ph: Math.random() * 6.283,
              ox: 0,
              oy: 0
            });
            if (bParts.length >= 2200) { yy = bH; break; }
          }
        }
      }

      bChips = [];
      bFloat = [];
      var crect = basinCanvas.getBoundingClientRect();
      qsa(".basin-chip").forEach(function (chip, ci) {
        var r = chip.getBoundingClientRect();
        if (r.width > 2) {
          bChips.push({ x: r.left + r.width / 2 - crect.left, top: r.top - crect.top });
        }
        var fpos = FLOAT_POS[ci % FLOAT_POS.length];
        bFloat.push({ label: chip.textContent.trim(), wx: fpos[0], z0: fpos[1] });
      });
      if (seaReady) seaResize();

      if (!bDrops.length) {
        var bdN = Math.round(70 * (HERO.rainMul || 1));
        for (var bd = 0; bd < bdN; bd++) bDrops.push(basinSeedDrop({}, false));
      }

      bGlyphs = [];
      for (var gl2 = 0; gl2 < 6; gl2++) {
        bGlyphs.push({
          t: GLYPH_SET[gl2 % GLYPH_SET.length],
          x: Math.random() * bW,
          y: Math.random() * (bWy - 60) + 16,
          vx: (Math.random() - 0.5) * 10,
          vy: -(2 + Math.random() * 6),
          a: 0.08 + Math.random() * 0.12,
          s: 10 + Math.random() * 3,
          ph: Math.random() * 6.283
        });
      }
      bClusters = [];   /* node constellations removed (Mike: delete the UFO-like flying thing) */
    };

    // stand-in while three.js loads (or if WebGL fails)
    var drawFallbackWater = function () {
      bctx.strokeStyle = "rgba(170, 235, 255, 0.5)";
      bctx.lineWidth = 1.5;
      bctx.beginPath();
      bctx.moveTo(0, surfaceY(0));
      for (var cx2 = 8; cx2 <= bW; cx2 += 8) bctx.lineTo(cx2, surfaceY(cx2));
      bctx.stroke();
    };

    var basinStep = function (ts) {
      bRaf = null;
      if (!bOn) return;
      var dt = Math.min((ts - bLast) / 1000 || 0.016, 0.05);
      bLast = ts;
      bTime += dt;
      updIdle();
      var bBreath = 0.82 + 0.18 * Math.sin(bTime * 0.23); // one breath, shared
      bctx.clearRect(0, 0, bW, bH);

      var i;
      var p;

      /* sky: drifting code glyphs */
      bctx.textBaseline = "middle";
      for (i = 0; i < bGlyphs.length; i++) {
        var g = bGlyphs[i];
        g.x += (g.vx + Math.sin(bTime * 0.7 + g.ph) * 4) * dt;
        g.y += g.vy * dt;
        if (g.y < 8 || g.x < -30 || g.x > bW + 30) {
          g.x = Math.random() * bW;
          g.y = bWy - 70 - Math.random() * 30;
          g.t = GLYPH_SET[Math.floor(Math.random() * GLYPH_SET.length)];
        }
        bctx.font = g.s.toFixed(0) + "px 'Geist Mono', monospace";
        bctx.fillStyle = (i % 2 ? "rgba(125, 211, 252," : "rgba(94, 234, 212,") + (g.a * 0.55 * (0.72 + 0.28 * bBreath)).toFixed(3) + ")";
        bctx.fillText(g.t, g.x, g.y);
      }

      /* sky: node constellations */
      for (i = 0; i < bClusters.length; i++) {
        var cluster = bClusters[i];
        cluster.x += cluster.vx * dt;
        if (cluster.x < -40) cluster.x = bW + 30;
        if (cluster.x > bW + 40) cluster.x = -30;
        var pts = [];
        for (var n2 = 0; n2 < cluster.nodes.length; n2++) {
          var nd = cluster.nodes[n2];
          pts.push({
            x: cluster.x + Math.cos(nd.a + bTime * nd.w) * nd.r,
            y: cluster.y + Math.sin(nd.a + bTime * nd.w) * nd.r * 0.6
          });
        }
        bctx.strokeStyle = "rgba(125, 211, 252, 0.1)";
        bctx.lineWidth = 1;
        bctx.beginPath();
        for (var l2 = 0; l2 < pts.length; l2++) {
          var pA = pts[l2];
          var pB = pts[(l2 + 1) % pts.length];
          bctx.moveTo(pA.x, pA.y);
          bctx.lineTo(pB.x, pB.y);
        }
        bctx.stroke();
        for (var d2i = 0; d2i < pts.length; d2i++) {
          bctx.fillStyle = "rgba(158, 222, 255, 0.3)";
          bctx.fillRect(pts[d2i].x - 1, pts[d2i].y - 1, 2, 2);
        }
      }

      /* sky: occasional data streak */
      bStreakAt -= dt;
      if (bStreakAt <= 0 && !bStreak) {
        bStreak = {
          x: Math.random() * bW * 0.6 + bW * 0.2,
          y: 20 + Math.random() * bWy * 0.4,
          vx: 420 + Math.random() * 240,
          life: 0.55
        };
        bStreakAt = 6 + Math.random() * 4;
      }
      if (bStreak) {
        bStreak.life -= dt;
        if (bStreak.life <= 0) {
          bStreak = null;
        } else {
          bStreak.x += bStreak.vx * dt;
          var sgrad = bctx.createLinearGradient(bStreak.x - 70, bStreak.y, bStreak.x, bStreak.y);
          sgrad.addColorStop(0, "rgba(125, 230, 255, 0)");
          sgrad.addColorStop(1, "rgba(125, 230, 255," + (0.5 * bStreak.life / 0.55).toFixed(3) + ")");
          bctx.strokeStyle = sgrad;
          bctx.lineWidth = 1.2;
          bctx.beginPath();
          bctx.moveTo(bStreak.x - 70, bStreak.y + 7);
          bctx.lineTo(bStreak.x, bStreak.y);
          bctx.stroke();
        }
      }

      /* the ocean - WebGL, or the 2D stand-in until it loads. in rain-only
         mode we draw neither: no sea, no horizon - just the logo and the rain. */
      if (HERO.noOcean) {
        /* rain-logo-only: the waterline sits off the bottom, drops fall into dark */
      } else if (seaReady) {
        seaMat.uniforms.uTime.value = bTime;
        seaMat.uniforms.uHy.value = bWy + bPar;
        seaMat.uniforms.uCamX.value = bCamX;
        /* dawn arc: a continuous, autonomous drift - deep night blooms up to
           first light and eases back on a slow loop, so the sky is always
           perceptibly alive (not stepped to the text). smoothstep makes it
           linger in night and at the crest rather than racing through. */
        var DAWN_PERIOD = 28; // seconds for one full night→dawn→night cycle
        var drift = 0.5 - 0.5 * Math.cos((bTime / DAWN_PERIOD) * Math.PI * 2);
        drift = drift * drift * (3 - 2 * drift);
        HERO.dawnTarget = drift;
        var dTgt = HERO.dawnOn ? drift * HERO.dawnMax : 0;
        dawnLevel += (dTgt - dawnLevel) * Math.min(1, 0.5 * dt);
        seaMat.uniforms.uDawn.value = dawnLevel;
        seaRenderer.render(seaSceneGl, seaCam);
      } else {
        drawFallbackWater();
      }

      /* wordmark reflection shimmering on the water (skipped in rain-only mode) */
      if (!HERO.noOcean) {
        for (i = 0; i < bParts.length; i += 3) {
          p = bParts[i];
          if (Math.abs(p.y - p.ty) < 40) {
            var ry = (bWy + bPar) + ((bWy + bPar) - p.y) * 0.36;
            var rx = p.x + Math.sin(bTime * 1.6 + p.ty * 0.05) * 2.0;
            bctx.fillStyle = "rgba(140, 225, 240," + (0.07 + 0.05 * bBreath).toFixed(3) + ")";
            bctx.fillRect(rx, ry, 1.9, 1.6);
          }
        }
      }

      /* the services ride at anchor - little boats on the open water */
      bFloatAge += dt;
      bFloatHits.length = 0;
      var fFocal = bH * 0.95;
      for (i = 0; i < bFloat.length; i++) {
        var fs = bFloat[i];
        var aW = Math.max(0, Math.min(1, (bFloatAge - 0.4 - i * 0.22) * 1.2));
        if (aW <= 0) continue;
        aW = 1 - Math.pow(1 - aW, 3);
        /* slow drift along its own path - a few units per minute */
        var wxd = fs.wx + Math.sin(bTime * 0.026 + i * 1.7) * (2 + fs.z0 * 0.012);
        var zd = fs.z0 + Math.sin(bTime * 0.019 + i * 2.3) * (4 + fs.z0 * 0.04);
        /* never drift into the fold: clamp depth so the keel stays above the bend */
        var minZ = (CAM_H * fFocal) / Math.max(bH * 0.85 - bWy - bPar - 34, 60);
        if (zd < minZ) zd = minZ;
        var dyW = (CAM_H * fFocal) / zd;
        var fy = bWy + bPar + dyW;
        var fx2 = bW / 2 + (wxd - bCamX) * fFocal / zd;
        var fontPx2 = Math.max(16, Math.min(46, dyW * 0.21 + 8));
        var bobA = Math.min(8, dyW * 0.05);
        var yb = (Math.sin(bTime * 0.8 + i * 1.9) * 0.8 + Math.sin(bTime * 0.53 + i) * 0.4) * bobA + (1 - aW) * 14;
        var fRot = Math.sin(bTime * 0.7 + i * 2.1) * 0.04;
        var fPitch = 1 + Math.sin(bTime * 0.8 + i * 1.9 + 0.7) * 0.025;
        /* engineered hover: ease toward the lift, never snap */
        var hTgt = bFloatHover === i ? 1 : 0;
        fs.h = (fs.h || 0) + (hTgt - (fs.h || 0)) * Math.min(1, 9 * dt);
        fontPx2 *= 1 + fs.h * 0.05;
        bctx.save();
        bctx.translate(fx2, fy + yb);
        bctx.rotate(fRot);
        bctx.scale(1, fPitch);
        bctx.font = "italic 600 " + fontPx2.toFixed(1) + "px 'Cormorant Garamond', Georgia, serif";
        bctx.textAlign = "center";
        var fw = bctx.measureText(fs.label).width;
        /* the water seats the hull */
        bctx.fillStyle = "rgba(120, 220, 255," + ((0.05 + 0.03 * Math.sin(bTime * 1.4 + i) + fs.h * 0.05) * aW).toFixed(3) + ")";
        bctx.beginPath();
        bctx.ellipse(0, 4, fw * 0.6, fontPx2 * 0.26, 0, 0, Math.PI * 2);
        bctx.fill();
        /* crisp serif over a soft cyan halo - no blur, no mirror */
        bctx.fillStyle = "rgba(120, 225, 255," + ((0.15 + fs.h * 0.13) * aW).toFixed(3) + ")";
        bctx.save();
        bctx.scale(1.045, 1.08);
        bctx.fillText(fs.label, 0, 0.6);
        bctx.restore();
        bctx.fillStyle = "rgba(240, 250, 255," + (Math.min(1, 0.95 + fs.h * 0.05) * aW).toFixed(3) + ")";
        bctx.fillText(fs.label, 0, 0);
        bctx.restore();
        if (aW > 0.5) {
          bFloatHits.push({ idx: i, x: fx2 - fw / 2 - 10, y: fy + yb - fontPx2 - 5, w: fw + 20, h: fontPx2 + 14 });
        }
      }

      /* rain falling onto the receding water */
      bctx.lineCap = "round";
      for (i = 0; i < bDrops.length; i++) {
        var d = bDrops[i];
        d.y += d.speed * dt;
        d.x += d.drift * dt;
        if (d.y >= d.land + bPar) {
          if (bRips.length < 40) {
            bRips.push({
              x: d.x,
              y: d.land + bPar,
              r: 1,
              max: (8 + Math.random() * 9) * d.scaleF * (HERO.splashMul || 1),
              a: 0.3 + 0.2 * d.scaleF,
              sf: d.scaleF * (HERO.splashMul || 1)
            });
          }
          if (d.scaleF > 0.55 && bSprays.length < 150) {
            var spN = (HERO.splashMul || 1) > 1.3 ? 2 : 1;
            for (var spi = 0; spi < spN; spi++) {
              bSprays.push({
                x: d.x,
                y: d.land + bPar,
                vx: (Math.random() - 0.5) * 110 * d.scaleF * (HERO.splashMul || 1),
                vy: -(55 + Math.random() * 110) * d.scaleF * (HERO.splashMul || 1),
                life: 0.32 + Math.random() * 0.24
              });
            }
          }
          basinSeedDrop(d, true);
          continue;
        }
        if (d.x > bW + 30) d.x -= bW + 60;
        bctx.strokeStyle = "rgba(158, 222, 255," + (d.alpha * bBreath).toFixed(3) + ")";
        bctx.lineWidth = 1;
        bctx.beginPath();
        bctx.moveTo(d.x, d.y);
        bctx.lineTo(d.x - (d.drift / d.speed) * d.len, d.y - d.len);
        bctx.stroke();
      }

      /* splash spray */
      for (i = bSprays.length - 1; i >= 0; i--) {
        var sw = bSprays[i];
        sw.life -= dt;
        if (sw.life <= 0) { bSprays.splice(i, 1); continue; }
        sw.vy += 980 * dt;
        sw.x += sw.vx * dt;
        sw.y += sw.vy * dt;
        bctx.globalAlpha = Math.min(0.7, sw.life * 1.6);
        var ss = 4.4 * (HERO.splashMul || 1);
        bctx.drawImage(softSprite(), sw.x - ss / 2, sw.y - ss / 2, ss, ss);
      }
      bctx.globalAlpha = 1;

      /* rings on the water */
      for (i = bRips.length - 1; i >= 0; i--) {
        var rp = bRips[i];
        rp.r += 42 * dt * (1 + rp.r / rp.max);
        rp.a -= 1.05 * dt;
        if (rp.a <= 0 || rp.r >= rp.max) { bRips.splice(i, 1); continue; }
        bctx.strokeStyle = "rgba(125, 230, 255," + rp.a.toFixed(3) + ")";
        bctx.lineWidth = 0.6 + 0.5 * (rp.sf || 1);
        bctx.beginPath();
        bctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.24, 0, 0, Math.PI * 2);
        bctx.stroke();
      }

      /* the wordmark, assembled drop by drop */
      for (i = 0; i < bParts.length; i++) {
        p = bParts[i];
        if (p.y < p.ty - 120) {
          p.y += p.fall * dt;
          p.x += (p.tx - p.x) * Math.min(1, 1.6 * dt);
        } else {
          p.x += (p.tx - p.x) * Math.min(1, 7 * dt);
          p.y += (p.ty - p.y) * Math.min(1, 7 * dt);
        }
        var dx = (p.x + p.ox) - bMX;
        var dy2b = (p.y + p.oy) - bMY;
        var pd2 = dx * dx + dy2b * dy2b;
        if (pd2 < 6400) {
          var dd = Math.sqrt(pd2) || 1;
          var f = (80 - dd) / 80;
          p.ox += (dx / dd) * f * 1000 * dt;
          p.oy += (dy2b / dd) * f * 1000 * dt;
        }
        p.ox += -p.ox * Math.min(1, 5 * dt);
        p.oy += -p.oy * Math.min(1, 5 * dt);
        var tw = 0.52 + 0.38 * Math.sin(bTime * 2.2 + p.ph * 2);
        bctx.fillStyle = p.hue < 0.5
          ? "rgba(158, 218, 255," + Math.max(0.24, tw).toFixed(3) + ")"
          : "rgba(128, 240, 218," + Math.max(0.24, tw).toFixed(3) + ")";
        bctx.fillRect(
          p.x + p.ox + Math.sin(bTime * 1.8 + p.ph) * 0.7 - 1.2,
          p.y + p.oy + Math.cos(bTime * 1.5 + p.ph) * 0.7 - 1.2 + bPar * 0.5,
          2.4,
          2.4
        );
      }

      bRaf = requestAnimationFrame(basinStep);
    };

    var basinStart = function () {
      if (bOn) return;
      bOn = true;
      bLast = performance.now();
      sceneEl.classList.add("basin--live"); // hide the chips BEFORE measuring
      if (!bParts.length) basinBuild();
      if (!seaLoadStarted) {
        seaLoadStarted = true;
        import("https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.min.js")
          .then(function (THREE) { seaInit(THREE); })
          .catch(function () { /* fallback stays */ });
      }
      sceneEl.classList.add("has-basin");
      if (bRaf === null) bRaf = requestAnimationFrame(basinStep);
    };
    var basinStop = function () {
      bOn = false;
      if (bRaf !== null) { cancelAnimationFrame(bRaf); bRaf = null; }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        bParts = [];
        if (bOn) basinBuild();
      });
    }

    var bFloatHover = -1;
    var floatHitAt = function (x, y) {
      for (var fh = 0; fh < bFloatHits.length; fh++) {
        var hr = bFloatHits[fh];
        if (x >= hr.x && x <= hr.x + hr.w && y >= hr.y && y <= hr.y + hr.h) return hr.idx;
      }
      return -1;
    };
    sceneEl.addEventListener("mousemove", function (e) {
      var r = basinCanvas.getBoundingClientRect();
      bMX = e.clientX - r.left;
      bMY = e.clientY - r.top;
      bFloatHover = floatHitAt(bMX, bMY);
      sceneEl.style.cursor = bFloatHover >= 0 ? "pointer" : "";
    });
    sceneEl.addEventListener("mouseleave", function () {
      bMX = -9999;
      bMY = -9999;
      bFloatHover = -1;
      sceneEl.style.cursor = "";
    });
    sceneEl.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button")) return;
      var r = basinCanvas.getBoundingClientRect();
      if (floatHitAt(e.clientX - r.left, e.clientY - r.top) >= 0) {
        var target = document.querySelector(".c2-sec");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // copy → water coupling: the water engine owns bRips/bSprays, so it hands
    // the headline-cycle a callback that lands a broad ripple + a little spray.
    HERO.onCycle = function () {
      if (!bOn) return;
      var rx = bW * (0.34 + Math.random() * 0.32);
      var ry = bWy + bPar + (bH - bWy) * (0.26 + Math.random() * 0.12);
      bRips.push({ x: rx, y: ry, r: 3, max: 120, a: 0.5, sf: 1.6 });
      for (var s = 0; s < 8 && bSprays.length < 90; s++) {
        bSprays.push({
          x: rx, y: ry,
          vx: (Math.random() - 0.5) * 120,
          vy: -(50 + Math.random() * 90),
          life: 0.4 + Math.random() * 0.25
        });
      }
    };

    var basinResizeT;
    window.addEventListener("resize", function () {
      window.clearTimeout(basinResizeT);
      basinResizeT = window.setTimeout(function () {
        bParts = [];
        bDrops = [];
        if (bOn) basinBuild();
      }, 200);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !document.hidden) basinStart();
          else basinStop();
        });
      }, { threshold: 0.12 }).observe(sceneEl);
    } else {
      basinStart();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { basinStop(); return; }
      var r = sceneEl.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) basinStart();
    });

  }

  /* ---------- hero depth: background layers follow the pointer ---------- */
  var heroSec = qs(".hero");
  if (heroSec && window.matchMedia("(pointer: fine)").matches) {
    var depthMedia = qs(".hero__media", heroSec);
    var depthGrid = qs(".circuit-grid", heroSec);
    var depthRaf = null;
    var dpx = 0;
    var dpy = 0;
    var applyDepth = function () {
      depthRaf = null;
      if (depthMedia) {
        depthMedia.style.transform =
          "translate3d(" + (dpx * -10).toFixed(1) + "px," + (dpy * -7).toFixed(1) + "px,0) scale(1.05)";
      }
      if (depthGrid) {
        depthGrid.style.transform =
          "translate3d(" + (dpx * 16).toFixed(1) + "px," + (dpy * 11).toFixed(1) + "px,0)";
      }
    };
    heroSec.addEventListener("mousemove", function (e) {
      if (reduce) return;
      var r = heroSec.getBoundingClientRect();
      dpx = (e.clientX - r.left) / r.width - 0.5;
      dpy = (e.clientY - r.top) / r.height - 0.5;
      if (depthRaf === null) depthRaf = requestAnimationFrame(applyDepth);
    });
    heroSec.addEventListener("mouseleave", function () {
      if (depthMedia) depthMedia.style.transform = "";
      if (depthGrid) depthGrid.style.transform = "";
    });
  }

  /* ---------- hero parallax (console drifts against the scroll) ---------- */
  var heroPanel = qs(".hero__panel");
  if (heroPanel) {
    var parRaf = null;
    var applyParallax = function () {
      parRaf = null;
      if (reduce) { heroPanel.style.translate = ""; return; }
      var y = Math.min(window.scrollY, 800);
      heroPanel.style.translate = "0 " + (y * -0.045).toFixed(1) + "px";
    };
    window.addEventListener("scroll", function () {
      if (parRaf === null) parRaf = requestAnimationFrame(applyParallax);
    }, { passive: true });
  }

  /* magnetic primary buttons REMOVED (Mike: the button must not move/shake on hover -
     it stays put and only changes colour, which the CSS :hover already does). */

  /* ---------- console rows pulse like live jobs ---------- */
  var pingRows = qsa(".console-row");
  if (pingRows.length && !reduce) {
    var pingIdx = 0;
    window.setInterval(function () {
      if (document.hidden) return;
      var row = pingRows[pingIdx % pingRows.length];
      pingIdx += 1;
      row.classList.add("is-ping");
      window.setTimeout(function () { row.classList.remove("is-ping"); }, 1200);
    }, 5200);
  }

  /* ---------- mobile drawer (focus trapped) ---------- */
  var toggle = qs("[data-menu-toggle]");
  var drawer = qs("[data-drawer]");
  var drawerOpen = false;

  function focusables(root) {
    return qsa('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function setDrawer(open) {
    if (!header || !toggle || !drawer) return;
    drawerOpen = open;
    header.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("no-scroll", open);
    if (open) {
      var f = focusables(drawer);
      if (f.length) f[0].focus();
    }
  }

  if (toggle && drawer) {
    toggle.addEventListener("click", function () { setDrawer(!drawerOpen); });

    qsa("[data-drawer-link]").forEach(function (link) {
      link.addEventListener("click", function () { setDrawer(false); });
    });

    document.addEventListener("keydown", function (e) {
      if (!drawerOpen) return;
      if (e.key === "Escape") {
        setDrawer(false);
        toggle.focus();
        return;
      }
      if (e.key !== "Tab") return;
      var f = [toggle].concat(focusables(drawer));
      if (!f.length) return;
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    var deskMq = window.matchMedia("(min-width: 1081px)");
    var onDesk = function (e) { if (e.matches && drawerOpen) setDrawer(false); };
    if (deskMq.addEventListener) deskMq.addEventListener("change", onDesk);
  }

  /* ---------- scroll reveals ---------- */
  var revealEls = qsa("[data-reveal]");
  var revealDone = function (el) {
    var idx = parseFloat(getComputedStyle(el).getPropertyValue("--i")) || 0;
    window.setTimeout(function () { el.classList.add("is-done"); }, idx * 90 + 820);
  };
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-in");
      el.classList.add("is-done");
    });
  } else if (revealEls.length) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealDone(entry.target);
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- decorative animations sleep off-screen ---------- */
  if ("IntersectionObserver" in window) {
    var gateIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle("is-offstage", !en.isIntersecting);
      });
    }, { rootMargin: "14% 0px" });
    qsa("section, .ticker").forEach(function (sec) { gateIO.observe(sec); });
  }

  /* ---------- count-up numerals ---------- */
  function runCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    if (reduce) { el.textContent = String(target); return; }
    var dur = 1400;
    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var countEls = qsa("[data-count]");
  if (reduce || !("IntersectionObserver" in window)) {
    countEls.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  } else if (countEls.length) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    countEls.forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- "You ask. It's done." - scenario engine ---------- */
  // One engine drives the chips, the chat, the connector pulse, and the
  // result card so the whole section plays as a single demonstration.
  var demoGrid = qs(".demo__grid");
  if (demoGrid) {
    var chatBody = qs("[data-chat-body]", demoGrid);
    var chips = qsa("[data-scenario]");
    var views = qsa("[data-view]", demoGrid);
    var pulseEl = qs("[data-pulse]", demoGrid);
    var reportNums = qsa("[data-report-num]", demoGrid);
    var reportBadge = qs("[data-report-badge]", demoGrid);

    var SCENARIOS = {
      social: { user: "Post today's promo to Facebook & Instagram 📸", reply: "Done ✅ Posted to Facebook + Instagram. Caption and image ready.", view: "social" },
      content: { user: "Write a blog on cold brew \u2014 publish Monday 7am \u2615", reply: "Done \u2705 Drafted, image ready, scheduled Mon 7:00.", view: "post" },
      restock: { user: "We're low for Friday - restock the café & kitchen.", reply: "📦 Ordered: coffee beans, oat milk & fresh produce, delivery Friday before 4pm.", view: "order" },
      replies: { user: "Answer the chat widget on our clinic site.", reply: "💬 18 patient chats handled - 4 consults booked, 2 flagged for you.", view: "inbox" }
    };
    var SCN_ORDER = ["social", "content", "restock", "replies"];

    var scnTimers = [];
    var scnTyping = null;
    var scnTouched = false;
    var scnStarted = false;
    var scnIdx = 0;
    var scnAuto = null;

    var scnWait = function (fn, ms) { scnTimers.push(window.setTimeout(fn, ms)); };
    var scnClear = function () {
      scnTimers.forEach(window.clearTimeout);
      scnTimers = [];
      if (scnTyping && scnTyping.parentNode) scnTyping.parentNode.removeChild(scnTyping);
      scnTyping = null;
    };

    var chatMsg = function (role, text) {
      var el = document.createElement("p");
      el.className = "chat__msg chat__msg--" + role;
      el.textContent = text;
      chatBody.appendChild(el);
      while (chatBody.children.length > 5) chatBody.removeChild(chatBody.firstElementChild);
    };

    var setReportNum = function (el, value) {
      var prefix = el.getAttribute("data-report-prefix") || "";
      el.textContent = prefix + value.toLocaleString("en-US");
    };

    var assembleReport = function (instant) {
      if (!reportBadge) return;
      if (instant) {
        reportNums.forEach(function (el) { setReportNum(el, parseInt(el.getAttribute("data-report-num"), 10)); });
        reportBadge.textContent = "Delivered \u2713";
        reportBadge.classList.add("is-done");
        return;
      }
      reportBadge.textContent = "Preparing\u2026";
      reportBadge.classList.remove("is-done");
      reportNums.forEach(function (el) { setReportNum(el, 0); });
      scnWait(function () {
        reportNums.forEach(function (el) {
          var target = parseInt(el.getAttribute("data-report-num"), 10);
          var start = null;
          var tick = function (ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / 1000, 1);
            setReportNum(el, Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }, 200);
      scnWait(function () {
        reportBadge.textContent = "Delivered \u2713";
        reportBadge.classList.add("is-done");
      }, 1600);
    };

    var showView = function (key, instant) {
      var target = null;
      views.forEach(function (v) {
        var on = v.getAttribute("data-view") === key;
        v.classList.toggle("is-active", on);
        if (on) target = v;
        else v.classList.remove("is-live");
      });
      if (!target) return;
      target.classList.remove("is-live");
      void target.offsetWidth; // restart the assemble transitions
      target.classList.add("is-live");
    };

    var setChip = function (key) {
      chips.forEach(function (c) {
        var on = c.getAttribute("data-scenario") === key;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };

    var runScenario = function (key, immediate) {
      var t = SCENARIOS[key];
      if (!t) return;
      scnClear();
      setChip(key);
      // each task shows its own clean exchange — never pile scenarios together
      chatBody.innerHTML = "";
      // a user tap resolves instantly (the typing theater is only for autoplay)
      if (reduce || immediate) {
        chatMsg("user", t.user);
        chatMsg("agent", t.reply);
        showView(t.view, true);
        return;
      }
      chatMsg("user", t.user);
      if (pulseEl) {
        pulseEl.classList.remove("is-firing");
        void pulseEl.offsetWidth;
        pulseEl.classList.add("is-firing");
      }
      scnWait(function () {
        scnTyping = document.createElement("div");
        scnTyping.className = "chat__typing";
        scnTyping.innerHTML = "<i></i><i></i><i></i>";
        chatBody.appendChild(scnTyping);
      }, 380);
      scnWait(function () {
        if (scnTyping && scnTyping.parentNode) scnTyping.parentNode.removeChild(scnTyping);
        scnTyping = null;
        chatMsg("agent", t.reply);
        showView(t.view, false);
      }, 1500);
    };

    var scnStop = function () {
      if (scnAuto !== null) { window.clearInterval(scnAuto); scnAuto = null; }
    };
    var scnPlay = function () {
      if (scnAuto !== null || scnTouched || reduce || document.hidden) return;
      if (!scnStarted) {
        scnStarted = true;
        scnWait(function () { runScenario(SCN_ORDER[0]); }, 500);
      }
      scnAuto = window.setInterval(function () {
        scnIdx = (scnIdx + 1) % SCN_ORDER.length;
        runScenario(SCN_ORDER[scnIdx]);
      }, 7800);
    };

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        scnTouched = true;
        scnStop();
        scnIdx = SCN_ORDER.indexOf(chip.getAttribute("data-scenario"));
        runScenario(chip.getAttribute("data-scenario"), true);
      });
    });

    if (reduce) {
      runScenario("social");
    } else {
      demoGrid.addEventListener("mouseenter", scnStop);
      demoGrid.addEventListener("mouseleave", scnPlay);
      if ("IntersectionObserver" in window) {
        var scnIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !document.hidden) scnPlay();
            else scnStop();
          });
        }, { threshold: 0.25 });
        scnIO.observe(demoGrid);
      } else {
        scnPlay();
      }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { scnStop(); return; }
        var r = demoGrid.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) scnPlay();
      });
    }
  }

  /* ---------- active nav link ---------- */
  var navLinks = qsa("[data-nav]");
  if (navLinks.length && "IntersectionObserver" in window) {
    var sectionsById = {};
    navLinks.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (section) sectionsById[id] = link;
    });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = sectionsById[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) {
            l.classList.remove("is-active");
            l.removeAttribute("aria-current");
          });
          link.classList.add("is-active");
          link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(sectionsById).forEach(function (id) {
      navIO.observe(document.getElementById(id));
    });
  }

  /* ---------- ticker: duplicate track for a seamless loop ---------- */
  var ticker = qs("[data-ticker]");
  if (ticker && !reduce) {
    ticker.innerHTML += ticker.innerHTML;
  }

  /* ---------- live run log ---------- */
  var __runlogs = qsa("[data-runlog]");
  if (__runlogs.length && !reduce) __runlogs.forEach(function (runlog) {
    var LOG_LINES = [
      ["10:05", "Review request sent to the Garcias"],
      ["06:12", "After-hours lead → water heater quote drafted"],
      ["07:58", "Morning report sent: jobs, revenue, leads"],
      ["08:40", "Estimate follow-up: Hendersons reminded (day 3)"],
      ["11:20", "Website chat answered, quote requested"],
      ["13:02", "New 5-star review replied to and reposted"],
      ["14:35", "Quote sent: kitchen remodel, $8,400"],
      ["16:10", "Tomorrow's schedule confirmed with 6 crews"],
      ["17:45", "Invoice paid: Patel job, marked complete"],
      ["09:30", "Lead from Google chased, booked for Tuesday"]
    ];
    var logIndex = 0;
    var logTimer = null;
    var MAX_LINES = 4;

    function pushLine() {
      var data = LOG_LINES[logIndex % LOG_LINES.length];
      logIndex += 1;
      var li = document.createElement("li");
      li.className = "is-new";
      var time = document.createElement("span");
      time.textContent = data[0];
      li.appendChild(time);
      li.appendChild(document.createTextNode(data[1]));
      runlog.appendChild(li);
      while (runlog.children.length > MAX_LINES) {
        runlog.removeChild(runlog.firstElementChild);
      }
    }

    function startLog() {
      if (logTimer !== null) return;
      logTimer = window.setInterval(pushLine, 2600);
    }
    function stopLog() {
      if (logTimer === null) return;
      window.clearInterval(logTimer);
      logTimer = null;
    }

    if ("IntersectionObserver" in window) {
      var logIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) startLog();
          else stopLog();
        });
      }, { threshold: 0.2 });
      logIO.observe(runlog);
    } else {
      startLog();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopLog();
      else if (!("IntersectionObserver" in window)) startLog();
      else {
        var r = runlog.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) startLog();
      }
    });
  });

  /* ---------- contact form ---------- */
  var form = qs("[data-form]");
  if (form) {
    var note = qs("[data-form-note]", form);
    var nameInput = qs("#f-name", form);
    var emailInput = qs("#f-email", form);
    var msgInput = qs("#f-msg", form);
    var submitBtn = qs(".contact-form__submit", form);

    function setNote(text, kind) {
      if (!note) return;
      note.textContent = text;
      note.classList.remove("is-error", "is-success");
      if (kind) note.classList.add(kind === "error" ? "is-error" : "is-success");
    }

    function markInvalid(input, invalid) {
      if (!input) return;
      input.classList.toggle("is-invalid", invalid);
      if (invalid) {
        input.setAttribute("aria-invalid", "true");
        input.classList.remove("is-shake");
        void input.offsetWidth; // restart the shake even on repeat rejections
        input.classList.add("is-shake");
      } else {
        input.removeAttribute("aria-invalid");
        input.classList.remove("is-shake");
      }
    }

    [nameInput, emailInput, msgInput].forEach(function (input) {
      if (!input) return;
      input.addEventListener("input", function () {
        markInvalid(input, false);
        setNote("", null);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = nameInput ? nameInput.value.trim() : "";
      var email = emailInput ? emailInput.value.trim() : "";
      var message = msgInput ? msgInput.value.trim() : "";
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

      markInvalid(nameInput, !name);
      markInvalid(emailInput, !emailOk);

      if (!name || !emailOk) {
        setNote(!name && !emailOk
          ? "Add your name and a valid email so we can reply."
          : (!name ? "Add your name so we know who to reply to." : "That email doesn't look right. Mind checking it?"), "error");
        (!name ? nameInput : emailInput).focus();
        return;
      }

      var subject = "Refresh request - " + name;
      var bodyLines = [
        "Name: " + name,
        "Email: " + email,
        "",
        "Where the manual work piles up:",
        (message || "(they left this blank - follow up)")
      ];
      var href = "mailto:hello@rain.studio" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyLines.join("\n"));

      if (submitBtn) {
        submitBtn.classList.add("is-sent");
        submitBtn.innerHTML =
          '<svg class="btn__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8.5l3.6 3.6L13.5 4.5"/></svg>Opening your email app…';
      }
      setNote("Your email app should open with everything pre-filled. Nothing arrive? Write us at hello@rain.studio.", "success");
      window.location.href = href;
    });
  }

  /* ---------- footer year ---------- */
  var yearEl = qs("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
