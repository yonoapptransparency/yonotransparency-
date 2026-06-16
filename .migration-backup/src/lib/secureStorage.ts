import CryptoJS from 'crypto-js';

// Derive a unique key to make it harder to guess or decrypt externally
const getStorageSecret = (): string => {
  const base = "RUMMY_PORTAL_CLIENT_SEC_2026_PROD_SHIELD";
  return base + "_KINETICS_HASH_V2";
};

// Obfuscate local storage keys so they aren't easily searchable (e.g. from extensions)
export function getObfuscatedKey(key: string): string {
  if (key.startsWith('rummystore_')) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return `_app_sec_chunk_${Math.abs(hash).toString(16)}`;
  }
  return key;
}

export const secureStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
      const realKey = getObfuscatedKey(key);
      const raw = localStorage.getItem(realKey);
      if (!raw) {
        const legacyRaw = localStorage.getItem(key);
        if (legacyRaw) return legacyRaw;
        return null;
      }
      if (raw.startsWith('U2FsdGVkX1')) {
          localStorage.removeItem(realKey); // clear old encrypted data so we re-sync
          return null;
      }
      return raw;
    } catch (e) {
      console.warn("Secure storage read fallback:", e);
      return null;
    }
  },
  
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const realKey = getObfuscatedKey(key);
      localStorage.setItem(realKey, value);
      
      // Clean up legacy plain text if present
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn("Secure storage write failed:", e);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const realKey = getObfuscatedKey(key);
      localStorage.removeItem(realKey);
      localStorage.removeItem(key); // Also clean up legacy plain-text entry if any
    } catch (e) {
      console.warn("Secure storage delete failed:", e);
    }
  },
  
  clear: (): void => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      localStorage.clear();
    } catch (e) {
      console.warn("Storage clear failed:", e);
    }
  }
};
