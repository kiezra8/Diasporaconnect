import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [heroSlide, setHeroSlide] = useState(0);
  const [activeFarmDot, setActiveFarmDot] = useState(0);
  const canvasRef = useRef(null);
  const farmTrackWrapRef = useRef(null);
  const heroTimerRef = useRef(null);

  // 1. PARTICLES CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const count = 40;
    const particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const rnd = (a, b) => a + Math.random() * (b - a);

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
        this.color =
          Math.random() > 0.5
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

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // 2. HERO CAROUSEL ROTATION
  useEffect(() => {
    const startTimer = () => {
      stopTimer();
      heroTimerRef.current = setInterval(() => {
        setHeroSlide((prev) => (prev === 0 ? 1 : 0));
      }, 5500);
    };
    const stopTimer = () => {
      if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    };

    startTimer();
    return () => stopTimer();
  }, []);

  // 3. SCROLL REVEALS
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if ('IntersectionObserver' in window && revealEls.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
      revealEls.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    } else {
      revealEls.forEach((el) => el.classList.add('visible'));
    }
  }, []);

  // 4. FARM VIDEO TRACK INTERSECTION & AUTOPLAY
  useEffect(() => {
    const wrap = farmTrackWrapRef.current;
    if (!wrap) return;

    const cards = wrap.querySelectorAll('.farm-vid-card');
    if ('IntersectionObserver' in window && cards.length > 0) {
      const vidObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const vid = entry.target.querySelector('.farm-video');
            if (!vid) return;
            if (entry.isIntersecting) {
              vid.play().catch(() => {});
            } else {
              vid.pause();
            }
          });
        },
        { threshold: 0.4 }
      );
      cards.forEach((c) => vidObs.observe(c));
      return () => vidObs.disconnect();
    }
  }, []);

  // 5. FARM TRACK DRAG SCROLL & SCROLL LISTENER
  useEffect(() => {
    const wrap = farmTrackWrapRef.current;
    if (!wrap) return;

    const cards = wrap.querySelectorAll('.farm-vid-card');
    const onScroll = () => {
      const cardW = cards[0] ? cards[0].offsetWidth + 20 : 320;
      const idx = Math.round(wrap.scrollLeft / cardW);
      setActiveFarmDot(idx);
    };
    wrap.addEventListener('scroll', onScroll, { passive: true });

    // Drag-to-scroll
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e) => {
      isDown = true;
      wrap.classList.add('grabbing');
      startX = e.pageX - wrap.offsetLeft;
      scrollLeft = wrap.scrollLeft;
    };
    const onMouseLeave = () => {
      isDown = false;
      wrap.classList.remove('grabbing');
    };
    const onMouseUp = () => {
      isDown = false;
      wrap.classList.remove('grabbing');
    };
    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - wrap.offsetLeft;
      wrap.scrollLeft = scrollLeft - (x - startX) * 1.5;
    };

    wrap.addEventListener('mousedown', onMouseDown);
    wrap.addEventListener('mouseleave', onMouseLeave);
    wrap.addEventListener('mouseup', onMouseUp);
    wrap.addEventListener('mousemove', onMouseMove);

    return () => {
      wrap.removeEventListener('scroll', onScroll);
      wrap.removeEventListener('mousedown', onMouseDown);
      wrap.removeEventListener('mouseleave', onMouseLeave);
      wrap.removeEventListener('mouseup', onMouseUp);
      wrap.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const handleDotClick = (index) => {
    const wrap = farmTrackWrapRef.current;
    if (!wrap) return;
    const cards = wrap.querySelectorAll('.farm-vid-card');
    const cardW = cards[0] ? cards[0].offsetWidth + 20 : 320;
    wrap.scrollTo({ left: index * cardW, behavior: 'smooth' });
  };

  return (
    <>
      {/* ─ CANVAS PARTICLES ─ */}
      <canvas id="particles-canvas" ref={canvasRef}></canvas>

      {/* ─ HERO CAROUSEL ─ */}
      <section id="hero">
        <div className="hero-carousel" id="hero-carousel">
          <div
            className={`hero-slide ${heroSlide === 0 ? 'active' : ''}`}
            style={{ backgroundImage: "url('/images/hero_slide_2.jpg?v=3.5')" }}
          ></div>
          <div
            className={`hero-slide ${heroSlide === 1 ? 'active' : ''}`}
            style={{ backgroundImage: "url('/images/hero_slide_1.jpg?v=3.5')" }}
          ></div>
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-eyebrow">Diaspora Connect &middot; Uganda</p>
          <div className="hero-logo-wrap">
            <img src="/images/Diasporaconnectlogo.jpg" alt="Diaspora Connect Farmers SACCO" width="68" height="68" />
          </div>
          <h1 className="hero-title">
            DIASPORA<br />
            <span className="accent">CONNECT</span>
          </h1>
          <p className="hero-subtitle">Farmers SACCO</p>
          <div className="hero-divider"></div>
          <p className="hero-tagline">
            <strong>Come Home.</strong>&nbsp; Invest.&nbsp; Grow Together.
          </p>
        </div>
        <div className="hero-carousel-dots" id="hero-carousel-dots">
          <button
            className={`hero-dot ${heroSlide === 0 ? 'active' : ''}`}
            aria-label="Slide 1"
            type="button"
            onClick={() => setHeroSlide(0)}
          ></button>
          <button
            className={`hero-dot ${heroSlide === 1 ? 'active' : ''}`}
            aria-label="Slide 2"
            type="button"
            onClick={() => setHeroSlide(1)}
          ></button>
        </div>
        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* ─ MISSION (STARTING SECTION) ─ */}
      <section id="mission">
        <div className="mission-header reveal">
          <h2 className="section-heading">OUR <span>MISSION</span></h2>
          <div className="gold-line gold-line-center"></div>
          <p className="mission-intro">
            To create a <em>trusted financial community</em> where every member can save with purpose,
            access opportunities, invest in agriculture and build a <em>more secure future</em>.
          </p>
        </div>

        <div className="mission-cards">
          {/* COME HOME */}
          <div className="mission-card">
            <div className="mission-card-bg bg-pin-1" style={{ backgroundImage: "url('/images/card_img_1.jpg?v=3.2')" }}></div>
            <div className="mission-card-overlay"></div>
            <div className="mission-card-content">
              <span className="mission-card-num">01 &middot; Mission</span>
              <h3 className="mission-card-title">COME HOME.</h3>
              <span className="mission-card-desc">Your roots are calling &mdash; your community awaits.</span>
              <div className="mission-card-bar"></div>
            </div>
          </div>

          {/* INVEST */}
          <div className="mission-card">
            <div className="mission-card-bg bg-pin-2" style={{ backgroundImage: "url('/images/card_img_2.jpg?v=3.2')" }}></div>
            <div className="mission-card-overlay"></div>
            <div className="mission-card-content">
              <span className="mission-card-num">02 &middot; Mission</span>
              <h3 className="mission-card-title">INVEST.</h3>
              <span className="mission-card-desc">Put capital into fertile, productive farmland and enterprise.</span>
              <div className="mission-card-bar"></div>
            </div>
          </div>

          {/* GROW TOGETHER */}
          <div className="mission-card">
            <div className="mission-card-bg bg-pin-3" style={{ backgroundImage: "url('/images/card_img_3.jpg?v=3.2')" }}></div>
            <div className="mission-card-overlay"></div>
            <div className="mission-card-content">
              <span className="mission-card-num">03 &middot; Mission</span>
              <h3 className="mission-card-title">GROW TOGETHER.</h3>
              <span className="mission-card-desc">Unite resources to compound returns and create enduring wealth.</span>
              <div className="mission-card-bar"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─ VALUES ─ */}
      <section id="values">
        <div className="values-header reveal">
          <span className="section-label">What We Stand For</span>
          <h2 className="section-heading">OUR <span>VALUES</span></h2>
          <div className="gold-line gold-line-center"></div>
          <p className="values-sub">The Foundation of Our Growth</p>
        </div>

        {/* Row 1: 4 cards */}
        <div className="values-grid">
          {/* TEAMWORK */}
          <div className="value-card">
            <div className="value-card-bg bg-teamwork"></div>
            <div className="value-card-overlay"></div>
            <div className="value-card-content">
              <svg className="value-svg-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="value-number">01 &middot; Value</span>
              <h3 className="value-title">TEAMWORK</h3>
              <p className="value-desc">We grow stronger when we work together.</p>
              <div className="value-bar"></div>
            </div>
          </div>

          {/* GROWTH */}
          <div className="value-card">
            <div className="value-card-bg bg-growth"></div>
            <div className="value-card-overlay"></div>
            <div className="value-card-content">
              <svg className="value-svg-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
              <span className="value-number">02 &middot; Value</span>
              <h3 className="value-title">GROWTH</h3>
              <p className="value-desc">Turning member savings into real possibilities.</p>
              <div className="value-bar"></div>
            </div>
          </div>

          {/* TRUST */}
          <div className="value-card">
            <div className="value-card-bg bg-trust"></div>
            <div className="value-card-overlay"></div>
            <div className="value-card-content">
              <svg className="value-svg-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span className="value-number">03 &middot; Value</span>
              <h3 className="value-title">TRUST</h3>
              <p className="value-desc">Your money. Your future. Our responsibility.</p>
              <div className="value-bar"></div>
            </div>
          </div>

          {/* EMPOWERMENT */}
          <div className="value-card">
            <div className="value-card-bg bg-pin-2" style={{ backgroundImage: "url('/images/card_img_2.jpg?v=3.2')" }}></div>
            <div className="value-card-overlay"></div>
            <div className="value-card-content">
              <svg className="value-svg-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="12" y2="16"/>
              </svg>
              <span className="value-number">04 &middot; Value</span>
              <h3 className="value-title">EMPOWERMENT</h3>
              <p className="value-desc">Opportunity within reach of every member.</p>
              <div className="value-bar"></div>
            </div>
          </div>
        </div>

        {/* Row 2: 3 cards centred */}
        <div className="values-grid-row2">
          {/* PRODUCTIVITY */}
          <div className="value-card">
            <div className="value-card-bg bg-productivity"></div>
            <div className="value-card-overlay"></div>
            <div className="value-card-content">
              <svg className="value-svg-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <span className="value-number">05 &middot; Value</span>
              <h3 className="value-title">PRODUCTIVITY</h3>
              <p className="value-desc">We believe in assets that work for you.</p>
              <div className="value-bar"></div>
            </div>
          </div>

          {/* LEGACY */}
          <div className="value-card">
            <div className="value-card-bg bg-pin-3" style={{ backgroundImage: "url('/images/card_img_3.jpg?v=3.2')" }}></div>
            <div className="value-card-overlay"></div>
            <div className="value-card-content">
              <svg className="value-svg-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="value-number">06 &middot; Value</span>
              <h3 className="value-title">LEGACY</h3>
              <p className="value-desc">What we build today benefits tomorrow.</p>
              <div className="value-bar"></div>
            </div>
          </div>

          {/* INTEGRITY */}
          <div className="value-card">
            <div className="value-card-bg bg-integrity"></div>
            <div className="value-card-overlay"></div>
            <div className="value-card-content">
              <svg className="value-svg-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span className="value-number">07 &middot; Value</span>
              <h3 className="value-title">INTEGRITY</h3>
              <p className="value-desc">We do the right thing, always.</p>
              <div className="value-bar"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─ VISION ─ */}
      <section id="vision">
        <div className="vision-orb vision-orb-1"></div>
        <div className="vision-orb vision-orb-2"></div>

        <div className="vision-header reveal">
          <span className="section-label">Where We Are Headed</span>
          <h2 className="section-heading">OUR <span>VISION</span></h2>
          <div className="gold-line gold-line-center"></div>
          <p className="vision-intro">
            To build a <strong>financially empowered community</strong> turning savings into{' '}
            <strong>productive assets</strong> and <strong>lasting generational wealth</strong>.
          </p>
        </div>

        <div className="vision-cards">
          <div className="vision-card">
            <div className="vision-card-bg bg-pin-2" style={{ backgroundImage: "url('/images/card_img_2.jpg?v=3.2')" }}></div>
            <div className="vision-card-overlay"></div>
            <div className="vision-card-content">
              <span className="vision-card-num">01 &middot; Vision</span>
              <h3 className="vision-card-title">Savings Into Assets</h3>
              <span className="vision-card-desc">Transforming savings into real, productive farmland and tangible returns.</span>
              <div className="vision-card-bar"></div>
            </div>
          </div>

          <div className="vision-card">
            <div className="vision-card-bg bg-pin-1" style={{ backgroundImage: "url('/images/card_img_1.jpg?v=3.2')" }}></div>
            <div className="vision-card-overlay"></div>
            <div className="vision-card-content">
              <span className="vision-card-num">02 &middot; Vision</span>
              <h3 className="vision-card-title">Diaspora Bridge</h3>
              <span className="vision-card-desc">Connecting global Ugandans directly to productive investments back home.</span>
              <div className="vision-card-bar"></div>
            </div>
          </div>

          <div className="vision-card">
            <div className="vision-card-bg bg-pin-3" style={{ backgroundImage: "url('/images/card_img_3.jpg?v=3.2')" }}></div>
            <div className="vision-card-overlay"></div>
            <div className="vision-card-content">
              <span className="vision-card-num">03 &middot; Vision</span>
              <h3 className="vision-card-title">Thriving Farms</h3>
              <span className="vision-card-desc">Smart agricultural investments that feed communities and generate surplus wealth.</span>
              <div className="vision-card-bar"></div>
            </div>
          </div>

          <div className="vision-card">
            <div className="vision-card-bg bg-legacy"></div>
            <div className="vision-card-overlay"></div>
            <div className="vision-card-content">
              <span className="vision-card-num">04 &middot; Vision</span>
              <h3 className="vision-card-title">Lasting Wealth</h3>
              <span className="vision-card-desc">Securing generational foundations that endure beyond any single lifetime.</span>
              <div className="vision-card-bar"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─ AT THE FARM (GROUND LEVEL VIDEOS - NO POSTER IMAGE!) ─ */}
      <section id="farm">
        <div className="farm-header reveal">
          <span className="section-label">Ground Level</span>
          <h2 className="section-heading">At the <span>Farm</span></h2>
          <div className="gold-line gold-line-center"></div>
          <p className="farm-sub">Real land. Real produce. Real returns — see what your investment looks like on the ground.</p>
        </div>
        <div className="farm-track-wrap" ref={farmTrackWrapRef}>
          <div className="farm-track" id="farm-track">
            {/* farmvideo4starting.mp4 */}
            <div className="farm-vid-card">
              <video className="farm-video" muted playsInline loop preload="metadata">
                <source src="/videos/farmvideo4starting.mp4" type="video/mp4" />
              </video>
              <div className="farm-vid-label">
                <span>The Farm</span>
                <p>Where it all begins</p>
              </div>
            </div>

            {/* farm video1.mp4 */}
            <div className="farm-vid-card">
              <video className="farm-video" muted playsInline loop preload="metadata">
                <source src="/videos/farm video1.mp4" type="video/mp4" />
              </video>
              <div className="farm-vid-label">
                <span>Growing Strong</span>
                <p>Crops in full season</p>
              </div>
            </div>

            {/* farmvideo2.mp4 */}
            <div className="farm-vid-card">
              <video className="farm-video" muted playsInline loop preload="metadata">
                <source src="/videos/farmvideo2.mp4" type="video/mp4" />
              </video>
              <div className="farm-vid-label">
                <span>Daily Operations</span>
                <p>Hands-on farm management</p>
              </div>
            </div>

            {/* farmvideo3.mp4 */}
            <div className="farm-vid-card">
              <video className="farm-video" muted playsInline loop preload="metadata">
                <source src="/videos/farmvideo3.mp4" type="video/mp4" />
              </video>
              <div className="farm-vid-label">
                <span>Harvest Season</span>
                <p>The reward of patience</p>
              </div>
            </div>

            {/* farm video5.mp4 */}
            <div className="farm-vid-card">
              <video className="farm-video" muted playsInline loop preload="metadata">
                <source src="/videos/farm video5.mp4" type="video/mp4" />
              </video>
              <div className="farm-vid-label">
                <span>Fertile Land</span>
                <p>Uganda's greatest asset</p>
              </div>
            </div>
          </div>
        </div>
        <div className="farm-scroll-hint">
          <div className="farm-scroll-dots" id="farm-dots">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`farm-dot ${activeFarmDot === i ? 'active' : ''}`}
                role="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => handleDotClick(i)}
              ></div>
            ))}
          </div>
        </div>
      </section>

      {/* ─ DIASPORA BLOGS ─ */}
      <section id="blogs">
        <div className="blogs-header reveal">
          <span className="section-label">Member Stories</span>
          <h2 className="section-heading">Diaspora <span>Blogs</span></h2>
          <div className="gold-line gold-line-center"></div>
          <p className="blogs-sub">Inspiring stories for diaspora members in the SACCO and their view on the matter.</p>
        </div>

        {/* FEATURED SPOTLIGHT STORY (DAIRY FARMING) */}
        <div className="blog-spotlight reveal">
          <div className="blog-spotlight-img">
            <img src="/images/blog_dairy_1.jpg?v=3.5" alt="The White Gold Revolution - Dairy Farming" loading="lazy" />
            <span className="spotlight-badge">Spotlight &middot; 2026</span>
          </div>
          <div className="blog-spotlight-content">
            <span className="blog-card-date">Sep 28, 2026</span>
            <span className="blog-card-cat">Dairy &middot; Modern Agriculture</span>
            <h3 className="blog-spotlight-title">The White Gold Revolution: How Diaspora Capital is Modernising Dairy Farming in Uganda</h3>
            <p className="blog-spotlight-excerpt">From automated milking parlours to cold-chain preservation, SACCO members are pooling funds to transform Uganda's milk belt into a high-yield dairy powerhouse.</p>
            <div className="blog-card-author">
              <img src="/images/author_amara.jpg" alt="Editorial Desk" />
              <div>
                <span className="blog-author-name">Diaspora Connect Dairy Desk</span>
                <span className="blog-author-loc">Mbarara &middot; London &middot; Toronto</span>
              </div>
            </div>
            <Link to="/blog#article-spotlight" className="blog-read-more">
              Read Full Story{' '}
              <svg viewBox="0 0 24 24">
                <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="blogs-grid">
          {/* BLOG 1 */}
          <article className="blog-card reveal">
            <div className="blog-card-img">
              <img src="/images/blog_dairy_1.jpg?v=3.5" alt="Investing in Dairy Cattle from London" loading="lazy" />
            </div>
            <div className="blog-card-body">
              <span className="blog-card-date">Sep 24, 2026</span>
              <span className="blog-card-cat">Dairy Cattle &middot; Passive Income</span>
              <h3 className="blog-card-title">Investing in Dairy Cattle from London: Consistent Monthly Milk Yields</h3>
              <p className="blog-card-excerpt">I co-own a herd of 15 Friesian-cross heifers in Kiruhura through the SACCO. The daily milk collection provides dependable quarterly dividends without the stress of remote management.</p>
              <div className="blog-card-author">
                <img src="/images/author_amara.jpg" alt="Amara Nakato" />
                <div>
                  <span className="blog-author-name">Amara Nakato</span>
                  <span className="blog-author-loc">London, UK</span>
                </div>
              </div>
              <Link to="/blog#article-1" className="blog-read-more">
                Read Full Story{' '}
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </Link>
            </div>
          </article>

          {/* BLOG 2 */}
          <article className="blog-card reveal">
            <div className="blog-card-img">
              <img src="/images/blog_farmland.jpg" alt="Cold-Chain Milk Storage" loading="lazy" />
            </div>
            <div className="blog-card-body">
              <span className="blog-card-date">Sep 14, 2026</span>
              <span className="blog-card-cat">Dairy Logistics &middot; Value Addition</span>
              <h3 className="blog-card-title">Cold-Chain Milk Storage: Solving the Dairy Distribution Puzzle</h3>
              <p className="blog-card-excerpt">Our cooperative investment in solar-powered milk chillers cut spoilage to zero across three collection centres, compounding member returns significantly.</p>
              <div className="blog-card-author">
                <img src="/images/author_david.jpg" alt="David Ochieng" />
                <div>
                  <span className="blog-author-name">David Ochieng</span>
                  <span className="blog-author-loc">Toronto, Canada</span>
                </div>
              </div>
              <Link to="/blog#article-2" className="blog-read-more">
                Read Full Story{' '}
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </Link>
            </div>
          </article>

          {/* BLOG 3 */}
          <article className="blog-card reveal">
            <div className="blog-card-img">
              <img src="/images/card_img_1.jpg?v=3.2" alt="Silage and Pasture Management" loading="lazy" />
            </div>
            <div className="blog-card-body">
              <span className="blog-card-date">Aug 28, 2026</span>
              <span className="blog-card-cat">Livestock Feed &middot; Sustainability</span>
              <h3 className="blog-card-title">Silage &amp; Pasture Management: Sustaining Milk Production Year-Round</h3>
              <p className="blog-card-excerpt">During dry spells when milk prices surge, our SACCO-backed silage banks ensure uninterrupted milk yield. It's smart, resilient dairy agriculture built on shared trust.</p>
              <div className="blog-card-author">
                <img src="/images/author_grace.jpg" alt="Grace Asiimwe" />
                <div>
                  <span className="blog-author-name">Grace Asiimwe</span>
                  <span className="blog-author-loc">Stockholm, Sweden</span>
                </div>
              </div>
              <Link to="/blog#article-3" className="blog-read-more">
                Read Full Story{' '}
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </Link>
            </div>
          </article>

          {/* BLOG 4 */}
          <article className="blog-card reveal">
            <div className="blog-card-img">
              <img src="/images/card_img_3.jpg?v=3.2" alt="Building Generational Dairy Assets" loading="lazy" />
            </div>
            <div className="blog-card-body">
              <span className="blog-card-date">Aug 15, 2026</span>
              <span className="blog-card-cat">Generational Wealth &middot; Dairy</span>
              <h3 className="blog-card-title">Building Generational Dairy Assets: From Calves to Milk Cooperatives</h3>
              <p className="blog-card-excerpt">A pedigree dairy cow multiplies in asset value each season. By reinvesting our milk earnings into dairy expansion, we are building enduring family security back home.</p>
              <div className="blog-card-author">
                <img src="/images/author_joseph.jpg" alt="Joseph Mugisha" />
                <div>
                  <span className="blog-author-name">Joseph Mugisha</span>
                  <span className="blog-author-loc">Dubai, UAE</span>
                </div>
              </div>
              <Link to="/blog#article-4" className="blog-read-more">
                Read Full Story{' '}
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </Link>
            </div>
          </article>
        </div>

        <div className="blogs-cta">
          <Link to="/blog" className="blogs-view-all">
            View All Stories
          </Link>
        </div>
      </section>
    </>
  );
}

