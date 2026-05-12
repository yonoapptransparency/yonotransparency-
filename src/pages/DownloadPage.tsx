import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { mockApps, mockSettings } from '../lib/supabase';
import { Shield, ShieldAlert, ShieldCheck, Download, MessageSquare, AlertTriangle, Info, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SecureDownloadButton from '../components/SecureDownloadButton';

export default function DownloadPage() {
  const { slug } = useParams();
  const app = mockApps.find(a => a.slug === slug);
  const [downloading, setDownloading] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!app) {
    return <Navigate to="/" />;
  }

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
    "description": app.seo_description || `${app.name} - Download`,
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

  const handleDownload = () => {
    setDownloading(true);
    // Ping API route which will do redirect, here we just mock that delay
    setTimeout(() => {
      if (app.encrypted_download_url) {
        window.location.href = app.encrypted_download_url;
      } else {
        alert("Download URL not configured for " + app.name);
      }
      setDownloading(false);
    }, 1500);
  };

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert("Review submitted and awaiting moderation.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="animate-fade-in select-none pb-20">
      <Helmet>
        <title>Download {app.seo_title || `${app.name} - Verified & Safe`}</title>
        <meta name="description" content={`Download page for ${app.name}. ${app.seo_description || `Completely verified for privacy and security. ${app.safety_status} status.`}`} />
        {app.seo_keywords && <meta name="keywords" content={app.seo_keywords} />}
        <meta property="og:title" content={`Download ${app.seo_title || app.name}`} />
        <meta property="og:description" content={app.seo_description || `Download page for ${app.name}. Completely verified for privacy and security.`} />
        <meta property="og:image" content={app.og_image_url || app.icon_url} />
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
      
      {/* Header section */}
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-4 text-black dark:text-white uppercase tracking-tighter">Download {app.name}</h1>
        <p className="text-black dark:text-slate-400 font-bold uppercase tracking-tight">
          You are about to download the requested application. Please review the security and transparency notes below before proceeding.
        </p>
      </div>

      {/* SEO Optimized FAQs */}
      {app.faqs && app.faqs.length > 0 && (
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-black dark:text-white uppercase tracking-tight">
            <Info className="w-5 h-5 text-red-600" /> Frequently Asked Questions
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

      {/* Main Download Action with Speedometer */}
      <div className="bg-white dark:bg-zinc-900/60 p-8 text-center mb-12 flex flex-col md:flex-row items-center justify-between border-2 border-white dark:border-white/5 rounded-[3rem] max-w-4xl mx-auto gap-8 shadow-2xl backdrop-blur-3xl">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-white shrink-0">
            {app.icon_url ? <img src={app.icon_url} alt="" className="w-full h-full object-cover"/> : null}
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter mb-1">{app.name}</h2>
            <div className="text-sm text-black dark:text-slate-400 font-black uppercase tracking-widest">
              Size: {app.file_size} • Version: {app.version}
            </div>
            {/* Visual Safety Speedometer */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Safety Index</span>
              <div className="flex items-center h-2 w-32 bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={cn(
                  "h-full transition-all duration-1000",
                  app.safety_status === 'Verified' ? "w-[95%] bg-green-500" :
                  app.safety_status === 'Caution' ? "w-[50%] bg-yellow-500" : "w-[10%] bg-red-500"
                )} />
              </div>
              <span className={cn(
                "text-xs font-bold",
                app.safety_status === 'Verified' ? "text-green-600 dark:text-green-400" :
                app.safety_status === 'Caution' ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"
              )}>{app.safety_status}</span>
            </div>
          </div>
        </div>
        
        <SecureDownloadButton appId={app.id} status={app.safety_status as 'Verified' | 'Caution' | 'Unsafe'} />
      </div>

      {/* Strict Section Order 1: Admin Alert Boxes */}
      <div className="space-y-4 mb-12 max-w-4xl mx-auto flex flex-col gap-4">
        {app.red_box_msg && (
          <div className="bg-red-600 text-white p-6 rounded-3xl shadow-xl shadow-red-600/20 border-l-8 border-red-800">
            <h3 className="font-black text-white flex items-center gap-2 mb-2 uppercase tracking-widest">
              <ShieldAlert className="w-5 h-5" /> Safety Warning
            </h3>
            <p className="text-white font-bold">{app.red_box_msg}</p>
          </div>
        )}
        {app.yellow_box_msg && (
          <div className="bg-amber-100 dark:bg-amber-500/10 border-l-4 border-amber-600 p-6 rounded-r-xl shadow-lg border border-amber-200">
            <h3 className="font-black text-amber-800 dark:text-amber-500 flex items-center gap-2 mb-2 uppercase tracking-widest">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Notice
            </h3>
            <p className="text-amber-900 dark:text-amber-100/80 font-medium">{app.yellow_box_msg}</p>
          </div>
        )}
        {app.idea_box_msg && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-600 p-6 rounded-r-xl shadow-lg border border-blue-100">
            <h3 className="font-black text-blue-800 dark:text-blue-400 flex items-center gap-2 mb-2 uppercase tracking-widest">
              <Info className="w-5 h-5 text-blue-600" /> Idea / Tip
            </h3>
            <p className="text-blue-900 dark:text-blue-100/80 font-medium">{app.idea_box_msg}</p>
          </div>
        )}
        {app.custom_admin_box_html && (
          <div className="bg-slate-900 text-slate-100 dark:bg-white dark:text-slate-900 shadow-xl border-l-4 border-slate-500 dark:border-slate-300 p-6 rounded-r-xl">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-white dark:text-slate-900">
              <Info className="w-5 h-5 text-slate-300 dark:text-slate-600" /> {app.custom_admin_box_heading || 'App Details'}
            </h3>
            <div 
              className="prose prose-sm prose-invert dark:prose-slate max-w-none opacity-90"
              dangerouslySetInnerHTML={{ __html: app.custom_admin_box_html }}
            />
          </div>
        )}
      </div>

      {/* Strict Section Order 2: Massive Description */}
      <div className="glass-panel p-8 mb-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-black mb-6 border-b border-black/10 dark:border-white/10 pb-4 text-black dark:text-white uppercase tracking-tight">Application Details</h2>
        <div 
          className="prose prose-slate dark:prose-invert prose-pink max-w-none text-black dark:text-slate-300 leading-relaxed font-medium pointer-events-none"
          dangerouslySetInnerHTML={{ __html: app.description_html || '<p>No description provided.</p>' }}
        />
      </div>

      {/* Strict Section Order 3: Peer Reviews */}
      <div className="max-w-4xl mx-auto mb-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> Community Experience
        </h2>
        
        <form onSubmit={handleReviewSubmit} className="glass-panel p-6 mb-8">
          <h3 className="font-semibold mb-4 text-slate-700 dark:text-slate-300">Share Your Experience</h3>
          
          <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Name / Alias</label>
              <input required type="text" className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Rating (1-5)</label>
              <select required className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 appearance-none">
                <option value="5">5 - Excellent and Safe</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Needs Improvement</option>
                <option value="1">1 - Dangerous / Bad</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Review</label>
              <textarea required rows={3} className="w-full bg-white/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20"></textarea>
            </div>
          </div>
          <button type="submit" className="mt-4 bg-slate-200 dark:bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-medium transition-colors">
            Submit for Moderation
          </button>
        </form>

        <div className="text-center text-slate-500 text-sm">
          No approved reviews yet. Be the first!
        </div>
      </div>

      {/* Strict Section Order 4: Helpline Block */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-4xl mx-auto mt-20 mb-12">
        <a href={`https://wa.me/${mockSettings.helpline_whatsapp.replace('+','')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center min-h-[48px] gap-2 bg-[#25D366]/20 text-[#25D366] px-6 py-3 rounded-full hover:bg-[#25D366]/30 transition-colors font-medium">
          WhatsApp Helpline
        </a>
        <a href={`https://t.me/${mockSettings.helpline_telegram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center min-h-[48px] gap-2 bg-[#229ED9]/20 text-[#229ED9] px-6 py-3 rounded-full hover:bg-[#229ED9]/30 transition-colors font-medium">
          Telegram Support
        </a>
      </div>

      {/* Discover More Slider */}
      <div className="max-w-6xl mx-auto mt-24 mb-10">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
          <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">Discover More New Apps</h2>
          <div className="flex gap-2">
             <button className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10"><ChevronLeft className="w-5 h-5"/></button>
             <button className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10"><ChevronRight className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockApps.filter(a => a.is_new && a.id !== app.id).slice(0, 4).map(discoverApp => (
            <Link key={discoverApp.id} to={`/app/${discoverApp.slug}`} className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl p-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform pointer-events-auto border border-white/20 dark:border-white/5 rounded-3xl shadow-lg">
              <div className="w-16 h-16 rounded-3xl overflow-hidden mb-3 bg-white dark:bg-slate-800 shadow-lg border border-white">
                 {discoverApp.icon_url && <img src={discoverApp.icon_url} alt="" className="w-full h-full object-cover"/>}
              </div>
              <h4 className="font-black text-xs uppercase tracking-tighter truncate w-full">{discoverApp.name}</h4>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">{discoverApp.developer}</div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* 4.4 THE "WHITE-THEME" TRANSPARENCY PORTAL */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 mt-20 mb-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-white/10">
        <div className="py-24 px-6 sm:px-12 md:px-24 shadow-inner relative overflow-hidden">
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black mb-12 uppercase tracking-tighter border-b-4 border-red-600 pb-6 inline-block text-slate-900 dark:text-white">YONOSTORE Transparency Box</h2>
            
            <div className="grid md:grid-cols-2 gap-12 text-left mt-12 bg-white dark:bg-slate-800 p-8 rounded-[3rem] border-2 border-slate-200 dark:border-slate-700 shadow-xl">
              <div className="space-y-4">
                <h3 className="font-black text-2xl mb-3 flex items-center gap-3 uppercase tracking-tighter text-black dark:text-white">
                  <CheckCircle2 className="w-8 h-8 text-red-600" /> Platform Disclaimer
                </h3>
                <p className="leading-relaxed text-sm font-bold uppercase tracking-tight text-slate-700 dark:text-slate-300">
                  {mockSettings.disclaimer_text}
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-black text-2xl mb-3 flex items-center gap-3 uppercase tracking-tighter text-black dark:text-white">
                  <Shield className="w-8 h-8 text-blue-600" /> Ethics & Discrimination
                </h3>
                <p className="leading-relaxed text-sm font-bold uppercase tracking-tight text-slate-700 dark:text-slate-300">
                  {mockSettings.ethics_discrimination_text}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer to push content down because portal is absolute (wait, it's better to just use relative width viewport or negative margins) */}
      <div className="h-[400px] sm:h-[300px]"></div>
    </div>
  );
}
