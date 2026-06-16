import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ShieldCheck, ShieldAlert, ArrowRight, ArrowLeft, Star, Sparkles, Info, FileText, Share2, Check, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { AppListItem } from '../components/PlayStoreUI';
import { motion, AnimatePresence } from 'framer-motion';
import UserReviews from '../components/UserReviews';
import PlayStoreRatingSection from '../components/PlayStoreRatingSection';

export function AppDetailsSkeleton() {
  return (
    <div className="max-w-[1550px] mx-auto select-none px-4 py-6 animate-fade-in">
      {/* Back button skeleton */}
      <div className="mb-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>

      <div className="w-full">
        {/* App Main Header Info Loader */}
        <div className="pt-0.5 pb-6 mb-6 flex flex-col items-center text-center border-b border-black/5 dark:border-white/5">
          {/* App Icon rounded box skeleton */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] bg-zinc-200 dark:bg-zinc-800 animate-pulse mb-4 shadow-sm" />
          
          {/* Title and Subtitles */}
          <div className="h-7 w-52 sm:w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse mb-3" />
          <div className="flex gap-2 mb-4">
            <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
            <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          </div>

          {/* Key metrics grid (4 specs columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full max-w-[320px] mb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="py-2.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 animate-pulse">
                <div className="h-2 w-8 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto mb-1.5" />
                <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto" />
              </div>
            ))}
          </div>


          {/* Action buttons skeleton */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-center mt-1">
            <div className="h-10 w-full sm:w-[150px] bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-10 w-full sm:w-[150px] bg-zinc-100 dark:bg-zinc-850 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Long description / About this app skeleton loader */}
        <div className="py-8 border-b border-black/5 dark:border-white/5">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-5" />
          <div className="space-y-3">
            <div className="h-3.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-3.5 w-[94%] bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-3.5 w-[85%] bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-3.5 w-[91%] bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-3.5 w-[70%] bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
          
          {/* Release Notes subsection skeleton */}
          <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-3" />
            <div className="h-20 w-full bg-zinc-50 dark:bg-zinc-850 border border-black/5 dark:border-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>

        {/* Related items list skeleton */}
        <div className="mb-8">
          <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3.5 border border-black/5 dark:border-white/5 bg-zinc-55/50 dark:bg-zinc-900/30 rounded-2xl flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-250 dark:bg-zinc-800" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-2.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppDetails() {
  const { apps: mockApps, settings: mockSettings, loading, appsSyncedWithServer, serverAppsFetched, refreshAll } = useData();
  const { slug: routeSlug, "*": splat } = useParams();
  const decodedSplat = splat ? decodeURIComponent(splat) : '';
  const slug = routeSlug || decodedSplat.replace(/^\/|\/$/g, '').split('/')[0];
  const app = mockApps.find(a => a.slug?.toLowerCase() === slug?.toLowerCase());
  
  const navigate = useNavigate();
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!app?.is_coming_soon || !app?.publish_date) {
      setTimeRemaining(null);
      return;
    }

    const calculateRemaining = () => {
      const remaining = new Date(app.publish_date!).getTime() - new Date().getTime();
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [app?.is_coming_soon, app?.publish_date]);

  const isActuallyComingSoon = app?.is_coming_soon && (timeRemaining === null || timeRemaining > 0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Automatically trigger a silent cloud sync if the requested app is not found in local cache
  useEffect(() => {
    let active = true;
    const fetchLatestApps = async () => {
      const found = mockApps.some(a => a.slug?.toLowerCase() === slug?.toLowerCase());
      if (!found && !triedRefresh && !isRefreshing) {
        if (active) {
          setIsRefreshing(true);
        }
        console.log(`Deep Link Sync: App "${slug}" not found in local cache. Syncing latest indices...`);
        try {
          await refreshAll(true);
        } catch (e: any) {
          console.warn("Deep Link Auto-Sync failed:", e.message || e);
        } finally {
          if (active) {
            setTriedRefresh(true);
            setIsRefreshing(false);
          }
        }
      }
    };
    fetchLatestApps();
    return () => {
      active = false;
    };
  }, [slug, mockApps, triedRefresh, isRefreshing, refreshAll]);

  // Initial loading phase or DB syncing phase: show complete visual structure skeleton
  if ((loading && !app) || (!app && (!serverAppsFetched || !appsSyncedWithServer || isRefreshing || !triedRefresh))) {
    return <AppDetailsSkeleton />;
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">App Not Found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-3 leading-relaxed mb-6">
          The requested application "<span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{slug}</span>" could not be located.
          If you just created it, it might still be propagating. Try refreshing.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-[16px] font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            Refresh Data
          </button>
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[16px] font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Store
          </Link>
        </div>
      </div>
    );
  }

  const title = app.seo_title || app.name;
  
  const stripHtml = (html: string) => {
    if (!html) return '';
    const stripped = html.replace(/<[^>]*>?/gm, ' ');
    return stripped.replace(/\s+/g, ' ').trim();
  };

  const cleanSeoDescription = (rawDesc: string) => {
    if (!rawDesc) return '';
    const trimmed = rawDesc.trim();
    if (trimmed.startsWith('<') || trimmed.includes('<meta ')) {
      const metaMatch = trimmed.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
      if (metaMatch && metaMatch[1]) {
        return metaMatch[1].trim();
      }
      const ogMatch = trimmed.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
      if (ogMatch && ogMatch[1]) {
        return ogMatch[1].trim();
      }
      return stripHtml(trimmed).substring(0, 160);
    }
    return trimmed;
  };
  
  const desc = cleanSeoDescription(app.seo_description) || (app.description_html ? stripHtml(app.description_html).substring(0, 160) : `${app.name} application specifications`);
  const ogImage = app.og_image_url || app.icon_url;

  const faqSchema = app.faqs && app.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": app.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer.replace(/<[^>]*>?/gm, '')
      }
    }))
  } : null;

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": app.name,
    "description": desc,
    "applicationCategory": app.category,
    "operatingSystem": "Android, iOS, Windows",
    "softwareVersion": app.version,
    "fileSize": app.file_size,
    "image": app.og_image_url || app.icon_url,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": app.rating || "5.0",
      "ratingCount": app.serial_number ? parseInt(String(app.serial_number).replace(/\D/g,'')) % 1000 + 100 : "150"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": app.name,
        "item": window.location.href
      }
    ]
  };

  const relatedApps = useMemo(() => {
    const currentCats = app.category ? app.category.toLowerCase().split(',').map(c => c.trim()) : [];
    return mockApps
      .filter(a => {
        if (a.id === app.id) return false;
        const appCats = a.category ? a.category.toLowerCase().split(',').map(c => c.trim()) : [];
        return appCats.some(cat => currentCats.includes(cat));
      });
  }, [mockApps, app.category, app.id]);

  const [shareToast, setShareToast] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setShareToast(true);
        setTimeout(() => setShareToast(false), 2050);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || app.name,
          text: desc || `Check out ${app.name} specification on our platform.`,
          url: window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="animate-fade-in max-w-[1550px] mx-auto select-none">
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-3 rounded-full shadow-xl flex items-center gap-2 border border-white/10 dark:border-black/5"
          >
            <Check className="w-4 h-4 text-green-500 font-bold animate-bounce" />
            <span className="text-sm font-semibold tracking-wide">Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="px-4 mb-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors group"
        >
          <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to storefront
        </Link>
      </div>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        {app.seo_keywords && <meta name="keywords" content={app.seo_keywords} />}
        <meta name="author" content={mockSettings.site_title} />
        <meta name="robots" content="index, follow" />
        {app.target_region && <meta name="geo.region" content={app.target_region} />}
        {app.target_region && <meta name="coverage" content={app.target_region} />}
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={window.location.href} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={ogImage} />

        {app.canonical_url ? <link rel="canonical" href={app.canonical_url} /> : <link rel="canonical" href={window.location.href} />}
        <script type="application/ld+json">
          {JSON.stringify(softwareSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
      </Helmet>
      <div className="w-full">
        <div className="pt-0.5 pb-3 mb-3 flex flex-col items-center text-center relative transition-all duration-300 border-b border-black/5 dark:border-white/5">
          <div className="relative mb-2">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] overflow-hidden shrink-0 shadow-md bg-white border border-black/5 dark:border-white/10 group">
              {app.icon_url ? (
                <img src={app.icon_url || undefined} alt={app.name} width={128} height={128} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl sm:text-3xl font-bold bg-zinc-800 text-zinc-500">
                  {(app.name || 'A').substring(0, 1)}
                </div>
              )}
              {isActuallyComingSoon && (
                <div className="absolute top-1 right-1 pointer-events-none">
                  <div className="bg-amber-500/95 backdrop-blur-[1px] text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-[1px] rounded shadow-[0_2px_4px_rgba(0,0,0,0.1)] border border-amber-400">
                    Soon
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center w-full max-w-2xl px-2">
            <div className="mb-3">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none mb-2.5 break-words px-4">
                {app.name}
              </h1>
              <div className="flex justify-center flex-wrap gap-1.5">
                {app.is_new && (
                  <div className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wide border border-blue-500/10">
                    New Release
                  </div>
                )}
                <div className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wide border",
                  app.safety_status === 'Verified' ? "bg-green-500/10 text-green-600 border-green-500/10" :
                  app.safety_status === 'Unsafe' ? "bg-rose-500/10 text-rose-600 border-rose-500/10" :
                  "bg-orange-500/10 text-orange-600 border-orange-500/10"
                )}>
                  {app.safety_status === 'Verified' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {app.safety_status}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full max-w-[320px] mb-4">
              {[
                { label: 'Version', value: app.version },
                { label: 'Size', value: app.file_size },
                { label: 'Type', value: app.category ? app.category.split(',')[0] : 'App' },
                { label: 'Rating', value: app.rating ? app.rating.toFixed(1) : '5.0', icon: Star },
              ].map((item, i) => (
                <div key={i} className="text-center py-1 sm:py-1.5 px-0.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                  <div className="text-[9px] mb-0.5 font-bold uppercase tracking-wider text-zinc-500">{item.label}</div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-0.5 tracking-tight">
                    {item.icon && <item.icon className="w-3 h-3 text-orange-500 fill-orange-500 shrink-0" />}
                    <span className="truncate max-w-full">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>

  
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-center select-none mt-1">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto min-w-[130px] sm:min-w-[150px]"
              >
                {isActuallyComingSoon ? (
                  <div className="flex flex-col items-center">
                    <button 
                      disabled
                      className="w-full bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 font-bold py-2.5 px-5 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed text-sm shadow-sm"
                    >
                      Coming Soon
                    </button>
                    {timeRemaining !== null && timeRemaining > 0 && (
                      <div className="mt-2 flex gap-1 justify-center">
                        {(() => {
                          const s = Math.floor(timeRemaining / 1000);
                          const d = Math.floor(s / 86400);
                          const h = Math.floor((s % 86400) / 3600);
                          const m = Math.floor((s % 3600) / 60);
                          const sec = s % 60;
                          return [
                            { label: 'D', value: d.toString().padStart(2, '0') },
                            { label: 'H', value: h.toString().padStart(2, '0') },
                            { label: 'M', value: m.toString().padStart(2, '0') },
                            { label: 'S', value: sec.toString().padStart(2, '0') }
                          ].map((unit, i) => (
                            <div key={i} className="flex flex-col items-center bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-1 border border-black/5 dark:border-white/5">
                              <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">{unit.value}</span>
                              <span className="text-[8px] uppercase tracking-widest text-zinc-500">{unit.label}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link 
                    to={`/gateway/${app.slug}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-sm shadow-md h-[44px]"
                  >
                    <span className="flex items-center gap-1.5 font-bold">Access Gateway <ArrowRight className="w-4 h-4" /></span>
                  </Link>
                )}
              </motion.div>
 
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto min-w-[130px] sm:min-w-[150px]"
              >
                <button 
                  onClick={handleShare}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold py-2.5 px-5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm border border-black/5 dark:border-white/5 shadow-sm"
                >
                  <Share2 className="w-4 h-4 text-blue-500" /> Share app
                </button>
              </motion.div>
            </div>

            <PlayStoreRatingSection appId={app.id} appTitle={app.name} onReviewSubmitted={() => setReviewsRefreshKey(prev => prev + 1)} />
          </div>
        </div>

        {relatedApps.length > 0 && (
          <div className="mb-6 px-1">
            <div className="flex items-center justify-between mb-4 px-3">
              <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                You might also like
              </h2>
            </div>
            <div className="space-y-2">
              {relatedApps.map((relatedApp) => (
                <AppListItem key={relatedApp.id} app={relatedApp} index={relatedApp.serial_number} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RESTORED SAFETY & INFO BOXES */}
      <div className="px-1 space-y-3 mb-8 w-full">

        {app.red_box_msg && app.red_box_msg.trim() !== '.' && app.red_box_msg.trim() !== '' && (
          <div className="bg-rose-50/50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl flex items-start gap-4 shadow-sm group">
            <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-sm font-medium text-rose-800 dark:text-rose-200 leading-relaxed pt-0.5">
              {app.red_box_msg}
            </div>
          </div>
        )}
        
        {app.yellow_box_msg && app.yellow_box_msg.trim() !== '.' && app.yellow_box_msg.trim() !== '' && (
          <div className="bg-orange-50/50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 p-4 rounded-2xl flex items-start gap-4 shadow-sm group">
             <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl text-orange-600 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="text-sm font-medium text-orange-800 dark:text-orange-200 leading-relaxed pt-0.5">
              {app.yellow_box_msg}
            </div>
          </div>
        )}

        {app.idea_box_msg && app.idea_box_msg.trim() !== '.' && app.idea_box_msg.trim() !== '' && (
          <div className="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 rounded-2xl flex items-start gap-4 shadow-sm group">
             <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-sm font-medium text-blue-800 dark:text-blue-200 leading-relaxed pt-0.5">
              {app.idea_box_msg}
            </div>
          </div>
        )}
      </div>

      <div className="w-full mb-8 space-y-12">
        {app.custom_admin_box_html && (
           <div className="py-8 border-b border-black/5 dark:border-white/5 relative overflow-hidden w-auto -mx-3 sm:-mx-6 md:-mx-10 transition-all duration-300">
             {app.custom_admin_box_heading && (
               <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100 px-3 sm:px-6 md:px-10">
                  {app.custom_admin_box_heading}
               </h2>
             )}
             <div 
               className="w-full text-zinc-800 dark:text-zinc-200"
               dangerouslySetInnerHTML={{ __html: app.custom_admin_box_html }}
             />
           </div>
        )}

        <div className="py-8 -mx-3 sm:-mx-6 md:-mx-10 px-3 sm:px-6 md:px-10">
           <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100 px-1 sm:px-0">
             About this app
           </h2>
          <div 
             className="w-full text-base text-zinc-700 dark:text-zinc-300 [&_strong]:font-semibold [&_p]:mb-4 [&_p]:leading-relaxed [&_a]:text-blue-500 [&_a]:hover:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: app.description_html || '<p>No details available.</p>' }}
          />

          {app.features_html && (
            <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
               <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100 px-1 sm:px-0">
                 App Features
               </h2>
               <div 
                 className="w-full text-base text-zinc-700 dark:text-zinc-300 [&_strong]:font-semibold [&_p]:mb-4 [&_p]:leading-relaxed [&_a]:text-blue-500 [&_a]:hover:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-2"
                 dangerouslySetInnerHTML={{ __html: app.features_html }}
               />
            </div>
          )}
          
          {app.release_notes && (
             <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
               <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">What's New</h3>
               <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap border border-black/5 dark:border-white/5 line-clamp-4 hover:line-clamp-none transition-all">
                {app.release_notes}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-1 mb-8">
        <UserReviews key={reviewsRefreshKey} appId={app.id} appTitle={app.name} overallRating={app.rating} />
      </div>
      
      {app.faqs && app.faqs.length > 0 && (
         <div className="mb-20 px-4">
           <div className="py-8 border-t border-black/5 dark:border-white/5">
            <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {app.faqs.map((faq, idx) => (
                 <div key={idx} className="border border-black/5 dark:border-white/10 rounded-2xl p-1 bg-white dark:bg-zinc-900 shadow-sm">
                  <details className="group">
                     <summary className="font-medium p-4 cursor-pointer select-none flex items-center justify-between text-base text-zinc-900 dark:text-zinc-100">
                      <span className="flex-1 pr-4">{faq.question}</span>
                       <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-open:rotate-45 transition-transform shrink-0">
                         +
                       </div>
                    </summary>
                    <div 
                       className="px-4 pb-4 pt-0 text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
