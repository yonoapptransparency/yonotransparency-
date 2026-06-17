import { DataProvider, useData } from './contexts/DataContext';
import { useLocation, BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Menu, Shield, ShieldCheck, Info, ArrowRight, X, LayoutGrid, Newspaper, Sparkles, Send, MoreHorizontal, Search, Video } from 'lucide-react';
import Home from './pages/Home';
import PublicChatbot from './components/PublicChatbot';
import React, { useState, useEffect, useMemo, Suspense, lazy, ComponentType, LazyExoticComponent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Polished, high-performance loading screen that can be referenced by the preloader system
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
      <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-medium tracking-wide text-zinc-500 animate-pulse">Loading...</p>
    </div>
  );
}

// --- HIGH PERFORMANCE CUSTOM ROUTE PRELOADER ENGINE ---
// Caches resolved ES modules to bypass React Suspense triggers and provide completely synchronous, zero-lag rendering.
const resolvedComponents: Record<string, ComponentType<any>> = {};
const loadingPromises: Record<string, Promise<any> | undefined> = {};

export function preloadComponent(name: string, importFn: () => Promise<{ default: ComponentType<any> }>) {
  if (resolvedComponents[name]) {
    return Promise.resolve(resolvedComponents[name]);
  }
  if (loadingPromises[name]) {
    return loadingPromises[name];
  }
  const promise = importFn()
    .then((mod) => {
      resolvedComponents[name] = mod.default;
      return mod.default;
    })
    .catch((err) => {
      console.error(`[Preloader] Failed to resolve chunk for ${name}:`, err);
      // If it is a chunk load failure (which happens after structural deployment), auto-reload the window to fetch fresh scripts.
      if (err?.message?.includes('Failed to fetch dynamically imported module')) {
        const hasReloaded = sessionStorage.getItem(`reloaded_chunk_${name}`);
        if (!hasReloaded) {
          sessionStorage.setItem(`reloaded_chunk_${name}`, 'true');
          window.location.reload();
        }
      }
      delete loadingPromises[name];
      throw err;
    });
  loadingPromises[name] = promise;
  return promise;
}

function getPreloadedComponent(
  name: string,
  importFn: () => Promise<{ default: ComponentType<any> }>,
  Fallback: ComponentType<any>
) {
  return function PreloadedComponentWrapper(props: any) {
    const [Comp, setComp] = useState<ComponentType<any> | null>(() => resolvedComponents[name] || null);

    useEffect(() => {
      let active = true;
      if (!Comp) {
        preloadComponent(name, importFn)
          .then((resolved) => {
            if (active) {
              setComp(() => resolved);
            }
          })
          .catch(() => {});
      }
      return () => {
        active = false;
      };
    }, [Comp]);

    if (Comp) {
      return <Comp {...props} />;
    }
    return <Fallback {...props} />;
  };
}

// Helper utility to make lazy imports bulletproof against redeployment chunk-load/fetch errors
function lazyRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error: any) {
      console.warn("Chunk loading/network anomaly detected. Reloading viewport payload...", error);
      // Automatically refresh the page to pull the latest production build from the server.
      window.location.reload();
      return new Promise(() => {}) as Promise<{ default: T }>;
    }
  });
}

// Code-Splitting Loaders: Registered explicitly so both lazy routers and smart background prefetch workers can invoke them
const loaders = {
  Home: () => import('./pages/Home'),
  AppDetails: () => import('./pages/AppDetails'),
  GatewayPage: () => import('./pages/GatewayPage'),
  About: () => import('./pages/About'),
  Contact: () => import('./pages/Contact'),
  Privacy: () => import('./pages/Privacy'),
  Terms: () => import('./pages/Terms'),
  Responsibility: () => import('./pages/Responsibility'),
  NewApps: () => import('./pages/NewApps'),
  NewsPage: () => import('./pages/NewsPage'),
  NewsDetailPage: () => import('./pages/NewsDetailPage'),
  Blogs: () => import('./pages/Blogs'),
  BlogDetailPage: () => import('./pages/BlogDetailPage'),
  VideosPage: () => import('./pages/VideosPage'),
  VideoDetailPage: () => import('./pages/VideoDetailPage'),
  AdminLogin: () => import('./pages/AdminLogin'),
  AdminDashboard: () => import('./pages/AdminDashboard'),
};

// Start prefetching page assets at parse-time before React bundle initialization even finishes!
const initialPath = window.location.pathname;

function prefetchOtherRoutes() {
  const routes = [
    'AppDetails', 'GatewayPage', 'NewApps', 'NewsPage', 'VideosPage',
    'About', 'Contact', 'Privacy', 'Terms', 'Responsibility',
    'NewsDetailPage', 'Blogs', 'BlogDetailPage', 'VideoDetailPage'
  ];
  let delay = 500;
  routes.forEach((route) => {
    setTimeout(() => {
      // @ts-ignore
      preloadComponent(route, loaders[route]).catch(() => {});
    }, delay);
    delay += 300;
  });
}

