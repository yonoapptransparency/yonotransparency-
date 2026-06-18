/**
 * AdminLogin access point form
 * Supports Firebase single-authority logins for dashboard panel modifications.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Mail, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useData } from '../contexts/DataContext';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { getAdminPath } from '../lib/utils';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, params: object) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

export default function AdminLogin() {
  const { settings } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [domainMismatch, setDomainMismatch] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  // Manual Captcha
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (captchaText && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // draw background noise
        for (let i = 0; i < 100; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150, 150, 150, ${Math.random() * 0.5})`;
          ctx.fill();
        }

        // draw disruption lines
        for (let i = 0; i < 12; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.strokeStyle = `rgba(180, 180, 180, ${Math.random() * 0.8})`;
          ctx.stroke();
        }

        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#f8fafc'; // slate-50

        // Draw each char with some jitter
        for (let i = 0; i < captchaText.length; i++) {
            const char = captchaText[i];
            const xOffset = 30 + (i * 35);
            ctx.save();
            ctx.translate(xOffset, canvas.height / 2);
            ctx.rotate((Math.random() - 0.5) * 0.6); // rotate randomly
            ctx.fillText(char, -10, 10 + (Math.random() - 0.5) * 10);
            ctx.restore();
        }
    }
  }, [captchaText]);

  // Cloudflare Turnstile
  const [cfToken, setCfToken] = useState<string>('');
  const cfWidgetId = useRef<string>('');
  const cfContainerRef = useRef<HTMLDivElement>(null);
  
  const rawSiteKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CF_TURNSTILE_SITE_KEY) || '';
  const isRealValue = (id: string | undefined): boolean => {
    if (!id) return false;
    if (id === 'PLACEHOLDER') return false;
    if (id.includes('#') || id.includes('!') || id.includes('@') || id.includes('$') || id.includes('^') || id.includes('*') || id.includes('+')) return false;
    return true;
  };
  const SITE_KEY = isRealValue(rawSiteKey) ? rawSiteKey : '1x00000000000000000000AA'; // Use dummy test key if none provided

  useEffect(() => {
    if (!document.querySelector('script[data-cf-ts]')) {
      window.onTurnstileLoad = () => {};
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
      s.async = true; s.defer = true;
      s.setAttribute('data-cf-ts', '1');
      document.head.appendChild(s);
    }
    
    return () => { window.onTurnstileLoad = undefined; };
  }, []);

  useEffect(() => {
    if (!cfContainerRef.current) return;
    const tryRender = () => {
      if (!window.turnstile || !cfContainerRef.current) { setTimeout(tryRender, 300); return; }
      if (cfWidgetId.current) return;
      try {
        cfWidgetId.current = window.turnstile.render(cfContainerRef.current, {
          sitekey: SITE_KEY,
          theme: 'dark',
          callback: (token: string) => { setCfToken(token); setError(null); },
          'error-callback': () => { setCfToken(''); },
          'expired-callback': () => { setCfToken(''); },
        });
      } catch(e) {
        console.error("Turnstile render error", e);
      }
    };
    setTimeout(tryRender, 600);
    return () => {
      if (cfWidgetId.current && window.turnstile) {
        try { window.turnstile.remove(cfWidgetId.current); } catch {}
        cfWidgetId.current = '';
      }
    };
  }, [SITE_KEY]);

  useEffect(() => {
    const host = window.location.hostname;
    const isMainDomain = host === 'localhost' || host === '127.0.0.1' || !host.includes('run.app');
    
    // Validate preview server domains neutrally
    const isCloudPreview = host.includes('run.app');

    if (!isMainDomain && !isCloudPreview) {
      setDomainMismatch(true);
    }

    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      }
    });
    return unsubscribe;
  }, []);



  const handleGoogleLogin = async () => {
    if (!cfToken) {
      setError("Please complete the security verification first.");
      return;
    }
    
    if (captchaInput.toUpperCase() !== captchaText) {
      setError("CAPTCHA code is incorrect.");
      generateCaptcha();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError(<>
          <p>Access Mismatch: This host domain ({window.location.hostname}) has not been authorized in Firebase.</p>
          <p className="mt-2 text-xs opacity-80">Google Auth requires this domain to be whitelisted. Please use Email/Password below or add the domain to Firebase.</p>
          </>);
      } else {
        setError(`Error: ${err.message}`);
      }
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cfToken) {
      setError("Please complete the security verification first.");
      return;
    }

    if (captchaInput.toUpperCase() !== captchaText) {
      setError("CAPTCHA code is incorrect.");
      generateCaptcha();
      return;
    }

    if (Date.now() < lockedUntil) {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Try again in ${secs} seconds.`);
      return;
    }

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        const lockMs = newAttempts >= 7 ? 600000 : newAttempts >= 5 ? 120000 : 30000;
        setLockedUntil(Date.now() + lockMs);
      }
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password.");
      } else {
        setError(`Login failed: ${err.message}`);
      }
      setIsLoading(false);
      // Reset Turnstile on login failure so they must click again
      if (window.turnstile && cfWidgetId.current) {
        window.turnstile.reset(cfWidgetId.current);
        setCfToken('');
      }
    }
  };



  if (authenticated) {
    return <Navigate to={`/${getAdminPath()}/dashboard`} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] text-white animate-fade-in relative overflow-hidden">
      <style>{`
        @keyframes moveBlob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
      
      {/* Base animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a0f24] to-[#1a0b16] z-0">
        {/* Animated glowing orbs */}
        <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-rose-600/20 rounded-full blur-[100px] mix-blend-screen" style={{ animation: 'moveBlob 15s infinite alternate' }}></div>
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen" style={{ animation: 'moveBlob 12s infinite alternate-reverse' }}></div>
        <div className="absolute top-[40%] left-[60%] w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] mix-blend-screen" style={{ animation: 'moveBlob 18s infinite alternate' }}></div>

        {/* Floating particles/shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => {
            const size = Math.random() * 60 + 20;
            return (
               <div 
                key={i}
                className="absolute bottom-[-100px] bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                  animationDelay: `${Math.random() * 10}s`
                }}
              ></div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] z-0"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.8)] z-10"></div>
      
      <div className="glass-panel p-10 w-full max-w-md border-2 border-rose-500/20 shadow-2xl relative z-10 backdrop-blur-xl bg-black/40">
        <div className="flex justify-center mb-6">
          <div className="bg-rose-500/10 p-5 rounded-full border border-rose-500/30">
            {settings.logo_url ? (
              <img src={settings.logo_url} width={48} height={48} className="w-12 h-12 object-contain" alt="Logo" />
            ) : (
              <Shield className="w-10 h-10 text-rose-500" />
            )}
          </div>
        </div>
        <h1 className="text-3xl font-black text-center mb-2 text-rose-500 uppercase tracking-widest italic">Admin Login</h1>
        <p className="text-[10px] text-center text-slate-500 mb-8 font-black uppercase tracking-[0.3em]">Admin Login Required</p>
        
        {domainMismatch && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
            <p className="text-xs text-amber-500 font-bold mb-2">DOMAIN CHECK NOTICE</p>
            <p className="text-xs opacity-60 mb-3">
              You are currently on <strong>{window.location.hostname}</strong>. 
              Please verify that this hostname is authorized under your security setup.
            </p>
          </div>
        )}

        {window.location.hostname.includes('run.app') && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg text-left">
            <p className="text-xs text-blue-400 font-bold mb-2">PREVIEW MODE NOTICE</p>
            <ol className="text-xs text-blue-200/80 space-y-1 list-decimal ml-4">
              <li>Google Auth popups are blocked in embedded iframes. Please <strong>↗ Open in new tab</strong> using the button at the top right of this panel.</li>
              <li>Or, go to your Firebase Console &rarr; Authentication, enable <strong>Email/Password</strong>, add a user with your registered admin email and log in here directly without popups!</li>
            </ol>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Security Challenge</label>
          <div className="flex gap-3">
            <div 
              className="bg-black border border-slate-700/50 rounded-lg select-none flex-1 flex items-center justify-center overflow-hidden"
            >
              <canvas 
                ref={canvasRef} 
                width={200} 
                height={60} 
                className="w-full h-[60px] object-cover pointer-events-none"
              />
            </div>
            <button 
              type="button" 
              onClick={generateCaptcha}
              className="bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 transition flex-shrink-0 flex items-center justify-center"
              title="Refresh CAPTCHA"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            required
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            placeholder="Type the characters above"
            className="w-full bg-black/30 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-rose-500 font-mono mt-3 text-center uppercase tracking-widest"
          />
        </div>

        <div className="mb-6 flex justify-center w-full min-h-[65px] overflow-hidden">
          <div ref={cfContainerRef} />
        </div>

        {error && (
          <div className="space-y-4 mb-6">
            <div className="text-rose-400 text-sm text-center bg-rose-500/10 p-3 rounded border border-rose-500/20">{error}</div>
          </div>
        )}

        <div className="space-y-4 pt-2">
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest italic py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-500 flex items-center justify-center gap-3 active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLoading ? 'Decrypting Access...' : 'Sign in with Google'}
          </button>
        </div>

        <div className="my-6 flex items-center">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="px-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold">OR EMAIL</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin Email"
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Master Password"
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all font-mono text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest italic py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.2)] border border-rose-500 flex items-center justify-center gap-3 active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SECURE LOGIN'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-[10px] opacity-40 font-mono">
          SYSTEM_VER: 2.4.9 • ENCRYPTION: AES-256
          {isLoading && (
            <div className="mt-4 w-full h-1 bg-slate-800 rounded overflow-hidden">
              <div 
                className="h-full bg-rose-500 animate-pulse" 
                style={{ width: `${Math.random() * 40 + 60}%`, transition: 'width 2s' }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
