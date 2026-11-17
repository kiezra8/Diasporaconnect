import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, User, ChevronRight, X, ArrowUpRight, Share2 } from 'lucide-react';

const ARTICLES = [
  {
    id: 'spotlight',
    title: 'The White Gold Revolution: How Diaspora Capital is Modernising Dairy Farming in Uganda',
    category: 'Dairy Farming',
    readTime: '6 min read',
    date: 'Sep 28, 2026',
    thumbnail: '/images/blog_dairy_1.jpg?v=3.5',
    author: {
      name: 'Editorial Dairy Desk',
      location: 'Mbarara, Uganda',
      avatar: '/images/author_amara.jpg'
    },
    excerpt: 'From automated milking parlours to cold-chain preservation, SACCO members are pooling funds to transform Uganda’s milk belt into a high-yield dairy powerhouse.',
    body: [
      'Across Uganda’s south-western cattle corridor, a profound shift is taking place. Traditional free-range pastoralism is giving way to high-efficiency zero-grazing paddocks and crossbred dairy herds. By combining hardy local Ankole cattle with pedigree Friesian and Ayrshire genetics, milk yields per cow have skyrocketed from 5 litres to over 22 litres daily.',
      'Diaspora Connect Farmers SACCO members are leading this transition. Rather than navigating the hurdles of distant farm hands alone, diaspora members pool their savings into joint veterinary oversight, automated milking clusters, and bulk animal nutrition contracts.',
      'The resulting dairy yields feed directly into contracted pasteurisation hubs across Kampala and export processing centres. Members earn predictable monthly returns backed by real, thriving livestock assets on Ugandan soil.'
    ]
  },
  {
    id: 'art1',
    title: 'Investing in Dairy Cattle from London: Consistent Monthly Milk Yields',
    category: 'Livestock Investment',
    readTime: '4 min read',
    date: 'Sep 24, 2026',
    thumbnail: '/images/blog_dairy_1.jpg?v=3.5',
    author: {
      name: 'Amara Nakato',
      location: 'London, UK',
      avatar: '/images/author_amara.jpg'
    },
    excerpt: 'I co-own a herd of 15 Friesian-cross heifers in Kiruhura through the SACCO. The daily milk collection provides dependable quarterly dividends without the stress of remote management.',
    body: [
      'For years while living in London, sending money back home felt like a leaky bucket. When I tried to fund a small family farm remotely, costs kept escalating with minimal milk sales to show for it. Joining Diaspora Connect Farmers SACCO was the breakthrough I needed.',
      'Through our dedicated dairy cluster, every cow is ear-tagged, vaccinated on strict schedules, and milk output is logged into an online member ledger each morning. My 15 heifers are cared for by full-time resident agronomists and veterinary professionals.',
      'Now, every liter of morning and evening milk goes directly into the cooling tank and generates consistent income. For the first time since relocating to the UK, I feel complete peace of mind about my investments back home.'
    ]
  },
  {
    id: 'art2',
    title: 'Cold-Chain Milk Storage: Solving the Dairy Distribution Puzzle',
    category: 'Value Addition',
    readTime: '5 min read',
    date: 'Sep 14, 2026',
    thumbnail: '/images/blog_farmland.jpg?v=3.5',
    author: {
      name: 'David Ochieng',
      location: 'Toronto, Canada',
      avatar: '/images/author_david.jpg'
    },
    excerpt: 'Our cooperative investment in solar-powered milk chillers cut spoilage to zero across three collection centres, compounding member returns significantly.',
    body: [
      'Working in corporate financial logistics in Toronto taught me that in agriculture, margin is won or lost post-harvest. In Uganda’s dairy sector, temperature control is everything. Without immediate chilling, fresh morning milk loses quality before it reaches urban markets.',
      'That is why our SACCO prioritised capital expenditure into solar-hybrid bulk chillers. Installed at strategic collection depots in Mbarara and Luwero, these chillers bring freshly milked yields down to 4°C within two hours.',
      'This single intervention eliminated spoilage completely and secured premium long-term off-take contracts with national dairy processors. The financial return is steady, ethical, and built to last.'
    ]
  },
  {
    id: 'art3',
    title: 'Silage & Pasture Management: Sustaining Milk Production Year-Round',
    category: 'Agronomy & Feed',
    readTime: '4 min read',
    date: 'Aug 28, 2026',
    thumbnail: '/images/card_img_1.jpg?v=3.2',
    author: {
      name: 'Grace Asiimwe',
      location: 'Stockholm, Sweden',
      avatar: '/images/author_grace.jpg'
    },
    excerpt: 'During dry spells when milk prices surge, our SACCO-backed silage banks ensure uninterrupted milk yield. It’s smart, resilient dairy agriculture built on shared trust.',
    body: [
      'In traditional farming, dry seasons bring drastic drops in milk output and spikes in cattle mortality. By establishing dedicated Napier grass, Chloris gayana pastures, and ensiled corn reserves, our dairy units maintain uninterrupted production through all weather conditions.',
      'Because market milk prices escalate during dry quarters, our members capture peak revenues when other farmers are struggling with feed deficits. Sustainable pasture planning is our greatest competitive advantage.'
    ]
  },
  {
    id: 'art4',
    title: 'Building Generational Dairy Assets: From Calves to Milk Cooperatives',
    category: 'Generational Wealth',
    readTime: '5 min read',
    date: 'Aug 15, 2026',
    thumbnail: '/images/card_img_3.jpg?v=3.2',
    author: {
      name: 'Joseph Mugisha',
      location: 'Dubai, UAE',
      avatar: '/images/author_joseph.jpg'
    },
    excerpt: 'A pedigree dairy cow multiplies in asset value each season. By reinvesting our milk earnings into dairy expansion, we are building enduring family security back home.',
    body: [
      'Living in Dubai taught me the value of tangible asset ownership. Unlike paper funds that fluctuate with speculative markets, livestock reproduction creates organic capital expansion.',
      'Each heifer calf born into our cooperative increases our total asset base. Combined with cooperative title protection, our SACCO membership provides an enduring legal foundation for our children’s inheritance.'
    ]
  }
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeArticle, setActiveArticle] = useState(null);

  const categories = ['All', 'Dairy Farming', 'Livestock Investment', 'Value Addition', 'Generational Wealth'];

  const filteredArticles = selectedCategory === 'All'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pt-20 pb-32 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Clean Header */}
        <header className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4" />
            Member Insights &amp; Stories
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Diaspora Blogs
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real stories, investment lessons, and operational updates from members across the globe.
          </p>
        </header>

        {/* Category Pills (YouTube Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none justify-start sm:justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* YouTube-Style Word Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => (
            <article
              key={art.id}
              onClick={() => setActiveArticle(art)}
              className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-200 cursor-pointer flex flex-col"
            >
              {/* Thumbnail (16:9 ratio) */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={art.thumbnail}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white text-[10px] font-mono font-bold tracking-wider">
                  {art.readTime}
                </span>
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                  {art.category}
                </span>
              </div>

              {/* Body (YouTube Card Style) */}
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    {art.title}
                  </h2>

                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <span className="truncate">{art.author.name}</span>
                    <span>&middot;</span>
                    <span className="truncate">{art.author.location}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {art.date}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>Read Full Story</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </article>
          ))}
        </div>

      </div>

      {/* FULL ARTICLE MODAL / DRAWER */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-slate-800 dark:text-slate-100 p-6 sm:p-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badge & Meta */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold uppercase">
                {activeArticle.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">{activeArticle.date}</span>
              <span className="text-xs text-slate-400 font-medium">&middot;</span>
              <span className="text-xs text-slate-400 font-medium">{activeArticle.readTime}</span>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-4">
              {activeArticle.title}
            </h2>

            {/* Author Profile */}
            <div className="pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-white">{activeArticle.author.name}</p>
              <p className="text-[11px] text-slate-500">{activeArticle.author.location}</p>
            </div>

            {/* Featured Image */}
            <div className="rounded-2xl overflow-hidden aspect-video mb-6">
              <img src={activeArticle.thumbnail} alt={activeArticle.title} className="w-full h-full object-cover" />
            </div>

            {/* Content Body */}
            <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <p className="font-bold text-base text-slate-900 dark:text-white border-l-4 border-emerald-500 pl-3 italic">
                &ldquo;{activeArticle.excerpt}&rdquo;
              </p>
              {activeArticle.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
              >
                Close Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