if (initialPath === '/' || initialPath === '') {
  setTimeout(prefetchOtherRoutes, 800);
} else if (initialPath.startsWith('/app/')) {
  preloadComponent('AppDetails', loaders.AppDetails).catch(() => {});
  setTimeout(prefetchOtherRoutes, 1000);
} else {
  setTimeout(prefetchOtherRoutes, 500);
}

const AppDetails = lazyRetry(loaders.AppDetails);
const GatewayPage = lazyRetry(loaders.GatewayPage);
const NewApps = lazyRetry(loaders.NewApps);
const NewsPage = lazyRetry(loaders.NewsPage);
const VideosPage = lazyRetry(loaders.VideosPage);
const About = lazyRetry(loaders.About);
const Contact = lazyRetry(loaders.Contact);
const Privacy = lazyRetry(loaders.Privacy);
const Terms = lazyRetry(loaders.Terms);
const Responsibility = lazyRetry(loaders.Responsibility);
const NewsDetailPage = lazyRetry(loaders.NewsDetailPage);
const Blogs = lazyRetry(loaders.Blogs);
const BlogDetailPage = lazyRetry(loaders.BlogDetailPage);
const VideoDetailPage = lazyRetry(loaders.VideoDetailPage);
const AdminLogin = lazyRetry(loaders.AdminLogin);
const AdminDashboard = lazyRetry(loaders.AdminDashboard);

import FallbackRouteMatcher from './components/FallbackRouteMatcher';

