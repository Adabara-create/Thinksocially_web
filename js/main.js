javascript
/* ==========================================================================
   THINKSOCIALLY — SITE SCRIPT
   One file, shared by every page. Every feature below checks that its
   elements exist before wiring anything up, so this file is safe to load
   on a page that only has some of these components (or none of them).
   ========================================================================== */

(function () {
  "use strict";

  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };

  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call(
      (ctx || document).querySelectorAll(sel)
    );
  };


  /* ------------------------------------------------------------------------
     1. THEME TOGGLE (light / dark)
     ------------------------------------------------------------------------ */

  (function themeToggle() {
    var root = document.documentElement;
    var btn = document.getElementById("themeToggle");
    var STORAGE_KEY = "ts-theme";

    function currentTheme() {
      var attr = root.getAttribute("data-theme");

      if (attr === "light" || attr === "dark") {
        return attr;
      }

      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    function setTheme(theme) {
      root.setAttribute("data-theme", theme);

      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {}

      if (btn) {
        btn.setAttribute(
          "aria-pressed",
          theme === "dark" ? "true" : "false"
        );
      }
    }

    setTheme(currentTheme());

    if (btn) {
      btn.addEventListener("click", function () {
        setTheme(
          currentTheme() === "dark"
            ? "light"
            : "dark"
        );
      });
    }

    if (window.matchMedia) {
      var mq = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );

      var onSystemChange = function (e) {
        var saved = null;

        try {
          saved = localStorage.getItem(STORAGE_KEY);
        } catch (err) {}

        if (!saved) {
          setTheme(e.matches ? "dark" : "light");
        }
      };

      if (mq.addEventListener) {
        mq.addEventListener("change", onSystemChange);
      } else if (mq.addListener) {
        mq.addListener(onSystemChange);
      }
    }
  })();


  /* ------------------------------------------------------------------------
     2. MOBILE NAVIGATION
     ------------------------------------------------------------------------ */

  (function mobileNav() {
    var burger = document.getElementById("navBurger");
    var burgerIcon = document.getElementById("burgerIcon");
    var navLinks = document.getElementById("navLinks");

    if (!burger || !navLinks) return;

    var MOBILE_QUERY = window.matchMedia(
      "(max-width: 920px)"
    );

    function setBurgerIcon(open) {
      if (!burgerIcon) return;

      var use = burgerIcon.querySelector("use");

      if (use) {
        use.setAttribute(
          "href",
          open ? "#i-close" : "#i-menu"
        );
      }
    }

    function openMenu() {
      navLinks.classList.add("is-open");

      burger.setAttribute(
        "aria-expanded",
        "true"
      );

      document.body.style.overflow = "hidden";

      setBurgerIcon(true);
    }

    function closeMenu() {
      navLinks.classList.remove("is-open");

      burger.setAttribute(
        "aria-expanded",
        "false"
      );

      document.body.style.overflow = "";

      setBurgerIcon(false);

      $$(".has-mega.is-open", navLinks).forEach(
        function (li) {
          li.classList.remove("is-open");
        }
      );
    }

    burger.addEventListener("click", function () {
      if (navLinks.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    $$(
      'a[href]:not([href="#services"])',
      navLinks
    ).forEach(function (a) {
      a.addEventListener("click", function () {
        if (navLinks.classList.contains("is-open")) {
          closeMenu();
        }
      });
    });

    $$(".has-mega").forEach(function (li) {
      var trigger = li.querySelector(
        "a#servicesToggle, a"
      );

      if (!trigger) return;

      trigger.addEventListener("click", function (e) {
        if (!MOBILE_QUERY.matches) return;

        e.preventDefault();

        li.classList.toggle("is-open");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (
        e.key === "Escape" &&
        navLinks.classList.contains("is-open")
      ) {
        closeMenu();
      }
    });

    var mediaChange = function (e) {
      if (!e.matches) {
        closeMenu();
      }
    };

    if (MOBILE_QUERY.addEventListener) {
      MOBILE_QUERY.addEventListener(
        "change",
        mediaChange
      );
    } else if (MOBILE_QUERY.addListener) {
      MOBILE_QUERY.addListener(mediaChange);
    }
  })();


  /* ------------------------------------------------------------------------
     3. SERVICES TABS
     ------------------------------------------------------------------------ */

  (function serviceTabs() {
    var chooser = document.getElementById(
      "tabChooser"
    );

    if (!chooser) return;

    var tabs = $$(".tab-btn", chooser);
    var panels = $$(".tab-panel");

    function activate(name) {
      tabs.forEach(function (t) {
        t.setAttribute(
          "aria-selected",
          t.dataset.tab === name
            ? "true"
            : "false"
        );
      });

      panels.forEach(function (p) {
        p.classList.toggle(
          "is-active",
          p.dataset.panel === name
        );
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        activate(t.dataset.tab);
      });
    });

    chooser.addEventListener("keydown", function (e) {
      if (
        ["ArrowRight", "ArrowLeft"].indexOf(e.key) ===
        -1
      ) {
        return;
      }

      var i = tabs.indexOf(
        document.activeElement
      );

      if (i === -1) return;

      e.preventDefault();

      var next =
        tabs[
          (i +
            (e.key === "ArrowRight" ? 1 : -1) +
            tabs.length) %
            tabs.length
        ];

      next.focus();

      activate(next.dataset.tab);
    });
  })();


  /* ------------------------------------------------------------------------
     4. "WHY US" FOCUS CAROUSEL
     ------------------------------------------------------------------------ */

  (function focusCarousel() {
    var track = document.getElementById(
      "focusTrack"
    );

    if (!track) return;

    var cards = $$(".focus-card", track);
    var prevBtn = document.getElementById(
      "focusPrev"
    );
    var nextBtn = document.getElementById(
      "focusNext"
    );

    function scrollByCard(dir) {
      var card = cards[0];

      if (!card) return;

      var amount =
        card.getBoundingClientRect().width + 22;

      track.scrollBy({
        left: dir * amount,
        behavior: "smooth"
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        scrollByCard(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        scrollByCard(1);
      });
    }

    if (
      "IntersectionObserver" in window &&
      cards.length
    ) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle(
              "is-active",
              entry.intersectionRatio > 0.6
            );
          });
        },
        {
          root: track,
          threshold: [0, 0.6, 1]
        }
      );

      cards.forEach(function (c) {
        io.observe(c);
      });
    }
  })();


  /* ------------------------------------------------------------------------
     5. "WHY THINKSOCIALLY" ACCORDION
     ------------------------------------------------------------------------ */

  (function whyAccordion() {
    var root = document.getElementById(
      "whyAccordion"
    );

    if (!root) return;

    var items = $$(".why-item", root);

    function setOpen(item, open) {
      var body = item.querySelector(
        ".why-item-body"
      );

      item.classList.toggle(
        "is-open",
        open
      );

      if (!body) return;

      body.style.maxHeight = open
        ? body.scrollHeight + "px"
        : "0px";
    }

    items.forEach(function (item) {
      var head = item.querySelector(
        ".why-item-head"
      );

      if (!head) return;

      setOpen(
        item,
        item.classList.contains("is-open")
      );

      head.addEventListener(
        "click",
        function () {
          var willOpen =
            !item.classList.contains("is-open");

          items.forEach(function (other) {
            setOpen(other, false);
          });

          setOpen(item, willOpen);
        }
      );
    });

    window.addEventListener(
      "resize",
      function () {
        items.forEach(function (item) {
          if (
            item.classList.contains("is-open")
          ) {
            setOpen(item, true);
          }
        });
      }
    );
  })();


  /* ------------------------------------------------------------------------
     6. TESTIMONIALS SLIDER
     ------------------------------------------------------------------------ */

  (function testimonials() {
    var track = document.getElementById(
      "testiTrack"
    );

    if (!track) return;

    var slides = $$(".testi-slide", track);
    var dotsWrap = document.getElementById(
      "testiDots"
    );

    var dots = dotsWrap
      ? $$(".testi-dot", dotsWrap)
      : [];

    var prevBtn = document.getElementById(
      "testiPrev"
    );

    var nextBtn = document.getElementById(
      "testiNext"
    );

    var i = Math.max(
      0,
      slides.findIndex(function (s) {
        return s.classList.contains(
          "is-active"
        );
      })
    );

    function show(index) {
      i =
        (index + slides.length) %
        slides.length;

      slides.forEach(function (s, n) {
        s.classList.toggle(
          "is-active",
          n === i
        );
      });

      dots.forEach(function (d, n) {
        d.classList.toggle(
          "is-active",
          n === i
        );
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener(
        "click",
        function () {
          show(i - 1);
        }
      );
    }

    if (nextBtn) {
      nextBtn.addEventListener(
        "click",
        function () {
          show(i + 1);
        }
      );
    }

    dots.forEach(function (d, n) {
      d.addEventListener(
        "click",
        function () {
          show(n);
        }
      );
    });

    if (slides.length > 1) {
      var timer = setInterval(
        function () {
          show(i + 1);
        },
        9000
      );

      track.addEventListener(
        "mouseenter",
        function () {
          clearInterval(timer);
        }
      );
    }
  })();


  /* ------------------------------------------------------------------------
     7. CONTACT FORM — FORMSPREE

     Formspree now handles the submission directly.

     Flow:

     contact.html
          ↓
     Formspree
          ↓
     configured email inbox

     No FastAPI request is made here.
     No /api/contact endpoint is used.
     ------------------------------------------------------------------------ */

  (function contactForm() {
    var form = document.getElementById(
      "contactForm"
    );

    if (!form) return;

    var submitBtn = document.getElementById(
      "formSubmitBtn"
    );

    if (!submitBtn) return;

    var submitLabel =
      submitBtn.querySelector(
        ".btn-submit-label"
      );

    var defaultLabel =
      submitLabel
        ? submitLabel.textContent
        : "Send inquiry";


    form.addEventListener(
      "submit",
      function () {

        submitBtn.disabled = true;

        submitBtn.classList.add(
          "is-loading"
        );

        if (submitLabel) {
          submitLabel.textContent =
            "Sending...";
        }
      }
    );


    /*
      Formspree normally redirects to its response
      page after a successful submission.

      This listener only changes the button state while
      the form is being submitted.
    */

  })();

})();

