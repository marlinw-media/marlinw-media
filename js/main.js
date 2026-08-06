// ==========================================================================
// MarlinW Media — Site JS
// ==========================================================================

(function () {
  'use strict';

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const themeSwitches = document.querySelectorAll('.theme-switch');
  const stored = localStorage.getItem('mw-theme');
  const initialTheme = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  root.setAttribute('data-theme', initialTheme);

  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function reflectSwitches() {
    const isLight = currentTheme() === 'light';
    themeSwitches.forEach((sw) => sw.setAttribute('aria-checked', String(isLight)));
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('mw-theme', theme);
    reflectSwitches();
  }

  reflectSwitches();
  themeSwitches.forEach((sw) => {
    sw.addEventListener('click', () => {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileNavClose = document.querySelector('.mobile-nav-close');

  function closeMobileNav() { mobileNav && mobileNav.classList.remove('open'); }

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => mobileNav.classList.add('open'));
    mobileNavClose && mobileNavClose.addEventListener('click', closeMobileNav);
    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMobileNav));
  }

  /* ---------- Reveal on scroll (progressive enhancement: elements are
     visible by default; JS opts them into a fade-in if IO is available).
     Siblings that share a parent (card grids, testimonial lists, ...) get
     a small incremental transition-delay so they pop in one after another
     instead of all at once. ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealEls.length && !reduceMotion) {
    const STAGGER_MS = 70;
    const STAGGER_MAX = 6;
    const groups = new Map();
    revealEls.forEach((el) => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach((items) => {
      if (items.length > 1) {
        items.forEach((el, i) => {
          el.style.transitionDelay = Math.min(i, STAGGER_MAX) * STAGGER_MS + 'ms';
        });
      }
    });
  }

  if ('IntersectionObserver' in window && revealEls.length && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (alreadyVisible) return; // don't hide what's already on screen
      el.classList.add('reveal-pending');
      io.observe(el);
    });
  }

  /* ---------- Portfolio filter ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioGrid = document.querySelector('.portfolio-grid');

  if (filterBtns.length && portfolioGrid) {
    const cards = portfolioGrid.querySelectorAll('.p-card');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        let visible = 0;
        cards.forEach((card) => {
          const match = cat === 'all' || card.dataset.category === cat;
          card.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        portfolioGrid.classList.toggle('list-empty', visible === 0);
      });
    });
  }

  /* Prefill contact form from a package "Anfragen" click */
  const contactMessage = document.getElementById('field-message');
  const contactService = document.getElementById('field-service');

  document.querySelectorAll('[data-request-package]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkg = btn.dataset.requestPackage;
      const price = btn.dataset.requestPrice || '';
      if (contactMessage) {
        contactMessage.value = `Ich interessiere mich für: ${pkg}${price ? ' (Schätzpreis ' + price + ')' : ''}.\n\nKurz zu meinem Projekt: `;
      }
      if (contactService) {
        const opt = Array.from(contactService.options).find((o) => o.value === btn.dataset.requestCategory);
        if (opt) contactService.value = opt.value;
      }
      const contactSection = document.getElementById('kontakt');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => contactMessage && contactMessage.focus(), 500);
      }
    });
  });

  /* ---------- Hourly calculator ---------- */
  const RATES = { planning: 40, shooting: 90, editing: 55, km: 0.5 };

  const rangePlanning = document.getElementById('range-planning');
  const rangeShooting = document.getElementById('range-shooting');
  const rangeEditing = document.getElementById('range-editing');
  const rangeKm = document.getElementById('range-km');
  const calcTotal = document.getElementById('calc-total');
  const calcSendBtn = document.getElementById('calc-send');

  function fmtEUR(n) {
    return n.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' €';
  }

  function updateCalc() {
    if (!rangePlanning) return;
    const planning = Number(rangePlanning.value);
    const shooting = Number(rangeShooting.value);
    const editing = Number(rangeEditing.value);
    const km = Number(rangeKm.value);

    document.getElementById('val-planning').textContent = planning + ' Std.';
    document.getElementById('val-shooting').textContent = shooting + ' Std.';
    document.getElementById('val-editing').textContent = editing + ' Std.';
    document.getElementById('val-km').textContent = km + ' km';

    const total =
      planning * RATES.planning +
      shooting * RATES.shooting +
      editing * RATES.editing +
      km * RATES.km;

    if (calcTotal) calcTotal.textContent = fmtEUR(total);
  }

  [rangePlanning, rangeShooting, rangeEditing, rangeKm].forEach((el) => {
    if (el) el.addEventListener('input', updateCalc);
  });
  updateCalc();

  if (calcSendBtn) {
    calcSendBtn.addEventListener('click', () => {
      if (contactMessage) {
        const planning = rangePlanning.value;
        const shooting = rangeShooting.value;
        const editing = rangeEditing.value;
        const km = rangeKm.value;
        contactMessage.value =
          `Individuelle Kalkulation:\n` +
          `– Planung/Vorbereitung: ${planning} Std.\n` +
          `– Shooting/Dreh: ${shooting} Std.\n` +
          `– Editing: ${editing} Std.\n` +
          `– Anfahrt: ${km} km\n` +
          `– Geschätzter Gesamtpreis: ${calcTotal.textContent}\n\n` +
          `Kurz zu meinem Projekt: `;
      }
      const contactSection = document.getElementById('kontakt');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => contactMessage && contactMessage.focus(), 500);
      }
    });
  }

  /* ---------- Contact form submit (FormSubmit.co, no backend required) ---------- */
  const form = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet …';
      formStatus.className = 'form-status';

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          formStatus.textContent = 'Danke! Deine Anfrage wurde gesendet — ich melde mich schnellstmöglich zurück.';
          formStatus.classList.add('show', 'ok');
          form.reset();
          updateCalc();
        } else {
          throw new Error('Request failed');
        }
      } catch (err) {
        formStatus.textContent =
          'Da ist etwas schiefgelaufen. Schreib mir gerne direkt an marlinw.media@gmail.com.';
        formStatus.classList.add('show', 'err');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Lightbox (click any marked image to view it larger) ---------- */
  const lightboxTriggers = document.querySelectorAll('img[data-lightbox]');
  if (lightboxTriggers.length) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<img alt="">';
    document.body.appendChild(overlay);
    const overlayImg = overlay.querySelector('img');
    const closeBtn = overlay.querySelector('.lightbox-close');

    function openLightbox(src, alt) {
      overlayImg.src = src;
      overlayImg.alt = alt || '';
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    lightboxTriggers.forEach((img) => {
      img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt));
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox();
    });
    closeBtn.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }
})();
