import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ShieldCheck, Star, Download, AlertTriangle, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import React from 'react';

interface BannerProps {
  items: any[];
}

export const FlipkartBanner = React.memo(({ items }: BannerProps) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (!items || items.length <= 1) return;
    
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        const firstItem = scrollRef.current.querySelector('a');
        const itemWidth = firstItem ? firstItem.offsetWidth + 12 : clientWidth * 0.8;

        if (scrollLeft >= maxScroll - 50) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          setActiveIndex(0);
        } else {
          scrollRef.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
          setActiveIndex(prev => (prev + 1) % items.length);
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [items]);

  // Sync index on manual scroll
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const firstItem = scrollRef.current.querySelector('a');
      const itemWidth = firstItem ? firstItem.offsetWidth + 12 : clientWidth * 0.8;
      const index = Math.round(scrollLeft / itemWidth);
      if (index !== activeIndex) setActiveIndex(index);
    }
  };

  return (
    <div className="w-full overflow-hidden mb-6 -mx-4 sm:mx-0 relative group">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-3 px-4 pb-6 snap-x no-scrollbar scroll-smooth"
      >
        {items.map((item, i) => (
          <Link
            to={item.link || "/"}
            key={item.id || i}
            className="flex-shrink-0 w-[85vw] sm:w-[500px] h-[160px] sm:h-[180px] rounded-2xl relative overflow-hidden snap-center group block border border-white/30 shadow-lg"
          >
            <motion.div 
              whileHover={{ scale: 0.99 }}
              className="w-full h-full relative will-change-transform"
            >
              <img 
                src={item.image || `https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop`} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Banner"
                decoding="async"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em] shadow-lg w-fit mb-2">Exclusive</span>
                <h3 className="text-white text-lg sm:text-xl font-black mb-0 uppercase tracking-tighter drop-shadow-md italic leading-tight">{item.title}</h3>
                <p className="text-white text-[10px] sm:text-xs mb-1 font-bold drop-shadow-sm opacity-90 uppercase tracking-tight">{item.subtitle}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
      
      {/* Indicators */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1.5 py-2 pointer-events-none">
        {items.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1 rounded-full transition-all duration-300",
              i === activeIndex ? "w-8 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "w-1.5 bg-slate-300"
            )}
          />
        ))}
      </div>
    </div>
  );
});

export const PromotionSection = React.memo(() => {
  return (
    <div className="mx-2 mb-10 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Video Card */}
        <div className="aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 border-2 border-white/20 shadow-2xl relative group min-h-[200px] w-full">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1" 
            title="Promotional Video" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            loading="lazy"
          ></iframe>
          <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-[0.2em] shadow-2xl">Premium Feature</div>
        </div>

        {/* Download App Card */}
        <div className="bg-linear-to-br from-red-600 to-rose-700 rounded-[2.5rem] p-6 flex flex-col justify-between text-white relative overflow-hidden shadow-2xl group min-h-[200px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">Join the Hub</h3>
            <p className="text-white/80 text-xs font-black uppercase tracking-tight mb-6 max-w-[200px] leading-relaxed">Experience lightning fast downloads with our secure mobile portal.</p>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <button className="bg-white text-rose-600 px-6 py-3 rounded-2xl font-black uppercase tracking-wider text-xs shadow-2xl hover:bg-rose-50 transition-all active:scale-95 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download Store
            </button>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-rose-600 bg-slate-200 overflow-hidden shrink-0 shadow-lg">
                  <img src={`https://i.pravatar.cc/32?img=${i + 20}`} alt="user" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full flex items-center justify-center rotate-12">
            <Sparkles className="w-12 h-12 text-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
});

import { useData } from '../contexts/DataContext';

interface TabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hideOnSearch?: boolean;
}

