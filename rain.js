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
