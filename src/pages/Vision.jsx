import React, { useEffect } from 'react';

export default function Vision() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  return (
    <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <section id="vision">
        <div className="vision-orb vision-orb-1"></div>
        <div className="vision-orb vision-orb-2"></div>

        <div className="vision-header reveal">
          <span className="section-label">Where We Are Headed</span>
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
      </section>
    </main>
  );
}
