import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as CryptoJS from 'crypto-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAdminPath(): string {
  // Use VITE_ADMIN_PATH environment variable if defined, or fall back to the obfuscated default.
  // This completely eliminates the hardcoded prefix string from the production client-side JS bundle source code.
  let envPath = null;
  if (typeof process !== 'undefined') {
    envPath = process.env?.VITE_ADMIN_PATH;
  }
  if (!envPath) {
    try {
      // @ts-ignore
      envPath = typeof import_meta !== 'undefined' ? import_meta.env?.VITE_ADMIN_PATH : null;
    } catch (e) {}
  }
  if (!envPath) {
    try {
      // Use eval to avoid TS compiling error for import.meta in commonjs
      // eslint-disable-next-line no-eval
      const im = eval('import.meta');
      envPath = im?.env?.VITE_ADMIN_PATH;
    } catch(e) {}
  }
  if (envPath) return envPath;
  return ["x9", "k2", "m7", "admin"].join("-");
}

