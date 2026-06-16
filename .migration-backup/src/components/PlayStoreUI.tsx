import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ShieldCheck, Star, AlertTriangle, ShieldAlert, ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import React from 'react';

interface BannerProps {
  items: any[];
}

export const FeaturedBanner = React.memo(({ items }: BannerProps) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (!items || items.length <= 1 || isHovered || isDragging) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500); // 4.5s autoplay rotation
    
    return () => clearInterval(interval);
  }, [items, isHovered, isDragging]);

  if (!items || items.length === 0) return null;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    const threshold = 50; // minimum px swipe offset to register transition
    if (info.offset.x < -threshold) {
      handleNext();
    } else if (info.offset.x > threshold) {
      handlePrev();
    }
  };

  return (
    <div 
      className="w-full relative px-4 sm:px-0 max-w-4xl mx-auto mb-5 group/carousel select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full overflow-hidden rounded-[20px] shadow-sm border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/40 relative h-[130px] sm:h-[160px] md:h-[185px]">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.4}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="flex h-full w-full cursor-grab active:cursor-grabbing"
          style={{ width: `${items.length * 100}%` }}
        >
          {items.map((item, i) => {
            const isExternal = item.link && (item.link.startsWith('http://') || item.link.startsWith('https://') || item.link.startsWith('//'));
            const isJavaScript = item.link && item.link.trim().toLowerCase().startsWith('javascript:');
            
            // Proactive security: Prevent dynamic XSS payloads in banner URL
            if (isJavaScript) return null;

            const content = (
              <div className="w-full h-full relative overflow-hidden select-none pointer-events-none">
                <img 
                  src={item.image || `https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop`} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 pointer-events-none"
                  alt="Banner"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop";
                  }}
                />
                
                {/* Visual Glassmorphism gradient back overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pt-10 pb-3 px-4 sm:px-6 flex flex-col justify-end" />
                
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end">
                  <div className="flex items-center gap-1.5 mb-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 w-fit">
                    <Sparkles className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-[9px] font-bold uppercase tracking-wider">Featured App</span>
                  </div>
                  <div>
                    <h3 className="text-white text-base sm:text-lg md:text-xl font-black tracking-tight leading-none mb-1 text-left">
                      {item.title}
                    </h3>
                    <p className="text-white/80 text-[11px] sm:text-xs font-semibold leading-tight line-clamp-1 text-left">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            );

            const slideStyle = { width: `${100 / items.length}%` };

            if (isExternal) {
              return (
                <a 
                  key={item.id || i}
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="h-full block flex-shrink-0"
                  style={slideStyle}
                  draggable={false}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={item.id || i}
                to={item.link || "/"}
                className="h-full block flex-shrink-0"
                style={slideStyle}
                draggable={false}
              >
                {content}
              </Link>
            );
          })}
        </motion.div>
      </div>

      {/* Prev / Next controls (only visible on hover, desktop only for touch screen friendly clean interface) */}
      {items.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 focus:outline-none cursor-pointer hidden md:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 focus:outline-none cursor-pointer hidden md:flex"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Modern expandable indicator dots */}
      {items.length > 1 && (
        <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1.5 py-1 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="group/dot focus:outline-none cursor-pointer py-1"
              aria-label={`Go to slide ${i + 1}`}
            >
              <motion.div 
                className={cn(
                  "h-1.5 rounded-full", 
                  i === currentIndex ? "bg-white" : "bg-white/40 group-hover/dot:bg-white/60"
                )}
                animate={{ width: i === currentIndex ? 18 : 6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export const PromotionSection = React.memo(() => {
  return (
    <div className="mx-2 mb-10 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Video Card */}
        <div className="aspect-video rounded-[32px] overflow-hidden bg-zinc-900 border border-black/5 dark:border-white/5 shadow-sm relative group min-h-[200px] w-full">
          <iframe 
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1" 
            title="Promotional Video" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>

        {/* Secure Access Hub Card */}
        <div className="bg-blue-600 rounded-[32px] p-8 flex flex-col justify-between text-white relative overflow-hidden shadow-md group min-h-[200px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative z-10 w-full max-w-[280px]">
            <h3 className="text-2xl font-bold tracking-tight mb-2">Editor's Choice</h3>
            <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6">Discover the most innovative and carefully crafted applications curated by our team.</p>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold text-sm shadow-sm hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Explore Selection
            </button>
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

  let tabs = settings.categories && settings.categories.length > 0 
    ? settings.categories 
    : ["All Apps", "Games", "Apps", "Entertainment"];
    
  if (tabs.length > 0 && !tabs.some(c => c.toLowerCase() === 'all' || c.toLowerCase() === 'all apps' || c.toLowerCase() === 'home' || c.toLowerCase() === 'apps')) {
    tabs = ["All Apps", ...tabs];
  }
  
  return (
    <div className="mb-6 sticky top-16 z-40 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex overflow-x-auto no-scrollbar gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "whitespace-nowrap px-4 py-2 text-sm font-medium transition-all rounded-full border",
              activeTab === tab 
                ? "bg-blue-500 text-white border-blue-500 shadow-sm" 
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-black/5 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
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
  const [isActuallyComingSoon, setIsActuallyComingSoon] = React.useState(() => {
    if (!app.is_coming_soon) return false;
    if (!app.publish_date) return true;
    return new Date(app.publish_date).getTime() > new Date().getTime();
  });
  
  React.useEffect(() => {
    if (!app.is_coming_soon || !app.publish_date) return;
    const interval = setInterval(() => {
      setIsActuallyComingSoon(new Date(app.publish_date).getTime() > new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [app.is_coming_soon, app.publish_date]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-2px" }}
      transition={{ duration: 0.1, delay: (index || 0) % 6 * 0.005 }}
      className="will-change-[opacity,transform]"
    >
      <Link 
        to={`/${app.slug}`}
        onClick={() => {
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10);
          }
        }}
        className="flex items-center gap-4 p-4 mb-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200 group rounded-2xl relative active:scale-[0.98]"
      >
        <div className="w-6 sm:w-8 text-sm font-bold text-zinc-400 dark:text-zinc-500 text-center shrink-0">
          {displayIndex}
        </div>

        <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0">
          <div className="w-full h-full rounded-[18px] overflow-hidden bg-white shadow-sm border border-black/5 dark:border-white/10 relative z-10 transition-transform group-hover:-translate-y-0.5 duration-300">
            <img 
              src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} 
              alt={app.name} 
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop";
              }}
            />
            {isActuallyComingSoon && (
              <div className="absolute top-1 right-1 pointer-events-none">
                <div className="bg-amber-500/95 backdrop-blur-[1px] text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-[1px] rounded shadow-sm border border-amber-400">
                  Soon
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-base sm:text-[17px] tracking-tight text-zinc-900 dark:text-zinc-100 truncate w-full">
              {app.name}
            </h3>
          </div>

          <div className="text-xs sm:text-[13px] font-normal text-zinc-500 dark:text-zinc-400 truncate">
            {app.category}
          </div>

          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
            <span>{app.rating ? app.rating.toFixed(1) : '10.0'}</span>
            <Star className="w-3 h-3 fill-current text-zinc-400" />
            {app.safety_status === 'Verified' && (
              <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0 ml-1" />
            )}
          </div>
        </div>
        
        <div className="shrink-0 pr-1">
          <div className="bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 px-4 py-1 text-[11px] font-bold rounded-full transition-all duration-300 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900 shadow-sm border border-transparent group-hover:border-black/5 dark:group-hover:border-white/5">
            {isActuallyComingSoon ? 'SOON' : 'MORE'}
          </div>
        </div>
        
        <div className="absolute bottom-0 right-4 left-[104px] border-b border-black/5 dark:border-white/5 opacity-50 transition-opacity group-hover:opacity-0" />
      </Link>
    </motion.div>
  );
});

export const TopChartItem = React.memo(({ rank, app }: TopChartItemProps) => {
  const [isActuallyComingSoon, setIsActuallyComingSoon] = React.useState(() => {
    if (!app.is_coming_soon) return false;
    if (!app.publish_date) return true;
    return new Date(app.publish_date).getTime() > new Date().getTime();
  });
  
  React.useEffect(() => {
    if (!app.is_coming_soon || !app.publish_date) return;
    const interval = setInterval(() => {
      setIsActuallyComingSoon(new Date(app.publish_date).getTime() > new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [app.is_coming_soon, app.publish_date]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.15, delay: (rank % 8) * 0.01 }}
      className="will-change-[opacity,transform]"
    >
      <Link 
        to={`/${app.slug}`}
        onClick={() => {
          if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10);
          }
        }}
        className="flex items-center gap-4 p-4 mb-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200 group rounded-2xl relative active:scale-[0.98]"
      >
        <div className="w-6 sm:w-8 text-sm font-bold text-zinc-400 dark:text-zinc-500 text-center shrink-0">
          {rank}
        </div>
        
        <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0">
          <div className="w-full h-full rounded-[18px] overflow-hidden bg-white shadow-sm border border-black/5 dark:border-white/10 relative z-10 transition-transform group-hover:-translate-y-0.5 duration-300">
            <img 
              src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} 
              alt={app.name} 
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop";
              }}
            />
            {isActuallyComingSoon && (
              <div className="absolute top-1 right-1 pointer-events-none">
                <div className="bg-amber-500/95 backdrop-blur-[1px] text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-[1px] rounded shadow-sm border border-amber-400">
                  Soon
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-base sm:text-[17px] tracking-tight text-zinc-900 dark:text-zinc-100 truncate w-full">
              {app.name}
            </h3>
          </div>
          <div className="text-xs sm:text-[13px] font-normal text-zinc-500 dark:text-zinc-400 truncate">
            {app.category}
          </div>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
            <span>{app.rating ? app.rating.toFixed(1) : '10.0'}</span>
            <Star className="w-3 h-3 fill-current text-zinc-400" />
            {app.safety_status === 'Verified' && <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0 ml-1" />}
          </div>
        </div>
        
        <div className="shrink-0 pr-1">
          <div className="bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 px-4 py-1 text-[11px] font-bold rounded-full transition-all duration-300 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-zinc-900 shadow-sm border border-transparent group-hover:border-black/5 dark:group-hover:border-white/5">
            {isActuallyComingSoon ? 'SOON' : 'MORE'}
          </div>
        </div>
        
        <div className="absolute bottom-0 right-4 left-[104px] border-b border-black/5 dark:border-white/5 opacity-50 transition-opacity group-hover:opacity-0" />
      </Link>
    </motion.div>
  );
});

export const AppListItemSkeleton = () => {
  return (
    <div className="flex items-center gap-4 p-4 mb-2 animate-pulse rounded-2xl relative select-none">
      <div className="w-6 sm:w-8 text-center shrink-0">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4 mx-auto" />
      </div>

      <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0">
        <div className="w-full h-full rounded-[18px] bg-zinc-200 dark:bg-zinc-700" />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="bg-zinc-200 dark:bg-zinc-800 rounded h-4 w-1/3" />
        </div>

        <div className="bg-zinc-200 dark:bg-zinc-800 rounded h-3 w-1/4" />

        <div className="flex items-center gap-1 mt-0.5">
          <div className="bg-zinc-200 dark:bg-zinc-800 rounded h-3 w-8" />
        </div>
      </div>
      
      <div className="shrink-0 pr-1">
        <div className="w-14 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      </div>
      
      <div className="absolute bottom-0 right-4 left-[104px] border-b border-black/5 dark:border-white/5 opacity-50" />
    </div>
  );
};

export const TopChartItemSkeleton = ({ rank }: { rank: number }) => {
  return (
    <div className="flex items-center gap-4 p-4 mb-2 animate-pulse rounded-2xl relative select-none">
      <div className="w-6 sm:w-8 text-sm font-bold text-zinc-300 dark:text-zinc-700 text-center shrink-0">
        {rank}
      </div>
      
      <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0">
        <div className="w-full h-full rounded-[18px] bg-zinc-200 dark:bg-zinc-800" />
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="bg-zinc-200 dark:bg-zinc-800 rounded h-4 w-1/2" />
        </div>
        <div className="bg-zinc-200 dark:bg-zinc-800 rounded h-3 w-1/3" />
        <div className="flex items-center gap-1 mt-0.5">
          <div className="bg-zinc-200 dark:bg-zinc-800 rounded h-3 w-8" />
        </div>
      </div>
      
      <div className="shrink-0 pr-1">
        <div className="w-14 h-7 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      </div>
      
      <div className="absolute bottom-0 right-4 left-[104px] border-b border-black/5 dark:border-white/5 opacity-50 opacity-50" />
    </div>
  );
};

export const NewAdditionItemSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 animate-pulse p-1 select-none">
      <div className="aspect-square rounded-[18px] bg-zinc-200 dark:bg-zinc-800 w-full" />
      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3 mx-auto mt-1" />
    </div>
  );
};

