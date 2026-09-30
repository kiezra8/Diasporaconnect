/**
 * Diaspora Connect Farmers SACCO - Interactive & Visual Engine
 * Clean, lightweight, and static hero layout.
 */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. SUBTLE PARTICLES BACKGROUND ── */
  (function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const count = 40;
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
        this.r = rnd(0.8, 2.6);
        this.vx = rnd(-0.18, 0.18);
        this.vy = rnd(-0.35, -0.06);
        this.alpha = rnd(0.08, 0.40);
        this.color = Math.random() > 0.5
          ? `rgba(184,134,11,${this.alpha})`
          : `rgba(148,163,184,${this.alpha * 0.7})`;
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

  /* ── 2. SCROLL REVEAL OBSERVER ── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window && revealEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ── 3. VALUE CARDS STAGGER SEQUENCE ── */
  const valueCards = document.querySelectorAll('.value-card');
  if ('IntersectionObserver' in window && valueCards.length > 0) {
    const cardObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.index || '0', 10);
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 65 * idx);
          cardObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    valueCards.forEach((c, i) => {
      c.dataset.index = String(i);
      c.style.opacity = '0';
      c.style.transform = 'translateY(24px)';
      c.style.transition = 'opacity 0.65s ease, transform 0.65s ease';
      cardObs.observe(c);
    });
  }

  /* ── 4. MISSION CARDS STAGGER SEQUENCE ── */
  const missionCards = document.querySelectorAll('.mission-card');
  if ('IntersectionObserver' in window && missionCards.length > 0) {
    const missionObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.mindex || '0', 10);
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100 * idx);
          missionObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    missionCards.forEach((c, i) => {
      c.dataset.mindex = String(i);
      c.style.opacity = '0';
      c.style.transform = 'translateY(28px)';
      c.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      missionObs.observe(c);
    });
  }

  /* ── 5. VISION CARDS STAGGER SEQUENCE ── */
  const visionCards = document.querySelectorAll('.vision-card');
  if ('IntersectionObserver' in window && visionCards.length > 0) {
    const visionObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.vindex || '0', 10);
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100 * idx);
          visionObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    visionCards.forEach((c, i) => {
      c.dataset.vindex = String(i);
      c.style.opacity = '0';
      c.style.transform = 'translateY(28px)';
      c.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      visionObs.observe(c);
    });
  }

  /* ── 6. NAVBAR SCROLL EFFECT (WHITE THEME) ── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.07)';
      } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
      }
    }, { passive: true });
  }

  /* ── 7. FLOATING WHATSAPP / CALL TOGGLE (ON RIGHT) ── */
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

  /* ── 8. FARM VIDEO CAROUSEL: DRAG-TO-SCROLL + AUTO-PLAY + DOTS ── */
  (function initFarmCarousel() {
    const wrap  = document.querySelector('.farm-track-wrap');
    const track = document.getElementById('farm-track');
    const dotsContainer = document.getElementById('farm-dots');
    if (!wrap || !track) return;

    const cards = track.querySelectorAll('.farm-vid-card');
    const videos = track.querySelectorAll('.farm-video');
    const total  = cards.length;

    // Build dot indicators
    if (dotsContainer) {
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('div');
        dot.className = 'farm-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('role', 'button');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', () => {
          const cardW = cards[0].offsetWidth + 20;
          wrap.scrollTo({ left: i * cardW, behavior: 'smooth' });
        });
        dotsContainer.appendChild(dot);
      }
    }

    // Update active dot on scroll
    wrap.addEventListener('scroll', () => {
      if (!dotsContainer) return;
      const cardW = cards[0] ? cards[0].offsetWidth + 20 : 320;
      const idx   = Math.round(wrap.scrollLeft / cardW);
      dotsContainer.querySelectorAll('.farm-dot').forEach((d, i) => {
        d.classList.toggle('active', i === idx);
      });
    }, { passive: true });

    // Drag to scroll (desktop)
    let isDown = false, startX = 0, scrollLeft = 0;
    wrap.addEventListener('mousedown', (e) => {
      isDown = true;
      wrap.classList.add('grabbing');
      startX = e.pageX - wrap.offsetLeft;
      scrollLeft = wrap.scrollLeft;
    });
    wrap.addEventListener('mouseleave', () => { isDown = false; wrap.classList.remove('grabbing'); });
    wrap.addEventListener('mouseup',    () => { isDown = false; wrap.classList.remove('grabbing'); });
    wrap.addEventListener('mousemove',  (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - wrap.offsetLeft;
      wrap.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });

    // Auto-play video when card enters viewport
    if ('IntersectionObserver' in window) {
      const vidObs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const vid = entry.target.querySelector('.farm-video');
          if (!vid) return;
          if (entry.isIntersecting) {
            vid.play().catch(() => {});
          } else {
            vid.pause();
          }
        });
      }, { threshold: 0.4 });

      cards.forEach((card) => vidObs.observe(card));
    }
  })();

  /* ── 9. BLOG CARDS STAGGER ── */
  const blogCards = document.querySelectorAll('.blog-card');
  if ('IntersectionObserver' in window && blogCards.length > 0) {
    const blogObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.bidx || '0', 10);
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 80 * idx);
          blogObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    blogCards.forEach((c, i) => {
      c.dataset.bidx = String(i);
      c.style.opacity = '0';
      c.style.transform = 'translateY(24px)';
      c.style.transition = 'opacity 0.65s ease, transform 0.65s ease';
      blogObs.observe(c);
    });
  }

});
