/**
 * Diaspora Connect Farmers SACCO - Interactive & Visual Engine
 * Secure, modular, and optimized for performance & protection.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. PARTICLES BACKGROUND ── */
  (function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const count = 52;
    const particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function rnd(a, b) {
      return a + Math.random() * (b - a);
    }

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = rnd(0, canvas.width);
        this.y = rnd(0, canvas.height);
        this.r = rnd(0.8, 3);
        this.vx = rnd(-0.22, 0.22);
        this.vy = rnd(-0.45, -0.08);
        this.alpha = rnd(0.08, 0.50);
        this.color = Math.random() > 0.55
          ? `rgba(212,175,55,${this.alpha})`
          : `rgba(240,243,250,${this.alpha * 0.65})`;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < -8) this.reset();
        if (this.x < -8) this.x = canvas.width + 8;
        if (this.x > canvas.width + 8) this.x = -8;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      requestAnimationFrame(animate);
    }
    animate();
  })();

  /* ── 2. HERO ZOOM & PARALLAX EFFECT ── */
  const heroBg = document.getElementById('hero-bg');
  if (heroBg) {
    setTimeout(() => {
      heroBg.classList.add('zoomed');
    }, 80);

    window.addEventListener('scroll', () => {
      const y = window.pageYOffset;
      heroBg.style.transform = `scale(1) translateY(${y * 0.28}px)`;
    }, { passive: true });
  }

  /* ── 3. SCROLL REVEAL OBSERVER ── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window && revealEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -50px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ── 4. VALUE CARDS STAGGER SEQUENCE ── */
  const valueCards = document.querySelectorAll('.value-card');
  if ('IntersectionObserver' in window && valueCards.length > 0) {
    const cardObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.index || '0', 10);
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 70 * idx);
          cardObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    valueCards.forEach((c, i) => {
      c.dataset.index = String(i);
      c.style.opacity = '0';
      c.style.transform = 'translateY(28px)';
      c.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      cardObs.observe(c);
    });
  }

  /* ── 5. MISSION CARDS STAGGER SEQUENCE ── */
  const missionCards = document.querySelectorAll('.mission-card');
  if ('IntersectionObserver' in window && missionCards.length > 0) {
    const missionObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.mindex || '0', 10);
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 120 * idx);
          missionObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    missionCards.forEach((c, i) => {
      c.dataset.mindex = String(i);
      c.style.opacity = '0';
      c.style.transform = 'translateY(32px)';
      c.style.transition = 'opacity 0.75s ease, transform 0.75s ease';
      missionObs.observe(c);
    });
  }

  /* ── 6. VISION CARDS STAGGER SEQUENCE ── */
  const visionCards = document.querySelectorAll('.vision-card');
  if ('IntersectionObserver' in window && visionCards.length > 0) {
    const visionObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.vindex || '0', 10);
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 110 * idx);
          visionObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    visionCards.forEach((c, i) => {
      c.dataset.vindex = String(i);
      c.style.opacity = '0';
      c.style.transform = 'translateY(32px)';
      c.style.transition = 'opacity 0.75s ease, transform 0.75s ease';
      visionObs.observe(c);
    });
  }

  /* ── 7. NAVBAR ADAPTIVE SCROLL EFFECT ── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.style.background = window.scrollY > 70
        ? 'rgba(4,12,7,0.94)'
        : 'rgba(8,22,14,0.72)';
    }, { passive: true });
  }

  /* ── 8. FLOATING WHATSAPP / CALL TOGGLE ── */
  const fabTrigger = document.getElementById('fab-trigger');
  const fabMenu    = document.getElementById('fab-menu');
  if (fabTrigger && fabMenu) {
    fabTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !fabMenu.classList.contains('hidden');
      if (isOpen) {
        fabMenu.classList.add('hidden');
        fabTrigger.classList.remove('open');
      } else {
        fabMenu.classList.remove('hidden');
        fabTrigger.classList.add('open');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!fabMenu.classList.contains('hidden') && !e.target.closest('#chat-fab')) {
        fabMenu.classList.add('hidden');
        fabTrigger.classList.remove('open');
      }
    });
  }

  /* ── 9. NAV CTA BUTTON (NO INLINE JS) ── */
  const joinBtn = document.getElementById('join-cta-btn');
  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      const missionSection = document.getElementById('mission');
      if (missionSection) {
        missionSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

});
