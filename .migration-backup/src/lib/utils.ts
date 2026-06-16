import * as CryptoJS from 'crypto-js';

export function cn(...inputs: any[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function getAdminPath(): string {
  let envPath = null;
  if (typeof process !== 'undefined') {
    envPath = process.env?.ADMIN_PATH || process.env?.VITE_ADMIN_PATH;
  }
  return envPath || "admin";
}
