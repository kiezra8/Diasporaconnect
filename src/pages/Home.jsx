import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ChevronRight, Calendar, Clock } from 'lucide-react';

const FARM_VIDEOS = [
  {
    id: 'start',
    title: 'The Farm',
    subtitle: 'Where it all begins',
    category: 'Foundation',
    src: '/videos/farmvideo4starting.mp4',
    description: 'Our primary agricultural hub in Uganda. Here, perimeter fencing, pasture paddocks, and water catchment systems provide the backbone for our high-yield dairy herds.'
  },
  {
    id: 'growing',
    title: 'Growing Strong',
    subtitle: 'Crops in full season',
    category: 'Agronomy',
    src: '/videos/farm video1.mp4',
    description: 'High-density fodder cultivation including Napier grass and ensiled maize. Strong nutritional inputs ensure consistent milk yield year-round regardless of drought.'
  },
  {
    id: 'operations',
    title: 'Daily Operations',
    subtitle: 'Hands-on farm management',
    category: 'Management',
    src: '/videos/farmvideo2.mp4',
    description: 'Veterinary rounds, scheduled cattle dippings, and automated milking stations. Resident livestock professionals monitor herd health and output daily.'
  },
  {
    id: 'harvest',
    title: 'Harvest Season',
    subtitle: 'The reward of patience',
    category: 'Yield & Production',
    src: '/videos/farmvideo3.mp4',
    description: 'Bulk silage processing and raw milk consolidation into solar-hybrid chillers. Zero post-harvest losses guarantee peak dividends for diaspora members.'
  },
  {
    id: 'land',
    title: 'Fertile Land',
    subtitle: "Uganda's greatest asset",
    category: 'Land & Assets',
    src: '/videos/farm video5.mp4',
    description: 'Freehold agricultural acreage deeded in collective trust. Compounding land appreciation and tangible dairy assets create enduring generational security.'
  }
];

const HOME_BLOGS = [
  {
    id: 'b1',
    title: 'The White Gold Revolution: How Diaspora Capital is Modernising Dairy Farming in Uganda',
    category: 'Dairy Farming',
    date: 'Sep 28, 2026',
    readTime: '6 min read',
    img: '/images/blog_dairy_1.jpg?v=3.5',
    author: {
      name: 'Dairy Desk',
      location: 'Mbarara, Uganda',
      avatar: '/images/author_amara.jpg'
    },
    excerpt: 'From automated milking parlours to cold-chain preservation, SACCO members are pooling funds to transform Uganda’s milk belt into a high-yield dairy powerhouse.',
    link: '/blog'
  },
  {
    id: 'b2',
    title: 'Investing in Dairy Cattle from London: Consistent Monthly Milk Yields',
    category: 'Livestock Investment',
    date: 'Sep 24, 2026',
    readTime: '4 min read',
    img: '/images/blog_dairy_1.jpg?v=3.5',
    author: {
      name: 'Amara Nakato',
      location: 'London, UK',
      avatar: '/images/author_amara.jpg'
    },
    excerpt: 'I co-own a herd of 15 Friesian-cross heifers in Kiruhura through the SACCO. The daily milk collection provides dependable quarterly dividends without the stress of remote management.',
    link: '/blog'
  },
  {
    id: 'b3',
    title: 'Cold-Chain Milk Storage: Solving the Dairy Distribution Puzzle',
    category: 'Value Addition',
    date: 'Sep 14, 2026',
    readTime: '5 min read',
    img: '/images/blog_farmland.jpg',
    author: {
      name: 'David Ochieng',
      location: 'Toronto, Canada',
      avatar: '/images/author_david.jpg'
    },
    excerpt: 'Our cooperative investment in solar-powered milk chillers cut spoilage to zero across three collection depots, compounding member returns significantly.',
    link: '/blog'
  },
  {
    id: 'b4',
    title: 'Silage & Pasture Management: Sustaining Milk Production Year-Round',
    category: 'Agronomy & Feed',
    date: 'Aug 28, 2026',
    readTime: '4 min read',
    img: '/images/card_img_1.jpg?v=3.2',
    author: {
      name: 'Grace Asiimwe',
      location: 'Stockholm, Sweden',
      avatar: '/images/author_grace.jpg'
    },
    excerpt: 'During dry spells when milk prices surge, our SACCO-backed silage banks ensure uninterrupted milk yield and protect cattle health through shared trust.',
    link: '/blog'
  }
];

