import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const cfg = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);

async function scan(dbName) {
  const db = getFirestore(app, dbName);
  try {
    const d = await getDoc(doc(db, 'store_data', 'settings'));
    console.log(`[${dbName}] Settings EXISTS:`, d.exists());
    if (d.exists()) console.log(`[${dbName}] TITLE:`, d.data().site_title);
    
    const a = await getDoc(doc(db, 'store_data', 'apps'));
    console.log(`[${dbName}] Apps EXISTS:`, a.exists());
    if (a.exists()) console.log(`[${dbName}] APPS:`, a.data().items?.length);
  } catch(e) {
    if (e.message.includes('DEADLINE_EXCEEDED')) return;
    console.error(`[${dbName}] ERROR:`, e.message);
  }
}

async function test() {
  await scan('(default)');
  cfg.firestoreDatabaseId = 'ai-studio-886315a4-8b9f-4ff6-8986-a90ad172210a';
  await scan('ai-studio-886315a4-8b9f-4ff6-8986-a90ad172210a');
  process.exit(0);
}
test();
