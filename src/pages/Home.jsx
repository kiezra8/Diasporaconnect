import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [activePillar, setActivePillar] = useState('mission');
  const [activeMediaTab, setActiveMediaTab] = useState('farmlife');
  const [activeFarmDot, setActiveFarmDot] = useState(0);
  const canvasRef = useRef(null);
  const farmTrackWrapRef = useRef(null);

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
      constructor() { this.reset(); }
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

    for (let i = 0; i < count; i++) particles.push(new Particle());

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

  // 2. SCROLL REVEALS
  useEffect(() => {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if ('IntersectionObserver' in window && revealEls.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }); },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
      revealEls.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    } else {
      revealEls.forEach((el) => el.classList.add('visible'));
    }
  }, []);

  // 3. FARM VIDEO TRACK INTERSECTION & AUTOPLAY
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
            if (entry.isIntersecting) vid.play().catch(() => {});
            else vid.pause();
          });
        },
        { threshold: 0.4 }
      );
      cards.forEach((c) => vidObs.observe(c));
      return () => vidObs.disconnect();
    }
  }, [activeMediaTab]);

  // 4. FARM TRACK DRAG SCROLL & SCROLL LISTENER
  useEffect(() => {
    const wrap = farmTrackWrapRef.current;
    if (!wrap) return;
    const cards = wrap.querySelectorAll('.farm-vid-card');
    const onScroll = () => {
      const cardW = cards[0] ? cards[0].offsetWidth + 16 : 280;
      const idx = Math.round(wrap.scrollLeft / cardW);
      setActiveFarmDot(idx);
    };
    wrap.addEventListener('scroll', onScroll, { passive: true });
    let isDown = false, startX = 0, scrollLeft = 0;
    const onMouseDown = (e) => { isDown = true; wrap.classList.add('grabbing'); startX = e.pageX - wrap.offsetLeft; scrollLeft = wrap.scrollLeft; };
    const onMouseLeave = () => { isDown = false; wrap.classList.remove('grabbing'); };
    const onMouseUp = () => { isDown = false; wrap.classList.remove('grabbing'); };
    const onMouseMove = (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - wrap.offsetLeft; wrap.scrollLeft = scrollLeft - (x - startX) * 1.5; };
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
  }, [activeMediaTab]);

  const handleDotClick = (index) => {
    const wrap = farmTrackWrapRef.current;
    if (!wrap) return;
    const cards = wrap.querySelectorAll('.farm-vid-card');
    const cardW = cards[0] ? cards[0].offsetWidth + 16 : 280;
    wrap.scrollTo({ left: index * cardW, behavior: 'smooth' });
  };

  const pillars = [
    { key: 'mission', label: 'Mission' },
    { key: 'values', label: 'Values' },
    { key: 'vision', label: 'Vision' },
  ];

  const mediaTabs = [
    { key: 'farmlife', label: 'Farm Life' },
    { key: 'blogs', label: 'Diaspora Blogs' },
  ];

  return (
    <>
      {/* CANVAS PARTICLES */}
      <canvas id="particles-canvas" ref={canvasRef}></canvas>

      {/* HERO IMAGE */}
      <section id="hero" style={{ height: '42vh', minHeight: '300px', maxHeight: '380px', display: 'flex', alignItems: 'center' }}>
        <div className="hero-carousel" id="hero-carousel">
          <div
            className="hero-slide active"
            style={{ backgroundImage: "url('/images/hero_slide_2.jpg?v=3.5')" }}
          ></div>
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content" style={{ textAlign: 'left', width: '100%', maxWidth: '1200px', padding: '0 32px', margin: '0 auto', display: 'flex', alignItems: 'center', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h1 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.15,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textShadow: '0 3px 12px rgba(0,0,0,0.85)',
              margin: 0
            }}>
              Come home,<br />
              <span style={{ color: 'var(--gold, #d4af37)' }}>Invest,</span><br />
              Grow together.
            </h1>
          </div>
        </div>
      </section>

      {/* ─ 1. MISSION / VALUES / VISION TAB SWITCHER ─ */}
      <section id="pillars" style={{ padding: '24px 0 36px' }}>
        {/* Tab Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0',
          marginBottom: '28px',
          borderBottom: '2px solid rgba(184,134,11,0.15)',
          position: 'relative',
        }}>
          {pillars.map((p) => (
            <button
              key={p.key}
              onClick={() => setActivePillar(p.key)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '14px 36px',
                fontSize: '13px',
                fontWeight: activePillar === p.key ? '800' : '600',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: activePillar === p.key ? 'var(--gold, #b8860b)' : 'var(--text-secondary, #6b7280)',
                borderBottom: activePillar === p.key ? '3px solid var(--gold, #b8860b)' : '3px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s ease',
              }}
              aria-selected={activePillar === p.key}
              role="tab"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* MISSION PANEL */}
        {activePillar === 'mission' && (
          <div>
            <div className="mission-header reveal" style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h2 className="section-heading">OUR <span>MISSION</span></h2>
              <div className="gold-line gold-line-center"></div>
            </div>
            <div className="mission-cards">
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
          </div>
        )}

        {/* VALUES PANEL */}
        {activePillar === 'values' && (
          <div>
            <div className="values-header reveal" style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h2 className="section-heading">OUR <span>VALUES</span></h2>
              <div className="gold-line gold-line-center"></div>
            </div>
            <div className="values-grid">
              {[
                { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, num: '01', title: 'TEAMWORK', desc: 'We grow stronger when we work together.', bg: 'bg-teamwork', style: {} },
                { icon: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>, num: '02', title: 'GROWTH', desc: 'Turning member savings into real possibilities.', bg: 'bg-growth', style: {} },
                { icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>, num: '03', title: 'TRUST', desc: 'Your money. Your future. Our responsibility.', bg: 'bg-trust', style: {} },
                { icon: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="12" y2="16"/></>, num: '04', title: 'EMPOWERMENT', desc: 'Opportunity within reach of every member.', bg: 'bg-pin-2', style: { backgroundImage: "url('/images/card_img_2.jpg?v=3.2')" } },
              ].map((v) => (
                <div className="value-card" key={v.num}>
                  <div className={`value-card-bg ${v.bg}`} style={v.style}></div>
                  <div className="value-card-overlay"></div>
                  <div className="value-card-content">
                    <svg className="value-svg-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{v.icon}</svg>
                    <span className="value-number">{v.num} &middot; Value</span>
                    <h3 className="value-title">{v.title}</h3>
                    <p className="value-desc">{v.desc}</p>
                    <div className="value-bar"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="values-grid-row2" style={{ marginTop: '20px' }}>
              {[
                { icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>, num: '05', title: 'PRODUCTIVITY', desc: 'We believe in assets that work for you.', bg: 'bg-productivity', style: {} },
                { icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>, num: '06', title: 'LEGACY', desc: 'What we build today benefits tomorrow.', bg: 'bg-pin-3', style: { backgroundImage: "url('/images/card_img_3.jpg?v=3.2')" } },
                { icon: <><polyline points="20 6 9 17 4 12"/></>, num: '07', title: 'INTEGRITY', desc: 'We do the right thing, always.', bg: 'bg-integrity', style: {} },
              ].map((v) => (
                <div className="value-card" key={v.num}>
                  <div className={`value-card-bg ${v.bg}`} style={v.style}></div>
                  <div className="value-card-overlay"></div>
                  <div className="value-card-content">
                    <svg className="value-svg-icon" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{v.icon}</svg>
                    <span className="value-number">{v.num} &middot; Value</span>
                    <h3 className="value-title">{v.title}</h3>
                    <p className="value-desc">{v.desc}</p>
                    <div className="value-bar"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISION PANEL */}
        {activePillar === 'vision' && (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="vision-orb vision-orb-1"></div>
            <div className="vision-orb vision-orb-2"></div>
            <div className="vision-header reveal" style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h2 className="section-heading">OUR <span>VISION</span></h2>
              <div className="gold-line gold-line-center"></div>
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
          </div>
        )}
      </section>

      {/* ─ 2. FARM LIFE & DIASPORA BLOGS SWITCHER ─ */}
      <section id="media-showcase" style={{ padding: '60px 0 72px', background: 'var(--surface, #f8f9fa)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>

          {/* Media Switcher Tab Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0',
            marginBottom: '40px',
            borderBottom: '2px solid rgba(184,134,11,0.15)',
          }}>
            {mediaTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveMediaTab(tab.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px 32px',
                  fontSize: '13px',
                  fontWeight: activeMediaTab === tab.key ? '800' : '600',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: activeMediaTab === tab.key ? 'var(--gold, #b8860b)' : 'var(--text-secondary, #6b7280)',
                  borderBottom: activeMediaTab === tab.key ? '3px solid var(--gold, #b8860b)' : '3px solid transparent',
                  marginBottom: '-2px',
                  transition: 'all 0.2s ease',
                }}
                aria-selected={activeMediaTab === tab.key}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: FARM LIFE */}
          {activeMediaTab === 'farmlife' && (
            <div>
              <div className="farm-header reveal" style={{ textAlign: 'center', marginBottom: '28px' }}>
                <span className="section-label">Ground Level Footage</span>
                <h2 className="section-heading">Farm <span>Life</span></h2>
                <div className="gold-line gold-line-center"></div>
              </div>

              <div className="farm-track-wrap" ref={farmTrackWrapRef} style={{
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                display: 'flex',
                gap: '16px',
                paddingBottom: '12px',
                cursor: 'grab',
              }}>
                <div className="farm-track" id="farm-track" style={{ display: 'flex', gap: '16px' }}>
                  {[
                    { src: '/videos/farmvideo4starting.mp4', title: 'The Farm', sub: 'Where it all begins' },
                    { src: '/videos/farm video1.mp4', title: 'Growing Strong', sub: 'Crops in full season' },
                    { src: '/videos/farmvideo2.mp4', title: 'Daily Operations', sub: 'Hands-on farm management' },
                    { src: '/videos/farmvideo3.mp4', title: 'Harvest Season', sub: 'The reward of patience' },
                    { src: '/videos/farm video5.mp4', title: 'Fertile Land', sub: "Uganda's greatest asset" },
                  ].map((v, i) => (
                    <div key={i} className="farm-vid-card" style={{ scrollSnapAlign: 'start', flexShrink: 0, width: '300px' }}>
                      <video className="farm-video" muted playsInline loop preload="metadata">
                        <source src={v.src} type="video/mp4" />
                      </video>
                      <div className="farm-vid-label">
                        <span>{v.title}</span>
                        <p>{v.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="farm-scroll-hint" style={{ marginTop: '16px' }}>
                <div className="farm-scroll-dots">
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

              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <Link to="/farmlife" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(184,134,11,0.3)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                  fontWeight: '800',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--gold, #b8860b)',
                  textDecoration: 'none',
                }}>
                  Explore All Farm Videos
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: DIASPORA BLOGS (YOUTUBE STYLE WORD ARTICLES) */}
          {activeMediaTab === 'blogs' && (
            <div>
              <div className="blogs-header reveal" style={{ textAlign: 'center', marginBottom: '28px' }}>
                <span className="section-label">Member Stories</span>
                <h2 className="section-heading">Diaspora <span>Blogs</span></h2>
                <div className="gold-line gold-line-center"></div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
              }}>
                {[
                  {
                    img: '/images/blog_dairy_1.jpg?v=3.5',
                    alt: 'The White Gold Revolution',
                    date: 'Sep 28, 2026',
                    cat: 'Dairy Farming',
                    title: 'The White Gold Revolution: How Diaspora Capital is Modernising Dairy Farming',
                    excerpt: 'From automated milking parlours to cold-chain preservation, SACCO members are pooling funds to transform Uganda’s milk belt into a high-yield powerhouse.',
                    author: 'Dairy Desk',
                    loc: 'Mbarara, Uganda',
                    authorImg: '/images/author_amara.jpg',
                    link: '/blog',
                  },
                  {
                    img: '/images/blog_dairy_1.jpg?v=3.5',
                    alt: 'Investing in Dairy Cattle from London',
                    date: 'Sep 24, 2026',
                    cat: 'Livestock Investment',
                    title: 'Investing in Dairy Cattle from London: Consistent Monthly Milk Yields',
                    excerpt: 'I co-own a herd of 15 Friesian-cross heifers in Kiruhura through the SACCO. The daily milk collection provides dependable quarterly dividends.',
                    author: 'Amara Nakato',
                    loc: 'London, UK',
                    authorImg: '/images/author_amara.jpg',
                    link: '/blog',
                  },
                  {
                    img: '/images/blog_farmland.jpg',
                    alt: 'Cold-Chain Milk Storage',
                    date: 'Sep 14, 2026',
                    cat: 'Value Addition',
                    title: 'Cold-Chain Milk Storage: Solving the Dairy Distribution Puzzle',
                    excerpt: 'Our cooperative investment in solar-powered milk chillers cut spoilage to zero across three collection centres, compounding member returns.',
                    author: 'David Ochieng',
                    loc: 'Toronto, Canada',
                    authorImg: '/images/author_david.jpg',
                    link: '/blog',
                  },
                ].map((post, i) => (
                  <article key={i} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--card-bg, #ffffff)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                  >
                    {/* YouTube-like 16:9 Thumbnail Banner */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#e2e8f0' }}>
                      <img
                        src={post.img}
                        alt={post.alt}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        decoding="async"
                      />
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        fontSize: '9px',
                        fontWeight: '800',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#ffffff',
                        background: '#059669',
                        padding: '3px 8px',
                        borderRadius: '20px',
                      }}>
                        {post.cat}
                      </span>
                    </div>

                    {/* YouTube Card Body */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{
                          margin: '0 0 4px 0',
                          fontSize: '13.5px',
                          fontWeight: '800',
                          lineHeight: '1.35',
                          color: 'var(--text-primary, #111827)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {post.title}
                        </h3>

                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #6b7280)', marginBottom: '6px' }}>
                          <span>{post.author}</span> &middot; <span>{post.loc}</span>
                        </div>

                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary, #9ca3af)', marginBottom: '8px' }}>
                          {post.date}
                        </div>

                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '12px',
                          color: 'var(--text-secondary, #4b5563)',
                          lineHeight: '1.45',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {post.excerpt}
                        </p>

                        <div style={{ marginTop: 'auto' }}>
                          <Link to={post.link} style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            color: 'var(--gold, #b8860b)',
                            textDecoration: 'none',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            Read Full Story
                            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <path d="M5 12h14m-7-7 7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '28px' }}>
                <Link to="/blog" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(184,134,11,0.3)',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                  fontWeight: '800',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--gold, #b8860b)',
                  textDecoration: 'none',
                }}>
                  View All Stories
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 12h14m-7-7 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
}
