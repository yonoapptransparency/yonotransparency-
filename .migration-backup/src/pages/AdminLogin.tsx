import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Mail, KeyRound, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useData } from '../contexts/DataContext';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { getAdminPath } from '../lib/utils';

export default function AdminLogin() {
  const { settings } = useData();
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [domainMismatch, setDomainMismatch] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(10);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

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
    }
  };



  if (authenticated) {
    return <Navigate to={`/${getAdminPath()}/dashboard`} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] bg-slate-950 text-white animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.8)]"></div>
      <div className="glass-panel p-10 w-full max-w-md border-2 border-rose-500/20 shadow-2xl relative z-10 backdrop-blur-xl">
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
