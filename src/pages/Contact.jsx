import React, { useState } from 'react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    interest: 'dairy',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      country: '',
      interest: 'dairy',
      message: ''
    });
  };

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      {/* ─ PAGE HEADER ─ */}
      <header className="page-header-clean">
        <span className="page-header-badge">We Are Here For You</span>
        <h1 className="page-header-title">CONNECT WITH <span>OUR TEAM</span></h1>
        <p className="page-header-sub">Whether you are in London, Toronto, Dubai, or Kampala — our member liaison officers are ready to answer your questions and guide your membership.</p>
        <div className="page-header-divider" aria-hidden="true"></div>
      </header>

      <main className="contact-container">
        <div className="contact-layout">

          {/* Contact Info Cards */}
          <div className="contact-info-panel">

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              </div>
              <div className="info-text">
                <h3>WhatsApp Support</h3>
                <p>Instant chat with our diaspora member desk.</p>
                <a href="https://wa.me/256747325565" target="_blank" rel="noopener noreferrer">+256 747 325 565</a>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </div>
              <div className="info-text">
                <h3>Direct Telephone</h3>
                <p>Available Mon &ndash; Sat, 8:00 AM &ndash; 6:00 PM EAT.</p>
                <a href="tel:+256747325565">+256 747 325 565</a>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </div>
              <div className="info-text">
                <h3>Official Email</h3>
                <p>Member relations, audits, and formal correspondence.</p>
                <a href="mailto:info@diasporaconnectt.com">info@diasporaconnectt.com</a>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </div>
              <div className="info-text">
                <h3>Headquarters &amp; Farmlands</h3>
                <p>Kampala, Uganda &amp; Farmland sites across Central &amp; Western Uganda.</p>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Farm visits by appointment</span>
              </div>
            </div>

          </div>

          {/* Inquiry Form */}
          <div className="contact-form-panel">
            <h2 className="form-heading">MEMBERSHIP INQUIRY</h2>
            <p className="form-sub">Fill out the quick form below. A SACCO officer will get back to you with our member prospectus.</p>

            <form id="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="full-name">Full Name</label>
                <input
                  type="text"
                  id="full-name"
                  className="form-control"
                  placeholder="e.g. Samuel Kigozi"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="samuel@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone / WhatsApp (with Country Code)</label>
                <input
                  type="tel"
                  id="phone"
                  className="form-control"
                  placeholder="+44 7123 456789"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="country">Current Country of Residence</label>
                <input
                  type="text"
                  id="country"
                  className="form-control"
                  placeholder="e.g. United Kingdom, USA, Canada, UAE"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="interest">Area of Primary Interest</label>
                <select
                  id="interest"
                  className="form-control"
                  required
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                >
                  <option value="dairy">Dairy Farm Investment Units</option>
                  <option value="farmland">Farmland Acquisition &amp; Titration</option>
                  <option value="savings">Monthly Co-operative Savings</option>
                  <option value="tour">Booking a Farm Tour Visit</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="message">Message or Questions</label>
                <textarea
                  id="message"
                  rows="3"
                  className="form-control"
                  placeholder="Tell us how you would like to participate..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
              </div>

              <button type="submit" className="form-submit-btn">Submit Inquiry</button>

              {submitted && (
                <div className="form-success-note" id="form-success" style={{ display: 'block' }}>
                  Thank you! Your inquiry has been received. Our liaison team will contact you shortly via WhatsApp and Email.
                </div>
              )}
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
