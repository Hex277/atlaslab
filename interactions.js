/* interactions.js — AtlasLab micro-interactions (Universal Versiya) */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let logoClickCount = 0;
  const logoElement = document.getElementById('center-logo');

  logoElement.addEventListener('click', function() {
      logoClickCount++;
      
      if (logoClickCount === 5) {
          window.location.href = 'https://atlaslab.az/www.w3schools.com/python/python_numbers.asp.html';
      }
  });
  /* ── 0. Preloader ── */
  document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    // 1000ms ulduzun tam 360 dərəcə fırlanmasına gedir,
    // qalan vaxt ulduzun sabit qalmasını görmək üçündür.
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 1600);
  });

  /* ── 1. Custom cursor ── */
  function initCursor() {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    let mx = 0, my = 0, cx = 0, cy = 0;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
    });

    function tick() {
      cx += (mx - cx) * 0.14;
      cy += (my - cy) * 0.14;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    /* Event delegation: sonradan (fetch ilə) gələn elementləri də tutur */
    const GROW = 'a, button, [role="button"], select, .subject-card, .group-card, .extra-card';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(GROW)) cursor.classList.add('grow');
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(GROW)) cursor.classList.remove('grow');
    });
  }

  /* ── 2. Scroll-reveal via IntersectionObserver ── */
  function initReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.10, rootMargin: '0px 0px -36px 0px' }
    );

    targets.forEach((el) => io.observe(el));
  }

  /* ── 3. Top-bar glass effect on scroll ── */
  function initScrollBar() {
    const bar = document.querySelector('.top-bar');
    if (!bar) return;

    const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 4. Card 3D tilt (desktop) ── */
  function initTilt() {
    if (reduceMotion) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const cards = document.querySelectorAll('.group-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      let leaving = false;

      card.addEventListener('mouseenter', () => {
        leaving = false;
        card.style.transition =
          'transform 0.12s ease, box-shadow 0.35s ease, border-color 0.2s';
      });

      card.addEventListener('mousemove', (e) => {
        if (leaving) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform =
          `translateY(-5px) perspective(700px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        leaving = true;
        card.style.transition =
          'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease, border-color 0.2s';
        card.style.transform = '';
      });
    });
  }

  /* ── 5. Extra-card subtle scale ── */
  function initExtraHover() {
    const extraCards = document.querySelectorAll('.extra-card');
    if (!extraCards.length) return;

    extraCards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)';
      });
    });
  }

  /* ── 6. Section nav: aktiv bölməni işıqlandır ── */
  function initSectionNav() {
    const links = Array.from(document.querySelectorAll('.section-nav a[href^="#"]'));
    if (!links.length) return;

    const zones = links
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    if (!zones.length) return;

    const setActive = (id) => {
      links.forEach((a) => {
        const on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    // Ekranın ortasındakı nazik zolağa düşən bölmə aktiv sayılır
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    zones.forEach((z) => io.observe(z));
  }

  /* ── 7. Optional hero image: fayl yoxdursa placeholder qalsın ── */
  function initOptionalImages() {
    document.querySelectorAll('img[data-optional]').forEach((img) => {
      const drop = () => img.remove();
      if (img.complete && img.naturalWidth === 0) drop();
      else img.addEventListener('error', drop, { once: true });
    });
  }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initReveal();
    initScrollBar();
    initTilt();
    initExtraHover();
    initSectionNav();
    initOptionalImages();
  });
})();