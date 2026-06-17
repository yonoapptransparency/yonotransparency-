import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const firebaseConfig = {
  apiKey: config.apiKey,
  projectId: config.projectId,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId);

async function fix() {
  const d1 = await getDoc(doc(db, 'store_data', 'sec_vault'));
  if (d1.exists()) {
    console.log("sec_vault exists, copying to secure_links and sec_public_links...");
    const data = d1.data();
    await setDoc(doc(db, 'store_data', 'secure_links'), data);
    await setDoc(doc(db, 'store_data', 'sec_public_links'), data);
    console.log("done");
  } else {
    console.log("sec_vault does not exist");
  }
}
fix();
