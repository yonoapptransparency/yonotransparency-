import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import CryptoJS from "crypto-js";

async function run() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("Error: firebase-applet-config.json is missing.");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const projectId = config.projectId;
  const firestoreDatabaseId = config.firestoreDatabaseId;
  const apiKey = config.apiKey;

  const AES_SECRET = process.env.AES_SECRET;
  if (!AES_SECRET) {
    console.error("Error: AES_SECRET environment variable is not set. Refusing to run test with predictable fallback keys.");
    process.exit(1);
  }

  console.log("process.env.AES_SECRET length:", AES_SECRET.length);
  console.log("process.env.AES_SECRET starting with:", AES_SECRET.substring(0, 10));

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
      try {
        const bytes = CryptoJS.AES.decrypt(enc, AES_SECRET);
        const dec = bytes.toString(CryptoJS.enc.Utf8);
        console.log(`Decrypted content =`, JSON.stringify(dec));
      } catch (e: any) {
        console.log(`Decryption error:`, e.message);
      }
    } else {
      console.log("No encryptedData field found.");
    }
  } catch (e: any) {
    console.log("Exception:", e.message);
  }
}
run();
