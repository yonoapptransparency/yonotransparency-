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

  useEffect(() => {
    // Check if we are on a Netlify preview domain or wrong domain which might cause auth issues
    const host = window.location.hostname;
    const isMainDomain = host === 'yonoinfo.netlify.app' || host === 'yonoinfo.in' || host === 'localhost' || host === '127.0.0.1';
    
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
    return <Navigate to="/admin" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="glass-panel p-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-pink-500/20 p-4 rounded-full">
            {settings.logo_url ? (
              <img src={settings.logo_url} width={48} height={48} className="w-12 h-12 object-contain" alt="Logo" />
            ) : (
              <Shield className="w-10 h-10 text-pink-400" />
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Admin Authority</h1>
        <p className="text-xs text-center text-slate-500 mb-6 font-medium">Restricted Access Portal</p>
        
        {domainMismatch && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
            <p className="text-xs text-amber-500 font-bold mb-2">AUTH DOMAIN NOTICE</p>
            <p className="text-xs opacity-60 mb-3">
              You are currently on <strong>{window.location.hostname}</strong>. 
              Firebase might reject login from this URL unless you've added it to "Authorized Domains".
            </p>
            <div className="space-y-2">
              <a 
                href="https://yonoinfo.netlify.app/admin/login" 
                className="block w-full text-center bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded transition-colors"
              >
                Go to Netlify Domain
              </a>
              <a 
                href="http://yonoinfo.in/admin/login" 
                className="block w-full text-center bg-black/5 hover:bg-black/10 text-black text-xs font-bold py-2 rounded transition-colors"
              >
                Go to Main Domain (yonoinfo.in)
              </a>
            </div>
          </div>
        )}



        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="text-rose-400 text-sm text-center bg-rose-500/10 p-3 rounded">{error}</div>}
          {message && <div className="text-emerald-400 text-sm text-center bg-emerald-500/10 p-3 rounded">{message}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium opacity-60 mb-2">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  className="w-full bg-black/5 border border-black/5 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  value={email}
                  placeholder="admin@example.com"
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                />
                <Mail className="w-5 h-5 absolute left-3 top-3.5 opacity-40" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium opacity-60 mb-2">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  className="w-full bg-black/5 border border-black/5 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                />
                <KeyRound className="w-5 h-5 absolute left-3 top-3.5 opacity-40" />
              </div>
              <div className="flex justify-end mt-2">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-sm text-pink-500 hover:text-pink-400 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg transition-all shadow-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Processing...' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-black/10 text-center">
          <p className="text-sm opacity-50 mb-4">Or sign in with a single click</p>
          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full bg-white border border-black/10 hover:bg-slate-50 text-slate-900 font-semibold py-3 rounded-lg transition-all shadow-sm flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
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
        
        <div className="mt-8 text-center text-xs opacity-40">
          v1.0.1
        </div>
      </div>
    </div>
  );
}
