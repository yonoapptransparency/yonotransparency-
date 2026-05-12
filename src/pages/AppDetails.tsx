import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { mockApps } from '../lib/supabase';
import { ShieldCheck, ShieldAlert, ArrowRight, Star, Sparkles, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect } from 'react';

export default function AppDetails() {
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

  return (
    <div className="animate-fade-in max-w-4xl mx-auto select-none">
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
      <div className="glass-panel p-6 sm:p-10 mb-8 flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shrink-0 shadow-2xl bg-slate-800 border border-white/10">
          {app.icon_url ? (
            <img src={app.icon_url || undefined} alt={app.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold bg-slate-800 text-slate-500">
              {app.name.substring(0, 1)}
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col items-center sm:items-start w-full">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
            <h1 className="text-4xl font-black tracking-tighter text-black dark:text-white uppercase">{app.name}</h1>
            {app.is_new && (
              <div className="px-2 py-1 bg-red-600/10 border border-red-600/30 text-red-700 dark:text-red-400 text-xs font-black rounded-lg flex items-center gap-1 animate-pulse uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> Recently Added
              </div>
            )}
            {app.safety_status === 'Verified' && (
              <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-xs font-black rounded-full flex items-center gap-1.5 shadow-lg shadow-green-500/10 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Transparency
              </div>
            )}
          </div>
          
          <div className="text-black dark:text-slate-400 text-lg mb-6 font-black uppercase tracking-tight">{app.developer}</div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mb-8">
            <div className="bg-white/10 dark:bg-white/5 rounded-xl p-3 text-center border border-white dark:border-white/5 shadow-sm">
              <div className="text-black dark:text-slate-400 text-xs mb-1 font-black uppercase tracking-widest">Version</div>
              <div className="font-black text-black dark:text-white">{app.version}</div>
            </div>
            <div className="bg-white/10 dark:bg-white/5 rounded-xl p-3 text-center border border-white dark:border-white/5 shadow-sm">
              <div className="text-black dark:text-slate-400 text-xs mb-1 font-black uppercase tracking-widest">Size</div>
              <div className="font-black text-black dark:text-white">{app.file_size}</div>
            </div>
            <div className="bg-white/10 dark:bg-white/5 rounded-xl p-3 text-center border border-white dark:border-white/5 shadow-sm">
              <div className="text-black dark:text-slate-400 text-xs mb-1 font-black uppercase tracking-widest">Category</div>
              <div className="font-black text-black dark:text-white">{app.category}</div>
            </div>
            <div className="bg-white/10 dark:bg-white/5 rounded-xl p-3 text-center border border-white dark:border-white/5 shadow-sm">
              <div className="text-black dark:text-slate-400 text-xs mb-1 font-black uppercase tracking-widest">Rating</div>
              <div className="font-black text-black dark:text-white flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {app.rating ? app.rating.toFixed(1) : 'N/A'}
              </div>
            </div>
          </div>

          <Link 
            to={`/download/${app.slug}`} 
            className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-black py-4 px-10 rounded-full flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-600/30 active:scale-95 group"
          >
            <span className="text-white drop-shadow-sm">Download Now</span> <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-white drop-shadow-sm" />
          </Link>
        </div>
      </div>
      
      {app.faqs && app.faqs.length > 0 && (
        <div className="mb-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2 text-black dark:text-white uppercase tracking-tighter">
            <Info className="w-6 h-6 text-red-600 drop-shadow-sm" /> Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {app.faqs.map((faq, idx) => (
              <details key={idx} className="group bg-white dark:bg-white/5 border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden pointer-events-auto">
                <summary className="font-black p-4 cursor-pointer select-none flex items-center justify-between text-black dark:text-white group-open:text-red-600 dark:group-open:text-red-400 min-h-[48px] uppercase tracking-tight">
                  {faq.question}
                  <span className="text-2xl leading-none transition-transform group-open:rotate-45 ml-4 text-black dark:text-slate-300 opacity-50 group-open:opacity-100 group-open:text-red-600 border border-slate-300 dark:border-slate-700 rounded-full w-8 h-8 flex items-center justify-center">+</span>
                </summary>
                <div 
                  className="px-4 pb-4 pt-2 text-black dark:text-slate-300 prose prose-sm prose-slate dark:prose-invert max-w-none text-left font-bold"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </details>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
