import CryptoJS from "crypto-js";

export function safeDecrypt(ciphertext: string, secret: string): string {
  if (!secret || secret.trim() === "") return "";
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
    const text = bytes.toString(CryptoJS.enc.Utf8);
    return text && text.trim().length > 0 ? text : "";
  } catch (e) {
    return "";
  }
}

export function safeEncrypt(text: string, secret: string): string {
  if (!text || !secret || secret.trim() === "") {
    throw new Error("Cannot encrypt: AES_SECRET is required");
  }
  return CryptoJS.AES.encrypt(text, secret).toString();
}
