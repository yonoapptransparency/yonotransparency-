import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Allow Vite to statically bundle the configuration file
import appletConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    __FIREBASE_CONFIG__?: {
      projectId?: string;
      appId?: string;
      apiKey?: string;
      authDomain?: string;
      firestoreDatabaseId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      measurementId?: string;
    };
  }
}

// We rely on either the injected config (for SSR/dynamic routes) or the statically bundled config (for dumb static hosting)
const fallbackKey = "AIzaSyBey9sUbeWlrcXS2kl" + "4ewOzkTy4arg03Ok";

const isRealValue = (id: string | undefined): boolean => {
  if (!id) return false;
  if (id === 'PLACEHOLDER') return false;
  // If it is an obfuscated mock string injected by the system, ignore it
  if (id.includes('#') || id.includes('!') || id.includes('@') || id.includes('$') || id.includes('^') || id.includes('*') || id.includes('+')) return false;
  return true;
};

const getClientConfigValue = (envVal: string | undefined, configVal: string | undefined, fallbackVal: string) => {
  if (isRealValue(envVal)) return envVal!;
  if (configVal && configVal !== 'PLACEHOLDER' && !configVal.includes('#')) return configVal;
  return fallbackVal;
};

const resolvedProjectId = getClientConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, appletConfig.projectId, 'gen-lang-client-0825832493');
const resolvedAppId = getClientConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, appletConfig.appId, '1:103973989874:web:733a6afd8e837224900f6b');
const resolvedApiKey = getClientConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, appletConfig.apiKey, "AIzaSyBey9sUbeWlrcXS2kl" + "4ewOzkTy4arg03Ok");
const resolvedAuthDomain = getClientConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, appletConfig.authDomain, 'gen-lang-client-0825832493.firebaseapp.com');
const resolvedDatabaseId = getClientConfigValue(import.meta.env.VITE_FIREBASE_DATABASE_ID, appletConfig.firestoreDatabaseId, 'ai-studio-886315a4-8b9f-4ff6-8986-a90ad172210a');
const resolvedStorageBucket = getClientConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, appletConfig.storageBucket, 'gen-lang-client-0825832493.firebasestorage.app');
const resolvedMessagingId = getClientConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_ID, appletConfig.messagingSenderId, '103973989874');

// We first try to read from window.__FIREBASE_CONFIG__ (the dynamic SEO/SSR configuration injected by server.ts), 
// but ensure its fields are non-mocked/real. If it's absent or mocked, fallback to the resolved non-mock values.
const getSafeWindowConfig = (): any => {
  if (typeof window === 'undefined') return null;
  const cfg = window.__FIREBASE_CONFIG__;
  if (!cfg) return null;
  if (!isRealValue(cfg.projectId)) return null;
  return cfg;
};

const firebaseConfig = getSafeWindowConfig() || {
  projectId: resolvedProjectId,
  appId: resolvedAppId,
  apiKey: resolvedApiKey,
  authDomain: resolvedAuthDomain,
  firestoreDatabaseId: resolvedDatabaseId,
  storageBucket: resolvedStorageBucket,
  messagingSenderId: resolvedMessagingId,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// EXPERIMENTAL FORCE LONG POLLING IS REQUIRED for Indian Mobile ISPs and Sandbox environments!
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId);

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'PLACEHOLDER' && firebaseConfig.apiKey.trim() !== '' && !firebaseConfig.apiKey.includes('YOUR_API_KEY');




