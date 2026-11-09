import React from 'react';
import { Link } from 'react-router-dom';

export default function Blog() {
  return (
    <div style={{ backgroundColor: '#ffffff', color: '#334155' }}>
      {/* BLOG HERO */}
      <section className="blog-hero">
        <Link to="/" className="back-btn">
          <svg viewBox="0 0 24 24">
            <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z" />
          </svg>
          Back Home
        </Link>
        <span className="blog-hero-label">Member Stories</span>
        <h1 className="blog-hero-title">Diaspora <span>Blogs</span></h1>
        <p className="blog-hero-sub">Inspiring stories from members across the globe — their journeys, investments, and visions for home.</p>
      </section>

      {/* FULL ARTICLES */}
      <section className="blog-articles-section">
        <div className="blog-articles-inner">

          {/* SPOTLIGHT ARTICLE (DAIRY FARMING) */}
          <article className="blog-full-article" id="article-spotlight">
            <div className="blog-full-img">
              <img src="/images/blog_dairy_1.jpg?v=3.5" alt="The White Gold Revolution - Dairy Farming" loading="lazy" />
            </div>
            <div className="blog-full-text">
              <span className="blog-full-date">September 28, 2026</span>
              <span className="blog-full-category">Dairy &middot; Modern Agriculture</span>
              <h2 className="blog-full-title">The White Gold Revolution: How Diaspora Capital is Modernising Dairy Farming in Uganda</h2>
              <p className="blog-full-excerpt">&ldquo;From automated milking parlours to cold-chain preservation, SACCO members are pooling funds to transform Uganda's milk belt into a high-yield dairy powerhouse.&rdquo;</p>
              <div className="blog-full-author">
                <img src="/images/author_amara.jpg" alt="Editorial Team" />
                <div className="blog-full-author-info">
                  <span className="blog-full-author-name">Diaspora Connect Dairy Desk</span>
                  <span className="blog-full-author-meta">Mbarara, Uganda &middot; Special Report</span>
                </div>
              </div>
              <div className="blog-full-body">
                <p>Across Uganda's south-western cattle corridor, a profound shift is taking place. Traditional free-range pastoralism is giving way to high-efficiency zero-grazing paddocks and crossbred dairy herds. By combining hardy local Ankole cattle with pedigree Friesian and Ayrshire genetics, milk yields per cow have skyrocketed from 5 litres to over 22 litres daily.</p>
                <p>Diaspora Connect Farmers SACCO members are leading this transition. Rather than navigating the hurdles of distant farm hands alone, diaspora members pool their savings into joint veterinary oversight, automated milking clusters, and bulk animal nutrition contracts.</p>
                <p>The resulting dairy yields feed directly into contracted pasteurisation hubs across Kampala and export processing centres. Members earn predictable monthly returns backed by real, thriving livestock assets on Ugandan soil.</p>
              </div>
            </div>
          </article>

          {/* ARTICLE 1 (AMARA NAKATO) */}
          <article className="blog-full-article reverse" id="article-1">
            <div className="blog-full-img">
              <img src="/images/blog_dairy_1.jpg?v=3.5" alt="Investing in Dairy Cattle from London" loading="lazy" />
            </div>
            <div className="blog-full-text">
              <span className="blog-full-date">September 24, 2026</span>
              <span className="blog-full-category">Dairy Cattle &middot; Passive Income</span>
              <h2 className="blog-full-title">Investing in Dairy Cattle from London: Consistent Monthly Milk Yields</h2>
              <p className="blog-full-excerpt">&ldquo;I co-own a herd of 15 Friesian-cross heifers in Kiruhura through the SACCO. The daily milk collection provides dependable quarterly dividends without the stress of remote management.&rdquo;</p>
              <div className="blog-full-author">
                <img src="/images/author_amara.jpg" alt="Amara Nakato" />
                <div className="blog-full-author-info">
                  <span className="blog-full-author-name">Amara Nakato</span>
                  <span className="blog-full-author-meta">London, UK &middot; SACCO Founding Member</span>
                </div>
              </div>
              <div className="blog-full-body">
                <p>For years while living in London, sending money back home felt like a leaky bucket. When I tried to fund a small family farm remotely, costs kept escalating with minimal milk sales to show for it. Joining Diaspora Connect Farmers SACCO was the breakthrough I needed.</p>
                <p>Through our dedicated dairy cluster, every cow is ear-tagged, vaccinated on strict schedules, and milk output is logged into an online member ledger each morning. My 15 heifers are cared for by full-time resident agronomists and veterinary professionals.</p>
                <p>Now, every liter of morning and evening milk goes directly into the cooling tank and generates consistent income. For the first time since relocating to the UK, I feel complete peace of mind about my investments back home.</p>
              </div>
            </div>
          </article>

          {/* ARTICLE 2 (DAVID OCHIENG) */}
          <article className="blog-full-article" id="article-2">
            <div className="blog-full-img">
              <img src="/images/blog_farmland.jpg?v=3.5" alt="Cold-Chain Milk Storage" loading="lazy" />
            </div>
            <div className="blog-full-text">
              <span className="blog-full-date">September 14, 2026</span>
              <span className="blog-full-category">Dairy Logistics &middot; Value Addition</span>
              <h2 className="blog-full-title">Cold-Chain Milk Storage: Solving the Dairy Distribution Puzzle</h2>
              <p className="blog-full-excerpt">&ldquo;Our cooperative investment in solar-powered milk chillers cut spoilage to zero across three collection centres, compounding member returns significantly.&rdquo;</p>
              <div className="blog-full-author">
                <img src="/images/author_david.jpg" alt="David Ochieng" />
                <div className="blog-full-author-info">
                  <span className="blog-full-author-name">David Ochieng</span>
                  <span className="blog-full-author-meta">Toronto, Canada &middot; SACCO Diaspora Representative</span>
                </div>
              </div>
              <div className="blog-full-body">
                <p>Working in corporate financial logistics in Toronto taught me that in agriculture, margin is won or lost post-harvest. In Uganda's dairy sector, temperature control is everything. Without immediate chilling, fresh morning milk loses quality before it reaches urban markets.</p>
                <p>That is why our SACCO prioritised capital expenditure into solar-hybrid bulk chillers. Installed at strategic collection depots in Mbarara and Luwero, these chillers bring freshly milked yields down to 4&deg;C within two hours.</p>
                <p>This single intervention eliminated spoilage completely and secured premium long-term off-take contracts with national dairy processors. The financial return is steady, ethical, and built to last.</p>
              </div>
            </div>
          </article>

          {/* ARTICLE 3 (GRACE ASIIMWE) */}
          <article className="blog-full-article reverse" id="article-3">
            <div className="blog-full-img">
              <img src="/images/card_img_1.jpg?v=3.5" alt="Silage and Pasture Management" loading="lazy" />
            </div>
            <div className="blog-full-text">
              <span className="blog-full-date">August 28, 2026</span>
              <span className="blog-full-category">Livestock Feed &middot; Sustainability</span>
              <h2 className="blog-full-title">Silage &amp; Pasture Management: Sustaining Milk Production Year-Round</h2>
              <p className="blog-full-excerpt">&ldquo;During dry spells when milk prices surge, our SACCO-backed silage banks ensure uninterrupted milk yield. It's smart, resilient dairy agriculture built on shared trust.&rdquo;</p>
              <div className="blog-full-author">
                <img src="/images/author_grace.jpg" alt="Grace Asiimwe" />
                <div className="blog-full-author-info">
                  <span className="blog-full-author-name">Grace Asiimwe</span>
                  <span className="blog-full-author-meta">Stockholm, Sweden &middot; SACCO Active Investor</span>
                </div>
              </div>
              <div className="blog-full-body">
                <p>Living in Sweden, I saw how Scandinavian farms prepare for harsh winters with scientific feed conservation. In Uganda, the challenge isn't snow — it's the seasonal dry spells when pasture dries out and ordinary dairy herds experience sharp drops in output.</p>
                <p>At Diaspora Connect Farmers SACCO, we solve this through systematic fodder banks. We harvest Napier grass, forage sorghum, and legume hay during peak rains, packing them into high-nutrition anaerobic silage pits.</p>
                <p>When the dry months arrive and local milk supplies drop, our herds maintain full milk production. We sell into a high-demand market at peak prices, converting climate resilience into higher dividend payouts for our members.</p>
              </div>
            </div>
          </article>

          {/* ARTICLE 4 (JOSEPH MUGISHA) */}
          <article className="blog-full-article" id="article-4">
            <div className="blog-full-img">
              <img src="/images/card_img_3.jpg?v=3.5" alt="Building Generational Dairy Assets" loading="lazy" />
            </div>
            <div className="blog-full-text">
              <span className="blog-full-date">August 15, 2026</span>
              <span className="blog-full-category">Generational Wealth &middot; Dairy</span>
              <h2 className="blog-full-title">Building Generational Dairy Assets: From Calves to Milk Cooperatives</h2>
              <p className="blog-full-excerpt">&ldquo;A pedigree dairy cow multiplies in asset value each season. By reinvesting our milk earnings into dairy expansion, we are building enduring family security back home.&rdquo;</p>
              <div className="blog-full-author">
                <img src="/images/author_joseph.jpg" alt="Joseph Mugisha" />
                <div className="blog-full-author-info">
                  <span className="blog-full-author-name">Joseph Mugisha</span>
                  <span className="blog-full-author-meta">Dubai, UAE &middot; SACCO Agricultural Partner</span>
                </div>
              </div>
              <div className="blog-full-body">
                <p>In traditional Ugandan heritage, cattle were always the ultimate foundation of wealth. But modern dairy farming turns that traditional wisdom into high-performing commercial assets. Unlike depreciating vehicles or stalled construction sites, dairy cows compound biologically.</p>
                <p>Working here in Dubai, every monthly payment I make into the SACCO purchases equity in our cooperative herds. Each breeding season brings new calves that expand the capital base, while daily milk sales generate cash flow.</p>
                <p>I know that whatever happens in the global economy, my family has real, thriving herds grazing on Ugandan pastures. That is true financial freedom, anchored in our own soil.</p>
              </div>
            </div>
          </article>

        </div>
      </section>
    </div>
  );
}

