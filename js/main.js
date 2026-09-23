/* ==========================================================================
   THINKSOCIALLY — SITE SCRIPT
   One file, shared by every page. Every feature below checks that its
   elements exist before wiring anything up, so this file is safe to load
   on a page that only has some of these components (or none of them).
   ========================================================================== */
(function () {
  "use strict";

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------------------
     1. THEME TOGGLE (light / dark)
     The <head> of every page sets data-theme as early as possible (see the
     inline snippet right after <meta charset>) so there is no flash of the
     wrong theme. This handler just flips that same attribute and remembers
     the choice, so it's the only place the decision is actually made.
     ------------------------------------------------------------------------ */
  (function themeToggle() {
    var root = document.documentElement;
    var btn = document.getElementById("themeToggle");
    var STORAGE_KEY = "ts-theme";

    function currentTheme() {
      var attr = root.getAttribute("data-theme");
      if (attr === "light" || attr === "dark") return attr;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function setTheme(theme) {
      root.setAttribute("data-theme", theme);
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* private mode, etc. */ }
      if (btn) btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }

    // Make sure the attribute is definitely set (covers pages/browsers where
    // the early inline script in <head> didn't run for any reason).
    setTheme(currentTheme());

    if (btn) {
      btn.addEventListener("click", function () {
        setTheme(currentTheme() === "dark" ? "light" : "dark");
      });
    }

    // If the person hasn't chosen a theme on this site yet, follow the OS
    // setting live (e.g. their system switches to dark mode at sunset).
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onSystemChange = function (e) {
        var saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (err) { /* ignore */ }
        if (!saved) setTheme(e.matches ? "dark" : "light");
      };
      if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
      else if (mq.addListener) mq.addListener(onSystemChange); // older Safari
    }
  })();

  /* ------------------------------------------------------------------------
     2. MOBILE NAVIGATION (burger menu + tap-to-open Services)
     ------------------------------------------------------------------------ */
  (function mobileNav() {
    var burger = document.getElementById("navBurger");
    var burgerIcon = document.getElementById("burgerIcon");
    var navLinks = document.getElementById("navLinks");
    if (!burger || !navLinks) return;

    var MOBILE_QUERY = window.matchMedia("(max-width: 920px)");

    function setBurgerIcon(open) {
      if (!burgerIcon) return;
      var use = burgerIcon.querySelector("use");
      if (use) use.setAttribute("href", open ? "#i-close" : "#i-menu");
    }

    function openMenu() {
      navLinks.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden"; // stop background scroll behind the drawer
      setBurgerIcon(true);
    }

    function closeMenu() {
      navLinks.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      setBurgerIcon(false);
      // also collapse any open Services submenu so it's fresh next time
      $$(".has-mega.is-open", navLinks).forEach(function (li) { li.classList.remove("is-open"); });
    }

    burger.addEventListener("click", function () {
      if (navLinks.classList.contains("is-open")) closeMenu(); else openMenu();
    });

    // Tapping a real destination link closes the drawer behind it.
    $$('a[href]:not([href="#services"])', navLinks).forEach(function (a) {
      a.addEventListener("click", function () {
        if (navLinks.classList.contains("is-open")) closeMenu();
      });
    });

    // Services has no page of its own on mobile — hover doesn't exist on
    // touch, so the first tap opens the submenu instead of navigating.
    $$(".has-mega").forEach(function (li) {
      var trigger = li.querySelector("a#servicesToggle, a");
      if (!trigger) return;
      trigger.addEventListener("click", function (e) {
        if (!MOBILE_QUERY.matches) return; // desktop: hover already handles this, let the link work normally
        e.preventDefault();
        li.classList.toggle("is-open");
      });
    });

    // Escape closes everything; resizing past the mobile breakpoint resets state.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navLinks.classList.contains("is-open")) closeMenu();
    });
    (MOBILE_QUERY.addEventListener ? MOBILE_QUERY.addEventListener.bind(MOBILE_QUERY) : MOBILE_QUERY.addListener.bind(MOBILE_QUERY))("change", function (e) {
      if (!e.matches) closeMenu();
    });
  })();

  /* ------------------------------------------------------------------------
     3. SERVICES TABS  (index.html "Our Services" tab-chooser)
     ------------------------------------------------------------------------ */
  (function serviceTabs() {
    var chooser = document.getElementById("tabChooser");
    if (!chooser) return;
    var tabs = $$(".tab-btn", chooser);
    var panels = $$(".tab-panel");

    function activate(name) {
      tabs.forEach(function (t) { t.setAttribute("aria-selected", t.dataset.tab === name ? "true" : "false"); });
      panels.forEach(function (p) { p.classList.toggle("is-active", p.dataset.panel === name); });
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function () { activate(t.dataset.tab); });
    });

    // Arrow-key navigation, matching the ARIA tabs pattern.
    chooser.addEventListener("keydown", function (e) {
      if (["ArrowRight", "ArrowLeft"].indexOf(e.key) === -1) return;
      var i = tabs.indexOf(document.activeElement);
      if (i === -1) return;
      e.preventDefault();
      var next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      activate(next.dataset.tab);
    });
  })();

  /* ------------------------------------------------------------------------
     4. "WHY US" FOCUS CAROUSEL  (index.html)
     ------------------------------------------------------------------------ */
  (function focusCarousel() {
    var track = document.getElementById("focusTrack");
    if (!track) return;
    var cards = $$(".focus-card", track);
    var prevBtn = document.getElementById("focusPrev");
    var nextBtn = document.getElementById("focusNext");

    function scrollByCard(dir) {
      var card = cards[0];
      if (!card) return;
      var amount = card.getBoundingClientRect().width + 22; // card width + gap
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
    }
    if (prevBtn) prevBtn.addEventListener("click", function () { scrollByCard(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { scrollByCard(1); });

    if ("IntersectionObserver" in window && cards.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-active", entry.intersectionRatio > 0.6);
        });
      }, { root: track, threshold: [0, 0.6, 1] });
      cards.forEach(function (c) { io.observe(c); });
    }
  })();

  /* ------------------------------------------------------------------------
     5. "WHY THINKSOCIALLY" ACCORDION  (index.html)
     ------------------------------------------------------------------------ */
  (function whyAccordion() {
    var root = document.getElementById("whyAccordion");
    if (!root) return;
    var items = $$(".why-item", root);

    function setOpen(item, open) {
      var body = item.querySelector(".why-item-body");
      item.classList.toggle("is-open", open);
      if (!body) return;
      body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
    }

    items.forEach(function (item) {
      var head = item.querySelector(".why-item-head");
      if (!head) return;
      setOpen(item, item.classList.contains("is-open"));
      head.addEventListener("click", function () {
        var willOpen = !item.classList.contains("is-open");
        items.forEach(function (other) { setOpen(other, false); }); // one open at a time
        setOpen(item, willOpen);
      });
    });

    // Re-measure open panels if the layout reflows (e.g. orientation change).
    window.addEventListener("resize", function () {
      items.forEach(function (item) {
        if (item.classList.contains("is-open")) setOpen(item, true);
      });
    });
  })();

  /* ------------------------------------------------------------------------
     6. TESTIMONIALS SLIDER  (index.html)
     ------------------------------------------------------------------------ */
  (function testimonials() {
    var track = document.getElementById("testiTrack");
    if (!track) return;
    var slides = $$(".testi-slide", track);
    var dotsWrap = document.getElementById("testiDots");
    var dots = dotsWrap ? $$(".testi-dot", dotsWrap) : [];
    var prevBtn = document.getElementById("testiPrev");
    var nextBtn = document.getElementById("testiNext");
    var i = Math.max(0, slides.findIndex(function (s) { return s.classList.contains("is-active"); }));

    function show(index) {
      i = (index + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle("is-active", n === i); });
      dots.forEach(function (d, n) { d.classList.toggle("is-active", n === i); });
    }
    if (prevBtn) prevBtn.addEventListener("click", function () { show(i - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { show(i + 1); });
    dots.forEach(function (d, n) { d.addEventListener("click", function () { show(n); }); });

    if (slides.length > 1) {
      var timer = setInterval(function () { show(i + 1); }, 9000);
      track.addEventListener("mouseenter", function () { clearInterval(timer); });
    }
  })();

  /* ------------------------------------------------------------------------
     7. CONTACT FORM  (contact.html) — Formspree
     Submits via fetch() so the page never reloads: the form fades into a
     confirmation state on success, or shows an inline error (with a mailto
     fallback) if the request fails. Formspree endpoint lives on the form's
     own action attribute in contact.html, so this file has nothing
     site-specific hard-coded in it.
     ------------------------------------------------------------------------ */
  (function contactForm() {
    var form = document.getElementById("contactForm");
    var status = document.getElementById("formStatus");
    var submitBtn = document.getElementById("formSubmitBtn");
    if (!form) return;

    var endpoint = form.getAttribute("action");
    var submitLabel = submitBtn ? submitBtn.querySelector(".btn-submit-label") : null;
    var defaultLabelText = submitLabel ? submitLabel.textContent : (submitBtn ? submitBtn.textContent : "Send inquiry");

    function setStatus(message, kind) {
      if (!status) return;
      status.textContent = message;
      status.classList.remove("is-error", "is-success");
      if (kind) status.classList.add(kind);
    }

    function setLoading(isLoading) {
      if (!submitBtn) return;
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle("is-loading", isLoading);
      var label = isLoading ? "Sending…" : defaultLabelText;
      if (submitLabel) submitLabel.textContent = label; else submitBtn.textContent = label;
    }

    // Turns Formspree's error payload into something a visitor can actually
    // read, instead of a raw API error.
    function extractErrorMessage(payload) {
      if (payload && Array.isArray(payload.errors) && payload.errors.length) {
        return payload.errors.map(function (err) { return err.message; }).join(" ");
      }
      return "Something went wrong sending your message. Please try again, or email us directly.";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!endpoint) {
        setStatus("This form isn't connected yet — please email us directly.", "is-error");
        return;
      }

      setLoading(true);
      setStatus("Sending your message…");

      var formData = new FormData(form);

      fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            setStatus("Thanks — your message has been sent. We'll be in touch within 24 hours.", "is-success");
            form.reset();
          } else {
            setStatus(extractErrorMessage(result.data), "is-error");
          }
        })
        .catch(function () {
          setStatus("We couldn't reach the server. Check your connection and try again, or email us directly.", "is-error");
        })
        .then(function () {
          setLoading(false);
        });
    });
  })();

  /* ------------------------------------------------------------------------
     8. SMOOTH-SCROLL OFFSET FOR THE FIXED HEADER
     html{scroll-behavior:smooth} already handles the animation; this just
     nudges same-page anchor jumps down so the fixed nav doesn't cover the
     heading they land on.
     ------------------------------------------------------------------------ */
  (function anchorOffset() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href").slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 76;
        var top = target.getBoundingClientRect().top + window.pageYOffset - (navH + 16);
        window.scrollTo({ top: top, behavior: "smooth" });
        history.pushState(null, "", "#" + id);
      });
    });
  })();
})();