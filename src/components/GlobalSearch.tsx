import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Link, useNavigate } from 'react-router-dom';

export default function GlobalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const { apps } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      setQuery('');
    }
  }, [isOpen]);

  const results = query.length > 0 
    ? apps.filter(app => {
        const searchLower = query.toLowerCase();
        return app.name.toLowerCase().includes(searchLower) || 
               app.seo_title?.toLowerCase().includes(searchLower) ||
               app.category?.toLowerCase().includes(searchLower);
      }).sort((a, b) => {
        // Direct matches first
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
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
    if (e.key === 'Enter' && results.length > 0) {
      navigate(`/app/${results[0].slug}`);
      onClose();
    }
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
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                {query.length > 0 ? (
                  <Zap className="w-6 h-6 text-red-600 animate-pulse" />
                ) : (
                  <Search className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Find anything... (Apps, Tools, Games)"
                className="w-full h-20 pl-16 pr-20 bg-white border-2 border-black/5 rounded-[2.5rem] shadow-2xl text-2xl font-black uppercase italic tracking-tighter focus:outline-none focus:border-red-600/20 transition-all placeholder:text-slate-200"
              />
              <button 
                onClick={onClose}
                className="absolute inset-y-4 right-4 w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence>
              {query.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-6 bg-white border border-black/5 rounded-[3rem] shadow-2xl overflow-hidden p-6"
                >
                  <div className="flex items-center justify-between mb-6 px-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 italic">Search Intel ({results.length})</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 animate-pulse">Live Feed</span>
                  </div>

                  <div className="space-y-2">
                    {results.length > 0 ? results.map((app) => (
                      <Link 
                        key={app.id} 
                        to={`/app/${app.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-3xl transition-all group border border-transparent hover:border-black/5"
                      >
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                          {app.icon_url && <img src={app.icon_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-black uppercase italic tracking-tighter truncate leading-none mb-1">{app.name}</h4>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 truncate">{app.category || 'Premium Service'}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-red-600" />
                      </Link>
                    )) : (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Loader2 className="w-6 h-6 text-slate-200 animate-spin" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 italic">Decrypting results...</p>
                      </div>
                    )}
                  </div>

                  {results.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-black/5 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 italic">Press Enter for top direct match</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