export default function Home() {
  const [activePillar, setActivePillar] = useState('mission');
  const [activeVideoId, setActiveVideoId] = useState('start');
  const activeVideo = FARM_VIDEOS.find(v => v.id === activeVideoId) || FARM_VIDEOS[0];
  const canvasRef = useRef(null);

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

  const pillars = [
    { key: 'mission', label: 'Mission' },
    { key: 'values', label: 'Values' },
    { key: 'vision', label: 'Vision' },
  ];

  return (
    <>
      {/* CANVAS PARTICLES */}
      <canvas id="particles-canvas" ref={canvasRef}></canvas>

      {/* HERO IMAGE */}
      <section id="hero" style={{ height: '45vh', minHeight: '320px', maxHeight: '420px', display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
        <div className="hero-carousel" id="hero-carousel">
          <div
            className="hero-slide active"
            style={{ backgroundImage: "url('/images/hero_slide_2.jpg?v=4.0')" }}
          ></div>
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content" style={{ textAlign: 'left', width: '100%', maxWidth: '1200px', padding: '0 28px 24px', margin: '0 auto', zIndex: 3 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 'clamp(1.75rem, 4.2vw, 3rem)',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.15,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textShadow: '0 3px 12px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.8)',
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
      <section id="pillars" style={{ padding: '16px 0 28px' }}>
        {/* Tab Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0',
          marginBottom: '18px',
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
                padding: '10px 28px',
                fontSize: '13px',
                fontWeight: activePillar === p.key ? '800' : '600',
                letterSpacing: '0.1em',
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
          <div className="mission-cards">
            <div className="mission-card">
              <div className="mission-card-bg bg-pin-1" style={{ backgroundImage: "url('/images/cows_mission_come_home.jpg?v=5.0')" }}></div>
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
        )}

        {/* VALUES PANEL */}
        {activePillar === 'values' && (
          <div>
            <div className="values-grid">
              {[
                { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>, num: '01', title: 'TEAMWORK', desc: 'We grow stronger when we work together.', bg: 'bg-teamwork', style: {} },
                { icon: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>, num: '02', title: 'GROWTH', desc: 'Turning member savings into real possibilities.', bg: 'bg-growth', style: {} },
                { icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>, num: '03', title: 'TRUST', desc: 'Your money. Your future. Our responsibility.', bg: 'bg-trust', style: {} },
                { icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="12" y2="16" /></>, num: '04', title: 'EMPOWERMENT', desc: 'Opportunity within reach of every member.', bg: 'bg-pin-2', style: { backgroundImage: "url('/images/card_img_2.jpg?v=3.2')" } },
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
            <div className="values-grid-row2" style={{ marginTop: '16px' }}>
              {[
                { icon: <><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>, num: '05', title: 'PRODUCTIVITY', desc: 'We believe in assets that work for you.', bg: 'bg-productivity', style: {} },
                { icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>, num: '06', title: 'LEGACY', desc: 'What we build today benefits tomorrow.', bg: 'bg-pin-3', style: { backgroundImage: "url('/images/card_img_3.jpg?v=3.2')" } },
                { icon: <><polyline points="20 6 9 17 4 12" /></>, num: '07', title: 'INTEGRITY', desc: 'We do the right thing, always.', bg: 'bg-integrity', style: {} },
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

      {/* ─ 2. FARM LIFE SECTION (MIRRORS FARM LIFE PAGE) ─ */}
      <section id="farm-showcase" style={{ padding: '64px 0 40px', background: 'var(--surface, #f8f9fa)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>

          {/* Bold Header */}
          <div className="farm-header reveal" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2
              className="section-heading"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(32px, 4.5vw, 48px)',
                fontWeight: 900,
                letterSpacing: '2.5px',
                color: '#0f172a',
                lineHeight: 1.15
              }}
            >
              FARM <span style={{ color: 'var(--gold, #b8860b)' }}>LIFE</span>
            </h2>
            <div className="gold-line gold-line-center" style={{ width: '64px', height: '3px', background: 'var(--gold, #b8860b)', margin: '14px auto 0', borderRadius: '2px' }}></div>
          </div>

          {/* Tab Switcher like Farm Life page */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-4 mb-8 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
            {FARM_VIDEOS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveVideoId(v.id)}
                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition cursor-pointer ${activeVideoId === v.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
              >
                {v.title}
              </button>
            ))}
          </div>

          {/* Featured Video Player & Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Video Player */}
              <div className="lg:col-span-2 bg-black flex items-center justify-center aspect-video lg:aspect-auto">
                <video
                  key={activeVideo.src}
                  className="w-full h-full max-h-[500px] object-cover"
                  controls
                  autoPlay
                  muted
                  playsInline
                  loop
                >
                  <source src={activeVideo.src} type="video/mp4" />
                </video>
              </div>

              {/* Video Meta Info */}
              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                    {activeVideo.category}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-3 leading-snug">
                    {activeVideo.title}
                  </h3>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 uppercase tracking-wider">
                    {activeVideo.subtitle}
                  </p>
                  <div className="h-0.5 w-12 bg-amber-500/40 my-4" />
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {activeVideo.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Direct on-site recording</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">1080p HD</span>
                </div>
              </div>
            </div>
          </div>

          {/* All Video Clips Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                All Farm Sections
              </h3>
              <span className="text-xs text-slate-500 font-bold">5 Ground Videos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FARM_VIDEOS.map((v) => (
                <div
                  key={v.id}
                  onClick={() => {
                    setActiveVideoId(v.id);
                  }}
                  className={`group rounded-3xl border overflow-hidden transition cursor-pointer flex flex-col shadow-sm ${activeVideoId === v.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                    }`}
                >
                  <div className="relative aspect-video w-full bg-black overflow-hidden">
                    <video
                      src={v.src}
                      muted
                      playsInline
                      loop
                      preload="metadata"
                      onMouseEnter={(e) => { e.currentTarget.play().catch(() => { }); }}
                      onMouseLeave={(e) => { e.currentTarget.pause(); }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                      {v.category}
                    </span>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-emerald-600 transition">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                        {v.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {v.subtitle}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px', paddingBottom: '16px' }}>
            <Link to="/farmlife" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '16px', backgroundColor: '#ffffff',
              border: '1.5px solid rgba(184,134,11,0.35)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              fontSize: '12px', fontWeight: '800', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--gold, #b8860b)', textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              Explore Farm Life Page
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─ 2b. DIASPORA BLOGS (PROFESSIONAL EDITORIAL LAYOUT) ─ */}
      <section id="blogs-showcase" style={{ padding: '64px 0 76px', background: 'var(--surface, #f8f9fa)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>

          <div className="blogs-header reveal" style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span className="section-label" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold, #b8860b)', display: 'block', marginBottom: '6px' }}>
              Member Stories &amp; Insights
            </span>
            <h2
              className="section-heading"
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 900,
                letterSpacing: '2px',
                color: '#0f172a',
                lineHeight: 1.15
              }}
            >
              DIASPORA <span style={{ color: 'var(--gold, #b8860b)' }}>BLOGS</span>
            </h2>
            <div className="gold-line gold-line-center" style={{ width: '64px', height: '3px', background: 'var(--gold, #b8860b)', margin: '14px auto 0', borderRadius: '2px' }}></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {HOME_BLOGS.map((post) => (
              <article
                key={post.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--card-bg, #ffffff)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.07)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.09)';
                  e.currentTarget.style.borderColor = 'rgba(5, 150, 105, 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)';
                }}
              >
                {/* 16:9 Image */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#0f172a' }}>
                  <img
                    src={post.img}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                    loading="lazy"
                  />
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    fontSize: '10px',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    background: '#059669',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                  }}>
                    {post.category}
                  </span>
                </div>

                {/* Article Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Meta Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                        {post.date}
                      </span>
                      <span>&bull;</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock style={{ width: '13px', height: '13px', color: '#94a3b8' }} />
                        {post.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '14.5px',
                      fontWeight: '800',
                      lineHeight: '1.38',
                      color: 'var(--text-primary, #0f172a)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p style={{
                      margin: '0 0 16px 0',
                      fontSize: '12px',
                      color: 'var(--text-secondary, #475569)',
                      lineHeight: '1.55',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Author Byline & Link */}
                  <div style={{ paddingTop: '14px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e2e8f0' }}
                      />
                      <div style={{ fontSize: '11px', lineHeight: 1.25 }}>
                        <span style={{ fontWeight: 700, color: '#1e293b', display: 'block' }}>{post.author.name}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>{post.author.location}</span>
                      </div>
                    </div>

                    <Link
                      to={post.link}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '800',
                        color: 'var(--gold, #b8860b)',
                        textDecoration: 'none',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'color 0.2s'
                      }}
                    >
                      <span>Read Story</span>
                      <ChevronRight style={{ width: '13px', height: '13px' }} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Link to="/blog" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 28px', borderRadius: '16px', backgroundColor: '#ffffff',
              border: '1.5px solid rgba(184,134,11,0.35)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              fontSize: '12px', fontWeight: '800', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--gold, #b8860b)', textDecoration: 'none',
              transition: 'all 0.2s'
            }}>
              View All Blog Stories
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─ 3. ABOUT US SECTION (LAST SECTION ON HOME) ─ */}
      <section id="about-us-home" style={{ padding: '48px 0 60px', background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span className="section-label" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold, #b8860b)', display: 'block', marginBottom: '6px' }}>
              Leadership &amp; Governance
            </span>
            <h2 className="section-heading" style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: 'clamp(24px, 3.5vw, 34px)', fontWeight: 800, color: '#111827' }}>
              About <span>Us</span>
            </h2>
            <div className="gold-line gold-line-center" style={{ width: '48px', height: '2px', background: 'var(--gold, #b8860b)', margin: '10px auto 0' }}></div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '18px',
            marginBottom: '32px'
          }}>
            {[
              { name: 'Mr. Nyanzi Edrine', role: 'Chairperson', img: '/images/nyanzi_edrine.jpg', bio: 'Executive direction and cooperative governance.' },
              { name: 'Mrs. Miriam Halera', role: 'Treasurer', img: '/images/miriam_halera.jpg', bio: 'Financial stewardship and capital allocation.' },
              { name: 'Ms. Namulindwa Mary Flavia', role: 'Vice Chairperson', img: '/images/namulindwa_mary_flavia.jpg', bio: 'Operational strategy and farm networks.' },
              { name: 'Mr. Halera John Bahati', role: 'Secretary', img: '/images/halera_john_bahati.jpg', bio: 'Institutional records and compliance.' },
              { name: 'Ms. Ssanyu Phiona', role: 'Member Representative', img: '/images/ssanyu_phiona.jpg', bio: 'Diaspora member engagement and community.' },
            ].map((f, i) => (
              <div key={i} className="founder-card" style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid rgba(184,134,11,0.22)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease'
              }}>
                <div style={{
                  width: '100%',
                  height: '230px',
                  background: '#0f172a',
                  overflow: 'hidden',
                  position: 'relative',
                  flexShrink: 0
                }}>
                  <img
                    src={f.img}
                    alt={f.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block', transition: 'transform 0.5s ease' }}
                    decoding="async"
                  />
                </div>
                <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ margin: '0 0 3px', fontFamily: "'Cinzel', serif", fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.25, letterSpacing: '0.02em' }}>
                    {f.name}
                  </h4>
                  <span style={{ display: 'block', fontSize: '9.5px', fontWeight: 700, color: 'var(--gold, #b8860b)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    {f.role}
                  </span>
                  <p style={{ margin: 0, fontSize: '10.5px', color: '#64748b', lineHeight: 1.45 }}>
                    {f.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link to="/about" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '11px 28px',
              borderRadius: '16px',
              border: '1.5px solid rgba(184,134,11,0.35)',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--gold, #b8860b)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}>
              Learn More About Us
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
