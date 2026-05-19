import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ShieldCheck, ShieldAlert, ArrowRight, ArrowLeft, Star, Sparkles, Info, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useMemo } from 'react';
import { AppListItem } from '../components/PlayStoreUI';

export default function AppDetails() {
  const { apps: mockApps, settings: mockSettings, news: mockNews, blogs: mockBlogs, videos: mockVideos, saveApps: saveMockApps, saveSettings: saveMockSettings, saveNews: saveMockNews, saveBlogs: saveMockBlogs, saveVideos: saveMockVideos } = useData();
  const { slug } = useParams();
  const app = mockApps.find(a => a.slug === slug);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!app) {
    return <Navigate to="/" />;
  }

  const defaultDesc = `${app.name} technical specifications, version ${app.version}. Verified security status: ${app.safety_status}. Download ${app.name} safe and secure.`;
  const desc = app.seo_description || defaultDesc;
  const title = app.seo_title || `${app.name} - Technical Specifications & Verified Download`;
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
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group"
        >
          <div className="p-2 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Back to storefront
        </Link>
      </div>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        {app.seo_keywords && <meta name="keywords" content={app.seo_keywords} />}
        <meta name="author" content="Transparency Portal" />
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="glass-panel p-6 sm:p-12 mb-8 flex flex-col items-center text-center shadow-2xl relative transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/40 text-transparent"></div>
          
          <div className="relative mb-8">
            <div className="relative w-24 h-24 sm:w-40 sm:h-40 rounded-2xl sm:rounded-[3rem] overflow-hidden shrink-0 shadow-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-white/10 group">
              {app.icon_url ? (
                <img src={app.icon_url || undefined} alt={app.name} width={160} height={160} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl sm:text-6xl font-black bg-slate-800 text-slate-500 uppercase">
                  {app.name.substring(0, 1)}
                </div>
              )}
            </div>
            <div className="absolute -inset-4 blur-3xl bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          
          <div className="flex flex-col items-center w-full max-w-2xl px-2">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white leading-tight mb-4 drop-shadow-sm break-words px-4">
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
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full mb-10">
              {[
                { label: 'VERSION', value: app.version },
                { label: 'SIZE', value: app.file_size },
                { label: 'TYPE', value: app.category.split(',')[0] },
                { label: 'RATING', value: app.rating ? app.rating.toFixed(1) : '10.0', icon: Star },
              ].map((item, i) => (
                <div key={i} className="bg-white/50 dark:bg-black/20 rounded-2xl p-4 sm:p-5 text-center border border-black/5 dark:border-white/5 backdrop-blur-sm shadow-sm group hover:border-red-600/20 transition-all">
                  <div className="text-[8px] sm:text-[10px] mb-1.5 font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 group-hover:text-red-500 transition-colors">{item.label}</div>
                  <div className="font-black text-[12px] sm:text-[14px] leading-none text-slate-900 dark:text-zinc-200 flex items-center justify-center gap-1">
                    {item.icon && <item.icon className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    <span className="truncate max-w-full">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
  
            <Link 
              to={`/download/${app.slug}`} 
              className="w-full sm:w-auto min-w-[280px] sm:min-w-[400px] bg-red-600 hover:bg-red-700 text-white font-black py-5 px-12 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 text-[12px] sm:text-[14px] uppercase tracking-[0.2em] italic shadow-2xl shadow-red-600/30 relative overflow-hidden group"
            >
              SECURE DOWNLOAD <ArrowRight className="w-5 h-5" />
            </Link>
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

      {/* RESTORED EXTENDED INFO & DESCRIPTION */}
      <div className="px-1 mb-8 space-y-6">
        {app.custom_admin_box_html && (
           <div className="bg-white/40 dark:bg-black/40 backdrop-blur-3xl border-2 border-white/20 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>
             {app.custom_admin_box_heading && (
               <h2 className="text-xs sm:text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-[0.2em] dark:text-zinc-100 italic">
                 <ShieldCheck className="w-5 h-5 text-pink-500" /> {app.custom_admin_box_heading}
               </h2>
             )}
             <div 
               className="prose prose-pink dark:prose-invert max-w-none text-[10px] sm:text-[11px] font-bold leading-relaxed text-slate-700 dark:text-zinc-300"
               dangerouslySetInnerHTML={{ __html: app.custom_admin_box_html }}
             />
           </div>
        )}

        <div className="bg-white/40 dark:bg-black/60 backdrop-blur-3xl border-2 border-white/20 dark:border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xs sm:text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-[0.2em] dark:text-zinc-100">
            <FileText className="w-5 h-5 text-red-600" /> About this application
          </h2>
          <div 
            className="prose prose-red dark:prose-invert max-w-none text-[10px] sm:text-[11px] font-bold leading-relaxed text-slate-700 dark:text-zinc-300 custom-description"
            dangerouslySetInnerHTML={{ __html: app.description_html || `<p>${app.seo_description || 'No detailed description available yet.'}</p>` }}
          />
          
          {app.release_notes && (
            <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-pink-500 dark:text-pink-400 mb-3 italic">Technical Changelog</h3>
              <div className="bg-black/5 dark:bg-black/40 rounded-2xl p-4 font-bold text-[9px] sm:text-[10px] dark:text-zinc-100 whitespace-pre-wrap">
                {app.release_notes}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {app.faqs && app.faqs.length > 0 && (
        <div className="mb-8 max-w-2xl mx-auto px-1">
          <div className="bg-white/40 dark:bg-black/60 backdrop-blur-3xl border border-white/20 dark:border-white/5 rounded-[2rem] p-4 sm:p-6 shadow-2xl">
            <h2 className="text-[10px] sm:text-xs font-black mb-4 px-2 flex items-center gap-2 uppercase tracking-[0.2em] dark:text-zinc-100">
              <Info className="w-3.5 h-3.5 text-red-600 drop-shadow-sm" /> Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {app.faqs.map((faq, idx) => (
                <div key={idx} className="group bg-white/20 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-[1.2rem] overflow-hidden transition-all hover:border-red-600/30 dark:hover:border-red-600/50 hover:bg-white/40 dark:hover:bg-white/10 shadow-sm">
                  <details className="group">
                    <summary className="font-black p-3.5 cursor-pointer select-none flex items-center justify-between group-open:text-red-600 text-[9px] sm:text-[10px] uppercase tracking-tight italic dark:text-zinc-100">
                      <span className="flex-1">{faq.question}</span>
                      <span className="text-base leading-none transition-transform group-open:rotate-45 ml-4 bg-red-600/10 rounded-full w-5 h-5 flex items-center justify-center text-red-600 border border-red-600/20 shadow-sm">+</span>
                    </summary>
                    <div 
                      className="px-4 pb-4 pt-0 prose prose-sm dark:prose-invert max-w-none text-left font-bold text-[8px] sm:text-[9px] border-t border-white/20 dark:border-white/5 mt-1 pt-2 dark:text-zinc-300"
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
