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

  const defaultDesc = `Download ${app.name} completely verified for privacy and security. ${app.safety_status} status.`;
  const desc = app.seo_description || defaultDesc;
  const title = app.seo_title || `${app.name} - Verified & Safe`;
  const ogImage = app.og_image_url || app.icon_url;

  const faqSchema = app.faqs && app.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": app.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": app.name,
    "description": app.seo_description || `${app.name} details`,
    "applicationCategory": app.category,
    "operatingSystem": "All",
    "softwareVersion": app.version,
    "image": app.og_image_url || app.icon_url,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const relatedApps = useMemo(() => {
    const currentCats = app.category ? app.category.toLowerCase().split(',').map(c => c.trim()) : [];
    return mockApps
      .filter(a => {
        if (a.id === app.id) return false;
        const appCats = a.category ? a.category.toLowerCase().split(',').map(c => c.trim()) : [];
        return appCats.some(cat => currentCats.includes(cat));
      })
      .slice(0, 10);
  }, [mockApps, app.category, app.id]);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto select-none">
      <div className="px-4 mb-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-70 hover:opacity-100 transition-colors group"
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
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={ogImage} />
        {app.canonical_url && <link rel="canonical" href={app.canonical_url} />}
        <script type="application/ld+json">
          {JSON.stringify(softwareSchema)}
        </script>
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
      </Helmet>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border-2 border-white/40 dark:border-white/10 rounded-[3.5rem] p-8 sm:p-12 mb-10 flex flex-col items-center text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden group transition-all duration-500">
          {/* Decorative Glossy Highlight & Subtle Glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent"></div>
          
          <div className="relative mb-8 group">
            <div className="absolute -inset-6 bg-red-600/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-[3rem] overflow-hidden shrink-0 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-white/10 transition-all duration-700 group-hover:rotate-1">
              {app.icon_url ? (
                <img src={app.icon_url || undefined} alt={app.name} width={144} height={144} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-slate-800 text-slate-500">
                  {app.name.substring(0, 1)}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center w-full relative z-10 max-w-xl">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic dark:text-white leading-tight mb-3 drop-shadow-sm">{app.name}</h1>
              <div className="flex justify-center gap-2">
                {app.is_new && (
                  <div className="px-2.5 py-1 bg-red-600/10 border border-red-600/30 text-red-600 text-[8px] font-black rounded-lg flex items-center gap-1 animate-pulse uppercase tracking-widest">
                    <Sparkles className="w-2.5 h-2.5" /> NEW
                  </div>
                )}
                {app.safety_status === 'Verified' && (
                  <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-600 text-[8px] font-black rounded-full flex items-center gap-1.5 shadow-lg shadow-green-500/10 uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-6 h-[1px] bg-red-600/20"></div>
              <div className="opacity-40 text-[10px] font-black uppercase tracking-[0.3em] leading-none dark:text-white italic">Provider: {app.developer || 'OFFICIAL'}</div>
              <div className="w-6 h-[1px] bg-red-600/20"></div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full mb-10">
              {[
                { label: 'VERSION', value: app.version },
                { label: 'SIZE', value: app.file_size },
                { label: 'CATEGORY', value: app.category },
                { label: 'RATING', value: app.rating ? app.rating.toFixed(1) : '5.0', icon: Star },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-100 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl p-4 text-center border-2 border-white/60 dark:border-white/10 shadow-sm transition-all hover:bg-white dark:hover:bg-zinc-800">
                  <div className="text-[8px] mb-1.5 font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-60 dark:opacity-100">{item.label}</div>
                  <div className="font-black text-[11px] leading-none text-slate-900 dark:text-white flex items-center justify-center gap-1">
                    {item.icon && <item.icon className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    <span className="truncate">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
  
            <Link 
              to={`/download/${app.slug}`} 
              className="w-full sm:w-auto min-w-[240px] bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 px-12 rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-[0_15px_30px_-5px_rgba(220,38,38,0.3)] active:scale-95 group text-[11px] uppercase tracking-[0.2em] italic border-t border-white/20"
            >
              <span className="text-white drop-shadow-md">GET NOW</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white drop-shadow-md" />
            </Link>
          </div>
        </div>
      </div>

      {/* RESTORED SAFETY & INFO BOXES */}
      <div className="px-1 space-y-3 mb-6">
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
            <div className="text-[10px] sm:text-[11px] font-black text-pink-500 uppercase tracking-tighter italic leading-tight">
              {app.idea_box_msg}
            </div>
          </div>
        )}
      </div>

      {/* RESTORED EXTENDED INFO & DESCRIPTION */}
      <div className="px-1 mb-8 space-y-6">
        {app.custom_admin_box_html && (
           <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-2 border-white/20 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>
             {app.custom_admin_box_heading && (
               <h2 className="text-xs sm:text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-[0.2em] dark:text-white italic">
                 <ShieldCheck className="w-5 h-5 text-pink-500" /> {app.custom_admin_box_heading}
               </h2>
             )}
             <div 
               className="prose prose-pink dark:prose-invert max-w-none text-[10px] sm:text-[11px] font-bold leading-relaxed text-slate-700 dark:text-slate-300"
               dangerouslySetInnerHTML={{ __html: app.custom_admin_box_html }}
             />
           </div>
        )}

        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-2 border-white/20 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xs sm:text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-[0.2em] dark:text-white opacity-80">
            <FileText className="w-5 h-5 text-red-600" /> About this application
          </h2>
          <div 
            className="prose prose-red dark:prose-invert max-w-none text-[10px] sm:text-[11px] font-bold leading-relaxed text-slate-700 dark:text-slate-300 custom-description"
            dangerouslySetInnerHTML={{ __html: app.description_html || `<p>${app.seo_description || 'No detailed description available yet.'}</p>` }}
          />
          
          {app.release_notes && (
            <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-pink-500 mb-3 italic">Technical Changelog</h3>
              <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 font-bold text-[9px] sm:text-[10px] dark:text-white/80 whitespace-pre-wrap">
                {app.release_notes}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {app.faqs && app.faqs.length > 0 && (
        <div className="mb-8 max-w-5xl mx-auto px-1">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-2 border-white/20 dark:border-white/10 rounded-[2.5rem] p-4 sm:p-6 shadow-2xl">
            <h2 className="text-xs sm:text-sm font-black mb-4 px-2 flex items-center gap-2 uppercase tracking-[0.2em] dark:text-white opacity-80">
              <Info className="w-4 h-4 text-red-600 drop-shadow-sm" /> Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {app.faqs.map((faq, idx) => (
                <div key={idx} className="group bg-white/20 dark:bg-slate-800/40 border border-white/40 dark:border-white/10 rounded-[1.8rem] overflow-hidden transition-all hover:border-red-600/30 dark:hover:border-red-600/50 hover:bg-white/40 dark:hover:bg-slate-800 shadow-sm hover:shadow-xl">
                  <details className="group">
                    <summary className="font-black p-4 cursor-pointer select-none flex items-center justify-between group-open:text-red-600 text-[10px] sm:text-[11px] uppercase tracking-tight italic dark:text-slate-200">
                      <span className="flex-1">{faq.question}</span>
                      <span className="text-lg leading-none transition-transform group-open:rotate-45 ml-4 bg-red-600/10 rounded-full w-6 h-6 flex items-center justify-center text-red-600 border border-red-600/20 shadow-sm">+</span>
                    </summary>
                    <div 
                      className="px-4 pb-4 pt-0 opacity-80 prose prose-sm dark:prose-invert max-w-none text-left font-bold text-[9px] sm:text-[10px] border-t border-white/20 dark:border-white/10 mt-1 pt-3 dark:text-slate-400"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {relatedApps.length > 0 && (
        <div className="mb-8 max-w-5xl mx-auto px-1">
          <h2 className="text-xs sm:text-sm font-black mb-4 px-4 flex items-center gap-2 uppercase tracking-[0.2em] dark:text-white opacity-80">
            <Sparkles className="w-4 h-4 text-red-600 drop-shadow-sm" /> Related Selection
          </h2>
          <div className="space-y-2">
            {relatedApps.map((relatedApp, index) => (
              <AppListItem key={relatedApp.id} app={relatedApp} index={index + 1} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
