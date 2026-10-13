/* Summit Home Remodeling — site behaviour. Original work, no dependencies. */
(function () {
  "use strict";

  /* ---- mobile nav ------------------------------------------------------- */
  var burger = document.querySelector(".burger");
  var nav    = document.querySelector(".nav");
  var scrim  = document.querySelector(".nav-scrim");

  function setNav(open) {
    if (!nav || !burger) return;
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    if (scrim) scrim.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }

  if (burger) burger.addEventListener("click", function () {
    setNav(!nav.classList.contains("is-open"));
  });
  if (scrim) scrim.addEventListener("click", function () { setNav(false); });
  var navClose = document.querySelector(".nav__close");
  if (navClose) navClose.addEventListener("click", function () { setNav(false); });
  // a tap on any menu link closes the panel before the page changes
  document.querySelectorAll(".nav a").forEach(function (a) {
    a.addEventListener("click", function () { setNav(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setNav(false);
  });

  /* ---- sticky header shadow --------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- hero slideshow ---------------------------------------------------- */
  // slides after the first carry their image in data-bg so they don't block first paint
  function loadDeferredSlides() {
    document.querySelectorAll(".hero__slide[data-bg]").forEach(function (s) {
      s.style.backgroundImage = s.dataset.bg;
      s.removeAttribute("data-bg");
    });
  }
  if (document.readyState === "complete") loadDeferredSlides();
  else window.addEventListener("load", loadDeferredSlides);

  var heroSlides = Array.prototype.slice.call(document.querySelectorAll(".hero__slide"));
  var heroDots   = Array.prototype.slice.call(document.querySelectorAll(".hero__dot"));
  if (heroSlides.length > 1) {
    var idx = 0, timer = null;
    var show = function (n) {
      idx = (n + heroSlides.length) % heroSlides.length;
      heroSlides.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
      heroDots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === idx);
        d.setAttribute("aria-selected", String(i === idx));
      });
    };
    var start = function () { timer = setInterval(function () { show(idx + 1); }, 6000); };
    var stop  = function () { clearInterval(timer); };
    heroDots.forEach(function (d, i) {
      d.addEventListener("click", function () { stop(); show(i); start(); });
    });
    show(0);
    start();
  }

  /* ---- before / after sliders -------------------------------------------- */
  document.querySelectorAll(".ba").forEach(function (box) {
    var after  = box.querySelector(".ba__after");
    var handle = box.querySelector(".ba__handle");
    if (!after || !handle) return;

    var dragging = false;

    function setPos(clientX) {
      var r = box.getBoundingClientRect();
      var pct = ((clientX - r.left) / r.width) * 100;
      pct = Math.max(0, Math.min(100, pct));
      after.style.clipPath = "inset(0 0 0 " + pct + "%)";
      handle.style.left = pct + "%";
      box.setAttribute("aria-valuenow", Math.round(pct));
    }

    box.addEventListener("pointerdown", function (e) {
      dragging = true;
      box.setPointerCapture(e.pointerId);
      setPos(e.clientX);
    });
    box.addEventListener("pointermove", function (e) {
      if (dragging) setPos(e.clientX);
    });
    ["pointerup", "pointercancel"].forEach(function (ev) {
      box.addEventListener(ev, function () { dragging = false; });
    });

    box.addEventListener("keydown", function (e) {
      var cur = parseFloat(box.getAttribute("aria-valuenow") || "50");
      if (e.key === "ArrowLeft")  { cur -= 4; } else
      if (e.key === "ArrowRight") { cur += 4; } else return;
      e.preventDefault();
      cur = Math.max(0, Math.min(100, cur));
      after.style.clipPath = "inset(0 0 0 " + cur + "%)";
      handle.style.left = cur + "%";
      box.setAttribute("aria-valuenow", Math.round(cur));
    });
  });

  /* ---- faq accordion ------------------------------------------------------ */
  document.querySelectorAll(".faq__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq__item");
      var panel = item.querySelector(".faq__a");
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
    });
  });

  /* ---- counters ----------------------------------------------------------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || "";
    var decimals = (el.dataset.count.split(".")[1] || "").length;
    var started = null, dur = 1400;
    function frame(ts) {
      if (!started) started = ts;
      var p = Math.min((ts - started) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---- reveal on scroll + counter trigger --------------------------------- */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls  = document.querySelectorAll(".reveal");
  var counterEls = document.querySelectorAll("[data-count]");

  if (reduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
    counterEls.forEach(function (el) {
      el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains("reveal")) el.classList.add("is-in");
        if (el.dataset.count) countUp(el);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px" });

    revealEls.forEach(function (el) { io.observe(el); });
    counterEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- contact form (no backend yet — demo behaviour) --------------------- */
  document.querySelectorAll("form[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form__status");
      if (status) {
        status.textContent =
          "Thanks — your request has been received. We'll call you back within one business day.";
        status.classList.add("is-visible");
      }
      form.reset();
    });
  });
})();
