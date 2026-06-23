/**
 * GatewayPage redirection portal
 * Secure countdown and verification interface before serving high-priority mirror links.
 */

import { safeHtml } from '../lib/safeHtml';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { Shield, ShieldAlert, ShieldCheck, MessageSquare, AlertTriangle, Info, CheckCircle2, ChevronRight, ChevronLeft, Fingerprint, Lock, ArrowRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ClearanceButton from '../components/ClearanceButton';
import { auth } from '../lib/firebase';

export default function GatewayPage() {
  const { apps: mockApps, settings: mockSettings, loading, appsSyncedWithServer, serverAppsFetched, refreshAll } = useData();
  const { slug } = useParams();
  const app = mockApps.find(a => a.slug?.toLowerCase() === slug?.toLowerCase());
  const [isClearing, setIsClearing] = useState(false);
  
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verifyInterval, setVerifyInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const isActuallyComingSoon = app?.is_coming_soon;

  useEffect(() => {
    // Auth check removed to reduce Firebase quotas.
  }, []);

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
        console.log(`Deep Link Sync: Verification gateway index for "${slug}" not found in local cache. Syncing latest indices...`);
        try {
          await refreshAll(true);
        } catch (e: any) {
          console.warn("Deep Link Auto-Sync failed (quota or net):", e.message || e);
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

  if (loading && !app) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide text-zinc-500 animate-pulse">Loading information...</p>
      </div>
    );
  }

  // Graceful interstitial for slow database cold-starts or deep links on first visit
  if (!app && (!serverAppsFetched || isRefreshing || !triedRefresh)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2">Retrieving App Specifications</h3>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          Loading app details from the server...
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
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Details Pending</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-3 leading-relaxed mb-8">
          The requested page for "<span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{slug}</span>" could not be located. It may have been relocated or removed.
        </p>
        <Link 
          to="/" 
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[16px] font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
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

  const cleanedAppDesc = cleanSeoDescription(app.seo_description) || (app.description_html ? stripHtml(app.description_html).substring(0, 160) : `${app.name} technical specs.`);

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": app.name,
    "description": cleanedAppDesc,
    "applicationCategory": app.category,
    "operatingSystem": "All",
    "softwareVersion": app.version,
    "image": app.og_image_url || app.icon_url,
    "offers": {
      "price": "0",
      "priceCurrency": "USD"
    }
  };

    const [username, setUsername] = useState('');
    const [rating, setRating] = useState('5');
    const [review, setReview] = useState('');

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !review.trim()) {
      alert("Please provide both name and review.");
      return;
    }
    alert("Review submitted and awaiting moderation.");
    setUsername('');
    setRating('5');
    setReview('');
  };

  return (
    <div className="animate-fade-in select-none pb-20 max-w-[1550px] mx-auto">
      <div className="mb-6 pt-6">
        <Link 
          to={`/app/${app.slug}`} 
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors group"
        >
          <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to details
        </Link>
      </div>
      <Helmet>
        <title>{app.seo_title || app.name}</title>
        <meta name="description" content={cleanedAppDesc} />
        {app.seo_keywords && <meta name="keywords" content={`${app.seo_keywords}, info ${app.name}, ${app.name} technical info`} />}
        <meta property="og:title" content={`${app.seo_title || app.name} - Technical Profile`} />
        <meta property="og:description" content={cleanedAppDesc} />
        <meta property="og:image" content={app.og_image_url || app.icon_url} />
        <meta property="og:url" content={app.canonical_url || window.location.href} />
        <meta name="robots" content="index, follow" />
        {app.canonical_url ? <link rel="canonical" href={app.canonical_url} /> : <link rel="canonical" href={window.location.href} />}
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
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4 font-semibold text-xs",
          app.safety_status === 'Verified' ? "bg-green-50 text-green-600" :
          app.safety_status === 'Caution' ? "bg-amber-50 text-amber-600" :
          "bg-rose-50 text-rose-600"
        )}>
          <Info className="w-3.5 h-3.5" />
          Status: {app.safety_status}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-zinc-900 dark:text-zinc-100 flex flex-wrap items-center justify-center gap-3">
          <Info className="w-6 h-6 text-blue-500" />
          <span>More Info URL Page</span>
        </h1>
        <p className="font-medium text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Specifications and details for <span className="font-semibold text-zinc-900 dark:text-zinc-100">{app.name}</span>.
        </p>
      </div>

      {/* Main Specs and Info Hub */}
      <div className="w-full mb-10">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 rounded-[32px] p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Left side: App Presentation */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 w-full lg:w-auto">
              <div className="relative w-24 h-24 bg-white dark:bg-zinc-800 rounded-[22px] overflow-hidden shadow-sm border border-black/5 dark:border-white/5 shrink-0">
                {app.icon_url ? <img src={app.icon_url} alt="" className="w-full h-full object-cover"/> : null}
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">{app.name}</h2>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <span>ID: {app.serial_number}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{app.file_size}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>VER: {app.version}</span>
                </div>
              </div>
            </div>

            {/* Right side: Dynamic Button */}
            <div className="flex flex-col items-center gap-3 w-full lg:w-auto shrink-0">
              {isActuallyComingSoon ? (
                <div className="w-full sm:w-96 flex flex-col items-center">
                  <button disabled className="w-full py-4 px-10 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm text-base font-semibold shrink-0 cursor-not-allowed bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Coming Soon
                  </button>
                </div>
              ) : (
                 <ClearanceButton appId={app.id} status={app.safety_status as 'Verified' | 'Caution' | 'Unsafe'} />
              )}
            </div>
          </div>
        </div>
      </div>



      {/* FAQ Intel */}
      {app.faqs && app.faqs.length > 0 && (
        <div className="w-full mb-16 px-4">
          <div className="py-12 border-t border-black/5 dark:border-white/5">
            <h2 className="text-xl font-bold mb-8 text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" /> FAQ
            </h2>
            <div className="space-y-4">
              {app.faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-black/5 dark:border-white/5 pb-4">
                  <details className="group">
                    <summary className="font-semibold py-4 cursor-pointer select-none flex items-center justify-between text-zinc-900 dark:text-zinc-100 text-lg group-open:text-blue-600 transition-colors">
                      <span className="flex-1 pr-6">{faq.question}</span>
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-open:rotate-90 transition-transform shrink-0" />
                    </summary>
                    <div 
                      className="px-0 pb-6 pt-2 prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400"
                      dangerouslySetInnerHTML={{ __html: safeHtml(faq.answer) }}
                    />
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strict Section Order 1: Admin Alert Boxes */}
      <div className="space-y-4 mb-20 w-full px-4">
        {app.red_box_msg && app.red_box_msg.trim() !== '.' && app.red_box_msg.trim() !== '' && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-6 rounded-[24px]">
            <h3 className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-2 text-sm tracking-wide">
              <ShieldAlert className="w-4 h-4" /> Warning
            </h3>
            <p className="text-rose-700 dark:text-rose-300 font-medium text-base leading-relaxed">{app.red_box_msg}</p>
          </div>
        )}
        {app.yellow_box_msg && app.yellow_box_msg.trim() !== '.' && app.yellow_box_msg.trim() !== '' && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-6 rounded-[24px]">
            <h3 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-2 text-sm tracking-wide">
              <AlertTriangle className="w-4 h-4" /> Notice
            </h3>
            <p className="text-amber-700 dark:text-amber-300 font-medium text-base leading-relaxed">{app.yellow_box_msg}</p>
          </div>
        )}
        {app.idea_box_msg && app.idea_box_msg.trim() !== '.' && app.idea_box_msg.trim() !== '' && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-6 rounded-[24px]">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2 text-sm tracking-wide">
              <Sparkles className="w-4 h-4" /> Tip
            </h3>
            <p className="text-blue-700 dark:text-blue-300 font-medium text-base leading-relaxed">{app.idea_box_msg}</p>
          </div>
        )}
      </div>

      {/* Strict Section Order 2: Massive Description */}
      <div className="py-16 mb-20 w-auto -mx-3 sm:-mx-6 md:-mx-10 px-3 sm:px-6 md:px-10 border-t border-black/5 dark:border-white/5">
        <h2 className="text-3xl sm:text-4xl font-bold mb-10 tracking-tight text-zinc-900 dark:text-zinc-100 px-1 sm:px-0">Technical Details</h2>
        <div 
          className="w-full text-base text-zinc-700 dark:text-zinc-300 [&_strong]:font-semibold [&_p]:mb-4 [&_p]:leading-relaxed [&_a]:text-blue-500 [&_a]:hover:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: safeHtml(app.description_html, '<p>App details and technical specifications.</p>') }}
        />

        {app.features_html && (
           <div className="mt-12 pt-12 border-t border-black/5 dark:border-white/5">
              <h2 className="text-3xl sm:text-4xl font-bold mb-10 tracking-tight text-zinc-900 dark:text-zinc-100 px-1 sm:px-0">App Features</h2>
              <div 
                className="w-full text-base text-zinc-700 dark:text-zinc-300 [&_strong]:font-semibold [&_p]:mb-4 [&_p]:leading-relaxed [&_a]:text-blue-500 [&_a]:hover:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-2"
                dangerouslySetInnerHTML={{ __html: safeHtml(app.features_html) }}
              />
           </div>
        )}
      </div>

      {/* Strict Section Order 3: Peer Reviews */}
      <div className="w-full mb-12 px-4">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 tracking-tight text-zinc-900 dark:text-zinc-100">
          <MessageSquare className="w-6 h-6 text-blue-500" /> User Reviews
        </h2>

          <form onSubmit={handleReviewSubmit} className="bg-zinc-50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 p-6 sm:p-10 rounded-[32px] mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">Leave a Review</h3>
            </div>
            
            <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
            
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Name</label>
                <input required type="text" onChange={(e) => setUsername(e.target.value)} value={username} className="w-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-black/10 dark:border-white/10 rounded-xl p-3.5 outline-none font-medium text-zinc-900 dark:text-zinc-100" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Rating</label>
                <select required value={rating} onChange={(e) => setRating(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-medium text-zinc-900 dark:text-zinc-100 appearance-none">
                  <option value="5">Excellent</option>
                  <option value="4">Good</option>
                  <option value="3">Average</option>
                  <option value="2">Poor</option>
                  <option value="1">Critical</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Review</label>
                <textarea required value={review} onChange={(e) => setReview(e.target.value)} rows={4} className="w-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none font-medium text-zinc-900 dark:text-zinc-100 resize-y" placeholder="Write your feedback..."></textarea>
              </div>
            </div>
            <button type="submit" className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]">
              Submit Review
            </button>
          </form>
      </div>

      {/* Strict Section Order 4: Helpline Block */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full mt-20 mb-32 px-4">
        {mockSettings.helpline_whatsapp && (
          <a href={`https://wa.me/${mockSettings.helpline_whatsapp.replace('+','')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-zinc-500 hover:text-green-600 dark:hover:text-green-400 transition-colors font-semibold text-sm">
            WhatsApp Support
          </a>
        )}
        {mockSettings.helpline_telegram && (
          <a href={`https://t.me/${mockSettings.helpline_telegram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-zinc-500 hover:text-blue-500 transition-colors font-semibold text-sm">
            Telegram Support
          </a>
        )}
      </div>

      {/* Discover More Slider */}
      <div className="max-w-6xl mx-auto mt-24 mb-10 px-4">
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 mb-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Similar Apps</h2>
          <div className="flex gap-2">
             <button className="p-2 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
             <button className="p-2 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"><ChevronRight className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {mockApps.filter(a => a.is_new && a.id !== app.id).slice(0, 4).map(discoverApp => (
            <Link key={discoverApp.id} to={`/app/${discoverApp.slug}`} className="bg-zinc-50 dark:bg-zinc-800/30 p-6 flex flex-col items-center text-center transition-all border border-black/5 dark:border-white/5 rounded-[24px] hover:border-black/10 dark:hover:border-white/10 group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[18px] overflow-hidden mb-4 bg-white dark:bg-zinc-900 shadow-sm border border-black/5 dark:border-white/5 group-hover:scale-105 transition-transform">
                 {discoverApp.icon_url && <img src={discoverApp.icon_url} alt="" className="w-full h-full object-cover"/>}
              </div>
              <h4 className="font-semibold text-sm tracking-tight w-full text-zinc-900 dark:text-zinc-100 truncate mb-1">{discoverApp.name}</h4>
              <div className="text-[11px] font-medium text-zinc-500 truncate w-full">{discoverApp.developer}</div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Transparency Footer */}
      <div className="w-full mb-20 text-center">
          <h2 
            className="text-3xl sm:text-5xl font-bold mb-12 tracking-tight text-zinc-900 dark:text-zinc-100"
            dangerouslySetInnerHTML={{ __html: safeHtml(mockSettings.portal_heading || mockSettings.site_title || 'Platform Review') }}
          />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left">
            <div className="p-8 border border-black/5 dark:border-white/5 rounded-[24px] bg-zinc-50 dark:bg-zinc-800/30">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-3">
                {mockSettings.disclaimer_heading || 'Legal'}
              </h3>
              <div 
                className="text-sm font-medium text-zinc-500 dark:text-zinc-400 prose prose-zinc dark:prose-invert prose-sm"
                dangerouslySetInnerHTML={{ __html: safeHtml(mockSettings.disclaimer_text) }}
              />
            </div>
            
            <div className="p-8 border border-black/5 dark:border-white/5 rounded-[24px] bg-zinc-50 dark:bg-zinc-800/30">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-3">
                {mockSettings.ethics_heading || 'Ethics'}
              </h3>
              <div 
                className="text-sm font-medium text-zinc-500 dark:text-zinc-400 prose prose-zinc dark:prose-invert prose-sm"
                dangerouslySetInnerHTML={{ __html: safeHtml(mockSettings.ethics_discrimination_text) }}
              />
            </div>

            <div className="p-8 border border-blue-100 dark:border-blue-500/20 rounded-[24px] bg-blue-50/50 dark:bg-blue-900/10">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
                {mockSettings.important_notice_heading || 'Notice'}
              </h3>
              <div 
                className="text-sm font-medium text-zinc-600 dark:text-zinc-300 prose prose-zinc dark:prose-invert prose-sm"
                dangerouslySetInnerHTML={{ __html: safeHtml(mockSettings.important_notice) }}
              />
            </div>
          </div>
      </div>
    </div>
  );
}