export const PlayStoreTabs = React.memo(({ activeTab, onTabChange, hideOnSearch }: TabProps) => {
  const { settings } = useData();
  
  if (hideOnSearch) return null;

  const tabs = settings.categories && settings.categories.length > 0 
    ? settings.categories 
    : ["All", "Yono app", "Sunali", "Jeet"];
  
  return (
    <div className="mb-6 sticky top-16 z-40">
      <div className="flex overflow-x-auto no-scrollbar gap-2 px-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "whitespace-nowrap px-4 py-1.5 text-[10px] sm:text-xs font-semibold transition-all rounded-full border will-change-transform",
              activeTab === tab 
                ? "bg-red-600 text-white border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)] font-black uppercase tracking-widest scale-105" 
                : "bg-white/40 backdrop-blur-xl border-white/40 hover:bg-white/60 font-bold uppercase tracking-tight"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
});

interface TopChartItemProps {
  rank: number;
  app: any;
  key?: string | number;
}

export const AppListItem = React.memo(({ app, index }: { app: any; index?: number }) => {
  const displayIndex = index !== undefined ? index : (app.serial_number || 1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.3, delay: (index || 0) % 8 * 0.03 }}
      className="will-change-[opacity,transform]"
    >
      <Link 
        to={`/app/${app.slug}`}
        className="flex items-center gap-4 sm:gap-6 p-4 sm:p-5 mb-4 glass-panel hover:brightness-110 dark:hover:brightness-125 transition-all duration-200 active:scale-[0.98] group rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.05)]"
      >
        <div className="w-8 text-base sm:text-lg font-black opacity-30 text-center shrink-0 italic">
          {displayIndex}
        </div>

        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
          {app.is_new && (
            <div className="absolute -top-3 -right-3 z-20 bg-red-600 text-white text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-widest shadow-2xl border-2 border-white italic rotate-12 animate-pulse">
              New
            </div>
          )}
          <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-slate-200 relative z-10">
            <img 
              src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} 
              alt={app.name} 
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center px-1">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-black text-base sm:text-lg leading-tight uppercase tracking-tighter italic">
              {app.name}
            </h3>
            {app.safety_status === 'Verified' && (
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            )}
          </div>

          <div className="text-xs sm:text-sm font-black uppercase tracking-widest leading-none opacity-60">{app.category}</div>

          <div className="flex items-center gap-2.5 leading-none mt-1">
            <span className="text-xs sm:text-sm font-black opacity-40 tracking-tighter">
              {app.rating ? app.rating.toFixed(1) : '10.0'}
            </span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {app.file_size && (
              <span className="text-xs sm:text-sm font-black opacity-40 tracking-tighter ml-1">
                • {app.file_size}
              </span>
            )}
          </div>
        </div>
        
        <div className="shrink-0 pr-2">
          <button className="bg-red-600 text-white px-6 py-2 text-xs sm:text-sm font-black rounded-full transition-all uppercase tracking-widest shadow-2xl shadow-red-600/30 active:scale-95 hover:scale-105 hover:brightness-110">
            Get Now
          </button>
        </div>
      </Link>
    </motion.div>
  );
});

export const TopChartItem = React.memo(({ rank, app }: TopChartItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: (rank % 10) * 0.03 }}
      className="will-change-[opacity,transform]"
    >
      <Link 
        to={`/app/${app.slug}`}
        className="flex items-center gap-4 sm:gap-6 p-4 sm:p-5 mb-3 glass-panel hover:brightness-110 dark:hover:brightness-125 transition-all duration-200 active:scale-[0.99] group rounded-[2rem] shadow-2xl shadow-black/[0.05]"
      >
        <div className="w-8 text-base sm:text-lg font-black opacity-40 text-center shrink-0 italic">
          {rank}
        </div>
        
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
          {app.is_new && (
            <div className="absolute -top-3 -right-3 z-20 bg-red-600 text-white text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-widest shadow-2xl border-2 border-white italic rotate-12 animate-pulse">
              New
            </div>
          )}
          <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-slate-200 relative z-10">
            <img 
              src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} 
              alt={app.name} 
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center px-1">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-black text-base sm:text-lg leading-tight uppercase tracking-tighter italic">
              {app.name}
            </h3>
            {app.safety_status === 'Verified' && <ShieldCheck className="w-4 h-4 shrink-0 text-green-500" />}
          </div>
          <span className="text-xs sm:text-sm font-black opacity-60 uppercase tracking-widest leading-none">{app.category}</span>
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black opacity-40 mt-1 uppercase tracking-tighter leading-none">
            <span>{app.rating ? app.rating.toFixed(1) : '10.0'}</span>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {app.file_size && (
              <span className="ml-1 opacity-70">• {app.file_size}</span>
            )}
          </div>
        </div>
        
        <div className="shrink-0 pr-2">
          <button className="bg-red-600 text-white px-6 py-2 text-xs sm:text-sm font-black rounded-full transition-all uppercase tracking-widest shadow-2xl shadow-red-600/30 active:scale-95 hover:scale-105 hover:brightness-110">
            Get Now
          </button>
        </div>
      </Link>
    </motion.div>
  );
});
