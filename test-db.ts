import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const cfg = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(cfg);
const db = getFirestore(app, '(default)');

async function test() {
  try {
    const d = await getDoc(doc(db, 'store_data', 'settings'));
    console.log("Settings EXISTS:", d.exists());
    if (d.exists()) {
      console.log("TITLE:", d.data().site_title);
    }
    const a = await getDoc(doc(db, 'store_data', 'apps'));
    console.log("Apps EXISTS:", a.exists());
    if (a.exists()) {
      console.log("APPS COUNT:", a.data().items?.length);
    }
  } catch(e) {
    console.error("ERROR:", e);
  }
}
test();
