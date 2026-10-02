// MarlinW Media — Konzept 2.0
(function () {
  const hasGsap = typeof gsap !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---- Nav scroll state --------------------------------------------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile drawer --------------------------------------------------*/
  const burger = document.querySelector('.nav-burger');
  const drawer = document.querySelector('.mobile-drawer');
  if (burger && drawer) {
    const closeBtn = drawer.querySelector('.mobile-drawer-close');
    burger.addEventListener('click', () => drawer.classList.add('is-open'));
    closeBtn?.addEventListener('click', () => drawer.classList.remove('is-open'));
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('is-open')));
  }

  /* ---- Split headline into animatable spans --------------------------*/
  document.querySelectorAll('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="line"><span>${w}</span></span>`).join(' ');
  });

  /* ---- Reveal on scroll (fallback: IntersectionObserver) --------------*/
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---- GSAP: headline word stagger + hero depth parallax --------------*/
  if (hasGsap) {
    document.querySelectorAll('[data-split] .line span').forEach((span, i) => {
      gsap.fromTo(span,
        { yPercent: 115, opacity: 0, filter: 'blur(6px)' },
        {
          yPercent: 0, opacity: 1, filter: 'blur(0px)',
          duration: 1.1, ease: 'power3.out', delay: i * 0.045,
          scrollTrigger: { trigger: span.closest('[data-split]'), start: 'top 85%' }
        });
    });

    // Depth parallax layers: background slow, midground medium, foreground fast
    document.querySelectorAll('.hero, .cta-band').forEach(hero => {
      const bg = hero.querySelector('.depth-bg');
      const mid = hero.querySelector('.depth-mid');
      if (bg) {
        gsap.to(bg, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      }
      if (mid) {
        gsap.to(mid, { yPercent: -26, xPercent: -4, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      }
    });

    // Number count-up for stats
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => gsap.to(obj, {
          v: target, duration: 1.8, ease: 'power2.out',
          onUpdate: () => el.textContent = (target % 1 === 0 ? Math.round(obj.v) : obj.v.toFixed(1)) + suffix
        })
      });
    });

    // Pin + fade hero content slightly as you leave it
    document.querySelectorAll('[data-pin-fade]').forEach(hero => {
      gsap.to(hero.querySelector('.hero-content'), {
        opacity: 0.2, y: -40, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---- Portfolio filter -------------------------------------------------*/
  const filterBtns = document.querySelectorAll('.filter-btn');
  const tiles = document.querySelectorAll('[data-cat]');
  if (filterBtns.length && tiles.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        tiles.forEach(tile => {
          const show = cat === 'all' || tile.dataset.cat === cat;
          tile.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---- Lazy-play background videos when visible (saves bandwidth) ------*/
  const bgVideos = document.querySelectorAll('video[data-lazy]');
  if ('IntersectionObserver' in window && bgVideos.length) {
    const vio = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const v = entry.target;
        if (entry.isIntersecting) {
          if (v.dataset.src && !v.src) v.src = v.dataset.src;
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.1 });
    bgVideos.forEach(v => vio.observe(v));
  }

  /* ---- Booking form (FormSubmit) ---------------------------------------*/
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      const status = document.getElementById('form-status');
      if (status) status.textContent = 'Wird gesendet …';
    });
  }

  /* ---- Current year --------------------------------------------------*/
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
