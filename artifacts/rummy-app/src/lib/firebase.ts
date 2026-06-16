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
const isRealValue = (id: string | undefined): boolean => {
  if (!id) return false;
  if (id === 'PLACEHOLDER') return false;
  // If it is an obfuscated mock string injected by the system, ignore it
  if (id.includes('#') || id.includes('!') || id.includes('@') || id.includes('$') || id.includes('^') || id.includes('*') || id.includes('+')) return false;
  return true;
};

const getClientConfigValue = (envVal: string | undefined, configVal: string | undefined) => {
  if (isRealValue(envVal)) return envVal!;
  if (configVal && configVal !== 'PLACEHOLDER' && !configVal.includes('#')) return configVal;
  return undefined;
};

const resolvedProjectId = getClientConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, appletConfig.projectId);
const resolvedAppId = getClientConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, appletConfig.appId);
const resolvedApiKey = getClientConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, appletConfig.apiKey);
const resolvedAuthDomain = getClientConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, appletConfig.authDomain);
const resolvedDatabaseId = getClientConfigValue(import.meta.env.VITE_FIREBASE_DATABASE_ID, appletConfig.firestoreDatabaseId);
const resolvedStorageBucket = getClientConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, appletConfig.storageBucket);
const resolvedMessagingId = getClientConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_ID, appletConfig.messagingSenderId);

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

export const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null as any;

export const auth = app ? getAuth(app) : null as any;

// EXPERIMENTAL FORCE LONG POLLING IS REQUIRED for Indian Mobile ISPs and Sandbox environments!
import { getFirestore } from 'firebase/firestore';

let firestoreInstance: any = null;
if (app) {
  try {
    firestoreInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true
    }, firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId);
  } catch (e) {
    console.warn("Firestore already initialized. Reusing existing instance.");
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId);
  }
}

export const db = firestoreInstance;

export const isFirebaseConfigured = !!app && firebaseConfig.apiKey !== 'PLACEHOLDER' && firebaseConfig.apiKey.trim() !== '' && !firebaseConfig.apiKey.includes('YOUR_API_KEY');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const user = auth?.currentUser;
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: user?.uid || null,
      email: user?.email || null,
      emailVerified: user?.emailVerified || null,
      isAnonymous: user?.isAnonymous || null,
      tenantId: user?.tenantId || null,
      providerInfo: user?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  const jsonString = JSON.stringify(errInfo);
  console.warn('Firestore Error (Fallback handled): ', jsonString);
  return new Error(jsonString);
}




