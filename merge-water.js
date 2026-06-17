/* ==========================================================================
   merge-water.js - compact WebGL water bands that end a dark section and
   dissolve into the paper section below, echoing the hero ocean. One instance
   per [data-merge-water] host. Reuses three@0.165.0 (cached by the hero).
   ========================================================================== */
(function () {
  "use strict";

  var hosts = [].slice.call(document.querySelectorAll("[data-merge-water]"));
  if (!hosts.length) return;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var VERT = [
    "varying vec2 vUv;",
    "void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform float uTime;",
    "uniform vec2 uRes;",
    "uniform float uFlip;",
    "uniform float uOcean;",
    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }",
    "float noise(vec2 p){ vec2 i=floor(p), f=fract(p); float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.)); vec2 u=f*f*(3.-2.*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }",
    "float fbm(vec2 p){ float v=0.0, a=0.55; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=0.5; } return v; }",
    "void main(){",
    "  float y = (uFlip > 0.5) ? vUv.y : (1.0 - vUv.y);",            /* 0 = horizon/dark, 1 = paper */
    "  float persp = mix(0.10, (uOcean > 0.5 ? 0.58 : 1.0), y);",  /* calmer + more distant for the open-ocean band */
    "  float t = uTime;",
    "  vec2 wp = vec2(vUv.x*3.4, y*5.2);",
    "  float w = fbm(wp + vec2(t*0.05, -t*0.20));",
    "  w += 0.5 * fbm(wp*2.4 + vec2(-t*0.11, t*0.32));",
    "  w *= persp;",
    "  float crest = smoothstep(0.50, 0.95, w);",
    "  vec3 deep = vec3(0.055,0.120,0.205);",
    "  vec3 mid  = vec3(0.105,0.235,0.375);",
    "  vec3 col = mix(deep, mid, smoothstep(0.0, 0.55, y));",
    "  col += crest * vec3(0.22,0.46,0.58) * persp;",
    "  col += smoothstep(0.26, 0.04, y) * vec3(0.03,0.09,0.15);",
    "  if (uOcean > 0.5) {",                                            /* open-ocean band: no paper, fade into the hero (far) and dark statement (near) */
    "    col *= 0.78;",                                                 /* a dark, moody sea to match the rainy-night hero */
    "    col += crest * vec3(0.10,0.20,0.27) * persp * 1.4;",           /* clearer swells / reflections so it reads as water */
    "    float ofoam = smoothstep(0.54, 0.85, y) * (0.16 + 0.5*crest);",
    "    col = mix(col, vec3(0.42,0.60,0.72), ofoam*0.40);",            /* restrained sparkle on the swells, never a white slab */
    "    col += smoothstep(0.13, 0.0, y) * vec3(0.08,0.16,0.24);",      /* faint, moody light along the far horizon */
    "    float oa = smoothstep(0.0, 0.20, y) * (1.0 - smoothstep(0.64, 1.0, y));",  /* emerge gently from the hero, sink into the dark near-water */
    "    gl_FragColor = vec4(col, oa);",
    "    return;",
    "  }",
    "  vec3 paper = vec3(0.980,0.972,0.961);",
    "  float toPaper = smoothstep(0.62, 1.0, y + w*0.04);",
    "  float foam = smoothstep(0.52, 0.70, y) * (0.35 + 0.65*crest) * (1.0 - toPaper);",
    "  col = mix(col, vec3(0.88,0.94,0.98), foam*0.6);",
    "  col = mix(col, paper, toPaper);",
    "  float alpha = smoothstep(0.0, 0.36, y);",
    "  alpha = max(alpha, toPaper);",
    "  gl_FragColor = vec4(col, alpha);",
    "}"
  ].join("\n");

  function initOne(THREE, host) {
    var canvas = host.querySelector("canvas");
    if (!canvas) return;
    var flip = host.hasAttribute("data-flip") ? 1 : 0;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, premultipliedAlpha: false });
    } catch (e) { host.style.display = "none"; return; }
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var mat = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uFlip: { value: flip }, uOcean: { value: host.hasAttribute("data-ocean") ? 1 : 0 } },
      vertexShader: VERT,
      fragmentShader: FRAG
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    function resize() {
      var r = host.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      var w = Math.max(1, Math.round(r.width));
      var h = Math.max(1, Math.round(r.height));
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      mat.uniforms.uRes.value.set(w, h);
    }
    resize();
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });

    if (reduce) { mat.uniforms.uTime.value = 3.0; renderer.render(scene, cam); return; }

    var raf = null, t0 = performance.now(), visible = true;
    function loop(now) {
      mat.uniforms.uTime.value = (now - t0) / 1000;
      renderer.render(scene, cam);
      raf = visible ? requestAnimationFrame(loop) : null;
    }
    function play() { if (!raf) raf = requestAnimationFrame(loop); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; if (visible) play(); else stop(); });
      }, { threshold: 0 }).observe(host);
    }
    play();
  }

  function start(THREE) { hosts.forEach(function (h) { initOne(THREE, h); }); }

  function boot() {
    if (window.THREE && window.THREE.WebGLRenderer) { start(window.THREE); return; }
    import("https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.min.js")
      .then(function (THREE) { start(THREE); })
      .catch(function () { hosts.forEach(function (h) { h.style.display = "none"; }); });
  }

  if (window.requestIdleCallback) window.requestIdleCallback(boot, { timeout: 2500 });
  else window.setTimeout(boot, 900);
})();
