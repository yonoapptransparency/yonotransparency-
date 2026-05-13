import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { Search, ShieldAlert, ShieldCheck, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { FlipkartBanner, PlayStoreTabs, TopChartItem, AppListItem } from '../components/PlayStoreUI';

export default function Home() {
  const { apps: mockApps, settings: mockSettings, news: mockNews, blogs: mockBlogs, videos: mockVideos, saveApps: saveMockApps, saveSettings: saveMockSettings, saveNews: saveMockNews, saveBlogs: saveMockBlogs, saveVideos: saveMockVideos } = useData();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || mockSettings.categories?.[0] || 'All Apps');
  const [apps, setApps] = useState(mockApps);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== searchTerm) {
      setSearchTerm(q);
    }
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab(mockSettings.categories?.[0] || 'All Apps');
    }
  }, [searchParams, location, mockSettings]);

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(20);
    }
  };

  const filteredApps = mockApps
    .filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()) || app.category.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (searchTerm) {
        const cleanSearch = searchTerm.toLowerCase().trim();
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Exact match prioritized
        const aExact = aName === cleanSearch;
        const bExact = bName === cleanSearch;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Starts with prioritized
        const aStartsWith = aName.startsWith(cleanSearch);
        const bStartsWith = bName.startsWith(cleanSearch);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
      }
      return a.serial_number - b.serial_number;
    });

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
      {/* Premium Hero Section from Screenshot */}
      <div className="text-center py-6 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold mb-3"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Transparency
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl font-black tracking-tighter text-black dark:text-white mb-2 uppercase flex justify-center items-center gap-2 flex-wrap"
        >
          App Transparency <span className="text-red-600">Portal</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-black dark:text-slate-400 max-w-xl mx-auto text-sm mb-6 font-bold uppercase tracking-tight"
        >
          Independent reviews for apps you can trust.
        </motion.p>

        {/* Search Header Style - Matching Screenshot */}
        <div className="max-w-xl mx-auto mb-6 px-1">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-red-500 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all shadow-lg shadow-black/5"
              placeholder="Search apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <PlayStoreTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {!searchTerm && activeTab.toLowerCase() !== 'categories' && activeTab.toLowerCase() !== 'top charts' && (
        <FlipkartBanner items={bannerItems} />
      )}

      {activeTab.toLowerCase() === 'top charts' && (
        <div className="space-y-2 animate-fade-in">
          <div className="bg-pink-500/10 p-4 rounded-2xl mb-6 flex items-center justify-between border border-pink-500/20">
            <div className="flex items-center gap-3">
              <div className="bg-pink-500 p-2 rounded-lg text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-pink-800 dark:text-pink-300">Trending Now</h3>
                <p className="text-xs text-pink-600 dark:text-pink-400">Apps with highest growth this week</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2 mb-4">
             <div className="flex gap-2">
                <button className="bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 px-4 py-1.5 rounded-full text-xs font-bold border border-pink-200 dark:border-pink-800">Top free</button>
             </div>
          </div>

          <div className="space-y-1">
            {filteredApps.map((app, index) => (
              <TopChartItem key={app.id} rank={index + 1} app={app} />
            ))}
          </div>
        </div>
      )}

      {(() => {
        const isHomeTab = activeTab.toLowerCase() === (mockSettings.categories?.[0]?.toLowerCase() || 'all apps') || activeTab.toLowerCase() === 'all apps' || activeTab.toLowerCase() === 'home' || activeTab.toLowerCase() === 'apps';
        return isHomeTab && (
        <div className="animate-fade-in">
          <h2 className="text-xl font-black mb-6 px-2 mt-8 uppercase tracking-tighter text-black dark:text-white border-l-4 border-red-600 pl-4">New Applications</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 px-1 mb-12">
            {filteredApps.filter(app => app.is_new).map((app) => (
              <Link key={app.id} to={`/app/${app.slug}`} className="flex flex-col gap-3 group">
                <div className="aspect-square rounded-3xl overflow-hidden bg-white dark:bg-white/5 border border-white dark:border-white/10 shadow-xl group-hover:shadow-red-500/10 transition-all relative">
                  <img src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} alt={app.name} className="w-full h-full object-cover group-hover:scale-110 group-active:scale-95 transition-transform" />
                  {app.is_new && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-lg z-10">New</span>
                  )}
                </div>
                <div className="px-1">
                  <h3 className="text-[14px] leading-tight font-black truncate text-black dark:text-white uppercase tracking-tighter">{app.name}</h3>
                  <div className="text-[11px] font-black text-black dark:text-slate-400 uppercase tracking-widest">{app.category}</div>
                </div>
              </Link>
            ))}
            {filteredApps.filter(app => app.is_new).length === 0 && (
               <div className="col-span-full text-center py-6 text-slate-400 text-sm">No new apps recently added.</div>
            )}
          </div>

          <h2 className="text-xl font-black mt-12 mb-6 px-2 uppercase tracking-tighter text-black dark:text-white border-l-4 border-red-600 pl-4">All Applications</h2>
          <div className="space-y-2">
            {filteredApps.map((app, index) => (
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
                <span className="font-black text-black dark:text-white uppercase tracking-tight text-lg">{cat}</span>
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
