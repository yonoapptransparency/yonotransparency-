import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { LayoutGrid, Sparkles, Filter, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppListItem } from '../components/PlayStoreUI';
import { Link } from 'react-router-dom';

export default function VideosPage() {
  const { apps: mockApps, settings: mockSettings } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const allCategoryApps = useMemo(() => {
    return mockApps.filter(app => {
      const appCategories = app.category ? app.category.toLowerCase().split(',').map(c => c.trim()) : [];
      const matchesCategory = appCategories.some(cat => cat === 'all app' || cat === 'all apps');
      
      if (!searchTerm) return matchesCategory;
      
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (app.seo_title && app.seo_title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    }).sort((a, b) => (a.serial_number || 0) - (b.serial_number || 0));
  }, [mockApps, searchTerm]);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto py-4 px-2">
      <div className="px-2 mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-colors group"
        >
          <div className="p-2 rounded-full bg-black/5 border border-black/5 group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Back to storefront
        </Link>
      </div>
      <Helmet>
        <title>All Premium Apps - {mockSettings.site_title}</title>
        <meta name="description" content="Explore our complete collection of verified premium applications." />
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter flex items-center gap-3 uppercase italic leading-none dark:text-white">
            {mockSettings.logo_url ? <img src={mockSettings.logo_url} className="w-10 h-10 object-contain brightness-110" alt="" /> : <LayoutGrid className="w-8 h-8 text-pink-600" />}
            All <span className="text-pink-600">Premium</span> Apps
          </h1>
          <p className="opacity-40 font-black uppercase tracking-[0.4em] text-[8px] sm:text-[10px] flex items-center gap-3 dark:text-white italic">
            <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
            Vetted & Verified Intelligence Index
          </p>
        </div>
        
        <div className="relative w-full sm:w-80 group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
            <Filter className="w-4 h-4 text-pink-500 opacity-40 group-focus-within:opacity-100 transition-opacity" />
          </div>
          <input 
            type="search" 
            placeholder="DECRYPT FEED..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-2 border-white/20 dark:border-white/10 rounded-[1.5rem] pl-14 pr-6 py-4 text-slate-900 dark:text-white placeholder-slate-400 text-xs font-black focus:ring-4 focus:ring-pink-500/10 transition-all outline-none uppercase tracking-[0.2em] shadow-2xl"
          />
        </div>
      </div>

      <div className="grid gap-2 px-1">
        {allCategoryApps.map((app, index) => (
          <AppListItem key={app.id} app={app} index={index + 1} />
        ))}
      </div>
      
      {allCategoryApps.length === 0 && (
        <div className="text-center py-40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-4 border-dashed border-white/20 dark:border-white/10 m-4 rounded-[4rem] shadow-inner">
          <div className="bg-pink-600/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-2 border-pink-500/20">
            <LayoutGrid className="w-10 h-10 text-pink-600 opacity-50" />
          </div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-3 dark:text-white">Feed Interrupted</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] max-w-[250px] mx-auto opacity-70 italic">
            {searchTerm ? "Search query returned zero matches" : "Syncing newly verified applications. Stand by."}
          </p>
        </div>
      )}
    </div>
  );
}
