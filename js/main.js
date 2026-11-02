/* MarlinW Media — Konzept 3 */
(() => {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------ */
  /* Smooth Scroll (Lenis) – synchron mit GSAP                           */
  /* ------------------------------------------------------------------ */
  let lenis = null;
  if (hasGsap && !reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = target => lenis ? lenis.scrollTo(target, { offset: -60, duration: 1.4 }) : $(target)?.scrollIntoView({ behavior: 'smooth' });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) { e.preventDefault(); scrollTo(id); }
  }));

  /* ------------------------------------------------------------------ */
  /* Videos: laufen dauerhaft im Loop, ohne Bedienelemente.              */
  /* Standbilder (Poster) kommen sofort, danach lädt eine Warteschlange  */
  /* die Videos einzeln in Seitenreihenfolge vor — das erste schon       */
  /* während des Logo-Intros. Was ins Bild kommt, springt nach vorne.    */
  /* Im Bild laufen sie immer, außerhalb ruhen sie.                      */
  /* ------------------------------------------------------------------ */
  const prep = v => {
    v.muted = true; v.defaultMuted = true; v.loop = true; v.controls = false; v.playsInline = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    v.setAttribute('disablepictureinpicture', ''); v.setAttribute('disableremoteplayback', '');
    v.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback noplaybackrate');
    v.disablePictureInPicture = true;
  };
  const tryPlay = v => { if (!v.src) return; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  // Lädt ein Video und meldet, sobald es flüssig abspielbar ist (oder nach Timeout)
  const loadVideo = v => v._ready || (v._ready = new Promise(resolve => {
    v.dataset.loaded = '1';
    prep(v);
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    v.addEventListener('canplaythrough', finish, { once: true });
    v.addEventListener('error', finish, { once: true });
    setTimeout(finish, 9000);
    if (!v.hasAttribute('data-scrub')) {
      ['loadeddata', 'canplay', 'canplaythrough'].forEach(ev => v.addEventListener(ev, () => { if (v.dataset.vis === '1') tryPlay(v); }));
      v.addEventListener('pause', () => { if (v.dataset.vis === '1' && !document.hidden) setTimeout(() => tryPlay(v), 150); });
      v.addEventListener('ended', () => { v.currentTime = 0; tryPlay(v); });
      v.addEventListener('stalled', () => { if (v.dataset.vis === '1') tryPlay(v); });
    }
    v.preload = 'auto';
    v.src = v.dataset.src;
    v.load();
    if (v.dataset.vis === '1' || v.hasAttribute('data-scrub')) { if (v.dataset.vis === '1') tryPlay(v); return; }
    // iOS lädt ruhende Videos sonst nicht vor: kurz stumm anspielen, sofort anhalten → Puffer füllt sich
    const p = v.play(); if (p && p.then) p.then(() => { if (v.dataset.vis !== '1') v.pause(); }).catch(() => {});
  }));
  const loopVideos = $$('video[data-src]:not([data-scrub])');
  const scrubVideo = $('video[data-scrub]');
  loopVideos.forEach(prep);
  // Reihenfolge: Hero-Video(s), dann Hintergrund-Wagen, dann alle übrigen von oben nach unten
  const queue = [...loopVideos.filter(v => v.hasAttribute('data-eager')), scrubVideo,
                 ...loopVideos.filter(v => !v.hasAttribute('data-eager'))].filter(Boolean);
  const conn = navigator.connection || {};
  const saveData = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  let running = false;
  const runQueue = async () => {
    if (running) return; running = true;
    while (queue.length) {
      const v = queue.shift();
      await loadVideo(v);
    }
    running = false;
  };
  const prioritize = v => { const i = queue.indexOf(v); if (i > -1) queue.splice(i, 1); loadVideo(v); };
  queue.filter(v => v.hasAttribute('data-eager')).forEach(v => { v.dataset.vis = '1'; });
  if (saveData) queue.filter(v => v.hasAttribute('data-eager')).forEach(prioritize);  // Datensparmodus: nur bei Bedarf
  else runQueue();
  if ('IntersectionObserver' in window) {
    // knapp vor dem Bild: vorziehen, falls die Warteschlange noch nicht so weit ist
    const near = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) prioritize(e.target); }), { rootMargin: '400px 0px 400px 0px' });
    // im Bild: abspielen, sonst ruhen
    const vio = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { v.dataset.vis = '1'; prioritize(v); tryPlay(v); }
      else { v.dataset.vis = '0'; if (v.dataset.loaded) v.pause(); }
    }), { rootMargin: '60px 0px 60px 0px' });
    loopVideos.forEach(v => { near.observe(v); vio.observe(v); });
  } else loopVideos.forEach(v => { v.dataset.vis = '1'; prioritize(v); });
  // iOS-Stromsparmodus u. ä.: beim ersten Kontakt alle sichtbaren Videos anstoßen
  const kick = () => loopVideos.forEach(v => { if (v.dataset.vis === '1') tryPlay(v); });
  ['touchstart', 'pointerdown', 'keydown', 'wheel'].forEach(ev => window.addEventListener(ev, kick, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  setInterval(kick, 2500);

  /* ------------------------------------------------------------------ */
  /* Text in Wörter teilen                                               */
  /* ------------------------------------------------------------------ */
  const splitWords = (el, cls) => {
    const out = [];
    const walk = (node, wrapClass) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = cls;
            const inner = document.createElement('span'); inner.textContent = part;
            if (wrapClass) inner.className = wrapClass;
            w.appendChild(inner); frag.appendChild(w); out.push(inner);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          const c = n.className; walk(n, c); n.replaceWith(...n.childNodes);
        }
      });
    };
    walk(el, '');
    return out;
  };
  $$('[data-split]').forEach(el => { el._words = splitWords(el, 'w'); });

  /* ------------------------------------------------------------------ */
  /* Intro (erster Besuch) bzw. kurzer Vorhang (Seitenwechsel)           */
  /* ------------------------------------------------------------------ */
  const intro = $('.intro');
  const heroWords = $$('[data-hero] [data-split]').flatMap(el => el._words || []);
  const heroFades = $$('[data-hero] [data-hero-fade]');
  if (hasGsap && !reduce) {
    gsap.set(heroWords, { yPercent: 115 });
    gsap.set(heroFades, { autoAlpha: 0, y: 24 });
  }
  const pageIn = () => {
    html.classList.add('intro-done');
    if (!hasGsap || reduce) return;
    gsap.to(heroWords, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: .055 });
    gsap.to(heroFades, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .08, delay: .35 });
    ScrollTrigger.refresh();
  };
  if (intro && hasGsap && !reduce) {
    lenis?.stop();
    // Langes Logo-Intro nur beim Einstieg von außen — ohne Speicher im Browser (kein Cookie/Storage nötig)
    let firstVisit = true;
    try { firstVisit = !document.referrer || new URL(document.referrer).host !== location.host; } catch (e) {}
    const markPaths = $$('.intro .lm path');
    const letters = $$('.intro .lw path');
    const tl = gsap.timeline({ onComplete: () => { lenis?.start(); pageIn(); } });
    if (firstVisit) {
      gsap.set(letters, { opacity: 0, y: 40 });
      tl.to(markPaths, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' })
        .to('.intro-line i', { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
        .to(markPaths, { fill: '#f5f5f7', strokeOpacity: 0, duration: .45, ease: 'power1.out' }, '-=.25')
        .to(letters, { opacity: 1, y: 0, duration: .7, ease: 'expo.out', stagger: .035 }, '-=.45')
        .to('.intro-logo', { scale: .92, autoAlpha: 0, duration: .55, ease: 'power3.in' }, '+=.25')
        .to(intro, { yPercent: -100, duration: .9, ease: 'expo.inOut' }, '-=.15')
        .from('.hero-frame', { scale: 1.2, duration: 1.8, ease: 'expo.out' }, '-=.75');
    } else {
      gsap.set(markPaths, { strokeDashoffset: 0, fill: '#f5f5f7', strokeOpacity: 0 });
      gsap.set('.intro-line', { autoAlpha: 0 });
      tl.to('.intro-logo', { autoAlpha: 0, scale: .94, duration: .35, ease: 'power2.in', delay: .1 })
        .to(intro, { yPercent: -100, duration: .75, ease: 'expo.inOut' }, '-=.05');
    }
  } else pageIn();

  // Seitenwechsel: Vorhang fährt hoch, dann Navigation
  if (hasGsap && !reduce && intro) {
    $$('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || a.target === '_blank' || /^(mailto|tel|https?):/i.test(href) || !/\.html(\?|#|$)/.test(href)) return;
      a.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        html.classList.remove('intro-done');
        gsap.set('.intro-logo', { autoAlpha: 0 });
        gsap.fromTo(intro, { yPercent: 100 }, { yPercent: 0, duration: .6, ease: 'expo.inOut', onComplete: () => { location.href = href; } });
      });
    });
    window.addEventListener('pageshow', e => { if (e.persisted) { gsap.set(intro, { yPercent: -100 }); html.classList.add('intro-done'); } });
  }

  /* ------------------------------------------------------------------ */
  /* Navigation & Menü                                                  */
  /* ------------------------------------------------------------------ */
  const nav = $('.nav');
  let lastY = 0;
  const onScroll = y => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', y > 20);
    if (!html.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > 300 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove('is-hidden');
    lastY = y;
  };
  if (lenis) lenis.on('scroll', e => onScroll(e.scroll)); else window.addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  onScroll(scrollY);
  $('.burger')?.addEventListener('click', () => {
    const open = html.classList.toggle('menu-open');
    $('.burger').setAttribute('aria-expanded', open);
    open ? lenis?.stop() : lenis?.start();
    if (open && hasGsap && !reduce) gsap.fromTo('.menu a.big', { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: .05, duration: .8, ease: 'expo.out', delay: .15 });
  });
  $$('.menu a').forEach(a => a.addEventListener('click', () => { html.classList.remove('menu-open'); lenis?.start(); }));

  /* ------------------------------------------------------------------ */
  /* Cursor & magnetische Buttons (nur Maus)                             */
  /* ------------------------------------------------------------------ */
  if (fine && hasGsap && !reduce) {
    const dot = document.createElement('div'); dot.className = 'cursor';
    const ring = document.createElement('div'); ring.className = 'cursor-ring'; ring.innerHTML = '<span></span>';
    document.body.append(dot, ring);
    const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', e => { html.classList.add('has-cursor'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener('pointerleave', () => html.classList.remove('has-cursor'));
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { ring.classList.add('is-label'); ring.firstChild.textContent = el.dataset.cursor; });
      el.addEventListener('pointerleave', () => ring.classList.remove('is-label'));
    });
    $$('a, button, summary, label').forEach(el => {
      if (el.closest('[data-cursor]')) return;
      el.addEventListener('pointerenter', () => ring.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => ring.classList.remove('is-hover'));
    });
    $$('.magnetic').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.4)' });
      const my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .35); my((e.clientY - r.top - r.height / 2) * .45); });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  if (!hasGsap || reduce) {
    $$('[data-reveal]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    initForms(); initPortfolio(); initFaq(); setYear();
    return;
  }

  /* ------------------------------------------------------------------ */
  /* Scroll-Animationen                                                  */
  /* ------------------------------------------------------------------ */
  // Fortschrittsbalken
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  // Einblenden
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%', once: true,
    onEnter: b => gsap.to(b, { opacity: 1, y: 0, scale: 1, duration: 1.15, ease: 'expo.out', stagger: .09, overwrite: true })
  });

  // Überschriften Wort für Wort (außer Hero, das macht das Intro)
  $$('[data-split]').filter(el => !el.closest('[data-hero]')).forEach(el => {
    gsap.from(el._words, { yPercent: 115, duration: 1.15, ease: 'expo.out', stagger: .045, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  // Statement: Wörter leuchten nacheinander auf
  $$('[data-highlight]').forEach(el => {
    const golds = (el.dataset.highlight || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const words = splitWords(el, 'word-w').map(s => { const w = s.parentNode; w.classList.add('word'); if (golds.includes(s.textContent.replace(/[.,—–]/g, '').toLowerCase())) w.classList.add('gold'); return w; });
    gsap.to(words, { opacity: 1, ease: 'none', stagger: .1, scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true } });
  });

  // Bild-Parallax in Medien
  $$('.media .parallax').forEach(img => {
    gsap.fromTo(img, { yPercent: -9 }, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-speed]').forEach(el => {
    gsap.to(el, { yPercent: -parseFloat(el.dataset.speed) * 12, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  const mm = gsap.matchMedia();

  // Home-Hero: Vollbild-Showreel schrumpft beim Scrollen zur gerahmten Karte
  const hero = $('.hero');
  if (hero) {
    mm.add({ wide: '(min-width: 761px)', narrow: '(max-width: 760px)' }, ctx => {
      const inset = ctx.conditions.wide ? 'inset(13% 9% 13% 9% round 34px)' : 'inset(16% 5% 16% 5% round 24px)';
      const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=110%', scrub: .6, pin: true, anticipatePin: 1 } });
      tl.fromTo('.hero-frame', { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: inset, ease: 'none' }, 0)
        .to('.hero-frame video', { scale: 1.12, ease: 'none' }, 0)
        .to('.hero-content', { yPercent: -18, autoAlpha: 0, scale: .94, ease: 'none' }, 0)
        .to('.hero-foot', { autoAlpha: 0, ease: 'none', duration: .3 }, 0);
    });
  }

  // Hintergrund-Wagen (Startseite): erscheint nach dem Hero, fährt langsam mit dem Scrollen
  const bgCar = $('.bg-car');
  if (bgCar) {
    const v = $('video', bgCar);
    prep(v);
    let ready = false, target = 0, current = 0;
    v.addEventListener('loadedmetadata', () => { ready = true; ScrollTrigger.refresh(); });
    const start = () => prioritize(v);
    ScrollTrigger.create({
      trigger: hero || document.body, start: hero ? 'bottom 60%' : 'top top', endTrigger: 'body', end: 'bottom bottom',
      onEnter: () => { start(); bgCar.classList.add('is-on'); },
      onEnterBack: () => bgCar.classList.add('is-on'),
      onLeaveBack: () => bgCar.classList.remove('is-on'),
      onUpdate: self => { target = self.progress; }
    });
    gsap.ticker.add(() => {
      if (!ready || !v.duration) return;
      current += (target - current) * .08;
      const t = Math.min(v.duration - .05, current * v.duration);
      if (Math.abs(v.currentTime - t) > .015) v.currentTime = t;
    });
  }

  // Laufband: dauerhaft in Bewegung, Tempo/Richtung/Neigung folgen dem Scrollen
  $$('.marquee').forEach(m => {
    const track = $('.marquee-track', m);
    const loop = gsap.to(track, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
    const skew = gsap.quickTo(track, 'skewX', { duration: .5, ease: 'power3' });
    ScrollTrigger.create({
      trigger: m, start: 'top bottom', end: 'bottom top',
      onUpdate: self => {
        const vel = self.getVelocity();
        gsap.to(loop, { timeScale: (self.direction || 1) * (1 + Math.min(Math.abs(vel) / 250, 6)), duration: .25, overwrite: true });
        gsap.to(loop, { timeScale: self.direction || 1, duration: 1.2, delay: .25, overwrite: false });
        skew(gsap.utils.clamp(-8, 8, vel / -180));
      }
    });
  });

  // Gestapelte Säulen-Karten: vorherige Karte tritt zurück, sobald die nächste kommt
  const cards = $$('.stack-card');
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.fromTo(card, { scale: 1, filter: 'brightness(1)' }, { scale: .9, filter: 'brightness(.4)', ease: 'none', immediateRender: false, scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true } });
  });

  // Horizontale Galerie (Desktop): vertikales Scrollen schiebt die Arbeiten seitlich
  $$('.hgal').forEach(sec => {
    const track = $('.hgal-track', sec);
    mm.add('(min-width: 768px)', () => {
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), scrub: .8, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
      $$('.hgal-item .media > *', sec).forEach(m => {
        gsap.set(m, { width: '118%', left: '-9%' });
        gsap.fromTo(m, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: m.closest('.hgal-item'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      $$('.hgal-item', sec).forEach(item => {
        gsap.from(item, { rotate: 4, y: 60, ease: 'none', scrollTrigger: { trigger: item, containerAnimation: tween, start: 'left 105%', end: 'left 60%', scrub: true } });
      });
    });
  });

  // Unterseiten-Hero: gerahmtes Video weitet sich beim Scrollen auf volle Breite
  $$('.expand').forEach(ex => {
    const frame = $('.expand-frame', ex);
    mm.add({ wide: '(min-width: 761px)', narrow: '(max-width: 760px)' }, ctx => {
      gsap.fromTo(frame, { clipPath: ctx.conditions.wide ? 'inset(0% 12% 0% 12% round 32px)' : 'inset(0% 5% 0% 5% round 24px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: ex, start: 'top 80%', end: 'top 10%', scrub: .5 } });
      gsap.fromTo($$('video, img', frame), { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: ex, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  // Zahlen hochzählen
  $$('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suf = el.dataset.suffix || '';
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec).replace('.', ',') + suf; } }) });
  });

  // Prozess: Linie füllt sich, Schritte leuchten auf
  $$('.steps').forEach(s => {
    gsap.to($('.steps-line i', s), { scaleY: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top 60%', end: 'bottom 60%', scrub: true } });
    $$('.step', s).forEach(st => ScrollTrigger.create({ trigger: st, start: 'top 62%', onEnter: () => st.classList.add('is-on'), onLeaveBack: () => st.classList.remove('is-on') }));
  });

  // Footer-Logo
  $$('.footer-big svg path').forEach((p, i) => gsap.from(p, { yPercent: 80, opacity: 0, duration: 1.2, ease: 'expo.out', delay: i * .04, scrollTrigger: { trigger: '.footer-big', start: 'top 95%', once: true } }));

  initForms(); initPortfolio(); initFaq(); setYear();
  window.addEventListener('load', () => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 1500);

  /* ------------------------------------------------------------------ */
  /* Hilfsfunktionen                                                     */
  /* ------------------------------------------------------------------ */
  function setYear() { $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear()); }

  function initFaq() {
    $$('.faq details').forEach(d => {
      const sum = $('summary', d), ans = $('.ans', d);
      sum.addEventListener('click', e => {
        if (typeof gsap === 'undefined' || reduce) return;
        e.preventDefault();
        if (d.open) gsap.to(ans, { height: 0, duration: .5, ease: 'power3.inOut', onComplete: () => { d.open = false; gsap.set(ans, { clearProps: 'height' }); window.ScrollTrigger?.refresh(); } });
        else { d.open = true; gsap.from(ans, { height: 0, duration: .6, ease: 'power3.out', onComplete: () => window.ScrollTrigger?.refresh() }); }
      });
    });
  }

  function initForms() {
    const form = $('#booking-form');
    if (!form) return;
    const q = new URLSearchParams(location.search);
    const key = q.get('leistung') || q.get('typ');
    if (key) { const r = $(`input[name="Leistung"][data-key="${CSS.escape(key)}"]`); if (r) r.checked = true; }
    const status = $('#form-status'), sent = $('#form-sent'), btn = $('button[type="submit"]', form);
    form.addEventListener('submit', async e => {
      if (!window.fetch || !sent) return;           // ohne JS/fetch: klassischer Versand
      e.preventDefault();
      status.textContent = 'Wird gesendet …'; btn.disabled = true;
      try {
        const res = await fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) === 'false') throw new Error(data.message || res.status);
        showSent();
      } catch (err) {
        btn.disabled = false;
        status.innerHTML = 'Das hat leider nicht geklappt. Bitte schreibt mir direkt per <a href="https://wa.me/4915231036109">WhatsApp</a> oder <a href="mailto:marlinw.media@gmail.com">E-Mail</a>.';
      }
    });
    function showSent() {
      const name = ($('#f-name').value || '').trim().split(/\s+/)[0];
      $('[data-sent-name]', sent).textContent = name ? ', ' + name : '';
      const reveal = () => { form.hidden = true; sent.hidden = false; sent.focus({ preventScroll: true }); lenis ? lenis.scrollTo(sent, { offset: -120 }) : sent.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
      if (!window.gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return reveal();
      gsap.to(form, { autoAlpha: 0, y: -20, duration: .45, ease: 'power2.in', onComplete: () => {
        reveal();
        gsap.timeline()
          .fromTo(sent, { autoAlpha: 0, scale: .96 }, { autoAlpha: 1, scale: 1, duration: .7, ease: 'expo.out' })
          .fromTo('.sent-check circle', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .8, ease: 'power2.inOut' }, '-=.4')
          .fromTo('.sent-check path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .45, ease: 'power2.out' }, '-=.15')
          .from($$('h2, .lead', sent), { y: 24, autoAlpha: 0, duration: .7, ease: 'expo.out', stagger: .08 }, '-=.3')
          .from($$('.sent-steps li', sent), { x: -30, autoAlpha: 0, duration: .7, ease: 'expo.out', stagger: .14 }, '-=.4')
          .from($$('.btn', sent), { y: 16, autoAlpha: 0, duration: .5, ease: 'power2.out', stagger: .08 }, '-=.3');
      } });
    }
  }

  function initPortfolio() {
    const btns = $$('.filters button'), items = $$('.pitem');
    if (!items.length) return;
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.classList.toggle('is-on', x === b));
      const f = b.dataset.filter;
      items.forEach(it => it.classList.toggle('is-hidden', f !== 'all' && !it.dataset.cat.split(' ').includes(f)));
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      if (typeof gsap !== 'undefined' && !reduce) gsap.fromTo(items.filter(i => !i.classList.contains('is-hidden')), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, ease: 'expo.out', stagger: .03 });
    }));
    const lb = $('.lightbox'), box = $('.lb-media', lb), cap = $('.lb-cap', lb);
    const close = () => { lb.classList.remove('is-open'); lenis?.start(); setTimeout(() => { box.innerHTML = ''; }, 500); };
    items.forEach(it => it.addEventListener('click', () => {
      const src = it.dataset.full, isVid = /\.mp4$/.test(src);
      box.innerHTML = '';
      const el = document.createElement(isVid ? 'video' : 'img');
      if (isVid) { prep(el); el.autoplay = true; el.src = src; el.addEventListener('pause', () => { if (lb.classList.contains('is-open')) tryPlay(el); }); }
      else { el.src = src; el.alt = it.querySelector('figcaption b')?.textContent || ''; }
      box.appendChild(el); if (isVid) tryPlay(el);
      cap.textContent = it.querySelector('figcaption')?.textContent.trim().replace(/\s+/g, ' · ') || '';
      lb.classList.add('is-open'); lenis?.stop();
    }));
    $('.lb-close', lb).addEventListener('click', close);
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('is-open')) close(); });
  }
})();
