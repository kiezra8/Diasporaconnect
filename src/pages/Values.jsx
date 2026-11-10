import React from 'react';

export default function Values() {
  return (
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      {/* ─ PAGE HEADER ─ */}
      <header className="page-header-clean">
        <span className="page-header-badge">Guiding Principles</span>
        <h1 className="page-header-title">OUR CORE <span>VALUES</span></h1>
        <p className="page-header-sub">The bedrock of Diaspora Connect Farmers SACCO. Six unwavering pillars ensuring security, transparency, and sustainable prosperity for every member.</p>
        <div className="page-header-divider" aria-hidden="true"></div>
      </header>

      <main className="values-page-content">
        <div className="values-full-grid">

          {/* Value 1: Trust */}
          <article className="value-full-card">
            <div className="value-full-img">
              <img src="/images/trust_bg_1790772762297.jpg" alt="Trust – Diaspora Connect Farmers SACCO" width="540" height="340" decoding="async" />
              <span className="value-full-num">Value 01</span>
            </div>
            <div className="value-full-body">
              <h2 className="value-full-title">TRUST</h2>
              <p className="value-full-desc">
                Trust is our most precious asset. In an environment where diaspora investors have frequently suffered from
                broken promises, we operate with open-book ledger accounting, certified title audits, and regular virtual
                townhalls.
              </p>
              <div className="value-full-point">
                &ldquo;Total institutional transparency in every shilling pooled and invested.&rdquo;
              </div>
            </div>
          </article>

          {/* Value 2: Teamwork */}
          <article className="value-full-card">
            <div className="value-full-img">
              <img src="/images/teamwork_bg_1790772717521.jpg" alt="Teamwork – Diaspora Connect Farmers SACCO" width="540" height="340" decoding="async" />
              <span className="value-full-num">Value 02</span>
            </div>
            <div className="value-full-body">
              <h2 className="value-full-title">TEAMWORK</h2>
              <p className="value-full-desc">
                Alone, an overseas individual investor faces substantial friction. Together, hundreds of diaspora
                professionals negotiate preferred land acquisitions, commercial silage processing, and industrial milk
                chilling facilities.
              </p>
              <div className="value-full-point">
                &ldquo;Uniting global resources to achieve domestic agricultural scale.&rdquo;
              </div>
            </div>
          </article>

          {/* Value 3: Empowerment */}
          <article className="value-full-card">
            <div className="value-full-img">
              <img src="/images/empowerment_bg_1790772773271.jpg" alt="Empowerment – Diaspora Connect Farmers SACCO" width="540" height="340" decoding="async" />
              <span className="value-full-num">Value 03</span>
            </div>
            <div className="value-full-body">
              <h2 className="value-full-title">EMPOWERMENT</h2>
              <p className="value-full-desc">
                Empowering our members means providing true asset ownership — not speculative paper, but deeded acreage and
                productive dairy cattle generating recurring cash flow for families at home and abroad.
              </p>
              <div className="value-full-point">
                &ldquo;Transforming overseas income into sovereign domestic wealth.&rdquo;
              </div>
            </div>
          </article>

          {/* Value 4: Productivity */}
          <article className="value-full-card">
            <div className="value-full-img">
              <img src="/images/productivity_bg_1790772786489.jpg" alt="Productivity – Diaspora Connect Farmers SACCO" width="540" height="340" decoding="async" />
              <span className="value-full-num">Value 04</span>
            </div>
            <div className="value-full-body">
              <h2 className="value-full-title">PRODUCTIVITY</h2>
              <p className="value-full-desc">
                We combine modern agronomic science, high-yielding dairy genetics (Friesian &amp; Jersey crosses), and
                precision pasture rotation to optimize liters of milk and crop tonnage per hectare.
              </p>
              <div className="value-full-point">
                &ldquo;Maximizing return per acre through scientific farm management.&rdquo;
              </div>
            </div>
          </article>

          {/* Value 5: Integrity */}
          <article className="value-full-card">
            <div className="value-full-img">
              <img src="/images/integrity_bg_1790776028154.jpg" alt="Integrity – Diaspora Connect Farmers SACCO" width="540" height="340" decoding="async" />
              <span className="value-full-num">Value 05</span>
            </div>
            <div className="value-full-body">
              <h2 className="value-full-title">INTEGRITY</h2>
              <p className="value-full-desc">
                We adhere strictly to Ugandan co-operative laws, statutory filing requirements, and international fiduciary
                standards. When we commit to a timeline or distribution, we deliver without exception.
              </p>
              <div className="value-full-point">
                &ldquo;Ethical stewardship rooted in accountability and legal compliance.&rdquo;
              </div>
            </div>
          </article>

          {/* Value 6: Legacy */}
          <article className="value-full-card">
            <div className="value-full-img">
              <img src="/images/legacy_bg_1790772823843.jpg" alt="Legacy – Diaspora Connect Farmers SACCO" width="540" height="340" decoding="async" />
              <span className="value-full-num">Value 06</span>
            </div>
            <div className="value-full-body">
              <h2 className="value-full-title">LEGACY</h2>
              <p className="value-full-desc">
                True prosperity outlasts a single career. Our farms and co-operative shares are permanent, inheritable
                generational assets designed to anchor your children and grandchildren to fruitful Ugandan land.
              </p>
              <div className="value-full-point">
                &ldquo;Building enduring wealth that outlives generations.&rdquo;
              </div>
            </div>
          </article>

        </div>
      </main>
    </div>
  );
}
