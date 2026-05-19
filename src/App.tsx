import { DataProvider, useData } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useLocation, BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Menu, Search, Shield, ShieldCheck, Info, Download, ArrowRight, X, Gamepad2, LayoutGrid, Search as SearchIcon, Newspaper, Sparkles, Send, MoreHorizontal } from 'lucide-react';
import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy Load Pages for Performance
const Home = lazy(() => import('./pages/Home'));
const AppDetails = lazy(() => import('./pages/AppDetails'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Responsibility = lazy(() => import('./pages/Responsibility'));
const NewApps = lazy(() => import('./pages/NewApps'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));
const Blogs = lazy(() => import('./pages/Blogs'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const VideosPage = lazy(() => import('./pages/VideosPage'));
const VideoDetailPage = lazy(() => import('./pages/VideoDetailPage'));

import Ticker from './components/Ticker';
import SupportWidget from './components/SupportWidget';
import ThemeToggle from './components/ThemeToggle';

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
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
        className={`glass-nav ${scrolled ? 'glass-nav-scrolled bg-white/30 dark:bg-black/30 backdrop-blur-xl' : 'bg-transparent py-2'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative flex justify-between items-center">
          <Link to="/" onClick={triggerHaptic} className="flex items-center gap-2 sm:gap-3 group">
            <div className="p-0 transition-transform group-hover:scale-105 duration-500">
              {settings.logo_url ? <img src={settings.logo_url} width={48} height={48} className="w-10 h-10 sm:w-14 sm:h-14 object-contain drop-shadow-xl brightness-110" alt="Logo" /> : <div className="w-10 h-10 sm:w-14 sm:h-14 bg-red-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black italic">{settings.site_title?.substring(0, 1)}</div>}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base sm:text-2xl font-black tracking-tighter uppercase italic drop-shadow-md">{settings.site_title}</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4 lg:gap-8 text-sm font-medium">
            <Link to="/" onClick={triggerHaptic} className={`transition-all p-2 font-bold uppercase tracking-tight relative ${pathname === '/' ? 'text-red-600' : ''}`}>
              Home
              {pathname === '/' && <motion.div layoutId="header-active" className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-600" />}
            </Link>
            <Link to="/new-apps" onClick={triggerHaptic} className={`transition-all p-2 font-bold uppercase tracking-tight flex items-center gap-1 relative ${pathname === '/new-apps' ? 'text-red-600' : ''}`}>
              New App <span className="flex w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              {pathname === '/new-apps' && <motion.div layoutId="header-active" className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-600" />}
            </Link>
            <Link to="/news" onClick={triggerHaptic} className={`transition-all p-2 font-bold uppercase tracking-tight relative ${pathname === '/news' ? 'text-red-600' : ''}`}>
              News
              {pathname === '/news' && <motion.div layoutId="header-active" className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-600" />}
            </Link>
            <div className="relative group/more" onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
              <button 
                className={`transition-all p-2 font-bold uppercase tracking-tight flex items-center gap-1 relative ${['/videos', '/blogs', '/contact', '/privacy', '/terms', '/about', '/responsibility'].includes(pathname) ? 'text-red-600' : ''}`}
                onClick={triggerHaptic}
              >
                More <MoreHorizontal className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {moreOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2"
                  >
                    {[
                      { to: '/videos', label: 'All App', icon: LayoutGrid },
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
                        className={`flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors ${pathname === item.to ? 'text-red-600' : ''}`}
                      >
                        <item.icon className="w-3 h-3" />
                        {item.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 ml-4 border-l border-black/10 pl-4">
              {settings.helpline_telegram && (
                <a 
                  href={settings.helpline_telegram.startsWith('http') ? settings.helpline_telegram : `https://t.me/${settings.helpline_telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center min-h-[48px] min-w-[48px] bg-[#0088cc]/10 text-[#0088cc] rounded-full border border-[#0088cc]/20 hover:bg-[#0088cc]/20 transition-colors"
                  aria-label="Telegram"
                >
                  <Send className="w-5 h-5" />
                </a>
              )}
              <SupportWidget />
              <ThemeToggle />
            </div>
          </nav>

          <div className="md:hidden flex items-center gap-2.5">
            {settings.helpline_telegram && (
              <a 
                href={settings.helpline_telegram.startsWith('http') ? settings.helpline_telegram : `https://t.me/${settings.helpline_telegram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center min-h-[44px] min-w-[44px] bg-[#0088cc]/10 text-[#0088cc] rounded-full border border-[#0088cc]/20"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4" />
              </a>
            )}
            <SupportWidget />
            <ThemeToggle />
            <button 
              className="flex items-center justify-center min-h-[44px] min-w-[44px] bg-red-600 rounded-full shadow-lg active:scale-95"
              onClick={() => { triggerHaptic(); setMenuOpen(true); }}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-white" />
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
            className="fixed inset-0 z-[60] bg-transparent backdrop-blur-xl flex flex-col px-6 py-8"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
                {settings.logo_url ? <img src={settings.logo_url} width={24} height={24} className="w-6 h-6 object-contain" alt="Logo" /> : <Shield className="w-6 h-6 text-red-600" />} {settings.site_title}
              </span>
              <button 
                onClick={() => { triggerHaptic(); setMenuOpen(false); }}
                className="flex items-center justify-center min-h-[48px] min-w-[48px] bg-red-600 text-white rounded-full shadow-lg active:scale-90 transition-transform"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-2 text-lg font-medium">
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <LayoutGrid className="w-5 h-5" /> Home
                </div>
              </Link>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/new-apps" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/new-apps' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <Sparkles className="w-5 h-5" /> New App
                  <span className="flex w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                </div>
              </Link>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/news" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/news' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <Newspaper className="w-5 h-5" /> News
                </div>
              </Link>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/videos" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/videos' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <LayoutGrid className="w-5 h-5" /> All App
                </div>
              </Link>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/blogs" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/blogs' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <Menu className="w-5 h-5" /> Blogs
                </div>
              </Link>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/responsibility" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/responsibility' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <ShieldCheck className="w-5 h-5" /> Responsibility
                </div>
              </Link>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/about" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/about' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <Info className="w-5 h-5" /> About Us
                </div>
              </Link>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/contact" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/contact' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <Send className="w-5 h-5" /> Contact
                </div>
              </Link>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/privacy" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/privacy' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <ShieldCheck className="w-5 h-5" /> Privacy
                </div>
              </Link>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/terms" className={`px-4 py-3 rounded-2xl transition-all ${pathname === '/terms' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-black/5'}`}>
                <div className="flex items-center gap-3 font-black uppercase tracking-tight">
                  <ShieldCheck className="w-5 h-5" /> Terms
                </div>
              </Link>
              
              <div className="mt-4 p-4 rounded-3xl bg-black/5 flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                  <span className="font-bold text-sm uppercase opacity-60">Dark Mode</span>
                  <ThemeToggle />
                </div>
              </div>
              
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/admin/login" className="text-center text-xs font-bold opacity-40 mt-6 hover:text-red-500 transition-colors">Admin Portal &copy; 2026</Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  const { settings } = useData();
  return (
    <footer className="white-theme-portal">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        <h3 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2 uppercase">
          <div className="p-1 transition-transform hover:scale-110">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                width={32} 
                height={32} 
                className="w-8 h-8 object-contain drop-shadow-lg" 
                alt="Logo" 
              />
            ) : (
              <Shield className="w-8 h-8 text-red-600" />
            )}
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400">
            {settings.site_title}
          </span>
        </h3>
        <p className="text-sm mb-6 max-w-md font-black uppercase tracking-widest leading-relaxed opacity-60">
          {settings.meta_description}
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black mb-8 uppercase tracking-[0.2em]">
          <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
          <Link to="/about" className="hover:text-red-600 transition-colors">About Us</Link>
          <Link to="/contact" className="hover:text-red-600 transition-colors">Contact</Link>
          <Link to="/videos" className="hover:text-red-600 transition-colors">All App</Link>
          <Link to="/blogs" className="hover:text-red-600 transition-colors">Blogs</Link>
          <Link to="/responsibility" className="hover:text-red-600 transition-colors">Safety</Link>
          <Link to="/privacy" className="hover:text-red-600 transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-red-600 transition-colors">Terms</Link>
        </div>
        
        {(settings.disclaimer_text || settings.ethics_discrimination_text) && (
          <div className="max-w-3xl text-center space-y-4 mb-8">
            {settings.disclaimer_text && (
              <div className="bg-black/5 border border-black/10 rounded-lg p-4">
                <h4 className="text-[10px] font-black mb-1 uppercase tracking-widest opacity-80">Platform Disclaimer</h4>
                <p className="text-[10px] font-bold opacity-60">{settings.disclaimer_text}</p>
              </div>
            )}
            {settings.ethics_discrimination_text && (
              <div className="bg-black/5 border border-black/10 rounded-lg p-4">
                <h4 className="text-[10px] font-black mb-1 uppercase tracking-widest opacity-80">Ethics & Discrimination</h4>
                <p className="text-[10px] font-bold opacity-60">{settings.ethics_discrimination_text}</p>
              </div>
            )}
          </div>
        )}

        {settings.important_notice && (
          <div className="max-w-3xl w-full text-center mb-8">
            <div className="bg-red-600/5 border border-red-600/10 rounded-2xl p-6">
              <h4 className="text-[10px] font-black text-red-600 mb-2 uppercase tracking-[0.3em]">Important Notice</h4>
              <p className="text-xs font-black whitespace-pre-wrap opacity-70">{settings.important_notice}</p>
            </div>
          </div>
        )}

        <div className="text-[9px] font-black uppercase tracking-[0.25em] flex items-center gap-2 opacity-40">
          &copy; 2026 {settings.site_title}. Verified Platform.
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
    if (window.confirm("Hard Reset: This will clear local memory and reload. Continue?")) {
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
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 ${isConnected === true ? (isLive ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500') : isConnected === false ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-blue-500 animate-spin' : isConnected === true ? (isLive ? 'bg-green-500' : 'bg-amber-500') : isConnected === false ? 'bg-red-500' : 'bg-slate-500 animate-pulse'}`}></div>
          {syncing ? 'Syncing...' : isConnected === true ? (isLive ? 'Cloud: Live' : 'Cloud: Cache') : isConnected === false ? 'Offline' : 'Connecting...'}
        </button>
        {lastSyncTime && (
          <span className="text-[8px] text-slate-400 font-bold">Updated: {lastSyncTime}</span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={handleTestConnection}
          disabled={testing}
          className="text-[9px] text-blue-500 hover:text-blue-600 font-black uppercase tracking-widest flex items-center gap-1"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button 
          onClick={handleClearCache}
          className="text-[9px] text-slate-500 hover:text-slate-700 underline decoration-slate-500/20"
        >
          Reset Cache
        </button>
      </div>
    </div>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight / 2);
    };
    window.addEventListener('scroll', handleScroll);
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
          className="fixed bottom-24 md:bottom-8 right-6 z-50 p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl shadow-red-600/40 border-2 border-white/20 transition-all hover:scale-110 active:scale-95"
          aria-label="Back to top"
        >
          <ArrowRight className="w-6 h-6 -rotate-90" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
      <div className="w-10 h-10 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600 italic animate-pulse">Syncing Hub...</p>
    </div>
  );
}

function AppContent() {
  const { settings } = useData();
  const location = useLocation();
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  // Memoize static layout parts to prevent redundant re-renders
  const memoizedHeader = useMemo(() => <Header />, [location.pathname, settings]);
  const memoizedFooter = useMemo(() => <Footer />, [settings]);
  const memoizedBottomNav = useMemo(() => <BottomNav />, [location.pathname]);

  useEffect(() => {
    // Simplify metadata update for better performance feel
    document.title = settings.site_title || 'YonoStore';
    
    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    if (settings.meta_description) {
      setMeta('meta[name="description"]', settings.meta_description);
      setMeta('meta[property="og:description"]', settings.meta_description);
    }
  }, [settings, location.pathname]);

  return (
    <div className="flex flex-col min-h-screen selection:bg-red-600/20">
      <ScrollToTop />
      <Ticker />
      {memoizedHeader}
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 pb-24 overflow-x-hidden relative">
        <Suspense fallback={<LoadingScreen />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="will-change-[opacity,transform]"
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/new-apps" element={<NewApps />} />
                <Route path="/app/:slug" element={<AppDetails />} />
                <Route path="/download/:slug" element={<DownloadPage />} />
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
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/*" element={<AdminDashboard />} />
                <Route path="*" element={<div className="text-center py-20 text-slate-500">Feature arriving soon. Check back later.</div>} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
      
      {memoizedFooter}
      {memoizedBottomNav}
      <BackToTop />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <DataProvider>
          <Router>
            <AppContent />
          </Router>
        </DataProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-transparent md:hidden pb-safe">
      <div className="flex justify-around items-center h-12 max-w-sm mx-auto px-1">
        <Link to="/videos" onClick={triggerHaptic} className={`flex flex-col items-center gap-0 group relative transition-all duration-200 ${isActive('/videos') ? 'scale-105' : ''}`}>
          <LayoutGrid className={`w-3.5 h-3.5 transition-colors ${isActive('/videos') ? 'text-red-600' : 'opacity-40'}`} />
          <span className={`text-[6px] font-black uppercase tracking-tighter transition-colors ${isActive('/videos') ? 'text-red-600' : 'opacity-40'}`}>Apps</span>
        </Link>
        <Link to="/new-apps" onClick={triggerHaptic} className={`flex flex-col items-center gap-0 group relative transition-all duration-200 ${isActive('/new-apps') ? 'scale-105' : ''}`}>
          <Sparkles className={`w-3.5 h-3.5 transition-colors ${isActive('/new-apps') ? 'text-red-600' : 'opacity-40'}`} />
          <span className={`text-[6px] font-black uppercase tracking-tighter transition-colors ${isActive('/new-apps') ? 'text-red-600' : 'opacity-40'}`}>Hot</span>
        </Link>
        
        <Link to="/" onClick={triggerHaptic} className="flex flex-col items-center group -mt-4 relative transition-all duration-200">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            className={`bg-red-600 text-white p-2 rounded-xl shadow-lg border border-white/20 transition-all ${pathname === '/' ? 'ring-2 ring-red-600/20 scale-110' : 'opacity-90'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </motion.div>
          <span className={`text-[6px] font-black uppercase tracking-tighter mt-1 drop-shadow-sm ${pathname === '/' ? 'text-red-600' : 'text-red-500 opacity-60'}`}>Home</span>
        </Link>

        <Link to="/news" onClick={triggerHaptic} className={`flex flex-col items-center gap-0 group relative transition-all duration-200 ${isActive('/news') ? 'scale-105' : ''}`}>
          <Newspaper className={`w-3.5 h-3.5 transition-colors ${isActive('/news') ? 'text-red-600' : 'opacity-40'}`} />
          <span className={`text-[6px] font-black uppercase tracking-tighter transition-colors ${isActive('/news') ? 'text-red-600' : 'opacity-40'}`}>News</span>
        </Link>
        <Link to="/contact" onClick={triggerHaptic} className={`flex flex-col items-center gap-0 group relative transition-all duration-200 ${isActive('/contact') ? 'scale-105' : ''}`}>
          <Info className={`w-3.5 h-3.5 transition-colors ${isActive('/contact') ? 'text-red-600' : 'opacity-40'}`} />
          <span className={`text-[6px] font-black uppercase tracking-tighter transition-colors ${isActive('/contact') ? 'text-red-600' : 'opacity-40'}`}>Help</span>
        </Link>
      </div>
    </div>
  );
}
