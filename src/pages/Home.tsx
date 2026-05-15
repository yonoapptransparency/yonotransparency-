import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { Search, ShieldAlert, ShieldCheck, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { FlipkartBanner, PlayStoreTabs, TopChartItem, AppListItem } from '../components/PlayStoreUI';

export default function Home() {
  const { apps: mockApps, settings: mockSettings } = useData();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || mockSettings.categories?.[0] || 'All Apps');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    } else if (mockSettings.categories && mockSettings.categories.length > 0) {
      // Default to first category if no tab in search params
      if (!tab && activeTab === 'All Apps' && !mockSettings.categories.includes('All Apps')) {
        setActiveTab(mockSettings.categories[0]);
      }
    }
  }, [searchParams, location, mockSettings.categories]);

  const filteredApps = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase().trim();
    if (!term) return [...mockApps].sort((a, b) => (a.serial_number || 0) - (b.serial_number || 0));

    const scored = mockApps
      .map(app => {
        let score = 0;
        const name = app.name.toLowerCase();
        const cat = app.category.toLowerCase();
        const seoTitle = app.seo_title?.toLowerCase() || "";
        const seoDesc = app.seo_description?.toLowerCase() || "";
        const keywords = app.seo_keywords?.toLowerCase() || "";

        // Exact matches
        if (name === term) score += 1000;
        if (seoTitle === term) score += 800;

        // "Starts with" matches
        if (name.startsWith(term)) score += 500;
        if (seoTitle.startsWith(term)) score += 400;

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
        if (seoTitle.includes(term)) score += 40;
        if (cat.includes(term)) score += 30;
        if (seoDesc.includes(term)) score += 20;

        return { app, score };
      })
      .filter(item => item.score > 0);

    return scored
      .sort((a, b) => {
        // Sort by score first (highest first)
        if (b.score !== a.score) return b.score - a.score;
        // Fallback to serial number for identical scores
        return (a.app.serial_number || 0) - (b.app.serial_number || 0);
      })
      .map(item => item.app);
  }, [mockApps, searchTerm]);

  const bannerItems = mockSettings.banners || [];

  return (
    <div className="select-none min-h-screen">
      <Helmet>
        <title>{mockSettings.site_title}</title>
        <meta name="description" content={mockSettings.meta_description} />
        {mockSettings.seo_keywords && <meta name="keywords" content={mockSettings.seo_keywords} />}
        <meta property="og:title" content={mockSettings.site_title} />
        <meta property="og:description" content={mockSettings.meta_description} />
        <meta property="og:image" content={mockSettings.logo_url} />
      </Helmet>
      {/* Premium Hero Section - Compact & Sleek */}
      <div className="text-center py-4 px-4 bg-linear-to-b from-slate-50/50 dark:from-slate-900/50 to-transparent backdrop-blur-md mb-4 border-b border-black/5 dark:border-white/5">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-base sm:text-lg font-black tracking-[0.2em] mb-4 uppercase flex justify-center items-center gap-2 italic dark:text-white"
        >
          <ShieldCheck className="w-5 h-5 text-red-600 drop-shadow-sm" />
          <span className="opacity-90">Secure</span> <span className="text-red-600 drop-shadow-sm">Index</span>
          <ShieldCheck className="w-5 h-5 text-red-600 drop-shadow-sm" />
        </motion.h1>

        {/* Compact Search */}
        <div className="max-w-md mx-auto mb-1">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2.5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-full placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-red-500/5 transition-all shadow-sm dark:text-white"
              placeholder="SEARCH PREMIUM CONTENT"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!searchTerm && activeTab.toLowerCase() !== 'categories' && activeTab.toLowerCase() !== 'top charts' && (
        <FlipkartBanner items={bannerItems} />
      )}

      {/* Grid of New Apps - Compact & Glossy (Hidden if searching) */}
      {(() => {
        if (searchTerm) return null;
        const isHomeTab = activeTab.toLowerCase() === (mockSettings.categories?.[0]?.toLowerCase() || 'all apps') || activeTab.toLowerCase() === 'all apps' || activeTab.toLowerCase() === 'home' || activeTab.toLowerCase() === 'apps';
        return isHomeTab && (
          <div className="px-2">
            <h2 className="text-[10px] font-black mb-2 mt-2 uppercase tracking-[0.3em] text-red-600 opacity-80 flex items-center gap-2 justify-center text-center">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Verified New Additions
              <Sparkles className="w-3 h-3 animate-pulse" />
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1.5 px-1 mb-4">
              {filteredApps.filter(app => app.is_new).slice(0, 10).map((app) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link to={`/app/${app.slug}`} className="flex flex-col gap-2 group">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-white/20 border-2 border-slate-200 shadow-lg group-hover:shadow-red-500/20 transition-all relative backdrop-blur-lg">
                      <img 
                        src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} 
                        alt={app.name} 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                    </div>
                    <div className="px-1 text-center">
                      <h3 className="text-[8px] sm:text-[10px] leading-tight font-black uppercase tracking-tighter italic">{app.name}</h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })()}

      <PlayStoreTabs activeTab={activeTab} onTabChange={setActiveTab} hideOnSearch={!!searchTerm} />

      {searchTerm && (
        <div className="px-1">
          <h2 className="text-[11px] font-black mt-2 mb-4 px-4 uppercase tracking-[0.3em] text-red-600 flex items-center gap-4 text-center justify-center italic">
            <div className="flex-1 h-[1px] bg-linear-to-r from-transparent to-red-600/20"></div>
            <Search className="w-3.5 h-3.5" />
            <span>Search Results</span>
            <Search className="w-3.5 h-3.5 rotate-90" />
            <div className="flex-1 h-[1px] bg-linear-to-l from-transparent to-red-600/20"></div>
          </h2>
          <div className="space-y-2">
            {filteredApps.slice(0, 30).map((app, index) => (
              <AppListItem key={app.id} app={app} index={index + 1} />
            ))}
          </div>
        </div>
      )}

      {activeTab.toLowerCase() === 'top charts' && !searchTerm && (
        <div className="space-y-1 px-1">
          <div className="bg-linear-to-r from-red-600/10 to-transparent p-3 rounded-2xl mb-2 flex items-center justify-between border border-red-600/10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 p-1.5 rounded-lg text-white shadow-lg shadow-red-600/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-xs uppercase tracking-tighter">Rising Stars</h3>
                <p className="text-[8px] opacity-60 font-bold uppercase tracking-widest">Trending high this week</p>
              </div>
            </div>
          </div>
          {filteredApps.slice(0, 50).map((app, index) => (
            <TopChartItem key={app.id} rank={index + 1} app={app} />
          ))}
        </div>
      )}

      {(() => {
        if (searchTerm) return null;
        const isHomeTab = activeTab.toLowerCase() === (mockSettings.categories?.[0]?.toLowerCase() || 'all apps') || activeTab.toLowerCase() === 'all apps' || activeTab.toLowerCase() === 'home' || activeTab.toLowerCase() === 'apps';
        return isHomeTab && (
          <div className="px-1">
            <h2 className="text-[11px] font-black mt-6 mb-3 px-4 uppercase tracking-[0.3em] text-slate-400 flex items-center gap-4 text-center justify-center">
              <div className="flex-1 h-[1px] bg-linear-to-r from-transparent to-slate-200"></div>
              <span>Explore All</span>
              <div className="flex-1 h-[1px] bg-linear-to-l from-transparent to-slate-200"></div>
            </h2>
            <div className="space-y-2">
              {filteredApps.slice(0, 30).map((app, index) => (
                <AppListItem key={app.id} app={app} index={index + 1} />
              ))}
            </div>
          </div>
        );
      })()}

      {activeTab.toLowerCase() === 'categories' && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
           {mockSettings.categories?.filter(c => c.toLowerCase() !== (mockSettings.categories?.[0]?.toLowerCase() || 'all apps') && c.toLowerCase() !== 'top charts' && c.toLowerCase() !== 'categories').map((cat) => (
             <button key={cat} onClick={() => setActiveTab(cat)} className="flex items-center gap-4 p-6 glass-panel text-left active:scale-[0.98] transition-transform">
                <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-600">
                   <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="font-black uppercase tracking-tight text-lg">{cat}</span>
             </button>
           ))}
        </div>
      )}

      {(() => {
        const isHomeTab = activeTab.toLowerCase() === (mockSettings.categories?.[0]?.toLowerCase() || 'all apps') || activeTab.toLowerCase() === 'all apps' || activeTab.toLowerCase() === 'home' || activeTab.toLowerCase() === 'apps';
        const isExcluded = isHomeTab || activeTab.toLowerCase() === 'top charts' || activeTab.toLowerCase() === 'categories';
        
        return !isExcluded && (
        <div className="animate-fade-in space-y-2 px-1">
          {(() => {
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

      {filteredApps.length === 0 && searchTerm && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg">No results found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
