/* ============================================================
   RAIN — "Ink & Current" interactions · v2
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

  /* ---------- header shadow ---------- */
  var header = qs("[data-header]");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- headline word cascade ---------- */
  // Wrap each hero headline word in a span so CSS can stagger them in.
  // Skipped under reduced motion — the unsplit headline renders statically.
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

  /* ---------- hero outcome line cycles through results ---------- */
  var cycleEl = qs("[data-cycle]");
  if (cycleEl && !reduce) {
    var PHRASES = [
      "every customer got a reply.",
      "your report arrived at 8:00.",
      "your low stock got reordered.",
      "your blog posted itself."
    ];
    var cycleIdx = 0;
    var doCycle = function () {
      cycleEl.classList.add("is-cycling", "is-swapping");
      window.setTimeout(function () {
        cycleEl.textContent = PHRASES[cycleIdx % PHRASES.length];
        cycleIdx += 1;
        cycleEl.classList.remove("is-swapping");
      }, 330);
    };
    // let the entrance cascade land before the first swap
    window.setTimeout(function () {
      window.setInterval(function () {
        if (!document.hidden) doCycle();
      }, 3600);
    }, 3000);
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
    // and a click lands like a stone — spray + shockwave ring
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

  /* ---------- the basin: night sail (three.js) — the business sails, Rain delivers ---------- */
  var basinCanvas = qs("[data-basin]");
  var seaCanvas = qs("[data-sea]");
  if (basinCanvas && seaCanvas && !reduce && window.matchMedia("(min-width: 901px)").matches) {
    var sceneEl = basinCanvas.closest("[data-scene]");
    var bctx = basinCanvas.getContext("2d");
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
    var FLOAT_POS = [[-30, 160], [24, 177], [-18, 194], [48, 211], [-40, 228], [12, 245]];
    var bFloat = [];
    var bFloatHits = [];
    var bFloatAge = 0;
    var bGlyphs = [];
    var bClusters = [];
    var bSurf = [];
    var bStreak = null;
    var bStreakAt = 4;
    var bRaf = null;
    var bOn = false;
    var bLast = 0;
    var bTime = 0;
    var bMX = -9999;
    var bMY = -9999;
    var bScroll = 0.5; // scene progress through the viewport
    var bPar = 0;      // vertical shift of the whole water world (sway + descent)
    var bSpill = 0;    // how hard the water pours over the boundary
    var bProg = 0;     // 0..1 cinematic progress, scrubbed by the pinned scroll
    var bStPin = false; // ScrollTrigger pin active
    var bLenis = null;
    var bCamZ = 0;     // camera dolly forward along the path (world units)
    var bCamX = 0;     // lateral camera sway
    var bDesc = 0;     // 0..1 riding down the face
    var bLipF = 1.08;  // the edge, as a fraction of height (below frame until revealed)
    var bFallP = [];   // droplet stream for the descent
    var bMistP = [];   // mist bloom at the landing

    var ssP = function (a, b, x) {
      var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };

    var updScroll = function () {
      if (bStPin) return; // the pin owns bProg
      var r = sceneEl.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      bScroll = Math.min(1, Math.max(0, 1 - (r.bottom - vh * 0.35) / (r.height + vh * 0.3)));
      bProg = bScroll * 0.62; // no pin: glide to the edge but never over it
    };

    // one scroll value drives the whole sequence:
    // 0–.30 dolly | .30–.55 buoys | .55–.75 edge reveal | .75–1 the glide down
    var updPhases = function () {
      bCamZ = 180 * ssP(0.02, 0.78, bProg);
      bCamX = Math.sin(bTime * 0.5) * 1.6 + Math.sin(bTime * 0.23) * 1.0;
      bDesc = ssP(0.75, 0.98, bProg);
      bSpill = ssP(0.5, 0.72, bProg);
      var lf = 1.08 + (0.74 - 1.08) * ssP(0.55, 0.72, bProg);
      bLipF = lf + (-0.3 - lf) * bDesc;
      var hyOff = -(bWy + bH * 0.42) * ssP(0.78, 0.96, bProg);
      bPar = hyOff + Math.sin(bTime * 0.7) * 2.2 * (1 - bDesc);
    };

    // shared camera model (the ocean build that earned the wow)
    var CAM_H = 14.0;
    var WORLD_SCALE = 0.07;
    var camFocal = function () { return bH * 0.95; };
    var pxToWorld = function (x, y) {
      var dy = Math.max(y - bWy, 2);
      var z = (CAM_H * camFocal()) / dy;
      var wx = (x - bW * 0.5) * z / camFocal();
      return { x: wx, z: z };
    };

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
      "uniform vec3 uMouseW;",
      "uniform float uSpill;",
      "uniform float uCamZ;",
      "uniform float uCamX;",
      "uniform float uDesc;",
      "uniform float uLipF;",
      "uniform vec4 uRipples[8];",
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
      "  for (int i = 0; i < 8; i++) {",
      "    vec4 R = uRipples[i];",
      "    float age = t - R.z;",
      "    if (R.w > 0.0 && age > 0.0 && age < 2.2) {",
      "      float d = distance(p, R.xy);",
      "      h += sin(d * 9.0 - age * 9.0) * exp(-d * 1.7) * exp(-age * 1.9) * R.w * 0.5;",
      "    }",
      "  }",
      "  if (uMouseW.z > 0.5) {",
      "    float md = distance(p, uMouseW.xy);",
      "    h += sin(md * 7.0 - t * 5.0) * exp(-md * 2.4) * 0.16;",
      "  }",
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
      "    float breathe = 0.86 + 0.14 * sin(uTime * 0.45 + vnoise(vec2(px.x * 0.002, 3.3)) * 2.6);",
      "    float horizGlow = exp(-abs(dy) * 0.07) * breathe;",
      "    col += vec3(0.5, 0.82, 0.92) * horizGlow * 0.42;",
      "    alpha = max(alpha, horizGlow * 0.5);",
      "    vec2 wordC = vec2(uRes.x * 0.5, uHy - 110.0);",
      "    float wglow = exp(-distance(px, wordC) * 0.006);",
      "    col += vec3(0.45, 0.75, 0.9) * wglow * 0.34;",
      "    alpha = max(alpha, wglow * 0.4);",
      "    gl_FragColor = vec4(col, alpha);",
      "    return;",
      "  }",
      "",
      "  /* the open ocean, full width, current running home */",
      "  float z = (uCamH * uFocal) / max(dy, 2.0);",
      "  float wx = (px.x - uRes.x * 0.5) * z / uFocal;",
      "  vec2 wp = vec2(wx + uCamX, z + uCamZ) * uScale;",
      "",
      "  float eps = 0.06 + z * uScale * 0.012;",
      "  float hC = waveH(wp);",
      "  float hX = waveH(wp + vec2(eps, 0.0));",
      "  float hZ = waveH(wp + vec2(0.0, eps));",
      "  vec3 n = normalize(vec3(hC - hX, eps * 2.6, hC - hZ));",
      "",
      "  vec3 viewPos = vec3(0.0, uCamH * uScale * 14.0, 0.0);",
      "  vec3 surfPos = vec3(wp.x * 14.0, hC, wp.y * 14.0);",
      "  vec3 viewDir = normalize(surfPos - viewPos);",
      "  vec3 lightDir = normalize(vec3(0.0, 0.6, 0.8));",
      "",
      "  float diff = max(dot(n, lightDir), 0.0);",
      "  vec3 ref = reflect(viewDir, n);",
      "  float zfade = exp(-z * uScale * 0.16);",
      "  float spec = pow(max(dot(ref, lightDir), 0.0), mix(80.0, 150.0, zfade));",
      "  float gNear = 0.5 + 0.5 * step(0.55, hash21(floor(wp * 40.0) + floor(uTime * 7.0)));",
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
      "",
      "  float waterMist = exp(-dy * 0.045);",
      "  col = mix(col, vec3(0.5, 0.65, 0.77), clamp(waterMist, 0.0, 1.0) * 0.7);",
      "  float alpha = 0.92;",
      "",
      "  /* the pool boundary: a long swell, then the water glides down the face */",
      "  float lipY = uRes.y * uLipF",
      "    + sin(px.x * 0.008 + uTime * 0.55) * 6.0",
      "    + sin(px.x * 0.019 - uTime * 0.4) * 3.0",
      "    + sin(px.x * 0.004 + uTime * 0.22) * 3.5",
      "    + sin(px.x * 0.041 + uTime * 1.1) * 0.9;",
      "  if (px.y <= lipY) {",
      "    /* water accelerating toward the edge — streamlines anchored to the lip */",
      "    float toLip = lipY - px.y;",
      "    float pull = exp(-toLip * 0.045);",
      "    float sheetStreak = vnoise(vec2(px.x * 0.14, toLip * 0.08 + uTime * (2.6 + uSpill * 2.4)));",
      "    float sheetFine = vnoise(vec2(px.x * 0.3 + 11.0, toLip * 0.12 + uTime * (3.4 + uSpill * 3.0)));",
      "    col += vec3(0.5, 0.8, 0.92) * pull * (0.14 + sheetStreak * 0.22 + sheetFine * 0.14) * (0.55 + uSpill * 0.65);",
      "    float fleck = step(0.952, vnoise(vec2(px.x * 0.42, toLip * 0.3 - uTime * (3.2 + uSpill * 2.0))));",
      "    col += vec3(0.9, 1.0, 1.0) * fleck * pull * 0.22;",
      "    float gleam = exp(-abs(px.y - lipY) * 0.5);",
      "    col += vec3(0.85, 0.97, 1.0) * gleam * (0.24 + 0.24 * vnoise(vec2(px.x * 0.045 + uTime * 0.5, 0.5))) * (1.0 + uSpill * 0.9);",
      "    float lspark = step(0.972, hash21(floor(vec2(px.x * 0.7, uTime * 8.0))));",
      "    col += vec3(1.0) * lspark * exp(-abs(px.y - lipY) * 0.8) * 0.35;",
      "    alpha = max(alpha, gleam * 0.85);",
      "  } else {",
      "    float dropRaw = px.y - lipY;",
      "    float curlH = 9.0 + vnoise(vec2(px.x * 0.025, uTime * 0.5)) * 9.0 + uSpill * 5.0;",
      "    if (dropRaw <= curlH) {",
      "      /* dark glass bending over the edge, a broken thread of light on the rim */",
      "      float fc = clamp(dropRaw / max(curlH, 1.0), 0.0, 1.0);",
      "      vec3 belly = mix(vec3(0.32, 0.6, 0.72), vec3(0.05, 0.19, 0.3), smoothstep(0.05, 0.85, fc));",
      "      float rimG = 0.3 + 0.7 * vnoise(vec2(px.x * 0.05 + uTime * 0.6, 2.0));",
      "      belly += vec3(0.8, 0.95, 1.0) * exp(-fc * 6.0) * rimG * 0.5;",
      "      belly += vec3(0.1, 0.42, 0.52) * max(1.0 - abs(fc - 0.5) * 2.6, 0.0) * (0.28 + uSpill * 0.3);",
      "      float wrap = vnoise(vec2(px.x * 0.14, fc * 2.0 - uTime * (2.2 + uSpill * 2.0)));",
      "      belly += vec3(0.5, 0.8, 0.9) * wrap * 0.12 * (1.0 - fc);",
      "      col = belly;",
      "      alpha = 0.92 - fc * 0.08;",
      "    } else {",
      "      /* the fall, from inside: straight down, layered, turbulent, aerating */",
      "      float g = dropRaw - curlH;",
      "      float gh = max(uRes.y - lipY - curlH, 40.0);",
      "      float gf = clamp(g / gh, 0.0, 1.0);",
      "      float cxp = uRes.x * 0.5;",
      "      float gx = (px.x - cxp) * (1.0 + g * 0.00022) + cxp;",
      "      float wob = (vnoise(vec2(gx * 0.013, px.y * 0.0026 - uTime * 0.7)) - 0.5) * (14.0 + 60.0 * gf);",
      "      float xx = gx + wob;",
      "      float spd = 1.0 + uDesc * 0.9;",
      "      float yA = px.y * 0.0045 - uTime * 3.2 * spd;",
      "      float yB = px.y * 0.0036 - uTime * 2.1 * spd;",
      "      float yC = px.y * 0.0028 - uTime * 1.3 * spd;",
      "      float a1 = vnoise(vec2(xx * 0.165, yA));",
      "      float a2 = vnoise(vec2(xx * 0.34 + 13.0, yA * 1.7));",
      "      float layerA = pow(clamp(a1 * 0.55 + a2 * 0.65 - 0.25, 0.0, 1.0), 3.0);",
      "      float b1 = vnoise(vec2(xx * 0.085 + 31.0, yB));",
      "      float b2 = vnoise(vec2(xx * 0.21 + 7.0, yB * 1.6));",
      "      float layerB = pow(clamp(b1 * 0.6 + b2 * 0.6 - 0.28, 0.0, 1.0), 2.6);",
      "      float layerC = vnoise(vec2(xx * 0.05 + 57.0, yC)) * 0.5 + vnoise(vec2(xx * 0.11 + 91.0, yC * 1.5)) * 0.3;",
      "      float aer = 0.25 + 0.75 * gf;",
      "      col = mix(vec3(0.04, 0.13, 0.24), vec3(0.35, 0.62, 0.74), clamp(layerC, 0.0, 1.0));",
      "      col = mix(col, vec3(0.62, 0.82, 0.92), clamp(layerB, 0.0, 1.0) * 0.75);",
      "      col = mix(col, vec3(0.93, 0.99, 1.0), clamp(layerA, 0.0, 1.0) * (0.55 + 0.35 * aer));",
      "      float dropS = step(0.992, hash21(floor(vec2(xx * 0.9, px.y * 0.5 - uTime * (640.0 + uDesc * 420.0)) / 2.0)));",
      "      col += vec3(1.0) * dropS * (0.25 + 0.45 * gf);",
      "      col += vec3(0.8, 0.95, 1.0) * exp(-g * 0.05) * 0.3;",
      "      float haze = vnoise(vec2(xx * 0.02 + 4.0, px.y * 0.008 - uTime * 0.9));",
      "      col = mix(col, vec3(0.75, 0.87, 0.94), clamp(haze - 0.45, 0.0, 1.0) * 0.3 * (0.4 + gf));",
      "      float body = clamp(layerB * 0.8 + layerA * 0.9 + layerC * 0.45, 0.0, 1.0);",
      "      alpha = (0.22 + body * 0.6 + aer * 0.18) * (0.55 + uSpill * 0.25 + uDesc * 0.3);",
      "      alpha *= 1.0 - gf * (0.35 - uDesc * 0.25);",
      "      alpha += exp(-g * 0.07) * 0.2;",
      "    }",
      "  }",
      "",
      "  /* nothing paints at the very bottom edge */",
      "  alpha *= 1.0 - smoothstep(uRes.y - 14.0, uRes.y - 2.0, px.y);",
      "",
      "  gl_FragColor = vec4(col, alpha);",
      "}"
    ].join("\n");

    var GLYPH_SET = ["</>", "{}", "01", "=>", "::", "ai"];

    var surfaceY = function (x) {
      return bWy + bPar + Math.sin(x * 0.01 + bTime * 0.6) * 1.0;
    };

    // JS mirror of the shader's pool lip, for spray and sparkle
    var lipYJS = function (x) {
      return bH * bLipF
        + Math.sin(x * 0.008 + bTime * 0.55) * 6
        + Math.sin(x * 0.019 - bTime * 0.4) * 3
        + Math.sin(x * 0.004 + bTime * 0.22) * 3.5
        + Math.sin(x * 0.041 + bTime * 1.1) * 0.9;
    };

    var pushSeaRipple = function (px, py, strength) {
      if (!seaReady) return;
      var w = pxToWorld(px, Math.max(py, bWy + 6));
      var slot = seaMat.uniforms.uRipples.value[seaRipIdx % 8];
      slot.set(w.x * WORLD_SCALE, w.z * WORLD_SCALE, bTime, strength);
      seaRipIdx += 1;
    };

    var seaResize = function () {
      if (!seaRenderer) return;
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
        seaRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        seaRenderer.setClearColor(0x000000, 0);
        seaSceneGl = new THREE.Scene();
        seaCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        var ripples = [];
        for (var ri = 0; ri < 8; ri++) ripples.push(new THREE.Vector4(0, 0, -10, 0));
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
            uMouseW: { value: new THREE.Vector3(0, 0, 0) },
            uSpill: { value: 0 },
            uCamZ: { value: 0 },
            uCamX: { value: 0 },
            uDesc: { value: 0 },
            uLipF: { value: 1.08 },
            uRipples: { value: ripples }
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
      d.speed = 340 + Math.random() * 420;
      d.drift = d.speed * 0.14;
      d.len = 9 + Math.random() * 13;
      d.alpha = 0.12 + Math.random() * 0.3;
      d.x = Math.random() * (bW * 1.15) - bW * 0.05;
      d.y = fromTop ? -d.len - Math.random() * bH * 0.4 : Math.random() * bWy;
      var t = Math.random();
      var landF = Math.min(bLipF, 0.92);
      d.land = bWy + 8 + t * t * (bH * landF - bWy - 12);
      d.scaleF = 0.3 + 0.7 * ((d.land - bWy) / Math.max(bH * landF - bWy, 1));
      return d;
    };

    var basinBuild = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      bW = basinCanvas.clientWidth;
      bH = basinCanvas.clientHeight;
      basinCanvas.width = Math.round(bW * dpr);
      basinCanvas.height = Math.round(bH * dpr);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bWy = bH * 0.52;

      bParts = [];
      var fontPx = Math.min(bW * 0.3, 330);
      var off = document.createElement("canvas");
      off.width = bW;
      off.height = bH;
      var octx = off.getContext("2d");
      octx.font = "italic 600 " + Math.round(fontPx) + "px 'Cormorant Garamond', Georgia, serif";
      octx.textBaseline = "alphabetic";
      var met = octx.measureText("rain.");
      octx.fillStyle = "#fff";
      octx.fillText("rain.", (bW - met.width) / 2, bWy - 18);
      var img = octx.getImageData(0, 0, bW, bH).data;
      for (var yy = 0; yy < bH; yy += 4) {
        for (var xx = 0; xx < bW; xx += 4) {
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
            if (bParts.length >= 2400) { yy = bH; break; }
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
        for (var bd = 0; bd < 70; bd++) bDrops.push(basinSeedDrop({}, false));
      }

      bSurf = [];
      for (var sf = 0; sf < 14; sf++) {
        bSurf.push({ x: Math.random() * bW, ph: Math.random() * 6.283, sp: 8 + Math.random() * 14 });
      }

      bGlyphs = [];
      for (var gl2 = 0; gl2 < 10; gl2++) {
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
      bClusters = [];
      for (var cl = 0; cl < 3; cl++) {
        var nodes = [];
        var nn = 3 + (cl % 2);
        for (var ni = 0; ni < nn; ni++) {
          nodes.push({ a: Math.random() * 6.283, r: 10 + Math.random() * 16, w: 0.3 + Math.random() * 0.5 });
        }
        bClusters.push({
          x: bW * (0.12 + 0.36 * cl) + Math.random() * bW * 0.1,
          y: 30 + Math.random() * (bWy * 0.5),
          vx: (Math.random() - 0.5) * 6,
          nodes: nodes
        });
      }
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
      updScroll();
      updPhases();
      bctx.clearRect(0, 0, bW, bH);

      var i;
      var p;

      /* sky: drifting code glyphs (the sky leaves with the horizon) */
      bctx.save();
      bctx.globalAlpha = Math.max(0, 1 - bDesc * 1.5);
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
        bctx.fillStyle = (i % 2 ? "rgba(125, 211, 252," : "rgba(94, 234, 212,") + g.a.toFixed(3) + ")";
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
      bctx.restore();

      /* the ocean — WebGL, or the 2D stand-in until it loads */
      if (seaReady) {
        seaMat.uniforms.uTime.value = bTime;
        seaMat.uniforms.uHy.value = bWy + bPar;
        seaMat.uniforms.uSpill.value = bSpill;
        seaMat.uniforms.uCamZ.value = bCamZ;
        seaMat.uniforms.uCamX.value = bCamX;
        seaMat.uniforms.uDesc.value = bDesc;
        seaMat.uniforms.uLipF.value = bLipF;
        if (bMX > -999 && bMY > bWy + 4) {
          var mw = pxToWorld(bMX, bMY);
          seaMat.uniforms.uMouseW.value.set(mw.x * WORLD_SCALE, mw.z * WORLD_SCALE, 1);
        } else {
          seaMat.uniforms.uMouseW.value.set(0, 0, 0);
        }
        seaRenderer.render(seaSceneGl, seaCam);
      } else {
        drawFallbackWater();
      }

      /* wordmark reflection shimmering on the water */
      for (i = 0; i < bParts.length; i += 3) {
        p = bParts[i];
        if (Math.abs(p.y - p.ty) < 40) {
          var ry = (bWy + bPar) + ((bWy + bPar) - p.y) * 0.36;
          var rx = p.x + Math.sin(bTime * 1.6 + p.ty * 0.05) * 2.0;
          bctx.fillStyle = "rgba(140, 225, 240, 0.10)";
          bctx.fillRect(rx, ry, 1.9, 1.6);
        }
      }

      /* the services, floating on the water, drifting past like buoys */
      bFloatAge += dt;
      bFloatHits.length = 0;
      var fFocal = bH * 0.95;
      var lipPix = bH * bLipF;
      for (i = 0; i < bFloat.length; i++) {
        var fs = bFloat[i];
        var aW = ssP(0.28 + i * 0.045, 0.36 + i * 0.045, bProg);
        if (aW <= 0.004 || bDesc > 0.55) continue;
        var zr = fs.z0 - bCamZ;
        if (zr < 16) continue;
        var dyW = (CAM_H * fFocal) / zr;
        var fy = bWy + bPar + dyW + (1 - aW) * 22;
        var fx2 = bW / 2 + (fs.wx - bCamX) * fFocal / zr;
        var fAlpha = aW;
        /* the word slips over the edge ahead of the viewer */
        if (fy > lipPix - 6) {
          var over = (fy - (lipPix - 6)) / 42;
          if (over >= 1) continue;
          fAlpha *= 1 - over;
          fy += over * over * 34;
        }
        var fontPx2 = Math.max(12, Math.min(38, dyW * 0.16 + 5));
        var bobA = Math.min(8, dyW * 0.045);
        var yb = (Math.sin(bTime * 0.9 + fs.wx) * 0.7 + Math.sin(bTime * 0.66 - fs.wx * 0.5 + fs.z0) * 0.5) * bobA;
        var fRot = Math.sin(bTime * 0.8 + fs.wx * 0.7) * 0.03;
        bctx.save();
        bctx.translate(fx2, fy + yb);
        bctx.rotate(fRot);
        bctx.font = "500 " + fontPx2.toFixed(1) + "px 'Geist', 'Inter', system-ui, sans-serif";
        bctx.textAlign = "center";
        var fw = bctx.measureText(fs.label).width;
        /* the water seats the word */
        bctx.fillStyle = "rgba(120, 220, 255," + ((0.05 + 0.03 * Math.sin(bTime * 1.4 + i)) * fAlpha).toFixed(3) + ")";
        bctx.beginPath();
        bctx.ellipse(0, 4, fw * 0.62, fontPx2 * 0.3, 0, 0, Math.PI * 2);
        bctx.fill();
        /* its reflection, broken by the swell */
        bctx.save();
        bctx.scale(1, -0.5);
        bctx.translate(Math.sin(bTime * 1.7 + i * 2.0) * 1.6, -(fontPx2 * 0.5 + 10));
        bctx.fillStyle = "rgba(150, 230, 250," + (0.14 * fAlpha).toFixed(3) + ")";
        bctx.fillText(fs.label, 0, 0);
        bctx.restore();
        /* the word itself */
        bctx.shadowColor = "rgba(140, 230, 255, 0.55)";
        bctx.shadowBlur = 12;
        bctx.fillStyle = "rgba(238, 250, 255," + (0.92 * fAlpha).toFixed(3) + ")";
        bctx.fillText(fs.label, 0, 0);
        bctx.shadowBlur = 0;
        bctx.restore();
        if (fAlpha > 0.5) {
          bFloatHits.push({ x: fx2 - fw / 2 - 10, y: fy + yb - fontPx2 - 5, w: fw + 20, h: fontPx2 + 14 });
        }
      }

      /* arrival glow where the overflow feeds each service */
      for (i = 0; i < bChips.length; i++) {
        var chg = bChips[i];
        var chPulse = (0.14 + 0.09 * Math.sin(bTime * 3 + i)) * (0.5 + bSpill * 0.7) * Math.max(0, 1 - bDesc * 2);
        bctx.fillStyle = "rgba(125, 230, 255," + chPulse.toFixed(3) + ")";
        bctx.beginPath();
        bctx.ellipse(chg.x, chg.top - 8, 12, 4.2, 0, 0, Math.PI * 2);
        bctx.fill();
      }

      /* rain falling onto the receding water */
      bctx.lineCap = "round";
      for (i = 0; i < bDrops.length; i++) {
        var d = bDrops[i];
        d.y += d.speed * dt;
        d.x += d.drift * dt;
        if (d.y >= d.land + bPar) {
          if (bRips.length < 26) {
            bRips.push({
              x: d.x,
              y: d.land + bPar,
              r: 1,
              max: (8 + Math.random() * 9) * d.scaleF,
              a: 0.3 + 0.2 * d.scaleF,
              sf: d.scaleF
            });
          }
          if (d.scaleF > 0.55 && bSprays.length < 90) {
            bSprays.push({
              x: d.x,
              y: d.land + bPar,
              vx: (Math.random() - 0.5) * 110 * d.scaleF,
              vy: -(55 + Math.random() * 110) * d.scaleF,
              life: 0.32 + Math.random() * 0.22
            });
          }
          basinSeedDrop(d, true);
          continue;
        }
        if (d.x > bW + 30) d.x -= bW + 60;
        bctx.strokeStyle = "rgba(158, 222, 255," + d.alpha.toFixed(3) + ")";
        bctx.lineWidth = 1;
        bctx.beginPath();
        bctx.moveTo(d.x, d.y);
        bctx.lineTo(d.x - (d.drift / d.speed) * d.len, d.y - d.len);
        bctx.stroke();
      }

      /* the surf: sparkle and spray along the living shoreline */
      for (i = 0; i < bSurf.length; i++) {
        var su = bSurf[i];
        su.x += su.sp * dt;
        if (su.x > bW + 6) su.x = -6;
        var suy = lipYJS(su.x);
        var sa = 0.18 + 0.22 * Math.sin(bTime * 2.2 + su.ph);
        if (sa > 0.05) {
          bctx.fillStyle = "rgba(225, 248, 255," + sa.toFixed(3) + ")";
          bctx.fillRect(su.x, suy - 1, 2.2, 1.4);
        }
      }
      if (Math.random() < dt * (1.6 + bSpill * 2.6) && bSprays.length < 90) {
        var spx = Math.random() * bW;
        bSprays.push({
          x: spx,
          y: lipYJS(spx),
          vx: (Math.random() - 0.5) * 70,
          vy: -(40 + Math.random() * 90),
          life: 0.35 + Math.random() * 0.25
        });
      }

      /* splash spray */
      for (i = bSprays.length - 1; i >= 0; i--) {
        var sw = bSprays[i];
        sw.life -= dt;
        if (sw.life <= 0) { bSprays.splice(i, 1); continue; }
        sw.vy += 980 * dt;
        sw.x += sw.vx * dt;
        sw.y += sw.vy * dt;
        bctx.fillStyle = "rgba(170, 230, 255," + Math.min(0.7, sw.life * 1.6).toFixed(3) + ")";
        bctx.fillRect(sw.x - 1, sw.y - 1, 2, 2.2);
      }

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
          p.y + p.oy + Math.cos(bTime * 1.5 + p.ph) * 0.7 - 1.2 + bPar * (0.5 + bDesc * 0.5),
          2.4,
          2.4
        );
      }

      /* phase 4: the droplet stream riding down with the camera */
      if (bDesc > 0.04) {
        if (!bFallP.length) {
          var nFP = window.innerWidth <= 760 ? 240 : 600;
          for (var fp = 0; fp < nFP; fp++) {
            bFallP.push({
              x: Math.random() * bW,
              y: Math.random() * bH,
              v: 500 + Math.random() * 900,
              o: (Math.random() - 0.5) * 60,
              l: 6 + Math.random() * 14,
              a: 0.1 + Math.random() * 0.3
            });
          }
        }
        bctx.lineWidth = 1.2;
        for (i = 0; i < bFallP.length; i++) {
          var fpp = bFallP[i];
          var rel = (fpp.v - 380) * (0.35 + bDesc * 0.85);
          fpp.y += rel * dt;
          fpp.x += fpp.o * dt * bDesc;
          if (fpp.y > bH + 24) { fpp.y = -24 - Math.random() * 60; fpp.x = Math.random() * bW; }
          if (fpp.y < -90) { fpp.y = bH + 12; fpp.x = Math.random() * bW; }
          bctx.strokeStyle = "rgba(190, 235, 255," + (fpp.a * bDesc).toFixed(3) + ")";
          bctx.beginPath();
          bctx.moveTo(fpp.x, fpp.y);
          bctx.lineTo(fpp.x + fpp.o * 0.02, fpp.y - fpp.l * (0.6 + bDesc));
          bctx.stroke();
        }
      }

      /* the landing: mist blooms up and hands the frame to the page */
      var mistA = ssP(0.82, 0.985, bProg);
      if (mistA > 0.004) {
        if (!bMistP.length) {
          for (var mp = 0; mp < 26; mp++) {
            bMistP.push({
              x: Math.random() * bW,
              y: bH * (0.5 + Math.random() * 0.5),
              r: 60 + Math.random() * 130,
              v: 30 + Math.random() * 70,
              ph: Math.random() * 6.28
            });
          }
        }
        for (i = 0; i < bMistP.length; i++) {
          var mpp = bMistP[i];
          mpp.y -= mpp.v * dt * (0.4 + mistA);
          if (mpp.y < -mpp.r) { mpp.y = bH + mpp.r * 0.5; mpp.x = Math.random() * bW; }
          var mg = bctx.createRadialGradient(mpp.x, mpp.y, 0, mpp.x, mpp.y, mpp.r);
          var ma = 0.16 * mistA * (0.7 + 0.3 * Math.sin(bTime * 0.8 + mpp.ph));
          mg.addColorStop(0, "rgba(244, 246, 247," + ma.toFixed(3) + ")");
          mg.addColorStop(1, "rgba(244, 246, 247, 0)");
          bctx.fillStyle = mg;
          bctx.beginPath();
          bctx.arc(mpp.x, mpp.y, mpp.r, 0, Math.PI * 2);
          bctx.fill();
        }
        /* the veil completes the crossfade into the next section (paper) */
        bctx.fillStyle = "rgba(250, 248, 245," + (ssP(0.9, 1.0, bProg) * 0.98).toFixed(3) + ")";
        bctx.fillRect(0, 0, bW, bH);
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

    var floatHitAt = function (x, y) {
      for (var fh = 0; fh < bFloatHits.length; fh++) {
        var hr = bFloatHits[fh];
        if (x >= hr.x && x <= hr.x + hr.w && y >= hr.y && y <= hr.y + hr.h) return true;
      }
      return false;
    };
    sceneEl.addEventListener("mousemove", function (e) {
      var r = basinCanvas.getBoundingClientRect();
      bMX = e.clientX - r.left;
      bMY = e.clientY - r.top;
      sceneEl.style.cursor = floatHitAt(bMX, bMY) ? "pointer" : "";
    });
    sceneEl.addEventListener("mouseleave", function () {
      bMX = -9999;
      bMY = -9999;
    });
    sceneEl.addEventListener("pointerdown", function (e) {
      if (e.target.closest("a, button")) return;
      var r = basinCanvas.getBoundingClientRect();
      var bx = e.clientX - r.left;
      var by = e.clientY - r.top;
      if (floatHitAt(bx, by)) {
        var svc = document.getElementById("services");
        if (svc && bLenis) bLenis.scrollTo(svc, { offset: -64 });
        else if (svc) svc.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      pushSeaRipple(bx, by, 1.0);
      var landY = Math.max(by, surfaceY(bx));
      bRips.push({ x: bx, y: landY, r: 2, max: 44, a: 0.45, sf: 0.8 });
      for (var s3 = 0; s3 < 10 && bSprays.length < 90; s3++) {
        var a3 = -Math.PI * (0.15 + Math.random() * 0.7);
        var v3 = 130 + Math.random() * 220;
        bSprays.push({ x: bx, y: landY, vx: Math.cos(a3) * v3, vy: Math.sin(a3) * v3, life: 0.5 + Math.random() * 0.3 });
      }
      for (var pi = 0; pi < bParts.length; pi++) {
        var pp = bParts[pi];
        var pdx = pp.x - bx;
        var pdy = pp.y - by;
        var pq = pdx * pdx + pdy * pdy;
        if (pq < 19600) {
          var pdd = Math.sqrt(pq) || 1;
          var pf = (140 - pdd) / 140;
          pp.ox += (pdx / pdd) * pf * 90;
          pp.oy += (pdy / pdd) * pf * 90;
        }
      }
    });

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

    /* the cinematic: pin the flow section, scrub one progress value 0..1,
       glide on Lenis. Without the libraries (or with reduced motion) the
       scene still works from plain scroll — it just never goes over the edge. */
    var initCinema = function () {
      if (!(window.gsap && window.ScrollTrigger)) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (window.innerWidth <= 760) return;
      window.gsap.registerPlugin(window.ScrollTrigger);
      if (window.Lenis) {
        bLenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
        bLenis.on("scroll", window.ScrollTrigger.update);
        window.gsap.ticker.add(function (t) { bLenis.raf(t * 1000); });
        window.gsap.ticker.lagSmoothing(0);
        qsa('a[href^="#"]').forEach(function (a) {
          a.addEventListener("click", function (ev) {
            var id = a.getAttribute("href");
            if (!id || id.length < 2) return;
            var tgt = document.querySelector(id);
            if (!tgt) return;
            ev.preventDefault();
            bLenis.scrollTo(tgt, { offset: -64 });
          });
        });
      }
      window.ScrollTrigger.create({
        trigger: "#flow",
        start: "top top",
        end: "+=260%",
        pin: true,
        scrub: 1,
        onUpdate: function (self) { bProg = self.progress; },
        onToggle: function (self) { if (self.isActive && !document.hidden) basinStart(); }
      });
      bStPin = true;
      /* scroll restoration can race the first measurement */
      window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
      window.setTimeout(function () { window.ScrollTrigger.refresh(); }, 400);
      /* verification hook: drive the sequence without scrolling */
      window.__rainProg = function (p) { bProg = Math.min(1, Math.max(0, p)); };
    };
    initCinema();
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

  /* ---------- magnetic primary buttons (fine pointers) ---------- */
  if (window.matchMedia("(pointer: fine)").matches) {
    qsa(".btn--primary").forEach(function (btn) {
      var magRaf = null;
      var mx = 0;
      var my = 0;
      var applyMag = function () {
        magRaf = null;
        btn.style.translate = mx.toFixed(1) + "px " + my.toFixed(1) + "px";
      };
      btn.addEventListener("mousemove", function (e) {
        if (reduce) return;
        var r = btn.getBoundingClientRect();
        mx = Math.max(-4, Math.min(4, (e.clientX - (r.left + r.width / 2)) * 0.12));
        my = Math.max(-3, Math.min(3, (e.clientY - (r.top + r.height / 2)) * 0.22));
        if (magRaf === null) magRaf = requestAnimationFrame(applyMag);
      });
      btn.addEventListener("mouseleave", function () {
        if (magRaf !== null) { cancelAnimationFrame(magRaf); magRaf = null; }
        btn.style.translate = "";
      });
    });
  }

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
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else if (revealEls.length) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { revealIO.observe(el); });
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

  /* ---------- formation entrance for the selector ---------- */
  var assembleEl = qs("[data-assemble]");
  if (assembleEl) {
    if (reduce || !("IntersectionObserver" in window)) {
      assembleEl.classList.add("is-assembled");
    } else {
      var asmIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            assembleEl.classList.add("is-assembled");
            asmIO.disconnect();
          }
        });
      }, { threshold: 0.22 });
      asmIO.observe(assembleEl);
    }
  }

  /* ---------- services: pick a problem (self-demoing) ---------- */
  var capBtns = qsa("[data-cap]");
  var capPanels = qsa("[data-cap-panel]");
  if (capBtns.length && capPanels.length) {
    var capKeys = capBtns.map(function (b) { return b.getAttribute("data-cap"); });
    var capIdx = 0;
    var capTimer = null;
    var capTouched = false; // once the visitor clicks, the demo stops for good

    var setCap = function (key) {
      capIdx = Math.max(0, capKeys.indexOf(key));
      capBtns.forEach(function (btn) {
        var on = btn.getAttribute("data-cap") === key;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      capPanels.forEach(function (panel) {
        panel.classList.toggle("is-active", panel.getAttribute("data-cap-panel") === key);
      });
    };

    var capStop = function () {
      if (capTimer !== null) { window.clearInterval(capTimer); capTimer = null; }
    };
    var capPlay = function () {
      if (capTimer !== null || capTouched || reduce || document.hidden) return;
      capTimer = window.setInterval(function () {
        setCap(capKeys[(capIdx + 1) % capKeys.length]);
      }, 4500);
    };

    capBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        capTouched = true;
        capStop();
        setCap(btn.getAttribute("data-cap"));
      });
    });

    var capZone = qs(".caps__grid");
    if (capZone) {
      capZone.addEventListener("mouseenter", capStop);
      capZone.addEventListener("mouseleave", capPlay);
      if ("IntersectionObserver" in window) {
        var capIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) capPlay();
            else capStop();
          });
        }, { threshold: 0.35 });
        capIO.observe(capZone);
      } else {
        capPlay();
      }
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { capStop(); return; }
      if (!capZone) return;
      var r = capZone.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) capPlay();
    });
  }

  /* ---------- "You ask. It's done." — scenario engine ---------- */
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
      numbers: { user: "Clicks last week vs last month?", reply: "\ud83d\udcc8 4,820 \u2014 up 18%. Full report, right here \u2192", view: "report" },
      content: { user: "Write a blog on cold brew \u2014 publish Monday 7am \u2615", reply: "Done \u2705 Drafted, image ready, scheduled Mon 7:00.", view: "post" },
      restock: { user: "Low on oat milk \u2014 reorder it.", reply: "\ud83d\uded2 48 units ordered from your supplier. ETA Thursday.", view: "order" },
      replies: { user: "Handle today's customer emails.", reply: "\u2709\ufe0f 12 replies drafted in your tone \u2014 2 flagged for you.", view: "inbox" }
    };
    var SCN_ORDER = ["numbers", "content", "restock", "replies"];

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
      if (key === "report") assembleReport(instant);
    };

    var setChip = function (key) {
      chips.forEach(function (c) {
        var on = c.getAttribute("data-scenario") === key;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
    };

    var runScenario = function (key) {
      var t = SCENARIOS[key];
      if (!t) return;
      scnClear();
      setChip(key);
      if (reduce) {
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
        runScenario(chip.getAttribute("data-scenario"));
      });
    });

    if (reduce) {
      runScenario("numbers");
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
          navLinks.forEach(function (l) { l.classList.remove("is-active"); });
          link.classList.add("is-active");
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
  var runlog = qs("[data-runlog]");
  if (runlog && !reduce) {
    var LOG_LINES = [
      ["12:05", "Social caption drafted + image generated"],
      ["13:18", "Low-stock alert: 3 SKUs flagged"],
      ["14:02", "Lead follow-up email queued"],
      ["15:47", "Blog post published to WordPress"],
      ["16:30", "Weekly numbers summarized for review"],
      ["17:15", "9 customer replies sent after approval"],
      ["18:08", "Tomorrow's content scheduled"],
      ["08:00", "Morning report sent to 3 clients"],
      ["09:12", "Blog draft ready → waiting for review"],
      ["11:30", "12 customer replies drafted"]
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
  }

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
      if (invalid) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
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
          : (!name ? "Add your name so we know who to reply to." : "That email doesn't look right — mind checking it?"), "error");
        (!name ? nameInput : emailInput).focus();
        return;
      }

      var subject = "Refresh request — " + name;
      var bodyLines = [
        "Name: " + name,
        "Email: " + email,
        "",
        "Where the manual work piles up:",
        (message || "(they left this blank — follow up)")
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
