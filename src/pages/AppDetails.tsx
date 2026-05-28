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
        <div className="w-10 h-10 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600 italic animate-pulse">Loading secure files...</p>
      </div>
    );
  }

  // Graceful interstitial for slow database cold-starts or deep links on first visit
  if (!app && (!serverAppsFetched || !appsSyncedWithServer || isRefreshing)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-10 h-10 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]"></div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mt-2">Establishing Cloud Sync</h3>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          Verifying secure app listing with our server. This resolves server cold-start latency during deep links...
        </p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center mb-6 border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.15)]">
          <ShieldAlert className="w-8 h-8 animate-pulse text-red-600" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-800">Application Not Found</h1>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed mb-8">
          The requested application "<span className="font-mono font-bold text-red-600">{slug}</span>" could not be located in our secure index. It may have been relocated, or it is taking a few moments to sync database records.
        </p>
        <Link 
          to="/" 
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" /> Go back to homepage
        </Link>
      </div>
    );
  }

  const defaultDesc = `${app.name} technical specifications, version ${app.version}. Verified security status: ${app.safety_status}. Access security clearance profile for<sup>TM</sup> ${app.name} safe environment.`;
  const desc = app.seo_description || defaultDesc;
  const title = app.seo_title || `${app.name} - Technical Specifications & Security Clearance`;
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
    "description": app.seo_description || `${app.name} secure installation and specifications`,
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
      })
      .slice(0, 30);
  }, [mockApps, app.category, app.id]);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto select-none">
      <div className="px-4 mb-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500 transition-colors group"
        >
          <div className="p-2 rounded-full bg-black/5 border border-black/5 group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
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
        <div className="pt-2 pb-6 sm:pt-4 sm:pb-10 mb-6 flex flex-col items-center text-center relative transition-all duration-300 border-b border-black/5">
          <div className="relative mb-6">
            <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-xl sm:rounded-[1.75rem] overflow-hidden shrink-0 shadow-xl bg-white border border-slate-200 group">
              {app.icon_url ? (
                <img src={app.icon_url || undefined} alt={app.name} width={128} height={128} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl sm:text-5xl font-black bg-slate-800 text-slate-500 uppercase">
                  {app.name.substring(0, 1)}
                </div>
              )}
            </div>
            <div className="absolute -inset-3 blur-2xl bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          
          <div className="flex flex-col items-center w-full max-w-2xl px-2">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-7xl font-black tracking-tighter uppercase italic text-slate-900 leading-tight mb-4 drop-shadow-sm break-words px-4">
                {app.name}
              </h1>
              <div className="flex justify-center flex-wrap gap-3">
                {app.is_new && (
                  <div className="px-3 py-1 bg-red-600/10 text-red-600 text-[9px] sm:text-[11px] font-black rounded-lg uppercase tracking-widest animate-pulse border border-red-600/10 shadow-sm">
                    NEW RELEASE
                  </div>
                )}
                <div className={cn(
                  "px-3 py-1 text-[9px] sm:text-[11px] font-black rounded-lg flex items-center gap-1.5 uppercase tracking-widest border shadow-sm",
                  app.safety_status === 'Verified' ? "bg-green-500/10 text-green-600 border-green-500/10" : "bg-amber-500/10 text-amber-600 border-amber-500/10"
                )}>
                  {app.safety_status === 'Verified' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  {app.safety_status}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full max-w-[340px] mb-8">
              {[
                { label: 'VERSION', value: app.version },
                { label: 'SIZE', value: app.file_size },
                { label: 'TYPE', value: app.category.split(',')[0] },
                { label: 'RATING', value: app.rating ? app.rating.toFixed(1) : '5.0', icon: Star },
              ].map((item, i) => (
                <div key={i} className="text-center group py-1 px-1.5 rounded-md bg-black/[0.015] dark:bg-white/[0.015] border border-black/[0.03] dark:border-white/[0.03] hover:border-red-500/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all duration-300">
                  <div className="text-[7.5px] mb-0.5 font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 group-hover:text-red-500 transition-colors">{item.label}</div>
                  <div className="font-extrabold text-[10.5px] sm:text-xs text-slate-800 dark:text-zinc-200 flex items-center justify-center gap-0.5 tracking-tight">
                    {item.icon && <item.icon className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />}
                    <span className="truncate max-w-full">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
  
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-full sm:w-auto min-w-[280px] sm:min-w-[400px] flex justify-center cursor-pointer select-none"
            >
              <Link 
                to={`/info/${app.slug}`} 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 px-12 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-3 transition-all text-[12px] sm:text-[14px] uppercase tracking-[0.2em] italic shadow-2xl shadow-red-600/30 relative overflow-hidden group"
              >
                READ SECURITY & SPECS <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>

        {relatedApps.length > 0 && (
          <div className="mb-6 px-1">
            <div className="flex items-center justify-between mb-3 px-3">
              <h2 className="text-[9px] font-black flex items-center gap-2 uppercase tracking-widest text-slate-500 dark:text-zinc-500 italic">
                <Sparkles className="w-3 h-3 text-red-600" /> RECOMMENDED FOR YOU
              </h2>
            </div>
            <div className="space-y-1">
              {relatedApps.map((relatedApp) => (
                <AppListItem key={relatedApp.id} app={relatedApp} index={relatedApp.serial_number} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RESTORED SAFETY & INFO BOXES */}
      <div className="px-1 space-y-2 mb-8 max-w-2xl mx-auto">

        {app.red_box_msg && (
          <div className="bg-rose-500/10 border-2 border-rose-500/30 p-4 rounded-2xl flex items-start gap-4 shadow-xl shadow-rose-500/5 group hover:bg-rose-500/15 transition-all">
            <div className="p-2 bg-rose-500 rounded-full shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div className="text-[10px] sm:text-[11px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tighter italic leading-tight">
              {app.red_box_msg}
            </div>
          </div>
        )}
        
        {app.yellow_box_msg && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 p-4 rounded-2xl flex items-start gap-4 shadow-xl shadow-amber-500/5 group hover:bg-amber-500/15 transition-all">
            <div className="p-2 bg-amber-500 rounded-full shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div className="text-[10px] sm:text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-tighter italic leading-tight">
              {app.yellow_box_msg}
            </div>
          </div>
        )}

        {app.idea_box_msg && (
          <div className="bg-pink-500/10 border-2 border-pink-500/30 p-4 rounded-2xl flex items-start gap-4 shadow-xl shadow-pink-500/5 group hover:bg-pink-500/15 transition-all">
            <div className="p-2 bg-pink-500 rounded-full shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-[10px] sm:text-[11px] font-black text-pink-500 dark:text-pink-400 uppercase tracking-tighter italic leading-tight">
              {app.idea_box_msg}
            </div>
          </div>
        )}
      </div>

      <div className="px-1 mb-8 space-y-12">
        {app.custom_admin_box_html && (
           <div className="py-12 border-b border-black/5 relative overflow-hidden group">
             {app.custom_admin_box_heading && (
               <h2 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-[0.2em] italic">
                 <ShieldCheck className="w-5 h-5 text-red-600" /> {app.custom_admin_box_heading}
               </h2>
             )}
             <div 
               className="prose prose-slate max-w-none text-lg font-medium leading-relaxed text-slate-600"
               dangerouslySetInnerHTML={{ __html: app.custom_admin_box_html }}
             />
           </div>
        )}

        <div className="py-12">
          <h2 className="text-sm font-black mb-8 flex items-center gap-2 uppercase tracking-[0.2em]">
            <FileText className="w-5 h-5 text-red-600" /> About this application
          </h2>
          <div 
            className="prose prose-slate max-w-none text-lg font-medium leading-relaxed text-slate-600 custom-description"
            dangerouslySetInnerHTML={{ __html: app.description_html || `<p>${app.seo_description || 'No detailed description available yet.'}</p>` }}
          />
          
          {app.release_notes && (
            <div className="mt-12 pt-8 border-t border-black/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 italic">Technical Changelog</h3>
              <div className="bg-slate-50 rounded-2xl p-6 font-bold text-xs text-slate-500 whitespace-pre-wrap border border-black/5">
                {app.release_notes}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {app.faqs && app.faqs.length > 0 && (
        <div className="mb-20 max-w-4xl mx-auto px-4">
          <div className="py-12 border-t border-black/5">
            <h2 className="text-xs font-black mb-8 flex items-center gap-2 uppercase tracking-[0.2em]">
              <Info className="w-4 h-4 text-red-600" /> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {app.faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-black/5 pb-4">
                  <details className="group">
                    <summary className="font-black py-4 cursor-pointer select-none flex items-center justify-between group-open:text-red-600 text-lg sm:text-2xl tracking-tighter italic">
                      <span className="flex-1">{faq.question}</span>
                      <span className="text-2xl leading-none transition-transform group-open:rotate-45 ml-4">+</span>
                    </summary>
                    <div 
                      className="px-0 pb-6 pt-2 prose prose-slate max-w-none text-left font-medium text-lg leading-relaxed text-slate-600"
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
