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

  /* ---------- Accent color picker ---------- */
  const ACCENTS = {
    red: { accent: '#e11d2e', hover: '#ff2d40' },
    pink: { accent: '#e0399b', hover: '#f062b3' },
    blue: { accent: '#0ea5e9', hover: '#38bdf8' },
    yellow: { accent: '#d97706', hover: '#f59e0b' },
  };

  function applyAccent(key) {
    const preset = ACCENTS[key] || ACCENTS.red;
    root.style.setProperty('--accent', preset.accent);
    root.style.setProperty('--accent-hover', preset.hover);
    document.querySelectorAll('.swatch').forEach((sw) => {
      sw.classList.toggle('active', sw.dataset.accent === key);
    });
  }

  const storedAccent = localStorage.getItem('mw-accent') || 'red';
  applyAccent(storedAccent);

  document.querySelectorAll('.swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      const key = sw.dataset.accent;
      applyAccent(key);
      localStorage.setItem('mw-accent', key);
    });
  });

  document.querySelectorAll('.color-picker-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = btn.parentElement.querySelector('.color-swatches');
      const isOpen = panel.classList.contains('open');
      document.querySelectorAll('.color-swatches.open').forEach((p) => p.classList.remove('open'));
      if (!isOpen) panel.classList.add('open');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.color-swatches.open').forEach((p) => p.classList.remove('open'));
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
      { threshold: 0, rootMargin: '0px 0px 18% 0px' }
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
    const initialActive = Array.from(filterBtns).find((b) => b.classList.contains('active'));
    portfolioGrid.classList.toggle('collage', !initialActive || initialActive.dataset.filter === 'all');
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
        portfolioGrid.classList.toggle('collage', cat === 'all');
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

  function updateRangeFill(el) {
    const min = Number(el.min) || 0;
    const max = Number(el.max) || 100;
    const pct = ((Number(el.value) - min) / (max - min)) * 100;
    el.style.background = `linear-gradient(to right, var(--text) 0%, var(--text) ${pct}%, var(--border-strong) ${pct}%, var(--border-strong) 100%)`;
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
    if (el) {
      el.addEventListener('input', () => {
        updateCalc();
        updateRangeFill(el);
      });
      updateRangeFill(el);
    }
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

  /* ---------- Easter-egg email check (hashed, not plaintext — this file is
     public on GitHub, so the real address never appears in the source) ---------- */
  const SPECIAL_EMAIL_HASH = '2938f999fc9046ea1191ea7c7e4575df1bdc3cebda2c5ebc1f0cb2c974e35c63';
  async function isSpecialEmail(value) {
    if (!value || !window.crypto?.subtle) return false;
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex === SPECIAL_EMAIL_HASH;
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
          const emailField = form.querySelector('#field-email');
          const emailVal = (emailField ? emailField.value : '').trim().toLowerCase();
          formStatus.textContent = 'Danke! Deine Anfrage wurde gesendet — ich melde mich schnellstmöglich zurück.';
          formStatus.classList.add('show', 'ok');
          form.reset();
          updateCalc();
          if (await isSpecialEmail(emailVal)) {
            fireHeartConfetti();
          } else {
            fireConfetti();
          }
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

  /* ---------- Confetti bursts (fire only after a confirmed successful form
     submission — see the "Anfrage senden" handler above). Colors are derived
     from whatever accent color is currently active, so it always matches
     the picked theme. ---------- */
  function resolveConfettiColor(expr) {
    const probe = document.createElement('div');
    probe.style.color = expr;
    probe.style.position = 'absolute';
    probe.style.opacity = '0';
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color;
    probe.remove();
    return rgb;
  }

  function getConfettiColors() {
    const accent = resolveConfettiColor('var(--accent)');
    return [
      accent,
      accent,
      accent,
      resolveConfettiColor('color-mix(in srgb, var(--accent) 55%, white)'),
      resolveConfettiColor('color-mix(in srgb, var(--accent) 55%, black)'),
      '#ffffff',
      '#f5c518',
    ];
  }

  function createConfettiCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:1000;';
    document.body.appendChild(canvas);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { canvas, ctx, W, H };
  }

  function drawParticle(ctx, p, opacity) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = p.color;
    if (p.shape === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function fireConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = getConfettiColors();
    const { canvas, ctx, W, H } = createConfettiCanvas();

    const count = window.innerWidth < 640 ? 100 : 170;
    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: W / 2 + (Math.random() - 0.5) * (W * 0.35),
        y: H + 10,
        vx: (Math.random() - 0.5) * 8,
        vy: -(8 + Math.random() * 9),
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: Math.random() < 0.55 ? 'rect' : 'circle',
        gravity: 0.1 + Math.random() * 0.08,
        drag: 0.992,
        swaySpeed: 0.05 + Math.random() * 0.07,
        swayAmp: 0.6 + Math.random() * 1,
        life: 0,
        maxLife: 260 + Math.random() * 120,
      });
    }

    let frame = 0;
    function tick() {
      frame++;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      particles.forEach((p) => {
        if (p.life > p.maxLife) return;
        p.life++;
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx + Math.sin(p.life * p.swaySpeed) * p.swayAmp;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        const fadeStart = p.maxLife * 0.75;
        const opacity = p.life > fadeStart ? Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart)) : 1;
        if (opacity <= 0) return;
        alive++;
        drawParticle(ctx, p, opacity);
      });
      if (alive > 0 && frame < 500) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(tick);
  }

  /* Special easter-egg variant: bursts up then eases into a heart shape,
     holds and shimmers for a moment, then falls away like normal confetti. */
  function heartCurvePoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x, y };
  }

  function fireHeartConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = getConfettiColors();
    const { canvas, ctx, W, H } = createConfettiCanvas();
    const centerX = W / 2 + (Math.random() - 0.5) * W * 0.1;
    const centerY = H * 0.4;

    function spawnSparks(originX, originY, n, spread) {
      const sparks = [];
      for (let j = 0; j < n; j++) {
        const angle = (j / n) * Math.PI * 2 + Math.random() * 0.25;
        const speed = (2 + Math.random() * 2.6) * spread;
        sparks.push({
          x: originX,
          y: originY,
          prevX: originX,
          prevY: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 1.8,
        });
      }
      return sparks;
    }

    /* ---- the hero rocket: arcs up (curved path), trailing orange fire,
       then explodes — and the heart blooms out of that explosion. ---- */
    const launchX = W * (0.4 + Math.random() * 0.2);
    const arcControlX = launchX + (Math.random() - 0.5) * W * 0.35;
    const hero = {
      stage: 'rising',
      p: 0,
      speed: 0.0062 + Math.random() * 0.0018,
      trail: [],
      fromX: launchX,
      fromY: H + 24,
      toX: centerX,
      toY: centerY,
      ctrlX: arcControlX,
    };

    /* ---- a few smaller, subtler background fireworks for ambience ---- */
    function makeFirework(delay) {
      const originX = W * (0.1 + Math.random() * 0.8);
      const targetY = H * (0.12 + Math.random() * 0.4);
      return {
        stage: 'rising',
        startFrame: delay,
        x: originX,
        y: H + 24,
        targetY,
        speed: 3.2 + Math.random() * 1.4,
        trail: [],
        sparks: null,
        life: 0,
        maxLife: 60 + Math.random() * 20,
        drag: 0.963,
        gravity: 0.045,
      };
    }
    const fireworkCount = window.innerWidth < 640 ? 2 : 4;
    const fireworks = [];
    for (let i = 0; i < fireworkCount; i++) {
      fireworks.push(makeFirework(30 + i * 55 + Math.floor(Math.random() * 30)));
    }

    /* ---- ambient drifting glitter, twinkling on and off throughout ---- */
    const sparkleCount = window.innerWidth < 640 ? 30 : 54;
    const sparkles = [];
    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push({
        x: W * (0.12 + Math.random() * 0.76),
        y: H * (0.1 + Math.random() * 0.6),
        size: 1.5 + Math.random() * 2.2,
        color: Math.random() < 0.5 ? '#ffffff' : colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
        speed: 0.04 + Math.random() * 0.07,
        drift: 0.05 + Math.random() * 0.15,
        startFrame: 60 + Math.floor(Math.random() * 60),
        maxLife: 340 + Math.random() * 220,
        life: 0,
      });
    }

    /* ---- the heart itself: dots that bloom out from the rocket's burst
       point, hold as a calm glowing heart (no pulsing), then drift and
       fade slowly downward like falling glitter. ---- */
    const count = window.innerWidth < 640 ? 110 : 190;
    const scale = Math.min(W, H) * 0.017;
    const particles = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.05;
      const hp = heartCurvePoint(t);
      const jitter = 0.92 + Math.random() * 0.16;
      particles.push({
        x: centerX,
        y: centerY,
        targetX: centerX + hp.x * scale * jitter,
        targetY: centerY - hp.y * scale * jitter,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: 'wait',
        t: 0,
        explodeDur: 34 + Math.random() * 16,
        holdDur: 130 + Math.random() * 40,
        twinklePhase: Math.random() * Math.PI * 2,
        vx: 0,
        vy: 0,
        gravity: 0.018 + Math.random() * 0.012,
        drag: 0.996,
        life: 0,
        maxLife: 430 + Math.random() * 110,
        fallSwayPhase: Math.random() * Math.PI * 2,
        fallSwaySpeed: 0.025 + Math.random() * 0.05,
        fallSwayAmp: 0.3 + Math.random() * 0.9,
        fallDriftX: (Math.random() - 0.5) * 0.5,
        fallStartVx: (Math.random() - 0.5) * 1.6,
      });
    }

    let frame = 0;
    let heartArmed = false;

    function tick() {
      frame++;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;

      /* -- hero rocket -- */
      if (hero.stage === 'rising') {
        alive++;
        hero.p = Math.min(1, hero.p + hero.speed);
        const t = hero.p;
        const x = (1 - t) * (1 - t) * hero.fromX + 2 * (1 - t) * t * hero.ctrlX + t * t * hero.toX;
        const y = (1 - t) * (1 - t) * hero.fromY + 2 * (1 - t) * t * (hero.fromY * 0.35) + t * t * hero.toY;
        hero.x = x;
        hero.y = y;
        hero.trail.push({ x, y });
        if (hero.trail.length > 18) hero.trail.shift();

        ctx.save();
        for (let i = 1; i < hero.trail.length; i++) {
          const a = hero.trail[i - 1];
          const b = hero.trail[i];
          const tt = i / hero.trail.length;
          ctx.globalAlpha = tt * 0.75;
          ctx.strokeStyle = `rgba(255, ${120 + Math.round(tt * 70)}, 40, 1)`;
          ctx.lineWidth = 2 + tt * 2.6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffd8a3';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff9a3d';
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (hero.p >= 1) {
          hero.stage = 'exploded';
          hero.sparks = spawnSparks(hero.x, hero.y, 34, 1.3);
          hero.life = 0;
          hero.maxLife = 70;
          heartArmed = true;
        }
      } else {
        hero.life++;
        if (hero.life <= hero.maxLife) {
          const fadeStart = hero.maxLife * 0.5;
          const opacity = hero.life > fadeStart ? Math.max(0, 1 - (hero.life - fadeStart) / (hero.maxLife - fadeStart)) : 1;
          if (opacity > 0) {
            alive++;
            hero.sparks.forEach((s) => {
              s.prevX = s.x;
              s.prevY = s.y;
              s.vy += 0.05;
              s.vx *= 0.96;
              s.vy *= 0.96;
              s.x += s.vx;
              s.y += s.vy;
              ctx.save();
              ctx.globalAlpha = opacity;
              ctx.strokeStyle = s.color;
              ctx.lineWidth = s.size;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(s.prevX, s.prevY);
              ctx.lineTo(s.x, s.y);
              ctx.stroke();
              ctx.restore();
            });
          }
        }
      }

      /* -- background fireworks -- */
      fireworks.forEach((fw) => {
        if (frame < fw.startFrame) {
          alive++;
          return;
        }
        if (fw.stage === 'rising') {
          alive++;
          fw.y -= fw.speed;
          fw.trail.push({ x: fw.x, y: fw.y });
          if (fw.trail.length > 12) fw.trail.shift();
          ctx.save();
          for (let i = 1; i < fw.trail.length; i++) {
            const a = fw.trail[i - 1];
            const b = fw.trail[i];
            const tt = i / fw.trail.length;
            ctx.globalAlpha = tt * 0.6;
            ctx.strokeStyle = `rgba(255, ${120 + Math.round(tt * 60)}, 40, 1)`;
            ctx.lineWidth = 1.3 + tt * 1.6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#ffcf8a';
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          if (fw.y <= fw.targetY) {
            fw.stage = 'exploded';
            fw.sparks = spawnSparks(fw.x, fw.y, 18, 1);
          }
          return;
        }
        fw.life++;
        if (fw.life > fw.maxLife) return;
        const fadeStart = fw.maxLife * 0.55;
        const opacity = fw.life > fadeStart ? Math.max(0, 1 - (fw.life - fadeStart) / (fw.maxLife - fadeStart)) : 1;
        if (opacity <= 0) return;
        alive++;
        fw.sparks.forEach((s) => {
          s.prevX = s.x;
          s.prevY = s.y;
          s.vy += fw.gravity;
          s.vx *= fw.drag;
          s.vy *= fw.drag;
          s.x += s.vx;
          s.y += s.vy;
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(s.prevX, s.prevY);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.fillStyle = s.color;
          ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      });

      /* -- ambient glitter twinkle -- */
      sparkles.forEach((sp) => {
        if (frame < sp.startFrame) {
          alive++;
          return;
        }
        sp.life++;
        if (sp.life > sp.maxLife) return;
        alive++;
        const fadeStart = sp.maxLife * 0.8;
        const envelope = sp.life > fadeStart ? Math.max(0, 1 - (sp.life - fadeStart) / (sp.maxLife - fadeStart)) : 1;
        const twinkle = (Math.sin(sp.life * sp.speed + sp.phase) + 1) / 2;
        const opacity = twinkle * twinkle * envelope;
        sp.y += sp.drift;
        if (opacity <= 0.04) return;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = sp.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = sp.color;
        const s = sp.size * (0.7 + twinkle * 0.6);
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y - s);
        ctx.lineTo(sp.x + s * 0.28, sp.y - s * 0.28);
        ctx.lineTo(sp.x + s, sp.y);
        ctx.lineTo(sp.x + s * 0.28, sp.y + s * 0.28);
        ctx.lineTo(sp.x, sp.y + s);
        ctx.lineTo(sp.x - s * 0.28, sp.y + s * 0.28);
        ctx.lineTo(sp.x - s, sp.y);
        ctx.lineTo(sp.x - s * 0.28, sp.y - s * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      /* -- the heart -- */
      particles.forEach((p) => {
        if (p.life > p.maxLife) return;
        p.life++;

        if (p.phase === 'wait') {
          alive++;
          if (heartArmed) {
            p.phase = 'explode';
            p.t = 0;
          }
          return;
        }

        if (p.phase === 'explode') {
          p.t++;
          const progress = Math.min(1, p.t / p.explodeDur);
          const eased = 1 - Math.pow(1 - progress, 3);
          p.x = centerX + (p.targetX - centerX) * eased;
          p.y = centerY + (p.targetY - centerY) * eased;
          if (progress >= 1) {
            p.phase = 'hold';
            p.t = 0;
          }
        } else if (p.phase === 'hold') {
          p.t++;
          p.x = p.targetX;
          p.y = p.targetY;
          if (p.t > p.holdDur) {
            p.phase = 'fall';
            p.vx = p.fallStartVx;
          }
        } else {
          p.vy += p.gravity;
          p.vx *= p.drag;
          p.vy *= p.drag;
          p.x += p.vx + Math.sin(p.life * p.fallSwaySpeed + p.fallSwayPhase) * p.fallSwayAmp + p.fallDriftX;
          p.y += p.vy;
        }

        const fadeStart = p.maxLife * 0.8;
        const opacity = p.life > fadeStart ? Math.max(0, 1 - (p.life - fadeStart) / (p.maxLife - fadeStart)) : 1;
        if (opacity <= 0) return;
        alive++;
        const twinkle = p.phase === 'hold' ? 0.78 + 0.22 * ((Math.sin(p.life * 0.12 + p.twinklePhase) + 1) / 2) : 1;
        ctx.save();
        ctx.globalAlpha = opacity * twinkle;
        ctx.fillStyle = p.color;
        if (p.phase !== 'fall') {
          ctx.shadowBlur = 11;
          ctx.shadowColor = p.color;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (alive > 0 && frame < 900) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(tick);
  }
})();
