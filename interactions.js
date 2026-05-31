/* interactions.js — AtlasLab micro-interactions (Universal Versiya) */
(function () {
  'use strict';

  document.addEventListener("DOMContentLoaded", () => {
    const preloader = document.getElementById("preloader");
      
      if (preloader) {
          // 1000ms ulduzun tam 360 dərəcə fırlanmasına gedir.
          // +400ms ulduz dayandıqdan sonra ekranda sabit qalmasını görmək üçündür.
          // Ümumi: 1400ms (1.4 saniyə) sonra yüklənmə ekranı yox olur.
          setTimeout(() => {
              preloader.classList.add("hidden");
          }, 1600);
      }
  });
  function initCursor() {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    let mx = 0, my = 0, cx = 0, cy = 0;
    let raf;
    
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
    });

    function tick() {
      cx += (mx - cx) * 0.14;
      cy += (my - cy) * 0.14;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    /* 🌟 ƏN DƏYİŞMƏLİ OLAN HİSSƏ BURADIR 🌟 */
    /* Köhnə kod səhifədə kartları tapmırdı. Bu yeni məntiq isə ekrana 
       sonradan gələn (Fetch ilə) bütün elementləri də anında tutur! */
    document.addEventListener('mouseover', (e) => {
      // İstifadəçi kursoru hər hansı bir link, düymə və ya fənn kartının üzərinə gətirəndə
      if (e.target.closest('a, button, [role="button"], select, .subject-card, .group-card, .extra-card')) {
        cursor.classList.add('grow');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, [role="button"], select, .subject-card, .group-card, .extra-card')) {
        cursor.classList.remove('grow');
      }
    });
  }
  /* ── 2. Scroll-reveal via IntersectionObserver ── */
  function initReveal() {
    const targets = document.querySelectorAll('.reveal');
    if (!targets || !targets.length) return; // Əgər bu səhifədə .reveal yoxdursa, işləmə

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
    if (!bar) return; // Əgər bu səhifədə .top-bar yoxdursa, keç

    const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 4. Card 3D tilt (desktop) ── */
  function initTilt() {
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const cards = document.querySelectorAll('.group-card');
    if (!cards || !cards.length) return; // Əgər .group-card yoxdursa, funksiyanı dayandır

    cards.forEach((card) => {
      let leaving = false;

      card.addEventListener('mouseenter', () => {
        leaving = false;
        card.style.transition =
          'transform 0.12s ease, box-shadow 0.35s ease, border-color 0.2s';
      });

      card.addEventListener('mousemove', (e) => {
        if (leaving) return;
        const r  = card.getBoundingClientRect();
        const x  = (e.clientX - r.left)  / r.width  - 0.5;   
        const y  = (e.clientY - r.top)   / r.height - 0.5;
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
    if (!extraCards || !extraCards.length) return; // Əgər .extra-card yoxdursa, keç

    extraCards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)';
      });
    });
  }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initReveal();
    initScrollBar();
    initTilt();
    initExtraHover();
  });
})();