/* ============================================================
   AI Career Copilot — deck engine v2
   keyboard · touch · dots · overview · counters · fullscreen
   directional transitions · sweep · typewriter headlines
   ============================================================ */
(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const dotsWrap = document.getElementById("dots");
  const overview = document.getElementById("overview");
  const overviewGrid = document.getElementById("overviewGrid");
  const progressFill = document.getElementById("progressFill");
  const slideNow = document.getElementById("slideNow");
  const slideTotal = document.getElementById("slideTotal");
  const hintbar = document.getElementById("hintbar");
  const sweep = document.getElementById("sweep");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;

  slideTotal.textContent = slides.length;

  /* ---------- build dots + overview ---------- */
  slides.forEach((s, i) => {
    const d = document.createElement("button");
    d.className = "dot";
    d.title = (i + 1) + " · " + (s.dataset.title || "");
    d.addEventListener("click", () => go(i));
    dotsWrap.appendChild(d);

    const ov = document.createElement("button");
    ov.className = "ov-card";
    ov.innerHTML =
      '<span class="ov-num">' + String(i + 1).padStart(2, "0") + "</span>" +
      '<div class="ov-title">' + (s.dataset.title || "Slide " + (i + 1)) + "</div>";
    ov.addEventListener("click", () => { toggleOverview(false); go(i); });
    overviewGrid.appendChild(ov);
  });
  const dots = Array.from(dotsWrap.children);
  const ovCards = Array.from(overviewGrid.children);

  /* ---------- typewriter ---------- */
  const typewriters = new Map();
  function runTypewriters(slide) {
    slide.querySelectorAll(".typewriter").forEach((el) => {
      if (!typewriters.has(el)) typewriters.set(el, el.dataset.text || el.textContent);
      const text = typewriters.get(el);
      el.textContent = "";
      el.classList.remove("done");
      if (reducedMotion) { el.textContent = text; el.classList.add("done"); return; }
      let i = 0;
      const speed = Math.max(14, Math.round(1500 / Math.max(text.length, 1)));
      const t = window.setInterval(() => {
        el.textContent = text.slice(0, ++i);
        if (i >= text.length) { window.clearInterval(t); el.classList.add("done"); }
      }, speed);
    });
  }

  /* ---------- navigation core ---------- */
  function go(n, dir) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    const direction = dir ?? (n > index ? 1 : n < index ? -1 : 0);
    if (n === index && slides[index].classList.contains("active")) return;
    const prevSlide = slides[index];
    if (prevSlide && n !== index) {
      prevSlide.classList.add("leaving");
      prevSlide.classList.remove("active");
      window.setTimeout(() => prevSlide.classList.remove("leaving"), 600);
    }
    index = n;
    const cur = slides[index];

    // directional entrance: pre-position, reflow, then activate
    if (!reducedMotion && direction !== 0) {
      cur.style.transition = "none";
      cur.style.transform = "translateX(" + (direction > 0 ? 70 : -70) + "px) scale(0.99)";
      void cur.offsetWidth;
      cur.style.transition = "";
      cur.style.transform = "";
    }

    cur.classList.add("active");

    // restart reveal animations
    cur.querySelectorAll(".r1,.r2,.r3,.r4,.r5,.r6,.r7").forEach((el) => {
      el.style.animation = "none";
      void el.offsetWidth; // reflow
      el.style.animation = "";
    });

    // effects
    runTypewriters(cur);
    cur.querySelectorAll(".count").forEach(animateCount);
    if (!reducedMotion && direction !== 0) {
      sweep.classList.remove("go");
      void sweep.offsetWidth;
      sweep.classList.add("go");
    }

    // hud
    dots.forEach((d, i) => d.classList.toggle("on", i === index));
    ovCards.forEach((c, i) => c.classList.toggle("cur", i === index));
    slideNow.textContent = index + 1;
    progressFill.style.width = ((index) / (slides.length - 1)) * 100 + "%";
    history.replaceState(null, "", "#" + (index + 1));
  }

  const next = () => go(index + 1, 1);
  const prev = () => go(index - 1, -1);

  /* ---------- animated counters ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count || "0");
    const dur = 1100;
    const t0 = performance.now();
    function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown" || e.key === "Enter") {
      e.preventDefault(); next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault(); prev();
    } else if (e.key === "Home") {
      go(0, -1);
    } else if (e.key === "End") {
      go(slides.length - 1, 1);
    } else if (e.key === "f" || e.key === "F") {
      toggleFull();
    } else if (e.key === "o" || e.key === "O") {
      toggleOverview();
    } else if (e.key === "Escape") {
      toggleOverview(false);
    }
  });

  /* ---------- touch swipe ---------- */
  let touchX = null, touchY = null;
  document.addEventListener("touchstart", (e) => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      dx < 0 ? next() : prev();
    }
    touchX = touchY = null;
  }, { passive: true });

  /* ---------- click zones (sides) ---------- */
  const zl = document.createElement("div"); zl.className = "zone zl";
  const zr = document.createElement("div"); zr.className = "zone zr";
  zl.addEventListener("click", prev);
  zr.addEventListener("click", next);
  document.body.appendChild(zl);
  document.body.appendChild(zr);

  /* ---------- hud buttons ---------- */
  document.getElementById("btnNext").addEventListener("click", next);
  document.getElementById("btnPrev").addEventListener("click", prev);
  document.getElementById("btnFull").addEventListener("click", toggleFull);
  document.getElementById("btnOverview").addEventListener("click", () => toggleOverview());

  function toggleFull() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function toggleOverview(force) {
    const open = typeof force === "boolean" ? force : !overview.classList.contains("open");
    overview.classList.toggle("open", open);
  }
  overview.addEventListener("click", (e) => {
    if (e.target === overview) toggleOverview(false);
  });

  /* ---------- hint auto-hide ---------- */
  window.setTimeout(() => hintbar.classList.add("hide"), 7000);
  hintbar.addEventListener("click", () => hintbar.classList.add("hide"));

  /* ---------- wheel (throttled) ---------- */
  let wheelLock = false;
  document.addEventListener("wheel", (e) => {
    if (overview.classList.contains("open") || wheelLock) return;
    if (Math.abs(e.deltaY) < 28) return;
    wheelLock = true;
    e.deltaY > 0 ? next() : prev();
    window.setTimeout(() => (wheelLock = false), 900);
  }, { passive: true });

  /* ---------- boot: honor #hash ---------- */
  const start = parseInt(location.hash.replace("#", ""), 10);
  go(Number.isInteger(start) && start > 0 ? start - 1 : 0, 1);
})();
