import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Mail, KeyRound, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useData } from '../contexts/DataContext';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export default function AdminLogin() {
  const { settings } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [domainMismatch, setDomainMismatch] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(10);

  useEffect(() => {
    // Check if we are on a Netlify preview domain or wrong domain which might cause auth issues
    const host = window.location.hostname;
    const isMainDomain = host === 'yonostored.netlify.app' || host === 'yonostored.in' || host === 'www.yonostored.in' || host.endsWith('.yonostored.in') || host === 'localhost' || host === '127.0.0.1' || host.includes('vercel.app');
    
    // Check if we are on an AI Studio preview domain
    const isAiStudio = host.includes('run.app');

    if ((!isMainDomain && !isAiStudio) || (host.includes('--') && host.includes('netlify.app'))) {
      setDomainMismatch(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      // In a high-security environment, we avoid hardcoding or directly checking unhashed 
      // values locally if avoidable, but we defer to Firebase for all identity verification anyway.
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError(<>
          <p>Firebase Domain Error: Your domain ({window.location.hostname}) is not authorized.</p>
          <p className="mt-2 text-xs">
            Since you are on mobile, you can't see the Firebase menu. Click below to go directly to the settings:
          </p>
          <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`} target="_blank" rel="noreferrer" className="block mt-2 bg-white/20 p-2 rounded text-white font-bold underline text-center">
            Open Authorized Domains
          </a>
        </>);
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please use the Google Login if you haven't set an email password yet.");
      } else {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      }
      setIsLoading(false);
    }
  };

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
          <p>Firebase Domain Error: Your domain ({window.location.hostname}) is not authorized.</p>
          <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`} target="_blank" rel="noreferrer" className="block mt-2 bg-white/20 p-2 rounded text-white font-bold underline text-center">
            Click here to open Authorized Domains
          </a>
        </>);
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authenticated) {
    return <Navigate to="/x9k2m7-admin" />;
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
        <h1 className="text-3xl font-black text-center mb-2 text-rose-500 uppercase tracking-widest italic">Restricted Zone</h1>
        <p className="text-[10px] text-center text-slate-500 mb-8 font-black uppercase tracking-[0.3em]">Top Secret Security Clearance Required</p>
        
        {domainMismatch && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
            <p className="text-xs text-amber-500 font-bold mb-2">AUTH DOMAIN NOTICE</p>
            <p className="text-xs opacity-60 mb-3">
              You are currently on <strong>{window.location.hostname}</strong>. 
              Firebase might reject login from this URL unless you've added it to "Authorized Domains".
            </p>
            <div className="space-y-2">
              <a 
                href="https://yonostored.in/x9k2m7-admin/login" 
                className="block w-full text-center bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2 rounded transition-colors"
              >
                Go to Custom Domain (yonostored.in)
              </a>
              <a 
                href="https://yonostored.vercel.app/x9k2m7-admin/login" 
                className="block w-full text-center bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-bold py-2 rounded transition-colors"
              >
                Go to Vercel Domain (yonostored.vercel.app)
              </a>
            </div>
          </div>
        )}



        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="text-rose-400 text-sm text-center bg-rose-500/10 p-3 rounded">{error}</div>}
          {message && <div className="text-emerald-400 text-sm text-center bg-emerald-500/10 p-3 rounded">{message}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black opacity-60 mb-2 uppercase tracking-widest text-slate-300">Identity Parameter</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-rose-500 font-mono text-xs text-rose-500 transition-colors"
                  value={email}
                  placeholder="AUTHORIZATION_CODE"
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                />
                <Mail className="w-4 h-4 absolute left-3 top-3.5 opacity-40 text-rose-500" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black opacity-60 mb-2 uppercase tracking-widest text-slate-300">Security Cipher</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-rose-500 font-mono text-xs text-rose-500 tracking-widest transition-colors"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                />
                <KeyRound className="w-4 h-4 absolute left-3 top-3.5 opacity-40 text-rose-500" />
              </div>
              <div className="flex justify-end mt-2">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-widest"
                >
                  Request Reset
                </button>
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest italic py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] border border-rose-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Decrypting Access...' : 'Initiate Handshake'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[10px] opacity-50 mb-4 font-bold uppercase tracking-widest">Federated Authentication</p>
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full bg-slate-900 border-2 border-slate-800 hover:border-slate-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
        
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
