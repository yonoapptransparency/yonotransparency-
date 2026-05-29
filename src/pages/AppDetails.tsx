import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ShieldCheck, ShieldAlert, ArrowRight, ArrowLeft, Star, Sparkles, Info, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { AppListItem } from '../components/PlayStoreUI';
import { motion } from 'framer-motion';

export default function AppDetails() {
  const { apps: mockApps, settings: mockSettings, loading, appsSyncedWithServer, serverAppsFetched, refreshAll } = useData();
  const { slug } = useParams();
  const app = mockApps.find(a => a.slug?.toLowerCase() === slug?.toLowerCase());
  
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        } catch (e) {
          console.error("Deep Link Auto-Sync failed:", e);
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

  // Initial loading phase (waiting for setup/cache checks)
  if (loading && !app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide text-zinc-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  // Graceful interstitial for slow database cold-starts or deep links on first visit
  if (!app && (!serverAppsFetched || !appsSyncedWithServer || isRefreshing)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2">Connecting</h3>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          Verifying app listing with our server.
        </p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">App Not Found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-3 leading-relaxed mb-8">
          The requested application "<span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{slug}</span>" could not be located.
        </p>
        <Link 
          to="/" 
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[16px] font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Go back
        </Link>
      </div>
    );
  }

  const title = `${app.seo_title || app.name} | ${mockSettings.site_title || 'RUMMY STORE'}`;
  
  const stripHtml = (html: string) => {
    if (!html) return '';
    const stripped = html.replace(/<[^>]*>?/gm, ' ');
    return stripped.replace(/\s+/g, ' ').trim();
  };
  
  const desc = app.seo_description || (app.description_html ? stripHtml(app.description_html).substring(0, 160) : `${app.name} application specifications`);
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

  return (
    <div className="animate-fade-in max-w-5xl mx-auto select-none">
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
        <meta name="author" content="RUMMY STORE" />
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="pt-2 pb-6 sm:pt-4 sm:pb-10 mb-6 flex flex-col items-center text-center relative transition-all duration-300 border-b border-black/5 dark:border-white/5">
          <div className="relative mb-6">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[22px] overflow-hidden shrink-0 shadow-lg bg-white border border-black/5 dark:border-white/10 group">
              {app.icon_url ? (
                <img src={app.icon_url || undefined} alt={app.name} width={128} height={128} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl sm:text-5xl font-bold bg-zinc-800 text-zinc-500">
                  {app.name.substring(0, 1)}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center w-full max-w-2xl px-2">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mb-4 break-words px-4">
                {app.name}
              </h1>
              <div className="flex justify-center flex-wrap gap-2">
                {app.is_new && (
                  <div className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold rounded-full uppercase tracking-wide border border-blue-500/10">
                    New Release
                  </div>
                )}
                <div className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-full flex items-center gap-1.5 uppercase tracking-wide border",
                  app.safety_status === 'Verified' ? "bg-green-500/10 text-green-600 border-green-500/10" : "bg-orange-500/10 text-orange-600 border-orange-500/10"
                )}>
                  {app.safety_status === 'Verified' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  {app.safety_status}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-[360px] mb-8">
              {[
                { label: 'Version', value: app.version },
                { label: 'Size', value: app.file_size },
                { label: 'Type', value: app.category.split(',')[0] },
                { label: 'Rating', value: app.rating ? app.rating.toFixed(1) : '5.0', icon: Star },
              ].map((item, i) => (
                <div key={i} className="text-center py-2 px-1 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5">
                  <div className="text-[10px] mb-1 font-semibold uppercase tracking-wider text-zinc-500">{item.label}</div>
                  <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1 tracking-tight">
                    {item.icon && <item.icon className="w-3 h-3 text-orange-500 fill-orange-500 shrink-0" />}
                    <span className="truncate max-w-full">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
  
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto min-w-[280px] flex justify-center cursor-pointer select-none"
            >
              <Link 
                to={`/info/${app.slug}`} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-[20px] flex items-center justify-center gap-2 transition-all text-[15px] shadow-lg shadow-blue-600/20"
              >
                More <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
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
      <div className="px-1 space-y-3 mb-8 max-w-3xl mx-auto">

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

      <div className="px-1 mb-8 space-y-12">
        {app.custom_admin_box_html && (
           <div className="py-8 border-b border-black/5 dark:border-white/5 relative overflow-hidden">
             {app.custom_admin_box_heading && (
               <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
                  {app.custom_admin_box_heading}
               </h2>
             )}
             <div 
               className="prose prose-zinc dark:prose-invert max-w-none text-base text-zinc-600 dark:text-zinc-400"
               dangerouslySetInnerHTML={{ __html: app.custom_admin_box_html }}
             />
           </div>
        )}

        <div className="py-8">
           <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
             About this app
          </h2>
          <div 
             className="prose prose-zinc dark:prose-invert max-w-none text-base text-zinc-600 dark:text-zinc-400"
            dangerouslySetInnerHTML={{ __html: app.description_html || '<p>No details available.</p>' }}
          />
          
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
