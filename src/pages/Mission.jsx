import React from 'react';

export default function Mission() {
  return (
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      {/* ─ PAGE HERO ─ */}
      <header className="page-hero">
        <span className="page-hero-label">Purpose &amp; Co-operative Vision</span>
        <h1 className="page-hero-title">OUR <span>MISSION</span></h1>
        <p className="page-hero-sub">&ldquo;To create a trusted financial community where every member can save with purpose, access opportunities, invest in agriculture and build a more secure future.&rdquo;</p>
      </header>

      <main className="mission-page-content">
        {/* Pillar 1: Come Home */}
        <section className="pillar-row">
          <div className="pillar-img-wrap">
            <img src="/images/card_img_1.jpg" alt="Come Home to Uganda – Diaspora Connect" loading="lazy" />
          </div>
          <div className="pillar-text">
            <span className="pillar-tag">Pillar 01</span>
            <h2 className="pillar-title">COME HOME.</h2>
            <p className="pillar-desc">
              For years, Ugandans living abroad have sent hard-earned remittances home with the aspiration of acquiring property or launching businesses, only to face fragmented informal arrangements, inflated pricing, or unfulfilled promises.
            </p>
            <ul className="pillar-list">
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Direct connection back to your roots with legal transparency.
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Dedicated diaspora member representatives in the UK, North America &amp; Middle East.
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Structured farm visits and live regular digital reporting for overseas members.
              </li>
            </ul>
          </div>
        </section>

        {/* Pillar 2: Invest */}
        <section className="pillar-row reverse">
          <div className="pillar-img-wrap">
            <img src="/images/card_img_2.jpg" alt="Invest in Uganda Farmland – Diaspora Connect" loading="lazy" />
          </div>
          <div className="pillar-text">
            <span className="pillar-tag">Pillar 02</span>
            <h2 className="pillar-title">INVEST.</h2>
            <p className="pillar-desc">
              Uganda possesses some of Africa's most fertile arable land, high-altitude pastures, and equatorial double-rainfall seasons. Through Diaspora Connect Farmers SACCO, your capital is channeled directly into real commercial farmland and certified dairy herds.
            </p>
            <ul className="pillar-list">
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                High-yielding dairy cattle breeds managed by seasoned veterinarians.
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Secured freehold land titling held collectively in trust for members.
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Consistent commercial milk off-taker agreements creating cash dividends.
              </li>
            </ul>
          </div>
        </section>

        {/* Pillar 3: Grow Together */}
        <section className="pillar-row">
          <div className="pillar-img-wrap">
            <img src="/images/card_img_3.jpg" alt="Grow Together Co-operative Community – Diaspora Connect" loading="lazy" />
          </div>
          <div className="pillar-text">
            <span className="pillar-tag">Pillar 03</span>
            <h2 className="pillar-title">GROW TOGETHER.</h2>
            <p className="pillar-desc">
              Individual agricultural ventures are vulnerable to isolated shocks. By pooling savings within a registered, member-owned co-operative, our community achieves massive economies of scale — negotiating wholesale feed, bulk veterinary supplies, and industrial processing machinery.
            </p>
            <ul className="pillar-list">
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Compounded savings interest credited directly to your SACCO ledger.
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Democratic member voting on major capital acquisitions and annual surplus dividends.
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Generational inheritance rights protecting your family's future.
              </li>
            </ul>
          </div>
        </section>

        {/* Co-operative Governance Framework */}
        <section className="framework-box">
          <h2>OUR CO-OPERATIVE <span>FRAMEWORK</span></h2>
          <p className="intro">Operated under strict statutory co-operative guidelines, audited by certified public accountants, and governed by members for members.</p>
          <div className="framework-grid">
            <div className="framework-card">
              <h3>Democratic Control</h3>
              <p>Every member holds an equal voice in our Annual General Meeting, voting on key governance matters and board elections.</p>
            </div>
            <div className="framework-card">
              <h3>Asset Titling Security</h3>
              <p>Farmland is legally titled, surveyed, and deeded to the SACCO trust to eliminate title conflicts or unverified transactions.</p>
            </div>
            <div className="framework-card">
              <h3>Financial Auditing</h3>
              <p>Annual external audits, quarterly financial disclosures, and real-time ledger accounting visible to overseas members.</p>
            </div>
            <div className="framework-card">
              <h3>Community Development</h3>
              <p>Beyond profits, our farms employ local youth, advance modern livestock genetics, and foster rural Ugandan agro-industrialisation.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

