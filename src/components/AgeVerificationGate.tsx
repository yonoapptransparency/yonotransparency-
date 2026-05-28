import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface AgeVerificationGateProps {
  onVerify: () => void;
}

export const AgeVerificationGate: React.FC<AgeVerificationGateProps> = ({ onVerify }) => {
  const { settings } = useData();
  const [denied, setDenied] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Auto-verify if the user-agent is a parser / bot / crawler
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.userAgent) {
      const botUserAgents = [
        'googlebot', 'bingbot', 'yandex', 'baidu', 'duckduck', 'yahoo',
        'lighthouse', 'chrome-lighthouse', 'gptbot', 'chatgpt', 'claudebot', 
        'anthropic', 'google-extended', 'gemini', 'perplexity', 'cohere', 
        'facebookexternalhit', 'twitterbot', 'linkedinbot', 'bot', 'crawl',
        'spider', 'slurp', 'archiver'
      ];
      const ua = navigator.userAgent.toLowerCase();
      if (botUserAgents.some(bot => ua.includes(bot))) {
        onVerify();
      }
    }
  }, [onVerify]);

  const handleVerify = () => {
    try {
      localStorage.setItem('rummystore_age_verified', 'true');
    } catch (e) {
      console.error('Failed to save age verification state:', e);
    }
    onVerify();
  };

  const handleDeny = () => {
    setDenied(true);
    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        window.location.href = 'https://www.google.com';
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/15 backdrop-blur-[4px] overflow-y-auto select-none">
      {/* Absolute ambient light rose/crimson gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/5 rounded-full blur-[140px]" />
      </div>

      <AnimatePresence mode="wait">
        {!denied ? (
          <motion.div
            key="age-challenge"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-white border border-slate-200/80 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] text-center text-slate-800"
          >
            {/* Website Logo Header (from admin / settings) */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-xl animate-pulse" />
                <div className="relative p-2.5 bg-white border border-slate-100/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center">
                  {settings?.logo_url ? (
                    <img 
                      src={settings.logo_url} 
                      alt="Logo" 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain" 
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-3xl flex items-center justify-center text-white font-black text-2xl italic">
                      {settings?.site_title?.substring(0, 1) || 'Y'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-600 block mb-2">
              Safety Compliance Mandate
            </span>
            <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight mb-4 uppercase italic text-slate-900 leading-none">
              Age Verification Required
            </h1>

            <div className="w-16 h-1 bg-gradient-to-r from-rose-600 to-amber-500 mx-auto mb-6 rounded-full" />

            {/* Compliance Context Text */}
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mb-8 max-w-sm mx-auto">
              Under recent safety regulations designed to protect students and minors from unrestricted gaming and online application portals, users must confirm eligibility. 
              <span className="block mt-3 text-slate-900 font-extrabold">
                By tapping the confirmation button below, you declare and verify that you are 18 years of age or older.
              </span>
            </p>

            {/* Responsive Actions Panel */}
            <div className="flex flex-col gap-3">
              <button
                id="btn-confirm-age-18"
                onClick={handleVerify}
                className="w-full bg-rose-600 hover:bg-rose-700 active:scale-97 text-white font-extrabold text-sm uppercase tracking-widest py-4 px-6 rounded-2xl transition-all shadow-lg shadow-rose-600/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                I am 18 or older - Enter
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-deny-age-18"
                onClick={handleDeny}
                className="w-full bg-slate-100 hover:bg-slate-200 active:scale-97 text-slate-600 font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-2xl border border-slate-200/60 transition-all cursor-pointer"
              >
                I am under 18 - Exit
              </button>
            </div>

            {/* Legal Defense Footer */}
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mt-8 pt-4 border-t border-slate-100">
              Regulatory compliance portal &bull; SSL Secured
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="age-restricted"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-white border border-slate-200/80 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] text-center text-slate-800"
          >
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-full text-slate-400">
                <ShieldCheck className="w-9 h-9" />
              </div>
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block mb-2">
              Access Restricted
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-4 uppercase italic text-slate-900 leading-none">
              Protected Space
            </h2>

            <div className="w-12 h-0.5 bg-slate-200 mx-auto mb-6 rounded-full" />

            <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed max-w-xs mx-auto mb-8">
              Under safety directives, unrestricted content accesses are restricted to adult audiences. Thank you for helping keep online systems compliant.
            </p>

            <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 animate-pulse">
                Redirecting to safety resource website in {countdown}s...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
