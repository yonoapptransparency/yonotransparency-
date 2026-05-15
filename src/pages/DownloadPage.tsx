import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { Shield, ShieldAlert, ShieldCheck, Download, MessageSquare, AlertTriangle, Info, CheckCircle2, ChevronRight, ChevronLeft, Fingerprint, Lock, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SecureDownloadButton from '../components/SecureDownloadButton';

export default function DownloadPage() {
  const { apps: mockApps, settings: mockSettings, news: mockNews, blogs: mockBlogs, videos: mockVideos, saveApps: saveMockApps, saveSettings: saveMockSettings, saveNews: saveMockNews, saveBlogs: saveMockBlogs, saveVideos: saveMockVideos } = useData();
  const { slug } = useParams();
  const app = mockApps.find(a => a.slug === slug);
  const [downloading, setDownloading] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [progress, setProgress] = useState(0);

  const playSoftClick = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play blocked", e));
  };

  const handleVerifyStart = () => {
    playSoftClick();
    setIsVerifying(true);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsVerified(true);
          setIsVerifying(false);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
  };

  const handleVerifyCancel = () => {
    if (!isVerified) {
      setIsVerifying(false);
      setProgress(0);
    }
  };

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
      <div className="px-4 mb-6 max-w-4xl mx-auto">
        <Link 
          to={`/app/${app.slug}`} 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-colors group"
        >
          <div className="p-2 rounded-full bg-black/5 border border-black/5 group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Back to details
        </Link>
      </div>
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
      <div className="text-center mb-10 max-w-2xl mx-auto px-4">
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-2xl mb-4 font-black uppercase text-[10px] tracking-widest shadow-xl italic",
          app.safety_status === 'Verified' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
          app.safety_status === 'Caution' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
          "bg-rose-500/10 text-rose-500 border border-rose-500/20"
        )}>
          {app.safety_status === 'Verified' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
          Security Status: {app.safety_status}
        </div>
        <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter dark:text-white italic flex flex-wrap items-center justify-center gap-4">
          <ShieldCheck className="w-8 h-8 text-pink-600" />
          <span>Transparency</span>
          <span className="text-pink-600">Review Portal</span>
          <Sparkles className="w-8 h-8 text-pink-600 animate-pulse" />
        </h1>
        <p className="opacity-60 font-bold uppercase tracking-tight dark:text-white">
          Decryption in progress. Please verify the technical specifications below for {app.name} before final execution.
        </p>
      </div>

      {/* Main Download Action with Stealth Gate */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-6 sm:p-10 text-center mb-10 border border-white/20 dark:border-white/10 rounded-[3.5rem] max-w-4xl mx-auto shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden relative">
        {/* Decorative Glossy Highlight */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        
        {!isVerified ? (
          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-tr from-pink-500 to-red-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative w-24 h-24 bg-white dark:bg-black/40 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 shrink-0">
                    {app.icon_url ? <img src={app.icon_url} alt="" className="w-full h-full object-cover"/> : null}
                  </div>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 dark:text-white italic leading-none">{app.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 font-black uppercase tracking-widest dark:text-white/60">
                      S-M-N: {app.serial_number}
                    </span>
                    <span className="text-[9px] px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 font-black uppercase tracking-widest dark:text-white/60">
                      {app.file_size}
                    </span>
                    <span className="text-[9px] px-2 py-1 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 font-black uppercase tracking-widest dark:text-white/60">
                      v{app.version}
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-3 px-6 py-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 group">
                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                  <Fingerprint className="w-4 h-4 text-pink-500 animate-pulse" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-tighter dark:text-white">Authorisation Gate</p>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 dark:text-white">Technical Lock Active</p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm relative" onClick={playSoftClick}>
              {/* Button Shadow Glow */}
              <div className="absolute -inset-4 bg-red-600/20 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <button
                onMouseDown={handleVerifyStart}
                onMouseUp={handleVerifyCancel}
                onMouseLeave={handleVerifyCancel}
                onTouchStart={handleVerifyStart}
                onTouchEnd={handleVerifyCancel}
                className="w-full relative h-[84px] bg-gradient-to-br from-red-500 to-red-700 rounded-[2.5rem] overflow-hidden active:scale-95 transition-all cursor-pointer group/btn shadow-[0_10px_20px_-5px_rgba(220,38,38,0.4)] border-2 border-white/20"
              >
                {/* Gloss Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
                
                {/* Hover Reveal */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                
                {/* Progress Overlay */}
                <div 
                  className="absolute inset-y-0 left-0 bg-black/20 backdrop-blur-sm transition-all duration-75 border-r border-white/30"
                  style={{ width: `${progress}%` }}
                ></div>

                <div className="absolute inset-0 flex items-center justify-center gap-5 px-6">
                  <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md border border-white/30 flex items-center justify-center relative shrink-0">
                    <Lock className={cn("w-5 h-5 text-white transition-all", isVerifying ? "animate-pulse scale-110" : "")} />
                    {isVerifying && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeDasharray={126}
                          strokeDashoffset={126 - (126 * progress) / 100}
                          className="transition-all duration-75"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-base font-black text-white uppercase tracking-[0.25em] italic drop-shadow-md truncate">
                    {progress > 0 ? `Decrypting ${progress}%` : "Hold to Unlock"}
                  </span>
                </div>
              </button>
              <div className="mt-5 flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className={cn("w-1 h-1 rounded-full bg-red-600 transition-all duration-300", isVerifying ? "animate-bounce" : "opacity-20")} style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white italic">Biometric Pressure Required for Extraction</p>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between w-full gap-8 py-2"
          >
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-green-500 rounded-3xl blur opacity-30 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-white dark:bg-black/20 rounded-[2rem] overflow-hidden shadow-2xl border-2 border-green-500/30 shrink-0">
                  {app.icon_url ? <img src={app.icon_url} alt="" className="w-full h-full object-cover"/> : null}
                </div>
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 dark:text-white italic leading-none">{app.name}</h2>
                <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20 w-fit">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Protocol Secured</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <SecureDownloadButton appId={app.id} status={app.safety_status as 'Verified' | 'Caution' | 'Unsafe'} downloadUrl={app.encrypted_download_url} />
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">Link active for 15 minutes</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* SEO Optimized FAQs - Repositioned below Get Now Button */}
      {app.faqs && app.faqs.length > 0 && (
        <div className="max-w-4xl mx-auto mb-12 px-2">
          <div className="bg-white/40 dark:bg-slate-900/40 border-2 border-white/20 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl backdrop-blur-3xl">
            <h2 className="text-xl font-black mb-8 flex items-center gap-2 uppercase tracking-tight px-2 dark:text-white italic">
              <Info className="w-6 h-6 text-pink-500" /> Intelligence Query
            </h2>
            <div className="space-y-4">
              {app.faqs.map((faq, idx) => (
                <div key={idx} className="group bg-white/20 dark:bg-black/20 border border-white/40 dark:border-white/10 rounded-[2rem] overflow-hidden transition-all hover:border-pink-500/30">
                  <details className="group">
                    <summary className="font-black p-6 cursor-pointer select-none flex items-center justify-between group-open:text-pink-500 min-h-[48px] uppercase tracking-tighter text-sm italic dark:text-white">
                      <span className="flex-1">{faq.question}</span>
                      <span className="text-2xl leading-none transition-transform group-open:rotate-45 ml-4 bg-pink-500/10 rounded-full w-10 h-10 flex items-center justify-center text-pink-500 border border-pink-500/20 shadow-sm">+</span>
                    </summary>
                    <div 
                      className="px-6 pb-6 pt-0 opacity-80 prose prose-sm dark:prose-invert max-w-none text-left font-bold border-t border-white/10 dark:border-white/5 mt-2 pt-6 text-[11px] sm:text-xs tracking-tight leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strict Section Order 1: Admin Alert Boxes */}
      <div className="space-y-4 mb-12 max-w-4xl mx-auto flex flex-col gap-4 px-2">
        {app.red_box_msg && (
          <div className="bg-rose-500/10 dark:bg-rose-500/5 border-2 border-rose-500/30 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 bg-rose-500 h-full"></div>
            <h3 className="font-black text-rose-500 flex items-center gap-3 mb-3 uppercase tracking-[0.2em] italic text-xs">
              <ShieldAlert className="w-5 h-5 animate-pulse" /> Critical Warning
            </h3>
            <p className="text-rose-600 dark:text-rose-400 font-bold text-sm tracking-tight leading-relaxed italic">{app.red_box_msg}</p>
          </div>
        )}
        {app.yellow_box_msg && (
          <div className="bg-amber-500/10 dark:bg-amber-500/5 border-2 border-amber-500/30 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full"></div>
            <h3 className="font-black text-amber-500 flex items-center gap-3 mb-3 uppercase tracking-[0.2em] italic text-xs">
              <AlertTriangle className="w-5 h-5" /> Operational Notice
            </h3>
            <p className="text-amber-600 dark:text-amber-500 font-bold text-sm tracking-tight leading-relaxed italic">{app.yellow_box_msg}</p>
          </div>
        )}
        {app.idea_box_msg && (
          <div className="bg-pink-500/10 dark:bg-pink-500/5 border-2 border-pink-500/30 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 bg-pink-500 h-full"></div>
            <h3 className="font-black text-pink-500 flex items-center gap-3 mb-3 uppercase tracking-[0.2em] italic text-xs">
              <Sparkles className="w-5 h-5" /> Efficiency Tip
            </h3>
            <p className="text-pink-500 font-bold text-sm tracking-tight leading-relaxed italic">{app.idea_box_msg}</p>
          </div>
        )}
        {app.custom_admin_box_html && (
          <div className="bg-white/40 dark:bg-slate-900/40 border-2 border-white/20 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl backdrop-blur-3xl">
            <h3 className="font-black flex items-center gap-3 mb-6 uppercase tracking-[0.2em] italic text-xs dark:text-white">
              <Info className="w-5 h-5 text-pink-500" /> {app.custom_admin_box_heading || 'App Encryption Details'}
            </h3>
            <div 
              className="prose prose-pink dark:prose-invert max-w-none text-xs font-bold leading-relaxed opacity-80"
              dangerouslySetInnerHTML={{ __html: app.custom_admin_box_html }}
            />
          </div>
        )}
      </div>

      {/* Strict Section Order 2: Massive Description */}
      <div className="bg-white/40 dark:bg-slate-900/40 border-2 border-white/20 dark:border-white/10 p-8 sm:p-12 mb-12 max-w-4xl mx-auto backdrop-blur-3xl rounded-[3rem] shadow-2xl">
        <h2 className="text-2xl font-black mb-8 border-b-4 border-pink-500/20 pb-4 uppercase tracking-tighter dark:text-white italic">Technical Analysis</h2>
        <div 
          className="prose prose-pink dark:prose-invert max-w-none opacity-80 leading-relaxed font-bold text-sm"
          dangerouslySetInnerHTML={{ __html: app.description_html || `<p>${app.seo_description}</p>` }}
        />
      </div>

      {/* Strict Section Order 3: Peer Reviews */}
      <div className="max-w-4xl mx-auto mb-12 px-2">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter dark:text-white italic">
          <MessageSquare className="w-6 h-6 text-pink-500" /> Transmission Reviews
        </h2>
        
        <form onSubmit={handleReviewSubmit} className="bg-white/40 dark:bg-slate-900/40 border-2 border-white/20 dark:border-white/10 p-8 rounded-[2.5rem] mb-12 backdrop-blur-3xl shadow-2xl">
          <h3 className="font-black mb-6 uppercase tracking-widest text-[10px] opacity-40 dark:text-white italic">Open Channel Feedback</h3>
          
          <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-black opacity-60 mb-2 uppercase tracking-widest italic dark:text-white">Identity Alias</label>
              <input required type="text" className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:border-pink-500 transition-all outline-none font-bold dark:text-white" placeholder="Operator Name..." />
            </div>
            <div>
              <label className="block text-[10px] font-black opacity-60 mb-2 uppercase tracking-widest italic dark:text-white">Security Rating</label>
              <select required className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:border-pink-500 transition-all outline-none font-bold dark:text-white appearance-none">
                <option value="5">S-Rank: Maximum Security</option>
                <option value="4">A-Rank: Stable</option>
                <option value="3">B-Rank: Average</option>
                <option value="2">C-Rank: Vulnerable</option>
                <option value="1">F-Rank: Hazardous</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black opacity-60 mb-2 uppercase tracking-widest italic dark:text-white">Transmission Message</label>
              <textarea required rows={4} className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-2xl p-4 focus:border-pink-500 transition-all outline-none font-bold dark:text-white" placeholder="Type review..."></textarea>
            </div>
          </div>
          <button type="submit" className="mt-8 bg-pink-500 hover:bg-pink-600 text-white px-10 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all shadow-xl shadow-pink-500/20 active:scale-95 italic">
            Broadcast Review
          </button>
        </form>

        <div className="text-center text-slate-400 font-black uppercase tracking-[0.4em] italic text-[10px] opacity-40">
          - End of Encrypted Feed -
        </div>
      </div>

      {/* Strict Section Order 4: Helpline Block */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-4xl mx-auto mt-24 mb-24 px-4">
        {mockSettings.helpline_whatsapp && (
          <a href={`https://wa.me/${mockSettings.helpline_whatsapp.replace('+','')}`} target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center min-h-[64px] gap-3 bg-[#25D366]/10 text-[#25D366] px-10 py-4 rounded-[2rem] border-2 border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all font-black uppercase tracking-widest italic text-[10px] shadow-2xl shadow-[#25D366]/10">
            WhatsApp Command
          </a>
        )}
        {mockSettings.helpline_telegram && (
          <a href={`https://t.me/${mockSettings.helpline_telegram.replace('@','')}`} target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center min-h-[64px] gap-3 bg-[#229ED9]/10 text-[#229ED9] px-10 py-4 rounded-[2rem] border-2 border-[#229ED9]/20 hover:bg-[#229ED9]/20 transition-all font-black uppercase tracking-widest italic text-[10px] shadow-2xl shadow-[#229ED9]/10">
            Telegram Directive
          </a>
        )}
      </div>

      {/* Discover More Slider */}
      <div className="max-w-6xl mx-auto mt-32 mb-10 px-4">
        <div className="flex items-center justify-between border-b-4 border-black/5 dark:border-white/5 pb-6 mb-10">
          <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter dark:text-white italic">Alternative Matrices</h2>
          <div className="flex gap-3">
             <button className="p-3 min-w-[56px] min-h-[56px] flex items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-pink-500 hover:text-white transition-all border-2 border-black/5 dark:border-white/5"><ChevronLeft className="w-5 h-5"/></button>
             <button className="p-3 min-w-[56px] min-h-[56px] flex items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-pink-500 hover:text-white transition-all border-2 border-black/5 dark:border-white/5"><ChevronRight className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {mockApps.filter(a => a.is_new && a.id !== app.id).slice(0, 4).map(discoverApp => (
            <Link key={discoverApp.id} to={`/app/${discoverApp.slug}`} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 flex flex-col items-center text-center hover:-translate-y-2 transition-transform border-2 border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl">
              <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden mb-4 bg-white/20 shadow-2xl border-4 border-white-10">
                 {discoverApp.icon_url && <img src={discoverApp.icon_url} alt="" className="w-full h-full object-cover"/>}
              </div>
              <h4 className="font-black text-xs uppercase tracking-tighter truncate w-full dark:text-white">{discoverApp.name}</h4>
              <div className="text-[10px] font-black opacity-40 mt-1 uppercase tracking-widest dark:text-white">{discoverApp.developer}</div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* THE "SECURITY" INFORMATION SECTION */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 mt-40 bg-[var(--bg-primary)] px-6 py-32 border-t-8 border-pink-600 transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          <div className="text-center relative z-10">
            <h2 className="text-4xl sm:text-6xl font-black mb-16 uppercase tracking-tighter text-[var(--text-primary)] italic drop-shadow-2xl">
              <span className="text-pink-600">Transparency</span> Review Portal
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-12 text-left mt-12 bg-[var(--card-bg)] p-10 sm:p-16 rounded-[4rem] border-2 border-black/5 dark:border-white/10 shadow-2xl dark:shadow-[0_0_100px_rgba(236,72,153,0.1)] transition-colors">
              <div className="space-y-6">
                <h3 className="font-black text-2xl mb-4 flex items-center gap-4 uppercase tracking-tighter text-white bg-pink-600 w-fit px-6 py-2 rounded-2xl italic">
                  Legal Directive
                </h3>
                <p className="leading-relaxed text-sm font-black uppercase tracking-tight text-[var(--text-primary)] opacity-70">
                  {mockSettings.disclaimer_text}
                </p>
              </div>
              
              <div className="space-y-6">
                <h3 className="font-black text-2xl mb-4 flex items-center gap-4 uppercase tracking-tighter text-white bg-blue-600 w-fit px-6 py-2 rounded-2xl italic">
                  Ethics Protocol
                </h3>
                <p className="leading-relaxed text-sm font-black uppercase tracking-tight text-[var(--text-primary)] opacity-70">
                  {mockSettings.ethics_discrimination_text}
                </p>
              </div>
            </div>
            
            <div className="mt-20">
              <p className="text-[10px] font-black uppercase tracking-[0.8em] text-[var(--text-primary)] opacity-30 italic">Encrypted Secure Link • High Speed Node {app.id}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Spacer to push content down because portal is absolute (wait, it's better to just use relative width viewport or negative margins) */}
      <div className="h-[400px] sm:h-[300px]"></div>
    </div>
  );
}
