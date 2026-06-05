import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { Search, ShieldAlert, ShieldCheck, Sparkles, ArrowRight, TrendingUp, Star, SlidersHorizontal, ChevronDown, ListFilter } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { FeaturedBanner, PlayStoreTabs, TopChartItem, AppListItem, AppListItemSkeleton, TopChartItemSkeleton, NewAdditionItemSkeleton } from '../components/PlayStoreUI';
import { WebsiteTitleHero } from '../components/WebsiteTitleHero';

export default function Home() {
  const { apps: mockApps, settings: mockSettings, loading } = useData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'All Apps');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams, location, mockSettings.categories]);

  const filteredApps = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let baseApps = [...mockApps];

    // Filter by Rating
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      if (!isNaN(minRating)) {
        baseApps = baseApps.filter(app => {
          const r = typeof app.rating === 'number' ? app.rating : parseFloat(app.rating) || 0;
          return r >= minRating;
        });
      }
    }

    if (!term) {
      if (sortBy === 'rating_desc') {
        baseApps.sort((a, b) => {
          const ra = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating) || 0;
          const rb = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating) || 0;
          return rb - ra;
        });
      } else if (sortBy === 'rating_asc') {
        baseApps.sort((a, b) => {
          const ra = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating) || 0;
          const rb = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating) || 0;
          return ra - rb;
        });
      } else {
        baseApps.sort((a, b) => (a.serial_number || 0) - (b.serial_number || 0));
      }
      return baseApps;
    }

    const scored = baseApps
      .map(app => {
        let score = 0;
        const name = app.name.toLowerCase();
        const cat = app.category.toLowerCase();
        const keywords = app.seo_keywords?.toLowerCase() || "";

        // Exact matches
        if (name === term) score += 1000;

        // "Starts with" matches
        if (name.startsWith(term)) score += 500;

        // Word-level matches (e.g. "India" in "Best India Apps")
        const nameWords = name.split(/\s+/);
        if (nameWords.some(w => w === term)) score += 300;
        if (nameWords.some(w => w.startsWith(term))) score += 200;

        // SEO Keywords (highest value for non-name metadata)
        if (keywords.includes(term)) {
          const keywordList = keywords.split(/,\s*/);
          if (keywordList.some(k => k === term)) score += 250;
          else score += 100;
        }

        // Substring matches
        if (name.includes(term)) score += 50;
        if (cat.includes(term)) score += 30;

        return { app, score };
      })
      .filter(item => item.score > 0);

    const resultingApps = scored
      .sort((a, b) => {
        // Sort by score first (highest first)
        if (b.score !== a.score) return b.score - a.score;
        // Fallback to serial number for identical scores
        return (a.app.serial_number || 0) - (b.app.serial_number || 0);
      })
      .map(item => item.app);

    if (sortBy === 'rating_desc') {
      resultingApps.sort((a, b) => {
        const ra = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating) || 0;
        const rb = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating) || 0;
        return rb - ra;
      });
    } else if (sortBy === 'rating_asc') {
      resultingApps.sort((a, b) => {
        const ra = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating) || 0;
        const rb = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating) || 0;
        return ra - rb;
      });
    }

    return resultingApps;
  }, [mockApps, searchTerm, ratingFilter, sortBy]);

  const bannerItems = mockSettings.banners || [];

  return (
    <div className="select-none min-h-screen">
      <Helmet>
        <title>{mockSettings.site_title}</title>
        <meta name="description" content={mockSettings.meta_description} />
        {mockSettings.seo_keywords && <meta name="keywords" content={mockSettings.seo_keywords} />}
        <meta name="author" content={mockSettings.site_title} />
        <meta name="robots" content="index, follow" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content={mockSettings.site_title} />
        <meta property="og:description" content={mockSettings.meta_description} />
        <meta property="og:image" content={mockSettings.logo_url} />
        <meta property="og:url" content={window.location.origin} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={mockSettings.site_title} />
        <meta name="twitter:description" content={mockSettings.meta_description} />
        <meta name="twitter:image" content={mockSettings.logo_url} />

        <link rel="canonical" href={window.location.origin} />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": mockSettings.site_title,
            "url": window.location.origin,
            "description": mockSettings.meta_description,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${window.location.origin}/?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
      </Helmet>
      {!searchTerm && (
        <WebsiteTitleHero settings={mockSettings} />
      )}

      {!searchTerm && activeTab.toLowerCase() !== 'categories' && activeTab.toLowerCase() !== 'top charts' && (
        <FeaturedBanner items={bannerItems} />
      )}

      {/* Grid of New Apps - Compact & Glossy (Hidden if searching) */}
      {(() => {
        if (searchTerm) return null;
        const activeTabLower = activeTab.toLowerCase();
        const isHomeTab = activeTabLower === 'all apps' || 
                          activeTabLower === 'all' || 
                          activeTabLower === 'home' || 
                          activeTabLower === 'apps';
        const hasNewApps = loading ? true : filteredApps.some(app => app.is_new);
        return isHomeTab && hasNewApps && (
          <div className="px-2 animate-fade-in">
            <h2 className="text-xl font-bold mb-4 mt-6 text-zinc-900 dark:text-zinc-100 flex items-center px-2">
              Verified New Additions
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3 px-1 mb-6">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <NewAdditionItemSkeleton key={i} />
                ))
              ) : (
                filteredApps.filter(app => app.is_new).slice(0, 10).map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link to={`/${app.slug}`} className="flex flex-col gap-2 group">
                      <div className="aspect-square rounded-[18px] overflow-hidden bg-white/20 border border-black/5 dark:border-white/10 shadow-sm group-hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] transition-all relative">
                        <img 
                          src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} 
                          alt={app.name} 
                          referrerPolicy="no-referrer"
                          loading="eager"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover group-hover:-translate-y-0.5 transition-transform duration-300" 
                        />
                      </div>
                      <div className="px-1 text-center">
                        <h3 className="text-[10px] sm:text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{app.name}</h3>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      <PlayStoreTabs activeTab={activeTab} onTabChange={setActiveTab} hideOnSearch={!!searchTerm} />

      {activeTab.toLowerCase() !== 'categories' && (
        <div className="px-4 mb-4 flex flex-wrap items-center justify-between gap-3 bg-zinc-50/40 dark:bg-zinc-950/40 py-2.5 rounded-2xl border border-black/[0.03] dark:border-white/[0.03]">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 leading-none">
              Filter Results
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Star Rating Dropdown */}
            <div className="relative">
              <label className="sr-only">Filter by Rating</label>
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-xl px-3 py-1.5 shadow-sm text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer select-none">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span>Rating: {ratingFilter === 'all' ? 'All' : `${ratingFilter}+ Stars`}</span>
                </span>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  <option value="all">All Ratings</option>
                  <option value="4.5">4.5+ ★ Superior</option>
                  <option value="4.0">4.0+ ★ Top Rated</option>
                  <option value="3.5">3.5+ ★ Premium</option>
                  <option value="3.0">3.0+ ★ Standard</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </div>
            </div>

            {/* Sort By Dropdown */}
            <div className="relative">
              <label className="sr-only">Sort by Order</label>
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-xl px-3 py-1.5 shadow-sm text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer select-none">
                <span className="flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Sort: {
                    sortBy === 'default' ? 'Recommended' : 
                    sortBy === 'rating_desc' ? 'Rating: High to Low' : 
                    'Rating: Low to High'
                  }</span>
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  <option value="default">Recommended</option>
                  <option value="rating_desc">Rating (Highest First)</option>
                  <option value="rating_asc">Rating (Lowest First)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </div>
            </div>

            {/* Clear filters if active */}
            {(ratingFilter !== 'all' || sortBy !== 'default') && (
              <button
                onClick={() => {
                  setRatingFilter('all');
                  setSortBy('default');
                }}
                className="text-xs font-bold text-red-500 hover:text-red-650 transition-colors px-2 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {searchTerm && (
        <div className="px-1">
          <h2 className="text-xl font-bold mb-4 mt-6 text-zinc-900 dark:text-zinc-100 px-4">
            Search Results
          </h2>
          <div className="space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <AppListItemSkeleton key={i} />
              ))
            ) : (
              filteredApps.map((app, index) => (
                <AppListItem key={app.id} app={app} index={index + 1} />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab.toLowerCase() === 'top charts' && !searchTerm && (
        <div className="space-y-1 px-1">
          <h2 className="text-xl font-bold mb-4 mt-6 text-zinc-900 dark:text-zinc-100 flex items-center gap-2 px-4">
            Top Charts
          </h2>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TopChartItemSkeleton key={i} rank={i + 1} />
            ))
          ) : (
            filteredApps.map((app, index) => (
              <TopChartItem key={app.id} rank={index + 1} app={app} />
            ))
          )}
        </div>
      )}

      {(() => {
        if (searchTerm) return null;
        const activeTabLower = activeTab.toLowerCase();
        const isHomeTab = activeTabLower === 'all apps' || 
                          activeTabLower === 'all' || 
                          activeTabLower === 'home' || 
                          activeTabLower === 'apps';
        return isHomeTab && (
          <div className="px-1">
            <h2 className="text-xl font-bold mb-4 mt-8 text-zinc-900 dark:text-zinc-100 px-4">
              Explore All
            </h2>
            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <AppListItemSkeleton key={i} />
                ))
              ) : (
                filteredApps.map((app, index) => (
                  <AppListItem key={app.id} app={app} index={index + 1} />
                ))
              )}
            </div>
          </div>
        );
      })()}

      {activeTab.toLowerCase() === 'categories' && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in px-4">
           {mockSettings.categories?.filter(c => c.toLowerCase() !== (mockSettings.categories?.[0]?.toLowerCase() || 'all apps') && c.toLowerCase() !== 'top charts' && c.toLowerCase() !== 'categories').map((cat) => (
             <button key={cat} onClick={() => setActiveTab(cat)} className="flex items-center gap-4 p-5 glass-panel text-left active:scale-[0.98] transition-all duration-300">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 shrink-0">
                   <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{cat}</span>
             </button>
           ))}
        </div>
      )}

      {(() => {
        const activeTabLower = activeTab.toLowerCase();
        const isHomeTab = activeTabLower === 'all apps' || 
                          activeTabLower === 'all' || 
                          activeTabLower === 'home' || 
                          activeTabLower === 'apps';
        const isExcluded = isHomeTab || activeTabLower === 'top charts' || activeTabLower === 'categories';
        
        return !isExcluded && (
        <div className="animate-fade-in space-y-2 px-1">
          {(() => {
            if (loading) {
              return Array.from({ length: 6 }).map((_, i) => (
                <AppListItemSkeleton key={i} />
              ));
            }
            const currentTabLower = activeTab.toLowerCase().trim();
            const tabApps = filteredApps.filter(app => {
              if (searchTerm) return true;
              const appCategories = app.category ? app.category.toLowerCase().split(',').map(c => c.trim()) : [];
              return appCategories.some(cat => cat === currentTabLower || cat.includes(currentTabLower) || currentTabLower.includes(cat));
            });
            return tabApps.length > 0 ? (
              tabApps.map((app, index) => <AppListItem key={app.id} app={app} index={index + 1} />)
            ) : (
              <div className="text-center py-20 text-slate-400">
                <p className="text-lg">No apps found in {activeTab}</p>
              </div>
            );
          })()}
        </div>
        );
      })()}

      {!loading && filteredApps.length === 0 && searchTerm && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">No results found for "{searchTerm}"</p>
        </div>
      )}

      {/* Deeply Integrated Secure CTA */}
      <div className="mt-12 mb-6 w-full animate-fade-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 shadow-2xl border border-white/10 p-1">
        <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay"></div>
        <div className="relative bg-zinc-900/40 dark:bg-black/20 backdrop-blur-md rounded-[28px] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 z-10 border border-white/5">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Secure</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
              Ready to Upgrade Your Experience?
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base font-medium max-w-xl mx-auto md:mx-0 leading-relaxed">
              Join thousands of users exploring our securely curated, privacy-first application universe. All downloads are protected with advanced verification handshakes.
            </p>
          </div>
          
          <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Explore Now
            </button>
            <Link to="/about" className="w-full sm:w-auto px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/10 rounded-2xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
