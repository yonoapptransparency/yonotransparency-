import fetch from "node-fetch";
import CryptoJS from "crypto-js";

async function run() {
  const projectId = "gen-lang-client-0825832493";
  const firestoreDatabaseId = "ai-studio-886315a4-8b9f-4ff6-8986-a90ad172210a";
  const apiKey = "AIzaSbey9sUbeWlrcXS2kl4ewOzkTy4arg03Ok";

  const fallbackKey = ["fallback", "secure", "store", "key", "19482"].join("-");
  const AES_SECRET = process.env.AES_SECRET || fallbackKey;

  console.log("process.env.AES_SECRET length:", process.env.AES_SECRET ? process.env.AES_SECRET.length : "undefined");
  console.log("process.env.AES_SECRET starting with:", process.env.AES_SECRET ? process.env.AES_SECRET.substring(0, 10) : "");

  const keysToTry = [AES_SECRET, fallbackKey];
  if (process.env.AES_SECRET) {
    keysToTry.push(process.env.AES_SECRET.trim());
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/store_data/sec_public_links?key=${apiKey}`;
  try {
    const r = await fetch(url);
    const data = (await r.json()) as any;
    if (data.error) {
      console.log(`Error:`, data.error.message);
      return;
    }
    const enc = data.fields?.encryptedData?.stringValue;
    if (enc) {
      console.log("Encrypted string:", enc);
      for (const key of Array.from(new Set(keysToTry))) {
        try {
          const bytes = CryptoJS.AES.decrypt(enc, key);
          const dec = bytes.toString(CryptoJS.enc.Utf8);
          console.log(`Key length ${key.length} trial: decrypted content =`, JSON.stringify(dec));
        } catch (e: any) {
          console.log(`Key depth ${key.length} error:`, e.message);
        }
      }
    } else {
      console.log("No encryptedData field found.");
    }
  } catch (e: any) {
    console.log("Exception:", e.message);
  }
}
run();
