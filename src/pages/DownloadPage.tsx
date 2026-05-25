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
  const { apps: mockApps, settings: mockSettings, loading, appsSyncedWithServer, serverAppsFetched, refreshAll } = useData();
  const { slug } = useParams();
  const app = mockApps.find(a => a.slug?.toLowerCase() === slug?.toLowerCase());
  const [downloading, setDownloading] = useState(false);
  
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verifyInterval, setVerifyInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Reset verification states on transition to another application
    setIsVerified(false);
    setIsVerifying(false);
    setProgress(0);
    if (verifyInterval) {
      clearInterval(verifyInterval);
      setVerifyInterval(null);
    }
  }, [slug]);

  // Handle browser Back-Forward Cache (Bfcache) restorative states to guarantee fresh, re-executable gateway handshake
  useEffect(() => {
    const handlePageShow = () => {
      setIsVerified(false);
      setIsVerifying(false);
      setProgress(0);
      if (verifyInterval) {
        clearInterval(verifyInterval);
        setVerifyInterval(null);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [verifyInterval]);

  // Automatically trigger a silent cloud sync if the requested app is not found in local cache
  useEffect(() => {
    let active = true;
    const fetchLatestApps = async () => {
      const found = mockApps.some(a => a.slug?.toLowerCase() === slug?.toLowerCase());
      if (!found && !triedRefresh && !isRefreshing) {
        if (active) {
          setIsRefreshing(true);
        }
        console.log(`Deep Link Sync: Download for "${slug}" not found in local cache. Syncing latest indices...`);
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

  useEffect(() => {
    return () => {
      if (verifyInterval) {
        clearInterval(verifyInterval);
      }
    };
  }, [verifyInterval]);

  const playSoftClick = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play blocked", e));
  };

  const startVerification = () => {
    if (isVerifying || isVerified) return;
    
    playSoftClick();
    setIsVerifying(true);
    setProgress(0);
    
    if (verifyInterval) {
      clearInterval(verifyInterval);
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setVerifyInterval(null);
          setIsVerified(true);
          setIsVerifying(false);
          return 100;
        }
        return prev + 10; // smooth 10-step verification (0.5 second overall)
      });
    }, 50);
    setVerifyInterval(interval);
  };

  // Initial loading phase (waiting for setup/cache checks)
  if (loading && !app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="w-10 h-10 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600 italic animate-pulse">Loading download configurations...</p>
      </div>
    );
  }

  // Graceful interstitial for slow database cold-starts or deep links on first visit
  if (!app && (!serverAppsFetched || isRefreshing)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-10 h-10 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]"></div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mt-2">Syncing Download Data</h3>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          Verifying download configurations with the secure server gateway. This works around first-visit database cold-starts...
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
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-800">Download Not Found</h1>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed mb-8">
          The download portal for "<span className="font-mono font-bold text-red-600">{slug}</span>" could not be located in our secure index. It may have been relocated, or it is taking a few moments to sync database records.
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
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group"
        >
          <div className="p-2 rounded-full bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Back to details
        </Link>
      </div>
      <Helmet>
        <title>{`Download ${app.name} - Verified ${app.version} Security Handshake`}</title>
        <meta name="description" content={`Safe download portal for ${app.name}. Technical size: ${app.file_size}. Verified safety status: ${app.safety_status}. Access secure link after identity verification.`} />
        {app.seo_keywords && <meta name="keywords" content={`${app.seo_keywords}, download ${app.name}, ${app.name} safe install, secure ${app.name}`} />}
        <meta property="og:title" content={`Secure Link: ${app.name}`} />
        <meta property="og:description" content={`Authorized download access for ${app.name}. Verified by Transparency Portal.`} />
        <meta property="og:image" content={app.og_image_url || app.icon_url} />
        <meta name="robots" content="index, follow" />
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
      <div className="text-center mb-8 max-w-xl mx-auto px-4">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl mb-4 font-black uppercase text-[10px] tracking-widest shadow-lg italic",
          app.safety_status === 'Verified' ? "bg-green-500/10 text-green-500 border border-green-500/10" :
          app.safety_status === 'Caution' ? "bg-amber-500/10 text-amber-500 border border-amber-500/10" :
          "bg-rose-500/10 text-rose-500 border border-rose-500/10"
        )}>
          {app.safety_status === 'Verified' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
          Security Status: {app.safety_status}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-3 uppercase tracking-tighter dark:text-white italic flex flex-wrap items-center justify-center gap-3">
          <ShieldCheck className="w-6 h-6 text-red-600" />
          <span>Security</span>
          <span className="text-red-600">Portal</span>
          <Sparkles className="w-6 h-6 text-red-600 animate-pulse" />
        </h1>
        <p className="font-bold uppercase tracking-tight text-[10px] sm:text-[11px] text-slate-400 dark:text-zinc-500 max-w-md mx-auto leading-relaxed">
          Technical handshake in progress. Verify <span className="text-red-600 underline decoration-red-600/30 underline-offset-4">{app.name}</span> identity below to authorize final data extraction.
        </p>
      </div>

      {/* Main Download Action with Stealth Gate */}
      <div className="p-6 sm:p-10 text-center mb-10 border-b border-black/5 max-w-4xl mx-auto overflow-hidden relative">
        {!isVerified ? (
          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="relative w-24 h-24 bg-white rounded-3xl overflow-hidden shadow-2xl border border-black/5 shrink-0">
                    {app.icon_url ? <img src={app.icon_url} alt="" className="w-full h-full object-cover"/> : null}
                  </div>
                </div>
                <div className="text-left">
                  <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-2 italic leading-none">{app.name}</h2>
                  <div className="flex flex-wrap gap-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                    <span>ID: {app.serial_number}</span>
                    <span>•</span>
                    <span>{app.file_size}</span>
                    <span>•</span>
                    <span>VER: {app.version}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full max-w-lg relative">
              <button
                onClick={startVerification}
                disabled={isVerifying}
                className="w-full relative h-20 bg-red-600 hover:bg-red-500 rounded-3xl overflow-hidden active:scale-[0.98] transition-all cursor-pointer shadow-xl shadow-red-600/20 flex items-center justify-center border-b-4 border-red-800"
              >
                <div 
                   className="absolute inset-y-0 left-0 bg-black/15 transition-all duration-75"
                   style={{ width: `${progress}%` }}
                ></div>

                <div className="absolute inset-0 flex items-center justify-center gap-5 px-6">
                  <Fingerprint className={cn("w-6 h-6 text-white transition-all", isVerifying ? "animate-pulse scale-110 text-red-200" : "animate-bounce")} />
                  <span className="text-base font-black text-white uppercase tracking-[0.2em] italic truncate text-shadow-sm">
                    {isVerifying ? `SCANNING BIOMETRICS ${progress}%` : "TAP TO AUTHORIZE EXTRACTION"}
                  </span>
                </div>
              </button>
              
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">SECURE GATEWAY: TAP CONTAINER TO INITIALIZE VERIFICATION</p>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col lg:flex-row items-center justify-between w-full gap-10 py-12"
          >
            <div className="flex items-center gap-8 text-left">
              <div className="w-24 h-24 bg-white rounded-3xl overflow-hidden shadow-2xl border border-black/5 shrink-0">
                {app.icon_url ? <img src={app.icon_url} alt="" className="w-full h-full object-cover"/> : null}
              </div>
              <div>
                <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-2 italic leading-none">{app.name}</h2>
                <div className="flex items-center gap-2 text-green-600 font-black uppercase tracking-widest text-xs italic">
                  <CheckCircle2 className="w-4 h-4" />
                  Protocol Secured
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <SecureDownloadButton appId={app.id} status={app.safety_status as 'Verified' | 'Caution' | 'Unsafe'} downloadUrl={app.encrypted_download_url} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic animate-pulse">Session Active: 15:00 Remaining</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* FAQ Intel */}
      {app.faqs && app.faqs.length > 0 && (
        <div className="max-w-4xl mx-auto mb-16 px-4">
          <div className="py-12 border-t border-black/5">
            <h2 className="text-xs font-black mb-10 flex items-center gap-3 uppercase tracking-[0.2em] italic">
              <Info className="w-4 h-4 text-red-600" /> Intelligence Query
            </h2>
            <div className="space-y-4">
              {app.faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-black/5 pb-6">
                  <details className="group">
                    <summary className="font-black py-4 cursor-pointer select-none flex items-center justify-between group-open:text-red-600 text-xl sm:text-2xl tracking-tighter italic uppercase leading-none">
                      <span className="flex-1">{faq.question}</span>
                      <span className="text-2xl leading-none transition-transform group-open:rotate-45 ml-4">+</span>
                    </summary>
                    <div 
                      className="px-0 pb-6 pt-4 prose prose-slate max-w-none text-left font-medium text-lg leading-relaxed text-slate-600"
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
      <div className="space-y-6 mb-20 max-w-4xl mx-auto px-4">
        {app.red_box_msg && (
          <div className="bg-red-50 border-l-4 border-red-600 p-8 rounded-2xl shadow-sm">
            <h3 className="font-black text-red-600 flex items-center gap-3 mb-4 uppercase tracking-[0.2em] italic text-[10px]">
              <ShieldAlert className="w-5 h-5 animate-pulse" /> Critical Warning
            </h3>
            <p className="text-red-700 font-bold text-lg tracking-tight leading-relaxed italic">{app.red_box_msg}</p>
          </div>
        )}
        {app.yellow_box_msg && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-8 rounded-2xl shadow-sm">
            <h3 className="font-black text-amber-600 flex items-center gap-3 mb-4 uppercase tracking-[0.2em] italic text-[10px]">
              <AlertTriangle className="w-5 h-5" /> Operational Notice
            </h3>
            <p className="text-amber-700 font-bold text-lg tracking-tight leading-relaxed italic">{app.yellow_box_msg}</p>
          </div>
        )}
        {app.idea_box_msg && (
          <div className="bg-slate-50 border-l-4 border-slate-900 p-8 rounded-2xl shadow-sm">
            <h3 className="font-black text-slate-900 flex items-center gap-3 mb-4 uppercase tracking-[0.2em] italic text-[10px]">
              <Sparkles className="w-5 h-5" /> Efficiency Tip
            </h3>
            <p className="text-slate-700 font-bold text-lg tracking-tight leading-relaxed italic">{app.idea_box_msg}</p>
          </div>
        )}
      </div>

      {/* Strict Section Order 2: Massive Description */}
      <div className="py-20 mb-20 max-w-4xl mx-auto px-4 border-t border-black/5">
        <h2 className="text-4xl sm:text-7xl font-black mb-12 uppercase tracking-tighter italic leading-none text-slate-900">Technical<br/>Analysis</h2>
        <div 
          className="prose prose-slate max-w-none leading-relaxed font-medium text-lg text-slate-600"
          dangerouslySetInnerHTML={{ __html: app.description_html || `<p>${app.seo_description}</p>` }}
        />
      </div>

      {/* Strict Section Order 3: Peer Reviews */}
      <div className="max-w-4xl mx-auto mb-12 px-2">
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 uppercase tracking-tighter dark:text-white italic">
          <MessageSquare className="w-6 h-6 text-pink-500" /> Transmission Reviews
        </h2>
        
        <form onSubmit={handleReviewSubmit} className="bg-white/40 dark:bg-black/60 border-2 border-white/20 dark:border-white/5 p-8 rounded-[2.5rem] mb-12 backdrop-blur-3xl shadow-2xl">
          <h3 className="font-black mb-6 uppercase tracking-widest text-[10px] text-slate-400 dark:text-zinc-500 italic">Open Channel Feedback</h3>
          
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-12 max-w-4xl mx-auto mt-24 mb-40 px-4">
        {mockSettings.helpline_whatsapp && (
          <a href={`https://wa.me/${mockSettings.helpline_whatsapp.replace('+','')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 text-slate-400 hover:text-green-600 transition-colors font-black uppercase tracking-[0.3em] italic text-[10px]">
            WhatsApp Command
          </a>
        )}
        {mockSettings.helpline_telegram && (
          <a href={`https://t.me/${mockSettings.helpline_telegram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 text-slate-400 hover:text-blue-500 transition-colors font-black uppercase tracking-[0.3em] italic text-[10px]">
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
            <Link key={discoverApp.id} to={`/app/${discoverApp.slug}`} className="bg-white/40 dark:bg-black/60 backdrop-blur-3xl p-6 flex flex-col items-center text-center hover:-translate-y-2 transition-transform border-2 border-white/20 dark:border-white/5 rounded-[2.5rem] shadow-2xl">
              <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden mb-4 bg-white/20 shadow-2xl border-4 border-white-10">
                 {discoverApp.icon_url && <img src={discoverApp.icon_url} alt="" className="w-full h-full object-cover"/>}
              </div>
              <h4 className="font-black text-xs uppercase tracking-tighter w-full dark:text-zinc-100">{discoverApp.name}</h4>
              <div className="text-[10px] font-black text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-widest">{discoverApp.developer}</div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Transparency Footer */}
      <div className="max-w-4xl mx-auto px-4 mb-40 text-center">
          <h2 
            className="text-4xl sm:text-7xl font-black mb-16 uppercase tracking-tighter text-slate-900 italic leading-none"
            dangerouslySetInnerHTML={{ __html: mockSettings.portal_heading || 'Transparency Review Portal' }}
          />
          
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="p-10 border border-black/5 rounded-[2.5rem] bg-slate-50/50">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-900 italic mb-4">
                {mockSettings.disclaimer_heading || 'Legal Directive'}
              </h3>
              <div 
                className="leading-relaxed text-lg font-medium text-slate-500"
                dangerouslySetInnerHTML={{ __html: mockSettings.disclaimer_text }}
              />
            </div>
            
            <div className="p-10 border border-black/5 rounded-[2.5rem] bg-slate-50/50">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-900 italic mb-4">
                {mockSettings.ethics_heading || 'Ethics Protocol'}
              </h3>
              <div 
                className="leading-relaxed text-lg font-medium text-slate-500"
                dangerouslySetInnerHTML={{ __html: mockSettings.ethics_discrimination_text }}
              />
            </div>

            <div className="p-10 border border-red-600/5 rounded-[2.5rem] bg-red-50/30">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-slate-900 italic mb-4">
                {mockSettings.important_notice_heading || 'Important Notice'}
              </h3>
              <div 
                className="leading-relaxed text-lg font-black text-slate-500 italic"
                dangerouslySetInnerHTML={{ __html: mockSettings.important_notice || '' }}
              />
            </div>
          </div>
      </div>
    </div>
  );
}
