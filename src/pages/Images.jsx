import React, { useState } from 'react';

const galleryItems = [
  {
    category: 'farmland',
    img: '/images/hero_slide_1.jpg',
    badge: 'Farmland',
    title: 'Ugandan Dairy Farmland',
    desc: 'Verdant pastures nurtured for optimal dairy cattle nutrition and compound agricultural yield.'
  },
  {
    category: 'farmland',
    img: '/images/hero_slide_2.jpg',
    badge: 'Livestock',
    title: 'Dairy Cattle Herd',
    desc: 'Selected dairy breeds yielding top commercial milk volumes for member dividend growth.'
  },
  {
    category: 'farmland',
    img: '/images/hero_carousel.jpg',
    badge: 'Acreage',
    title: 'Lush Agricultural Acreage',
    desc: 'Strategic farmland locations with year-round rainfall and sustainable irrigation channels.'
  },
  {
    category: 'community',
    img: '/images/card_img_1.jpg',
    badge: 'Mission',
    title: 'Come Home Initiative',
    desc: 'Inviting diaspora Ugandans to invest in their ancestral homeland with full legal protection.'
  },
  {
    category: 'farmland',
    img: '/images/card_img_2.jpg',
    badge: 'Investment',
    title: 'Farmland Capitalization',
    desc: 'Pooling resources to acquire freehold and secure titled farmland across agricultural corridors.'
  },
  {
    category: 'community',
    img: '/images/card_img_3.jpg',
    badge: 'Community',
    title: 'Grow Together Community',
    desc: 'Co-operative strength ensuring every member shares in the seasonal harvests and asset appreciation.'
  },
  {
    category: 'farmland',
    img: '/images/blog_dairy_1.jpg',
    badge: 'Operations',
    title: 'Modern Dairy Operations',
    desc: 'Scientific pasture rotation and modern cold chain storage for superior dairy production.'
  },
  {
    category: 'farmland',
    img: '/images/blog_farmland.jpg',
    badge: 'Agronomy',
    title: 'Soil Fertility & Surveys',
    desc: 'Detailed agronomic testing to certify rich nutrient profiles prior to crop and pasture seeding.'
  },
  {
    category: 'community',
    img: '/images/blog_saving_abroad.jpg',
    badge: 'Finance',
    title: 'Diaspora Wealth Planning',
    desc: 'Structured savings models built for overseas professionals seeking dependable homebound assets.'
  },
  {
    category: 'community',
    img: '/images/trust_bg_1790772762297.jpg',
    badge: 'Governance',
    title: 'Institutional Trust',
    desc: 'Audited accounts and regular member assemblies governing all land acquisitions.'
  },
  {
    category: 'farmland',
    img: '/images/productivity_bg_1790772786489.jpg',
    badge: 'Productivity',
    title: 'High Productivity',
    desc: 'Maximizing yield per acre through efficient mechanized equipment and skilled farm labor.'
  },
  {
    category: 'community',
    img: '/images/legacy_bg_1790772823843.jpg',
    badge: 'Legacy',
    title: 'Generational Legacy',
    desc: 'Passing down solid, tangible land and livestock wealth to the next generation.'
  },
  {
    category: 'members',
    img: '/images/author_grace.jpg',
    badge: 'Leadership',
    title: 'Grace Nakato',
    desc: 'Head of Operations & Member Relations – coordinating farm ground audits and community outreach.'
  },
  {
    category: 'members',
    img: '/images/author_david.jpg',
    badge: 'Diaspora Member',
    title: 'David Mukasa (UK Chapter)',
    desc: 'Active dairy unit investor sharing insights on building passive agricultural cashflow from London.'
  },
  {
    category: 'members',
    img: '/images/author_amara.jpg',
    badge: 'Diaspora Member',
    title: 'Amara Okello (Canada Chapter)',
    desc: 'Diaspora investor investing in sustainable acreage and compound SACCO interest models.'
  }
];

export default function Images() {
  const [filter, setFilter] = useState('all');
  const [activeItem, setActiveItem] = useState(null);

  const filteredItems = filter === 'all'
    ? galleryItems
    : galleryItems.filter((item) => item.category === filter);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      {/* ─ PAGE HERO ─ */}
      <header className="page-hero">
        <span className="page-hero-label">Official Visual Archive</span>
        <h1 className="page-hero-title">FARMLAND &amp; LIVESTOCK <span>GALLERY</span></h1>
        <p className="page-hero-sub">Explore our lush pastures, premium dairy cattle, and the thriving co-operative community built by Ugandans across the globe.</p>
      </header>

      {/* ─ FILTER CONTROLS ─ */}
      <div className="gallery-filter-wrap">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Photos
        </button>
        <button
          className={`filter-btn ${filter === 'farmland' ? 'active' : ''}`}
          onClick={() => setFilter('farmland')}
        >
          Farmland &amp; Livestock
        </button>
        <button
          className={`filter-btn ${filter === 'community' ? 'active' : ''}`}
          onClick={() => setFilter('community')}
        >
          Community &amp; Values
        </button>
        <button
          className={`filter-btn ${filter === 'members' ? 'active' : ''}`}
          onClick={() => setFilter('members')}
        >
          Members &amp; Leaders
        </button>
      </div>

      {/* ─ GALLERY GRID ─ */}
      <main className="gallery-grid" id="gallery-grid">
        {filteredItems.map((item, idx) => (
          <article
            key={idx}
            className="gallery-item"
            onClick={() => setActiveItem(item)}
            style={{ cursor: 'pointer' }}
          >
            <div className="gallery-img-wrap">
              <img src={item.img} alt={item.title} loading="lazy" />
              <span className="gallery-badge">{item.badge}</span>
            </div>
            <div className="gallery-caption-wrap">
              <h2 className="gallery-title">{item.title}</h2>
              <p className="gallery-desc">{item.desc}</p>
            </div>
          </article>
        ))}
      </main>

      {/* ─ LIGHTBOX MODAL ─ */}
      {activeItem && (
        <div className="lightbox-modal active" onClick={() => setActiveItem(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setActiveItem(null)}>&times;</button>
            <img src={activeItem.img} alt={activeItem.title} className="lightbox-img" />
            <div className="lightbox-meta">
              <h3 className="lightbox-title">{activeItem.title}</h3>
              <p className="lightbox-desc">{activeItem.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

