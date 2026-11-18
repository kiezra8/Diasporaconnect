import React, { useState } from 'react';
import { Play, ChevronRight } from 'lucide-react';

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

export default function FarmLife() {
  const [activeVideoId, setActiveVideoId] = useState('start');

  const activeVideo = FARM_VIDEOS.find(v => v.id === activeVideoId) || FARM_VIDEOS[0];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 pt-20 pb-32 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header — extra bold and clear */}
        <header className="text-center max-w-2xl mx-auto mb-8">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-wider"
            style={{ fontFamily: "'Cinzel', serif", fontWeight: 900, letterSpacing: '2px' }}
          >
            FARM <span style={{ color: 'var(--gold, #b8860b)' }}>LIFE</span>
          </h1>
          <div className="gold-line gold-line-center" style={{ width: '56px', height: '3px', background: 'var(--gold, #b8860b)', margin: '12px auto 0', borderRadius: '2px' }}></div>
        </header>

        {/* Tab Switcher like Mission / Values / Vision */}
        <div className="flex items-center justify-start sm:justify-center gap-1 overflow-x-auto pb-4 mb-8 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
          {FARM_VIDEOS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveVideoId(v.id)}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition cursor-pointer ${
                activeVideoId === v.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              {v.title}
            </button>
          ))}
        </div>

        {/* Featured Video Player & Details */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mb-12">
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
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-3">
                  {activeVideo.title}
                </h2>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1 uppercase tracking-wider">
                  {activeVideo.subtitle}
                </p>
                <div className="h-0.5 w-12 bg-amber-500/40 my-4" />
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeVideo.description}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
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
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`group rounded-3xl border overflow-hidden transition cursor-pointer flex flex-col shadow-sm ${
                  activeVideoId === v.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600'
                }`}
              >
                {/* Real Video Preview */}
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  <video
                    src={v.src}
                    muted
                    playsInline
                    loop
                    preload="metadata"
                    onMouseEnter={(e) => { e.currentTarget.play().catch(() => {}); }}
                    onMouseLeave={(e) => { e.currentTarget.pause(); }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
                  
                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                    {v.category}
                  </span>

                  {/* Play Button Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-emerald-600 transition">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Card Meta */}
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

      </div>
    </div>
  );
}
