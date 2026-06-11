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

  /* ---------- the basin: three.js shader sea + 2D life overlay ---------- */
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
    var bBubbles = [];
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
    var bTrailT = 0;

    /* --- the WebGL sea (three.js, lazy-loaded) --- */
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
      "uniform float uWaterY;",
      "uniform vec2 uMouse;",
      "uniform vec4 uRipples[8];",
      "float surf(float x){",
      "  return uWaterY",
      "    + sin(x*0.008 + uTime*0.9)*5.0",
      "    + sin(x*0.018 - uTime*1.5)*3.0",
      "    + sin(x*0.041 + uTime*2.6)*1.6;",
      "}",
      "float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
      "float vnoise(vec2 p){",
      "  vec2 i = floor(p); vec2 f = fract(p);",
      "  f = f*f*(3.0-2.0*f);",
      "  return mix(mix(hash21(i), hash21(i+vec2(1.0,0.0)), f.x),",
      "             mix(hash21(i+vec2(0.0,1.0)), hash21(i+vec2(1.0,1.0)), f.x), f.y);",
      "}",
      "void main(){",
      "  vec2 px = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y);",
      "  float sy = surf(px.x);",
      "  float rip = 0.0;",
      "  for (int i = 0; i < 8; i++) {",
      "    vec4 R = uRipples[i];",
      "    float age = uTime - R.z;",
      "    if (R.w > 0.0 && age > 0.0 && age < 1.6) {",
      "      float rad = age * 150.0;",
      "      vec2 dp = vec2(px.x - R.x, (px.y - R.y) * 2.4);",
      "      rip += exp(-abs(length(dp) - rad) * 0.085) * exp(-age * 2.0) * R.w;",
      "    }",
      "  }",
      "  float below = px.y - (sy - rip * 6.0);",
      "  if (below < -14.0) { gl_FragColor = vec4(0.0); return; }",
      "  float span = max(uRes.y - uWaterY, 1.0);",
      "  float depth = clamp(below / span, 0.0, 1.0);",
      "  vec2 w = px;",
      "  w.x += sin(px.y * 0.045 + uTime * 1.2) * (2.0 + 7.0 * depth) + rip * 9.0;",
      "  w.y += cos(px.x * 0.038 - uTime * 0.8) * (1.5 + 5.0 * depth);",
      "  vec3 shallow = vec3(0.13, 0.32, 0.58);",
      "  vec3 deep = vec3(0.012, 0.045, 0.11);",
      "  vec3 col = mix(shallow, deep, pow(depth, 0.75));",
      "  float alpha = 0.94 * smoothstep(-0.02, 0.85, depth);",
      "  float ca = sin(w.x * 0.052 + uTime * 1.1) * sin(w.x * 0.029 - uTime * 0.7 + w.y * 0.055);",
      "  float cb = sin((w.x + w.y * 0.6) * 0.041 - uTime * 1.35);",
      "  float caustic = pow(clamp(ca * cb * 1.5, 0.0, 1.0), 2.4) * pow(1.0 - depth, 2.0);",
      "  col += vec3(0.30, 0.72, 0.88) * caustic * 0.55;",
      "  vec2 sun = vec2(uRes.x * 0.5, uWaterY - 260.0);",
      "  vec2 sd = px - sun;",
      "  float ang = atan(sd.x, sd.y);",
      "  float shaft = vnoise(vec2(ang * 6.5 + uTime * 0.1, 0.5));",
      "  shaft = smoothstep(0.52, 0.95, shaft);",
      "  shaft *= exp(-depth * 2.4) * smoothstep(8.0, 90.0, below);",
      "  col += vec3(0.4, 0.78, 0.92) * shaft * 0.2;",
      "  float crest = exp(-abs(below) * 0.3);",
      "  col += vec3(0.62, 0.93, 1.0) * crest * (0.55 + rip * 0.9);",
      "  alpha = max(alpha, crest * 0.9);",
      "  float slope = (surf(px.x + 6.0) - surf(px.x - 6.0)) / 12.0;",
      "  float tw = hash21(vec2(floor(px.x / 6.0), floor(uTime * 9.0)));",
      "  float glint = smoothstep(0.1, 0.34, -slope) * (1.0 - smoothstep(0.0, 3.0, abs(below))) * (0.35 + 0.65 * tw);",
      "  col += vec3(0.95, 1.0, 1.0) * glint * 0.85;",
      "  alpha = max(alpha, glint * 0.9);",
      "  if (uMouse.x > -999.0 && below > 0.0) {",
      "    float md = distance(px, uMouse);",
      "    col += vec3(0.28, 0.66, 0.84) * exp(-md * 0.014) * 0.4;",
      "  }",
      "  col *= 1.0 - 0.22 * smoothstep(0.7, 1.0, depth);",
      "  gl_FragColor = vec4(col, alpha);",
      "}"
    ].join("\n");

    var GLYPH_SET = ["</>", "{}", "01", "=>", "::", "ai"];

    var surfaceY = function (x) {
      return bWy
        + Math.sin(x * 0.008 + bTime * 0.9) * 5
        + Math.sin(x * 0.018 - bTime * 1.5) * 3
        + Math.sin(x * 0.041 + bTime * 2.6) * 1.6;
    };

    var pushSeaRipple = function (x, y, strength) {
      if (!seaReady) return;
      var slot = seaMat.uniforms.uRipples.value[seaRipIdx % 8];
      slot.set(x, y, bTime, strength);
      seaRipIdx += 1;
    };

    var seaResize = function (THREE_NS) {
      if (!seaRenderer) return;
      seaRenderer.setSize(bW, bH, false);
      seaMat.uniforms.uRes.value.set(bW, bH);
      seaMat.uniforms.uWaterY.value = bWy;
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
            uWaterY: { value: 0 },
            uMouse: { value: new THREE.Vector2(-9999, -9999) },
            uRipples: { value: ripples }
          },
          vertexShader: SEA_VERT,
          fragmentShader: SEA_FRAG
        });
        seaSceneGl.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), seaMat));
        seaResize();
        seaReady = true;
      } catch (err) {
        seaReady = false; // 2D fallback water keeps the scene whole
      }
    };

    var basinSeedDrop = function (d, fromTop) {
      d.speed = 340 + Math.random() * 420;
      d.drift = d.speed * 0.14;
      d.len = 9 + Math.random() * 13;
      d.alpha = 0.12 + Math.random() * 0.3;
      d.x = Math.random() * (bW * 1.15) - bW * 0.05;
      d.y = fromTop ? -d.len - Math.random() * bH * 0.4 : Math.random() * bWy;
      return d;
    };

    var basinBuild = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      bW = basinCanvas.clientWidth;
      bH = basinCanvas.clientHeight;
      basinCanvas.width = Math.round(bW * dpr);
      basinCanvas.height = Math.round(bH * dpr);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bWy = bH * 0.58;
      if (seaReady) seaResize();

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
      var crect = basinCanvas.getBoundingClientRect();
      qsa(".basin-chip").forEach(function (chip) {
        var r = chip.getBoundingClientRect();
        bChips.push({ x: r.left + r.width / 2 - crect.left, top: r.top - crect.top });
      });

      if (!bDrops.length) {
        for (var bd = 0; bd < 70; bd++) bDrops.push(basinSeedDrop({}, false));
      }

      bBubbles = [];
      for (var bb = 0; bb < 18; bb++) {
        bBubbles.push({
          x: Math.random() * bW,
          y: bWy + 30 + Math.random() * (bH - bWy - 40),
          r: 1 + Math.random() * 2.2,
          vy: 16 + Math.random() * 26,
          ph: Math.random() * 6.283
        });
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

    // until three.js arrives (or if WebGL fails) the water stays 2D
    var drawFallbackWater = function () {
      bctx.beginPath();
      bctx.moveTo(0, surfaceY(0));
      for (var sx = 8; sx <= bW; sx += 8) bctx.lineTo(sx, surfaceY(sx));
      bctx.lineTo(bW, bH);
      bctx.lineTo(0, bH);
      bctx.closePath();
      var grad = bctx.createLinearGradient(0, bWy - 8, 0, bH);
      grad.addColorStop(0, "rgba(52, 120, 220, 0.16)");
      grad.addColorStop(1, "rgba(6, 18, 38, 0.5)");
      bctx.fillStyle = grad;
      bctx.fill();
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

      /* wordmark reflection, bent by the swells */
      for (i = 0; i < bParts.length; i += 3) {
        p = bParts[i];
        if (Math.abs(p.y - p.ty) < 40) {
          var shift = surfaceY(p.x) - bWy;
          var ry = bWy + (bWy - p.y) * 0.42 + shift * 1.6;
          var rx = p.x + Math.sin(bTime * 2 + p.ty * 0.06) * 2.4;
          bctx.fillStyle = "rgba(122, 225, 235, 0.12)";
          bctx.fillRect(rx, ry, 1.9, 1.9);
        }
      }

      /* the sea itself — WebGL shader, or the 2D stand-in until it loads */
      if (seaReady) {
        seaMat.uniforms.uTime.value = bTime;
        seaMat.uniforms.uMouse.value.set(bMX, bMY);
        seaRenderer.render(seaSceneGl, seaCam);
      } else {
        drawFallbackWater();
      }

      /* waterfalls pouring into each service */
      for (i = 0; i < bChips.length; i++) {
        var ch = bChips[i];
        var topY = surfaceY(ch.x) + 2;
        var botY = ch.top - 8;
        if (botY > topY) {
          var beam = bctx.createLinearGradient(0, topY, 0, botY);
          beam.addColorStop(0, "rgba(96, 200, 255, 0.16)");
          beam.addColorStop(1, "rgba(96, 200, 255, 0.05)");
          bctx.strokeStyle = beam;
          bctx.lineWidth = 8;
          bctx.beginPath();
          bctx.moveTo(ch.x, topY);
          bctx.lineTo(ch.x, botY);
          bctx.stroke();
          bctx.setLineDash([5, 12]);
          bctx.lineDashOffset = -(bTime * 64) + i * 7;
          bctx.strokeStyle = "rgba(150, 235, 255, 0.55)";
          bctx.lineWidth = 1.8;
          bctx.beginPath();
          bctx.moveTo(ch.x, topY);
          bctx.lineTo(ch.x, botY);
          bctx.stroke();
          bctx.setLineDash([]);
          var pulse = 0.16 + 0.09 * Math.sin(bTime * 3 + i);
          bctx.fillStyle = "rgba(125, 230, 255," + pulse.toFixed(3) + ")";
          bctx.beginPath();
          bctx.ellipse(ch.x, botY, 12, 4.4, 0, 0, Math.PI * 2);
          bctx.fill();
          bctx.beginPath();
          bctx.ellipse(ch.x, topY, 8, 3, 0, 0, Math.PI * 2);
          bctx.fill();
        }
      }

      /* rain feeding the sea */
      bctx.lineCap = "round";
      for (i = 0; i < bDrops.length; i++) {
        var d = bDrops[i];
        d.y += d.speed * dt;
        d.x += d.drift * dt;
        var sy = surfaceY(d.x);
        if (d.y >= sy) {
          if (bRips.length < 26) bRips.push({ x: d.x, y: sy, r: 1, max: 11 + Math.random() * 12, a: 0.5 });
          if (bSprays.length < 90) {
            for (var s2 = 0; s2 < 2; s2++) {
              bSprays.push({
                x: d.x,
                y: sy,
                vx: (Math.random() - 0.5) * 130,
                vy: -(70 + Math.random() * 150),
                life: 0.4 + Math.random() * 0.3
              });
            }
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

      /* splash spray */
      for (i = bSprays.length - 1; i >= 0; i--) {
        var sw = bSprays[i];
        sw.life -= dt;
        if (sw.life <= 0) { bSprays.splice(i, 1); continue; }
        sw.vy += 980 * dt;
        sw.x += sw.vx * dt;
        sw.y += sw.vy * dt;
        bctx.fillStyle = "rgba(170, 230, 255," + Math.min(0.75, sw.life * 1.6).toFixed(3) + ")";
        bctx.fillRect(sw.x - 1, sw.y - 1, 2, 2.4);
      }

      /* surface ripples (crisp echoes over the shader water) */
      for (i = bRips.length - 1; i >= 0; i--) {
        var rp = bRips[i];
        rp.r += 48 * dt * (1 + rp.r / rp.max);
        rp.a -= 1.05 * dt;
        if (rp.a <= 0 || rp.r >= rp.max) { bRips.splice(i, 1); continue; }
        bctx.strokeStyle = "rgba(125, 230, 255," + rp.a.toFixed(3) + ")";
        bctx.lineWidth = 1;
        bctx.beginPath();
        bctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.3, 0, 0, Math.PI * 2);
        bctx.stroke();
      }

      /* bubbles rising to the surface */
      for (i = 0; i < bBubbles.length; i++) {
        var bub = bBubbles[i];
        bub.y -= bub.vy * dt;
        var bx2 = bub.x + Math.sin(bTime * 2 + bub.ph) * 7;
        var bsy = surfaceY(bx2);
        if (bub.y <= bsy + 4) {
          if (bRips.length < 26) bRips.push({ x: bx2, y: bsy, r: 1, max: 7, a: 0.35 });
          bub.y = bH - 8 - Math.random() * 30;
          bub.x = Math.random() * bW;
          continue;
        }
        bctx.strokeStyle = "rgba(170, 225, 255, 0.28)";
        bctx.lineWidth = 0.9;
        bctx.beginPath();
        bctx.arc(bx2, bub.y, bub.r, 0, Math.PI * 2);
        bctx.stroke();
        bctx.fillStyle = "rgba(220, 245, 255, 0.35)";
        bctx.fillRect(bx2 - bub.r * 0.35, bub.y - bub.r * 0.55, 1, 1);
      }

      /* the cursor trails ripples through the shader water */
      if (bMX > -999 && bMY > bWy - 16 && bTime - bTrailT > 0.12) {
        pushSeaRipple(bMX, surfaceY(bMX), 0.45);
        bTrailT = bTime;
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
        var dy = (p.y + p.oy) - bMY;
        var pd2 = dx * dx + dy * dy;
        if (pd2 < 6400) {
          var dd = Math.sqrt(pd2) || 1;
          var f = (80 - dd) / 80;
          p.ox += (dx / dd) * f * 1000 * dt;
          p.oy += (dy / dd) * f * 1000 * dt;
        }
        p.ox += -p.ox * Math.min(1, 5 * dt);
        p.oy += -p.oy * Math.min(1, 5 * dt);
        var tw = 0.52 + 0.38 * Math.sin(bTime * 2.2 + p.ph * 2);
        bctx.fillStyle = p.hue < 0.5
          ? "rgba(158, 218, 255," + Math.max(0.24, tw).toFixed(3) + ")"
          : "rgba(128, 240, 218," + Math.max(0.24, tw).toFixed(3) + ")";
        bctx.fillRect(
          p.x + p.ox + Math.sin(bTime * 1.8 + p.ph) * 0.7 - 1.2,
          p.y + p.oy + Math.cos(bTime * 1.5 + p.ph) * 0.7 - 1.2,
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
      if (!bParts.length) basinBuild();
      if (!seaLoadStarted) {
        seaLoadStarted = true;
        import("https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.min.js")
          .then(function (THREE) { seaInit(THREE); })
          .catch(function () { /* fallback water stays */ });
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

    sceneEl.addEventListener("mousemove", function (e) {
      var r = basinCanvas.getBoundingClientRect();
      bMX = e.clientX - r.left;
      bMY = e.clientY - r.top;
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
      pushSeaRipple(bx, Math.max(by, surfaceY(bx)), 1.0);
      bRips.push({ x: bx, y: Math.max(by, surfaceY(bx)), r: 2, max: 70, a: 0.5 });
      for (var s3 = 0; s3 < 12 && bSprays.length < 90; s3++) {
        var a3 = -Math.PI * (0.15 + Math.random() * 0.7);
        var v3 = 150 + Math.random() * 260;
        bSprays.push({ x: bx, y: by, vx: Math.cos(a3) * v3, vy: Math.sin(a3) * v3, life: 0.5 + Math.random() * 0.3 });
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
