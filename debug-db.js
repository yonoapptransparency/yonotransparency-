import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  console.log('Using Project:', config.projectId);
  console.log('Using DB:', '(default)');
  
  try {
    const ref = doc(db, 'store_data', 'settings');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      console.log('Data found in settings:', snap.data().site_title);
    } else {
      console.log('No data found in store_data/settings');
      
      // Try writing a test
      console.log('Attempting to write test data...');
      await setDoc(doc(db, 'test_persistence', 'val'), { time: Date.now() });
      console.log('Write SUCCESS');
      const testSnap = await getDoc(doc(db, 'test_persistence', 'val'));
      console.log('Verification Read SUCCESS:', testSnap.data());
    }
  } catch (err) {
    console.error('Error during check:', err.message);
  }
}

check();
