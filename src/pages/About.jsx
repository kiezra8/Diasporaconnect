import React from 'react';

export default function About() {
  return (
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      {/* ─ PAGE HEADER ─ */}
      <header className="page-header-clean">
        <span className="page-header-badge">Leadership &amp; Governance</span>
        <h1 className="page-header-title">ABOUT <span>DIASPORA CONNECT</span></h1>
        <div className="page-header-divider" aria-hidden="true"></div>
      </header>

      <main className="about-content-wrap">
        {/* 1. BOARD MEMBERS & FOUNDERS SECTION (FIRST) */}
        <section className="founders-section" style={{ marginBottom: '48px' }}>
          <div className="founders-header">
            <h2>BOARD MEMBERS &amp; <span>FOUNDING LEADERSHIP</span></h2>
            <p>The visionary board and founding leadership team guiding Diaspora Connect Farmers SACCO.</p>
          </div>

          <div className="founders-grid">
            {/* Founder 1: Chairperson */}
            <article className="founder-card">
              <div className="founder-img-wrap">
                <img
                  src="/images/nyanzi_edrine.jpg"
                  alt="Mr. Nyanzi Edrine – Chairperson"
                  width="300"
                  height="300"
                  decoding="async"
                  style={{ objectFit: 'cover', objectPosition: 'top center', width: '100%', height: '100%' }}
                />
              </div>
              <div className="founder-info">
                <h3 className="founder-name">Mr. Nyanzi Edrine</h3>
                <span className="founder-role">Chairperson</span>
                <p className="founder-bio">Visionary leader providing executive direction, strategic oversight, and cooperative governance for the SACCO.</p>
              </div>
            </article>

            {/* Founder 2: Treasurer */}
            <article className="founder-card">
              <div className="founder-img-wrap">
                <img
                  src="/images/miriam_halera.jpg"
                  alt="Mrs. Miriam Halera – Treasurer"
                  width="300"
                  height="300"
                  decoding="async"
                  style={{ objectFit: 'cover', objectPosition: 'top center', width: '100%', height: '100%' }}
                />
              </div>
              <div className="founder-info">
                <h3 className="founder-name">Mrs. Miriam Halera</h3>
                <span className="founder-role">Treasurer</span>
                <p className="founder-bio">Managing financial stewardship, capital allocation, member dividend distribution, and statutory audits.</p>
              </div>
            </article>

            {/* Founder 3: Vice Chairperson */}
            <article className="founder-card">
              <div className="founder-img-wrap">
                <img
                  src="/images/namulindwa_mary_flavia.jpg"
                  alt="Ms. Namulindwa Mary Flavia – Vice Chairperson"
                  width="300"
                  height="300"
                  decoding="async"
                  style={{ objectFit: 'cover', objectPosition: 'top center', width: '100%', height: '100%' }}
                />
              </div>
              <div className="founder-info">
                <h3 className="founder-name">Ms. Namulindwa Mary Flavia</h3>
                <span className="founder-role">Vice Chairperson</span>
                <p className="founder-bio">Leading operational strategy, member alignment, and agricultural development initiatives across our farm networks.</p>
              </div>
            </article>

            {/* Founder 4: Secretary */}
            <article className="founder-card">
              <div className="founder-img-wrap">
                <img
                  src="/images/halera_john_bahati.jpg"
                  alt="Mr. Halera John Bahati – Secretary"
                  width="300"
                  height="300"
                  decoding="async"
                  style={{ objectFit: 'cover', objectPosition: 'top center', width: '100%', height: '100%' }}
                />
              </div>
              <div className="founder-info">
                <h3 className="founder-name">Mr. Halera John Bahati</h3>
                <span className="founder-role">Secretary</span>
                <p className="founder-bio">Directing institutional records, statutory compliance, board resolutions, and member correspondence.</p>
              </div>
            </article>

            {/* Founder 5: Member Representative */}
            <article className="founder-card">
              <div className="founder-img-wrap">
                <img
                  src="/images/ssanyu_phiona.jpg"
                  alt="Ms. Ssanyu Phiona – Member Representative"
                  width="300"
                  height="300"
                  decoding="async"
                  style={{ objectFit: 'cover', objectPosition: 'top center', width: '100%', height: '100%' }}
                />
              </div>
              <div className="founder-info">
                <h3 className="founder-name">Ms. Ssanyu Phiona</h3>
                <span className="founder-role">Member Representative</span>
                <p className="founder-bio">Championing diaspora member interests, community engagement, and ensuring every member voice is heard.</p>
              </div>
            </article>
          </div>
        </section>

        {/* 2. OVERVIEW & PURPOSE EXPLANATION SECTION (LATER) */}
        <section className="about-intro-grid" style={{ paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <div className="about-intro-text">
            <h2>Building Uganda&rsquo;s Agricultural Future Together</h2>
            <p>
              Diaspora Connect Farmers SACCO was established by Ugandan professionals living across the United Kingdom, North America, the Middle East, and Uganda who recognized a historic gap: diaspora remittances were sustaining families, but failing to build lasting sovereign wealth.
            </p>
            <p>
              By uniting under a legally registered Savings and Credit Co-operative (SACCO), our members pool monthly capital into commercial dairy farmland, high-yielding cattle herds, and modern agro-processing infrastructure across Uganda&rsquo;s most fertile agricultural corridors.
            </p>
            <p>
              Every member is a direct co-owner with equal voting rights, audited financial transparency, and titled freehold land security.
            </p>
          </div>

          <div className="about-card-badge">
            <div className="badge-item">
              <div className="badge-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>
              <div className="badge-desc">
                <h3>Statutory Co-operative</h3>
                <p>Fully compliant with the Co-operative Societies Act of Uganda.</p>
              </div>
            </div>
            <div className="badge-item">
              <div className="badge-icon">
                <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
              </div>
              <div className="badge-desc">
                <h3>Titled Farmland In Trust</h3>
                <p>All land is deeded freehold in trust for SACCO shareholders.</p>
              </div>
            </div>
            <div className="badge-item">
              <div className="badge-icon">
                <svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
              </div>
              <div className="badge-desc">
                <h3>Compound Dividends</h3>
                <p>Annual surplus dividends and regular commercial dairy milk yields.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
