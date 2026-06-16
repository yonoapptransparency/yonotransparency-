import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Link, useNavigate } from 'react-router-dom';

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const { apps, settings } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      try {
        const stored = localStorage.getItem('recent_searches');
        if (stored) {
          setHistory(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
    }
  }, [isOpen]);

  const saveToHistory = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setHistory(prev => {
      const next = [trimmed, ...prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      localStorage.setItem('recent_searches', JSON.stringify(next));
      return next;
    });
  };

  const removeFromHistory = (itemToRemove: string) => {
    setHistory(prev => {
      const next = prev.filter(item => item !== itemToRemove);
      localStorage.setItem('recent_searches', JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('recent_searches');
  };

  const getTrendingSearches = () => {
    let trends: string[] = [];
    if (settings?.trending_searches && Array.isArray(settings.trending_searches) && settings.trending_searches.length > 0) {
      trends = settings.trending_searches.filter(Boolean);
    } else if (settings?.trending_searches && typeof settings.trending_searches === 'string') {
      trends = (settings.trending_searches as string).split(',').map(s => s.trim()).filter(Boolean);
    }
    
    // If the admin didn't configure dedicated trending searches, fallback to generating them from actual App SEO keywords
    if (trends.length === 0 && apps.length > 0) {
      const allAppKeywords = new Set<string>();
      apps.forEach(a => {
        if (a.seo_keywords) {
          a.seo_keywords.split(',').forEach(k => allAppKeywords.add(k.trim()));
        }
      });
      trends = Array.from(allAppKeywords).filter(Boolean);
    }
    
    return trends.slice(0, 8);
  };

  const trendingSearches = getTrendingSearches();

  const results = query.length > 0 
    ? apps.filter(app => {
        if (!app || !app.name) return false;
        const searchLower = query.toLowerCase();
        return app.name.toLowerCase().includes(searchLower) || 
               app.seo_title?.toLowerCase().includes(searchLower) ||
               app.category?.toLowerCase().includes(searchLower) ||
               app.seo_keywords?.toLowerCase().includes(searchLower);
      }).sort((a, b) => {
        // Direct matches first
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const q = query.toLowerCase();
        if (aName === q) return -1;
        if (bName === q) return 1;
        if (aName.startsWith(q)) return -1;
        if (bName.startsWith(q)) return 1;
        return 0;
      }).slice(0, 8)
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col pt-20 px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/80 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-2xl mx-auto relative z-10"
          >
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim()) {
                  saveToHistory(query.trim());
                  navigate(`/?q=${encodeURIComponent(query.trim())}`);
                  onClose();
                }
              }}
              className="relative group block"
            >
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                {query.length > 0 ? (
                  <Zap className="w-6 h-6 text-blue-500 animate-pulse" />
                ) : (
                  <Search className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                )}
              </div>
              <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Find anything... (Apps, Tools, Games)"
                className="w-full h-20 pl-16 pr-20 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-xl text-xl font-medium focus:outline-none focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 dark:text-white"
              />
              <button 
                type="button"
                onClick={onClose}
                className="absolute inset-y-4 right-4 w-12 h-12 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            <AnimatePresence mode="wait">
              {query.length === 0 && (history.length > 0 || trendingSearches.length > 0) ? (
                <motion.div
                  key="search-history-and-trends"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden py-4"
                >
                  {/* Recent Searches Section */}
                  {history.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2 px-6">
                        <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase flex items-center gap-1.5 dark:text-zinc-500">
                          Recent Searches
                        </span>
                        <button 
                          onClick={clearHistory}
                          className="text-xs font-semibold text-red-500 hover:text-red-100/80 transition-colors cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="px-3 space-y-1">
                        {history.map((item, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-2xl transition-all group"
                          >
                            <button
                              onClick={() => {
                                saveToHistory(item);
                                navigate(`/?q=${encodeURIComponent(item)}`);
                                onClose();
                              }}
                              className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                            >
                              <Search className="w-4 h-4 text-zinc-400 group-hover:text-blue-500" />
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-blue-500 transition-colors">
                                {item}
                              </span>
                            </button>
                            <button
                              onClick={() => removeFromHistory(item)}
                              className="p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider line between History and Trends if both exist */}
                  {history.length > 0 && trendingSearches.length > 0 && (
                    <div className="my-4 border-t border-black/5 dark:border-white/5 mx-6" />
                  )}

                  {/* Trending Searches Section */}
                  {trendingSearches.length > 0 && (
                    <div className="px-6">
                      <div className="flex items-center gap-1.5 mb-3">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase dark:text-zinc-500">
                          Trending Searches
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1 pb-2">
                        {trendingSearches.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              saveToHistory(item);
                              navigate(`/?q=${encodeURIComponent(item)}`);
                              onClose();
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 border border-black/5 dark:border-white/5 hover:border-blue-500/10 dark:hover:border-blue-500/10 rounded-full text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            <TrendingUp className="w-3.5 h-3.5 opacity-60 text-current" />
                            <span>{item}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : query.length > 0 ? (
                <motion.div 
                  key="search-results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden py-4"
                >
                  <div className="flex items-center justify-between mb-4 px-6">
                    <span className="text-xs font-semibold text-zinc-500 tracking-wide uppercase">Results ({results.length})</span>
                    <span className="text-xs font-semibold text-blue-500 animate-pulse tracking-wide uppercase">Live Search</span>
                  </div>

                  <div className="space-y-1 px-3">
                    {results.length > 0 ? results.map((app) => (
                      <Link 
                        key={app.id} 
                        to={`/${app.slug}`}
                        onClick={() => {
                          saveToHistory(query);
                          onClose();
                        }}
                        className="flex items-center gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-all group"
                      >
                        <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden shrink-0">
                          {app.icon_url && <img src={app.icon_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate mb-0.5">{app.name}</h4>
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">{app.category || 'Premium Service'}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-blue-500 mr-2" />
                      </Link>
                    )) : (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Loader2 className="w-6 h-6 text-zinc-300 dark:text-zinc-600 animate-spin" />
                        </div>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500">Searching...</p>
                      </div>
                    )}
                  </div>

                  {results.length > 0 && (
                     <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 text-center">
                      <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Press Enter to select the top result</p>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
