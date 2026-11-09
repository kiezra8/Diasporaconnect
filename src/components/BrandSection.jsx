import React from 'react';

export default function BrandSection() {
  return (
    <>
      <section id="brand">
        <div className="brand-radial"></div>
        <div className="brand-inner">
          <div className="brand-logo-ring">
            <img
              className="brand-logo-img"
              src="/images/logo.jpg"
              alt="Diaspora Connect Farmers SACCO – Uganda's Premier Agricultural SACCO"
              width="188"
              height="188"
            />
          </div>
          <div>
            <h2 className="brand-name">
              DIASPORA<span className="connect">CONNECT</span>
            </h2>
            <span className="brand-sacco">&mdash; Farmers SACCO &mdash;</span>
          </div>
          <div className="brand-divider"></div>
          <p className="brand-tagline">
            <span className="highlight">Come Home.</span>&nbsp; Invest.&nbsp; Grow Together.
          </p>
        </div>
      </section>

      {/* ══ SEO ENTITY BLOCK – crawled by Google, visually hidden ══ */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        <h2>Diaspora Connect Farmers SACCO</h2>
        <p>
          Diaspora Connect is a Farmers SACCO based in Uganda, serving the diaspora community worldwide. Also referred to as
          Diaspora Connect Farmers SACCO Uganda, DC Farmers SACCO, Diaspora Connect SACCO, and Diaspora Connect Uganda.
        </p>
        <p>
          Diaspora Connect Farmers SACCO offers diaspora Ugandans the opportunity to invest in productive dairy farmland,
          participate in collective agricultural savings, and build generational wealth through a trusted cooperative model.
        </p>
        <p>
          Search queries: "diaspora connect", "diaspora connect farmers", "diaspora connect farmers sacco", "diaspora connect sacco
          uganda", "diaspora connect uganda farmers sacco", "dc farmers sacco uganda", "diaspora connect dairy farming".
        </p>
        <address>
          <span itemProp="name">Diaspora Connect Farmers SACCO</span><br />
          <span itemProp="addressCountry">Uganda</span><br />
          <a itemProp="telephone" href="tel:+256747325565">+256 747 325 565</a><br />
          <a itemProp="url" href="https://diasporaconnectt.com/">https://diasporaconnectt.com/</a>
        </address>
      </div>
    </>
  );
}