import { getAdminPath } from './lib/utils';
import Ticker from './components/Ticker';
import SupportWidget from './components/SupportWidget';
import GlobalSearch from './components/GlobalSearch';
import StarRatingFeedback from './components/StarRatingFeedback';
import QuickHub from './components/QuickHub';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function Header() {
  const { settings } = useData();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      setTimeout(() => {
        try {
          window.navigator.vibrate(10);
        } catch (e) {}
      }, 0);
    }
  };

  const navVariants = settings.animations_enabled ? {
    hidden: { y: -10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.2 } }
  } : {
    hidden: { y: 0, opacity: 1 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <>
      <motion.header 
        initial="hidden"
        animate="visible"
        variants={navVariants}
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-transparent py-2' : 'bg-transparent py-3'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative flex justify-between items-center">
          <Link to="/" onClick={triggerHaptic} className="flex items-center gap-2 sm:gap-3 group">
            <div className="p-0 transition-transform group-hover:scale-[1.02] duration-300">
              {settings.logo_url ? <img src={settings.logo_url} width={48} height={48} className="w-10 h-10 sm:w-14 sm:h-14 object-contain" alt="Logo" /> : <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-500 rounded-lg sm:rounded-2xl flex items-center justify-center text-white font-semibold">{settings.site_title?.substring(0, 1)}</div>}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base sm:text-[22px] font-bold tracking-tight text-zinc-900 dark:text-white">{settings.site_title}</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4 lg:gap-8 text-sm font-medium">
            <Link to="/" onClick={triggerHaptic} className={`transition-all p-2 tracking-wide relative ${pathname === '/' ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-500 dark:text-zinc-300'}`}>
              Home
              {pathname === '/' && <motion.div layoutId="header-active" className="absolute -bottom-1 left-2 right-2 h-[2px] bg-blue-600 rounded-t-full" />}
            </Link>
            <Link to="/new-apps" onClick={triggerHaptic} className={`transition-all p-2 tracking-wide flex items-center gap-1.5 relative ${pathname === '/new-apps' ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-500 dark:text-zinc-300'}`}>
              New Apps <span className="flex w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {pathname === '/new-apps' && <motion.div layoutId="header-active" className="absolute -bottom-1 left-2 right-2 h-[2px] bg-blue-600 rounded-t-full" />}
            </Link>
            <Link to="/news" onClick={triggerHaptic} className={`transition-all p-2 tracking-wide relative ${pathname === '/news' ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-500 dark:text-zinc-300'}`}>
              News
              {pathname === '/news' && <motion.div layoutId="header-active" className="absolute -bottom-1 left-2 right-2 h-[2px] bg-blue-600 rounded-t-full" />}
            </Link>
            <div className="relative group/more" onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
              <button 
                className={`transition-all p-2 tracking-wide flex items-center gap-1 relative ${['/videos', '/blogs', '/contact', '/privacy', '/terms', '/about', '/responsibility'].includes(pathname) ? 'text-blue-600' : 'text-zinc-600 hover:text-blue-500 dark:text-zinc-300'}`}
                onClick={triggerHaptic}
              >
                More <MoreHorizontal className="w-4 h-4 ml-1" />
              </button>
              
              <AnimatePresence>
                {moreOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full right-0 mt-1 w-48 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden py-2 z-50"
                  >
                    {[
                      { to: '/videos', label: 'Videos', icon: Video },
                      { to: '/blogs', label: 'Blogs', icon: LayoutGrid },
                      { to: '/about', label: 'About Us', icon: Info },
                      { to: '/contact', label: 'Contact', icon: Send },
                      { to: '/responsibility', label: 'Safety', icon: ShieldCheck },
                      { to: '/privacy', label: 'Privacy', icon: ShieldCheck },
                      { to: '/terms', label: 'Terms', icon: ShieldCheck },
                    ].map((item) => (
                      <Link 
                        key={item.to}
                        to={item.to} 
                        onClick={() => { setMoreOpen(false); triggerHaptic(); }}
                        className={`flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${pathname === item.to ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        <item.icon className="w-4 h-4 opacity-70" />
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-4 h-6">
              {/* Premium Search Capsule Bar */}
              <button 
                onClick={() => { triggerHaptic(); setSearchOpen(true); }}
                className="flex items-center gap-2 bg-zinc-100/50 dark:bg-zinc-800/50 hover:bg-zinc-200/50 transition-all text-left px-4 py-1.5 w-44 lg:w-52 rounded-full group outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Search Store"
              >
                <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-500 transition-colors shrink-0" />
                <span className="text-[13px] text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors truncate">Search...</span>
              </button>

              {/* Unified Portal Quick Access Hub */}
              <QuickHub isMobileSize={false} />

              {settings.helpline_telegram && (
                <a 
                  href={settings.helpline_telegram.startsWith('http') ? settings.helpline_telegram : `https://t.me/${settings.helpline_telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition-colors"
                  aria-label="Telegram"
                >
                  <Send className="w-3.5 h-3.5" />
                </a>
              )}
              <SupportWidget />
            </div>
          </nav>

          <div className="md:hidden flex items-center gap-3">
            {/* Mobile Touch-Target Search Capsule Bar */}
            <button 
              onClick={() => { triggerHaptic(); setSearchOpen(true); }}
              className="flex items-center justify-center w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-full active:scale-95 transition-all text-zinc-500"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Unified Portal Quick Access Hub */}
            <QuickHub isMobileSize={true} />

            {settings.helpline_telegram && (
              <a 
                href={settings.helpline_telegram.startsWith('http') ? settings.helpline_telegram : `https://t.me/${settings.helpline_telegram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-500 rounded-full"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            )}
            <SupportWidget />
            <button 
              className="flex items-center justify-center w-9 h-9 bg-zinc-900 dark:bg-white rounded-full active:scale-95 transition-transform"
              onClick={() => { triggerHaptic(); setMenuOpen(true); }}
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 text-white dark:text-zinc-900" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-white/98 dark:bg-slate-950/98 backdrop-blur-2xl flex flex-col px-6 py-8 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8 shrink-0">
              <span className="text-xl font-bold flex items-center gap-2 tracking-tight text-zinc-900 dark:text-white">
                {settings.logo_url ? <img src={settings.logo_url} width={24} height={24} className="w-6 h-6 object-contain" alt="Logo" /> : <Shield className="w-6 h-6 text-blue-500" />} {settings.site_title}
              </span>
              <button 
                onClick={() => { triggerHaptic(); setMenuOpen(false); }}
                className="flex items-center justify-center w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full active:scale-95 transition-transform"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="grid grid-cols-2 gap-3 mb-6 shrink-0">
              {[
                { to: '/', label: 'Home', icon: LayoutGrid },
                { to: '/new-apps', label: 'New Apps', icon: Sparkles, hot: true },
                { to: '/news', label: 'News', icon: Newspaper },
                { to: '/videos', label: 'Videos', icon: Video },
                { to: '/blogs', label: 'Blogs', icon: Menu },
                { to: '/responsibility', label: 'Safety', icon: ShieldCheck },
                { to: '/about', label: 'About Us', icon: Info },
                { to: '/contact', label: 'Contact', icon: Send },
                { to: '/privacy', label: 'Privacy', icon: ShieldCheck },
                { to: '/terms', label: 'Terms', icon: ShieldCheck },
              ].map((item) => {
                const active = pathname === item.to;
                return (
                  <Link 
                    key={item.to}
                    onClick={() => { triggerHaptic(); setMenuOpen(false); }} 
                    to={item.to} 
                    className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white' : 'bg-black/5 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-black/10'}`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    <span className="text-[13px] font-medium truncate">{item.label}</span>
                    {item.hot && <span className="flex w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto shrink-0"></span>}
                  </Link>
                );
              })}
            </nav>
            
            <div className="mt-auto pt-6 border-t border-black/5 dark:border-white/5 text-center shrink-0">
              <span className="text-xs text-zinc-400 font-medium">&copy; {new Date().getFullYear()} {settings.site_title}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function Footer() {
  const { settings } = useData();
  return (
    <footer className="pt-16 pb-8 border-t border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950 mt-12 w-full">
      <div className="max-w-[1550px] mx-auto flex flex-col items-center text-center px-4 sm:px-8 w-full">
        <h3 className="text-2xl font-bold tracking-tight mb-3 flex items-center gap-2">
          <div className="p-1">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                width={36} 
                height={36} 
                className="w-9 h-9 object-contain" 
                alt="Logo" 
              />
            ) : (
              <Shield className="w-8 h-8 text-blue-500" />
            )}
          </div>
          <span className="text-zinc-900 dark:text-zinc-100">
            {settings.site_title}
          </span>
        </h3>
        <p className="text-[15px] mb-8 max-w-xl text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium px-2">
          {settings.meta_description}
        </p>
        <div id="footer-feedback-section" className="w-full mb-12 px-2">
          <StarRatingFeedback />
        </div>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[13px] font-medium mb-16 text-zinc-600 dark:text-zinc-400 px-2">
          <Link to="/" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Home</Link>
          <Link to="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Contact</Link>
          <Link to="/videos" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Apps</Link>
          <Link to="/blogs" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Blog</Link>
          <Link to="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Terms</Link>
        </div>
        
        {(settings.disclaimer_text || settings.ethics_discrimination_text) && (
          <div className="max-w-[1550px] w-full flex flex-col gap-6 mb-12">
            {settings.disclaimer_text && (
              <div className="bg-white dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 sm:p-6 md:p-8 text-left shadow-sm w-full">
                <h4 className="text-sm font-semibold mb-3 text-zinc-900 dark:text-white uppercase tracking-wider">{settings.disclaimer_heading || 'Disclaimer'}</h4>
                <div 
                  className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed disclaimer-content"
                  dangerouslySetInnerHTML={{ __html: settings.disclaimer_text }}
                />
              </div>
            )}
            {settings.ethics_discrimination_text && (
              <div className="bg-white dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 sm:p-6 md:p-8 text-left shadow-sm w-full">
                <h4 className="text-sm font-semibold mb-3 text-zinc-900 dark:text-white uppercase tracking-wider">{settings.ethics_heading || 'Ethics & Safety'}</h4>
                <div 
                  className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed disclaimer-content"
                  dangerouslySetInnerHTML={{ __html: settings.ethics_discrimination_text }}
                />
              </div>
            )}
          </div>
        )}

        {settings.important_notice && (
          <div className="max-w-[1550px] w-full mb-12">
            <div className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 sm:p-6 md:p-8 text-left">
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">{settings.important_notice_heading || 'Notice'}</h4>
              <div 
                className="text-sm text-blue-800 dark:text-blue-200/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: settings.important_notice }}
              />
            </div>
          </div>
        )}

        <div className="text-xs text-zinc-400 flex flex-col items-center gap-4">
          <span>&copy; {new Date().getFullYear()} {settings.site_title}.</span>
          <SyncStatus />
        </div>
      </div>
    </footer>
  );
}

function SyncStatus() {
  const { isConnected, refreshAll, lastSyncTime, testCloudConnection, isLive } = useData();
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  
  const handleForceSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await refreshAll();
      alert("Manual Sync: Your data is now up-to-date with the Cloud Server.");
    } catch (err: any) {
      alert("Sync Failed: Failed to reach Cloud Server. " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    if (testing) return;
    setTesting(true);
    const success = await testCloudConnection();
    if (success) {
      alert("Real-time OK: The cloud acknowledged your test signal. Your connection is healthy!");
    } else {
      alert("Real-time ERROR: Failed to send signal to cloud. Please check if your device allows WebSockets or try another network.");
    }
    setTesting(false);
  };

  const handleClearCache = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 4000);
    } else {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <button 
          onClick={handleForceSync}
          disabled={syncing}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${isConnected === true ? (isLive ? 'bg-green-500/10 text-green-600 shadow-sm' : 'bg-orange-500/10 text-orange-600 shadow-sm') : isConnected === false ? 'bg-red-500/10 text-red-600 shadow-sm' : 'bg-slate-500/10 text-slate-500 text-slate-400'}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-blue-500 animate-spin' : isConnected === true ? (isLive ? 'bg-green-500' : 'bg-orange-500') : isConnected === false ? 'bg-red-500' : 'bg-slate-400 animate-pulse'}`}></div>
          {syncing ? 'Syncing...' : isConnected === true ? (isLive ? 'Live' : 'Cached') : isConnected === false ? 'Offline' : 'Connecting'}
        </button>
        {lastSyncTime && (
          <span className="text-[10px] text-zinc-400">Updated: {lastSyncTime}</span>
        )}
      </div>
      
      <div className="flex items-center gap-4 mt-1">
        <button 
          onClick={handleTestConnection}
          disabled={testing}
          className="text-[11px] text-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          {testing ? 'Testing...' : 'Diagnostics'}
        </button>
        <button 
          onClick={handleClearCache}
          className={`text-[11px] font-medium transition-colors ${confirmClear ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          {confirmClear ? 'Confirm Reset' : 'Reset'}
        </button>
      </div>
    </div>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(window.scrollY > window.innerHeight / 2);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-24 md:bottom-8 right-6 z-50 p-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full shadow-lg border border-black/5 dark:border-white/10 transition-transform hover:scale-110 active:scale-95"
          aria-label="Back to top"
        >
          <ArrowRight className="w-5 h-5 -rotate-90 opacity-70" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function BackgroundPrefetcher() {
  const location = useLocation();
  const { apps = [], news = [] } = useData();

  useEffect(() => {
    const path = location.pathname;
    const isHome = path === '/' || path === '';
    const isAppPage = path.startsWith('/app/');

    // Helper functions for smart prefetching with modern idle triggers
    const triggerPrefetch = (prefetchFn: () => void) => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(prefetchFn, { timeout: 3500 });
      } else {
        setTimeout(prefetchFn, 800);
      }
    };

    const preloadImage = (url: string) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    };

    if (isHome) {
      console.log("[Prefetcher] User is on Homepage. Preloading AppDetails code chunk & top apps' branding...");
      
      // 1. Immediately request the main app details page bundle chunk and populate synchronous preloader cache
      triggerPrefetch(() => {
        preloadComponent('AppDetails', loaders.AppDetails).catch(() => {});
        preloadComponent('NewApps', loaders.NewApps).catch(() => {});
        preloadComponent('GatewayPage', loaders.GatewayPage).catch(() => {});
      });

      // 2. Preload primary image assets for the top apps so they render list items and pages instantly on click
      triggerPrefetch(() => {
        apps.slice(0, 10).forEach(app => {
          if (app.icon_url) preloadImage(app.icon_url);
          if (app.og_image_url) preloadImage(app.og_image_url);
        });
      });
    } else if (isAppPage) {
      // Find current app slug from pathname
      const slug = decodeURIComponent(path.split('/app/')[1]?.split('/')[0]?.split('?')[0] || '');
      console.log(`[Prefetcher] User is on App Details page (${slug}). Preloading Home code chunk & other apps' assets...`);

      // 1. Immediately request the primary dashboard bundle chunk and cache synchronously
      triggerPrefetch(() => {
        preloadComponent('Home', loaders.Home).catch(() => {});
        preloadComponent('GatewayPage', loaders.GatewayPage).catch(() => {});
      });

      // 2. Preload assets of OTHER apps in our catalog so navigating between them is completely seamless
      triggerPrefetch(() => {
        const otherApps = apps.filter(app => app.slug?.toLowerCase() !== slug.toLowerCase());
        otherApps.slice(0, 8).forEach(app => {
          if (app.icon_url) preloadImage(app.icon_url);
          if (app.og_image_url) preloadImage(app.og_image_url);
        });

        if (news && news.length > 0) {
          news.slice(0, 2).forEach(n => {
            if (n.logo_url) preloadImage(n.logo_url);
          });
        }
      });
    } else {
      // Other pages: prefetch critical Home and AppDetails views
      triggerPrefetch(() => {
        preloadComponent('Home', loaders.Home).catch(() => {});
        preloadComponent('AppDetails', loaders.AppDetails).catch(() => {});
      });
    }
  }, [location.pathname, apps, news]);

  return null;
}

