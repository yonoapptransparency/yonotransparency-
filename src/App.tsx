import { DataProvider, useData } from './contexts/DataContext';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Menu, Search, Shield, Info, Download, ArrowRight, X, Gamepad2, LayoutGrid, Search as SearchIcon, Newspaper } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import AppDetails from './pages/AppDetails';
import DownloadPage from './pages/DownloadPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Ticker from './components/Ticker';
import SupportWidget from './components/SupportWidget';
import ThemeToggle from './components/ThemeToggle';
import NewApps from './pages/NewApps';
import NewsPage from './pages/NewsPage';
import NewsDetailPage from './pages/NewsDetailPage';
import Blogs from './pages/Blogs';
import VideosPage from './pages/VideosPage';
import VideoDetailPage from './pages/VideoDetailPage';

function Header() {
  const { settings } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
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
      window.navigator.vibrate(50);
    }
  };

  const navVariants = settings.animations_enabled ? {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, delay: 0.5 } }
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
        className={`glass-nav transition-all duration-300 ${scrolled ? 'py-3' : 'py-5'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative flex justify-between items-center">
          <Link to="/" onClick={triggerHaptic} className="flex items-center gap-2 group">
            <div className="p-1 transition-transform group-hover:scale-105 magic-text">
              {settings.logo_url ? <img src={settings.logo_url} className="w-10 h-10 object-contain" alt="Logo" /> : <Shield className="w-8 h-8" />}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tighter magic-text uppercase">{settings.site_title}</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-4 lg:gap-8 text-sm font-medium">
            <Link to="/" onClick={triggerHaptic} className="magic-text transition-colors p-2 font-bold uppercase tracking-tight">Home</Link>
            <Link to="/new-apps" onClick={triggerHaptic} className="magic-text transition-colors p-2 font-bold uppercase tracking-tight flex items-center gap-1">New App <span className="flex w-2 h-2 rounded-full bg-red-600 animate-pulse"></span></Link>
            <Link to="/categories" onClick={triggerHaptic} className="magic-text transition-colors p-2 font-bold uppercase tracking-tight">Categories</Link>
            <Link to="/videos" onClick={triggerHaptic} className="magic-text transition-colors p-2 font-bold uppercase tracking-tight">Videos</Link>
            <Link to="/blogs" onClick={triggerHaptic} className="magic-text transition-colors p-2 font-bold uppercase tracking-tight">Blogs</Link>
            <Link to="/app-checker" onClick={triggerHaptic} className="magic-text transition-colors p-2 font-bold uppercase tracking-tight">App Checker</Link>
            <div className="flex items-center gap-2">
              <SupportWidget />
              <ThemeToggle />
            </div>
            <Link to="/admin/login" onClick={triggerHaptic} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all flex items-center justify-center font-bold shadow-lg shadow-red-600/30">
              Admin
            </Link>
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <SupportWidget />
            <ThemeToggle />
            <button 
              className="flex items-center justify-center min-h-[48px] min-w-[48px] bg-red-600 rounded-full shadow-lg active:scale-90 transition-transform"
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl flex flex-col px-6 py-8"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="text-xl font-black flex items-center gap-2 magic-text uppercase tracking-tighter">
                {settings.logo_url ? <img src={settings.logo_url} className="w-6 h-6 object-contain" alt="Logo" /> : <Shield className="w-6 h-6 text-red-600" />} {settings.site_title}
              </span>
              <button 
                onClick={() => { triggerHaptic(); setMenuOpen(false); }}
                className="flex items-center justify-center min-h-[48px] min-w-[48px] bg-red-600 text-white rounded-full shadow-lg active:scale-90 transition-transform"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-6 text-lg font-medium">
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/" className="border-b border-white/10 pb-4 min-h-[48px] flex items-center magic-text font-black uppercase tracking-tight">Home</Link>
          <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/new-apps" className="border-b border-white/10 pb-4 min-h-[48px] flex items-center magic-text font-black uppercase tracking-tight gap-2">New App <span className="flex w-2 h-2 rounded-full bg-red-600 animate-pulse"></span></Link>
          <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/categories" className="border-b border-white/10 pb-4 min-h-[48px] flex items-center magic-text font-black uppercase tracking-tight">Categories</Link>
          <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/app-checker" className="border-b border-white/10 pb-4 min-h-[48px] flex items-center magic-text font-black uppercase tracking-tight">App Checker</Link>
          <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/blogs" className="border-b border-white/10 pb-4 min-h-[48px] flex items-center magic-text font-black uppercase tracking-tight">Blogs</Link>
          <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/videos" className="border-b border-white/10 pb-4 min-h-[48px] flex items-center magic-text font-black uppercase tracking-tight">Videos</Link>
              <div className="flex justify-between items-center py-4 border-b border-white/10 px-2 bg-white/5 rounded-xl backdrop-blur-md">
                <span className="text-slate-800 dark:text-white">Theme</span>
                <ThemeToggle />
              </div>
              <Link onClick={() => { triggerHaptic(); setMenuOpen(false); }} to="/admin/login" className="text-pink-500 dark:text-pink-400 mt-4 min-h-[48px] flex items-center">Admin Access</Link>
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
    <footer className="border-t border-slate-200 dark:border-white/10 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        <h3 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2 text-black dark:text-white uppercase">
          <div className="p-1 transition-transform">
            {settings.logo_url ? <img src={settings.logo_url} className="w-8 h-8 object-contain" alt="Logo" /> : <Shield className="w-8 h-8 text-red-600" />}
          </div>
          {settings.site_title}
        </h3>
        <p className="text-black dark:text-slate-400 text-sm mb-6 max-w-md font-medium">
          {settings.meta_description}
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm font-bold mb-8 uppercase tracking-tight">
          <Link to="/" className="text-black dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">Home</Link>
          <Link to="/about" className="text-black dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">About Us</Link>
          <Link to="/contact" className="text-black dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">Contact</Link>
          <Link to="/videos" className="text-black dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">Videos</Link>
          <Link to="/blogs" className="text-black dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">Blogs</Link>
          <Link to="/privacy" className="text-black dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">Privacy</Link>
          <Link to="/terms" className="text-black dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors">Terms</Link>
        </div>
        
        {(settings.disclaimer_text || settings.ethics_discrimination_text) && (
          <div className="max-w-3xl text-center space-y-4 mb-8">
            {settings.disclaimer_text && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h4 className="text-sm font-black text-black dark:text-slate-300 mb-1">Platform Disclaimer</h4>
                <p className="text-xs font-bold text-black dark:text-slate-400">{settings.disclaimer_text}</p>
              </div>
            )}
            {settings.ethics_discrimination_text && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h4 className="text-sm font-black text-black dark:text-slate-300 mb-1">Ethics & Discrimination</h4>
                <p className="text-xs font-bold text-black dark:text-slate-400">{settings.ethics_discrimination_text}</p>
              </div>
            )}
          </div>
        )}

        {settings.important_notice && (
          <div className="max-w-3xl w-full text-center mb-8">
            <div className="bg-red-600/10 border border-red-600/30 rounded-2xl p-6">
              <h4 className="text-sm font-black text-red-600 mb-2 uppercase tracking-widest">Important Notice</h4>
              <p className="text-sm text-black dark:text-red-400 font-bold whitespace-pre-wrap">{settings.important_notice}</p>
            </div>
          </div>
        )}

        <div className="text-black dark:text-slate-500 text-xs font-black uppercase tracking-tight">
          &copy; 2026 {settings.site_title}. All rights reserved.
        </div>
      </div>
    </footer>
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
          className="fixed bottom-6 right-6 z-50 p-4 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-xl shadow-pink-500/20 glass-panel border-none"
          aria-label="Back to top"
        >
          <ArrowRight className="w-6 h-6 -rotate-90" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function AppContent() {
  const { settings, loading } = useData();
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  useEffect(() => {
    document.title = settings.site_title;
    
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateMeta("description", settings.meta_description);
    updateMeta("og:title", settings.site_title, true);
    updateMeta("og:description", settings.meta_description, true);
    updateMeta("og:type", "website", true);
    
    // Add canonical link for SEO
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
    
    if (settings.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
    }
  }, [settings]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Ticker />
        <Header />
        
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new-apps" element={<NewApps />} />
            <Route path="/app/:slug" element={<AppDetails />} />
            <Route path="/download/:slug" element={<DownloadPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsDetailPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/videos/:slug" element={<VideoDetailPage />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="*" element={<div className="text-center py-20 text-slate-500">Feature arriving soon. Check back later.</div>} />
          </Routes>
        </main>
        
        <Footer />
        <BottomNav />
        <BackToTop />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </HelmetProvider>
  );
}

function BottomNav() {
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(20);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-md border-t border-black/5 dark:border-white/5 md:hidden">
      <div className="flex justify-around items-center h-20 max-w-lg mx-auto px-4">
        <Link to="/?tab=Games" onClick={triggerHaptic} className="flex flex-col items-center gap-1 group">
          <Gamepad2 className="w-6 h-6 fill-current text-black dark:text-white transition-transform group-active:scale-90" />
          <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">Games</span>
        </Link>
        <Link to="/?tab=All Apps" onClick={triggerHaptic} className="flex flex-col items-center gap-1">
          <div className="bg-red-600 text-white p-3 rounded-2xl shadow-xl shadow-red-600/30 -mt-6 border-4 border-white dark:border-zinc-900 active:scale-90 transition-transform">
            <LayoutGrid className="w-6 h-6 fill-current" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Explore</span>
        </Link>
        <Link to="/news" onClick={triggerHaptic} className="flex flex-col items-center gap-1 group font-medium">
          <Newspaper className="w-6 h-6 fill-current text-black dark:text-white transition-transform group-active:scale-90" />
          <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">News</span>
        </Link>
      </div>
    </div>
  );
}