function AppContent() {
  const { settings, apps = [], news = [], blogs = [], videos = [], quotaExceeded } = useData();
  const location = useLocation();
  const [isAgeVerified, setIsAgeVerified] = useState(true);

  const adminPath = getAdminPath();
  const isAdminPath = location.pathname.startsWith(`/${adminPath}`);

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      setTimeout(() => {
        try {
          window.navigator.vibrate(10);
        } catch (e) {}
      }, 0);
    }
  };

  // Dynamic SEO meta tag manager that reacts to the current page state, keeping it strictly in sync with the database settings and content models
  useEffect(() => {
    if (!settings) return;

    const stripHtml = (html: string) => {
      if (!html) return '';
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    };

    const siteTitle = settings.site_title || '';
    let pageTitle = siteTitle;
    let pageDesc = settings.meta_description || '';
    let pageKeywords = settings.seo_keywords || '';
    let pageOgImage = settings.logo_url || '';
    let pageAuthor = siteTitle;
    let pageRobots = 'index, follow';

    const path = location.pathname;

    const setMetaTag = (nameOrProperty: string, content: string, isProperty: boolean = false) => {
      const attributeName = isProperty ? 'property' : 'name';
      const selector = `meta[${attributeName}="${nameOrProperty}"]`;
      let element = document.querySelector(selector);
      if (!content) {
        if (element) element.remove();
        return;
      }
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, nameOrProperty);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (isAdminPath) {
      pageTitle = `Admin Dashboard - ${siteTitle}`;
      pageDesc = 'Admin authentication and management portal.';
      pageKeywords = 'admin, dashboard';
      pageRobots = 'noindex, nofollow, noarchive, nosnippet';
    } else if (path === '/' || path === '') {
      pageTitle = siteTitle;
      pageDesc = settings.meta_description || '';
      pageKeywords = settings.seo_keywords || '';
      pageOgImage = settings.logo_url || '';
    } else if (path === '/about') {
      pageTitle = `About Us - ${siteTitle}`;
      pageDesc = settings.meta_description || '';
      pageKeywords = settings.seo_keywords || '';
    } else if (path === '/contact') {
      pageTitle = `Contact Us - ${siteTitle}`;
      pageDesc = settings.meta_description || '';
      pageKeywords = settings.seo_keywords || '';
    } else if (path === '/privacy') {
      pageTitle = `Privacy Policy - ${siteTitle}`;
      pageDesc = settings.meta_description || '';
      pageKeywords = settings.seo_keywords || '';
    } else if (path === '/terms') {
      pageTitle = `Terms and Conditions - ${siteTitle}`;
      pageDesc = settings.meta_description || '';
      pageKeywords = settings.seo_keywords || '';
    } else if (path === '/responsibility') {
      pageTitle = `Responsible Gaming - ${siteTitle}`;
      pageDesc = settings.meta_description || '';
      pageKeywords = settings.seo_keywords || '';
    } else if (path === '/news') {
      pageTitle = `Latest News - ${siteTitle}`;
      pageDesc = 'Read our official news and verified coverage.';
      pageKeywords = settings.seo_keywords || '';
    } else if (path === '/blogs') {
      pageTitle = `Expert Strategy Blogs - ${siteTitle}`;
      pageDesc = 'Comprehensive casual gaming strategy breakdowns, tips, and tutorials.';
      pageKeywords = settings.seo_keywords || '';
    } else if (path === '/videos') {
      pageTitle = `Video Interface Walkthroughs - ${siteTitle}`;
      pageDesc = 'Watch video walkthroughs, system reviews, and strategic play-through breakdowns.';
      pageKeywords = settings.seo_keywords || '';
    } else if (path.startsWith('/app/')) {
      const slug = decodeURIComponent(path.split('/app/')[1]?.split('/')[0]?.split('?')[0] || '');
      const app = apps.find((a: any) => a?.slug?.toLowerCase() === slug.toLowerCase());
      if (app) {
        pageTitle = app.seo_title || app.name || siteTitle;
        const rawDesc = app.seo_description || '';
        const rawHtml = app.description_html || '';
        pageDesc = rawDesc ? rawDesc : (rawHtml ? stripHtml(rawHtml).substring(0, 160) : '');
        pageKeywords = app.seo_keywords || '';
        pageOgImage = app.og_image_url || app.icon_url || settings.logo_url || '';
      }
    } else if (path.startsWith('/info/') || path.startsWith('/gateway/')) {
      const parts = path.split('/');
      const slug = decodeURIComponent(parts[2]?.split('?')[0] || '');
      const app = apps.find((a: any) => a?.slug?.toLowerCase() === slug.toLowerCase());
      if (app) {
        pageTitle = `${app.seo_title || app.name || siteTitle} - Info`;
        const rawDesc = app.seo_description || '';
        const rawHtml = app.description_html || '';
        pageDesc = rawDesc ? rawDesc : (rawHtml ? stripHtml(rawHtml).substring(0, 160) : '');
        pageKeywords = app.seo_keywords || '';
        pageOgImage = app.og_image_url || app.icon_url || settings.logo_url || '';
      }
    } else if (path.startsWith('/news/') && path.length > 6) {
      const slug = decodeURIComponent(path.split('/news/')[1]?.split('/')[0]?.split('?')[0] || '');
      const newsItem = news.find((n: any) => n?.slug?.toLowerCase() === slug.toLowerCase());
      if (newsItem) {
        pageTitle = newsItem.title ? `${newsItem.title} - ${siteTitle}` : siteTitle;
        const rawDesc = newsItem.seo_description || '';
        const rawContent = newsItem.description || '';
        pageDesc = rawDesc ? rawDesc : (rawContent ? stripHtml(rawContent).substring(0, 160) : '');
        pageKeywords = newsItem.seo_keywords || '';
        pageOgImage = newsItem.logo_url || settings.logo_url || '';
        pageAuthor = newsItem.ceo_name || siteTitle;
      }
    } else if (path.startsWith('/blog/') && path.length > 6) {
      const slug = decodeURIComponent(path.split('/blog/')[1]?.split('/')[0]?.split('?')[0] || '');
      const blogItem = blogs.find((b: any) => b?.slug?.toLowerCase() === slug.toLowerCase());
      if (blogItem) {
        pageTitle = blogItem.title ? `${blogItem.title} - ${siteTitle}` : siteTitle;
        const rawDesc = blogItem.seo_description || '';
        const rawContent = blogItem.content || '';
        pageDesc = rawDesc ? rawDesc : (rawContent ? stripHtml(rawContent).substring(0, 160) : '');
        pageKeywords = blogItem.seo_keywords || '';
        pageOgImage = blogItem.cover_url || settings.logo_url || '';
        pageAuthor = blogItem.author || siteTitle;
      }
    } else if (path.startsWith('/videos/') && path.length > 8) {
      const slug = decodeURIComponent(path.split('/videos/')[1]?.split('/')[0]?.split('?')[0] || '');
      const videoItem = videos.find((v: any) => v?.slug?.toLowerCase() === slug.toLowerCase() || v?.id?.toLowerCase() === slug.toLowerCase());
      if (videoItem) {
        const getYoutubeThumbnail = (urlStr: string) => {
          if (!urlStr) return '';
          let id = '';
          try {
            const url = new URL(urlStr);
            if (url.hostname.includes('youtube.com')) {
              if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/live/') || url.pathname.startsWith('/embed/') || url.pathname.startsWith('/v/')) {
                id = url.pathname.split('/')[2] || url.pathname.split('/')[1] || '';
              } else {
                id = url.searchParams.get('v') || '';
              }
            } else if (url.hostname.includes('youtu.be')) {
              id = url.pathname.slice(1);
            }
          } catch (e) {
            if (urlStr.length === 11 && !urlStr.includes('/')) id = urlStr;
          }
          if (!id) {
            const m = urlStr.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
            if (m && m[1]) id = m[1];
            else id = urlStr.split('/').pop()?.split('?')[0] || '';
          }
          return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : '';
        };
        pageTitle = videoItem.title ? `${videoItem.title} - ${siteTitle}` : siteTitle;
        pageDesc = videoItem.seo_description || videoItem.description || '';
        pageKeywords = settings.seo_keywords || '';
        pageOgImage = getYoutubeThumbnail(videoItem.youtube_url) || settings.logo_url || '';
      }
    }

    // Dynamic document title assignment
    document.title = pageTitle;

    // Standard Meta tags mapping
    setMetaTag('description', pageDesc);
    setMetaTag('keywords', pageKeywords);
    setMetaTag('author', pageAuthor);
    setMetaTag('robots', pageRobots);

    // Dynamic social graph synchronization
    setMetaTag('og:title', pageTitle, true);
    setMetaTag('og:description', pageDesc, true);
    setMetaTag('og:image', pageOgImage, true);
    setMetaTag('og:url', window.location.href, true);

    setMetaTag('twitter:title', pageTitle);
    setMetaTag('twitter:description', pageDesc);
    setMetaTag('twitter:image', pageOgImage);

    // Frame synchronization logic
    try {
      if (window.parent && window.parent !== window && window.parent.document) {
        window.parent.document.title = pageTitle;
      }
    } catch (e) {
      // Bypassed for cross-origin compliance
    }

  }, [location.pathname, settings, apps, news, blogs, videos, isAdminPath]);

  // Memoize static layout parts to prevent redundant re-renders
  const memoizedHeader = useMemo(() => <Header />, [location.pathname, settings]);
  const memoizedFooter = useMemo(() => <Footer />, [settings]);
  const memoizedBottomNav = useMemo(() => <BottomNav />, [location.pathname]);

  useEffect(() => {
    // Dynamically synchronize favicon with firebase database changes live across all selectors!
    const targetUrl = settings.favicon_url || settings.logo_url;
    if (targetUrl) {
      const icons = [
        { rel: 'icon' },
        { rel: 'shortcut icon' },
        { rel: 'apple-touch-icon' }
      ];
      
      // Remove old icons to prevent duplicates
      document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(el => el.remove());
      
      icons.forEach(iconDef => {
        const newLink = document.createElement('link');
        newLink.rel = iconDef.rel;
        newLink.href = targetUrl;
        document.head.appendChild(newLink);
      });
      
      // Attempt to also update the parent document element if we are within an iframe of the same origin (such as preview environments relative hosting)
      try {
        if (window.parent && window.parent !== window && window.parent.document) {
          icons.forEach(iconDef => {
            const rel = iconDef.rel;
            let parentLink: HTMLLinkElement | null = window.parent.document.querySelector(`link[rel="${rel}"]`) || window.parent.document.querySelector(`link[rel*="${rel}"]`);
            if (parentLink) {
              parentLink.href = targetUrl;
            } else {
              const newLink = window.parent.document.createElement('link');
              newLink.rel = rel;
              newLink.href = targetUrl;
              window.parent.document.head.appendChild(newLink);
            }
          });
        }
      } catch (e) {
        // Silently catch cross-origin iframe security errors (standard and expected)
      }
    }
  }, [settings, location.pathname]);

  useEffect(() => {
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAdminPath]);

  return (
    <div className="flex flex-col min-h-screen">
      <BackgroundPrefetcher />
      <ScrollToTop />
      {memoizedHeader}

      {quotaExceeded && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 py-3 text-xs sm:text-sm font-semibold animate-fade-in z-50">
          <div className="max-w-[1550px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-3 sm:px-6 md:px-10 text-center md:text-left">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>Shared Firebase Sandbox Quota Exceeded:</strong> Because this app uses the shared sandbox project (<code className="bg-amber-500/20 px-1 rounded text-amber-700 dark:text-amber-300">gen-lang-client</code>), the global 50k reads/day ceiling is frequently exhausted by other builders. Your listed items are 100% safe! Standard visitors load items instantly via our server backup cache. For dedicated, permanent access, you can easily connect your own free Firebase project for free in minutes!
              </span>
            </div>
            <a 
              href="https://console.firebase.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase text-[10px] tracking-wider rounded-lg transition-all shadow-md shrink-0 active:scale-95"
            >
              Get Dedicated DB Free
            </a>
          </div>
        </div>
      )}
      
      <main className="flex-1 w-full max-w-[1550px] mx-auto px-3 sm:px-6 md:px-10 py-3 pb-16 sm:pb-24 overflow-x-hidden relative">
        <Suspense fallback={<LoadingScreen />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, ease: "linear" }}
              className="will-change-[opacity]"
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/new-apps" element={<NewApps />} />
                <Route path="/app/:slug" element={<AppDetails />} />
                <Route path="/info/:slug" element={<GatewayPage />} />
                <Route path="/gateway/:slug" element={<GatewayPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/responsibility" element={<Responsibility />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/:slug" element={<NewsDetailPage />} />
                <Route path="/videos" element={<VideosPage />} />
                <Route path="/videos/:slug" element={<VideoDetailPage />} />
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/blog/:slug" element={<BlogDetailPage />} />
                <Route path="/wp-admin" element={<Navigate to="/" replace />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/panel" element={<Navigate to="/" replace />} />
                
                {/* Keep obfuscated paths as fallback mapping */}
                <Route path={`/${adminPath}`} element={<Navigate to={`/${adminPath}/dashboard`} replace />} />
                <Route path={`/${adminPath}/login`} element={<Suspense fallback={<div className="flex h-screen items-center justify-center p-8"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}><AdminLogin /></Suspense>} />
                <Route path={`/${adminPath}/*`} element={<Suspense fallback={<div className="flex h-screen items-center justify-center p-8"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}><AdminDashboard /></Suspense>} />
                
                <Route path="*" element={<FallbackRouteMatcher />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      
      {!isAdminPath && <PublicChatbot />}
      
      <Ticker />
      {memoizedFooter}
      <BackToTop />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <DataProvider>
        <Router>
          <AppContent />
        </Router>
      </DataProvider>
    </HelmetProvider>
  );
}

export default App;

function BottomNav() {
  const { pathname } = useLocation();
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      setTimeout(() => {
        try {
          window.navigator.vibrate(15);
        } catch (e) {}
      }, 0);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden pb-safe px-4">
      <div className="flex items-center gap-1.5 p-1.5 pointer-events-auto bg-transparent w-auto max-w-full overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { icon: Video, label: 'Videos', path: '/videos' },
          { icon: Sparkles, label: 'New', path: '/new-apps' },
          { icon: LayoutGrid, label: 'Home', path: '/' },
          { icon: Newspaper, label: 'News', path: '/news' },
          { icon: Info, label: 'Help', path: '/contact' }
        ].map((item) => {
          const active = isActive(item.path);
          return (
            <Link 
              key={item.path}
              to={item.path} 
              onClick={triggerHaptic} 
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all active:scale-[0.85] ${
                active 
                  ? 'bg-transparent text-blue-600 dark:text-blue-400 font-extrabold' 
                  : 'bg-transparent text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${active ? '' : 'opacity-80'}`} />
              <span className={`text-[11px] font-bold tracking-tight transition-all duration-300 ${active ? 'max-w-[40px] opacity-100' : 'max-w-0 opacity-0 overflow-hidden'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
