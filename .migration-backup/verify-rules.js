import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);

async function test(dbId) {
  console.log(`\n--- Testing DB: ${dbId} ---`);
  try {
    const db = getFirestore(app, dbId);
    const ref = doc(db, 'test_collection', 'verify_' + Date.now());
    await setDoc(ref, { test: true }, { timeout: 5000 }); // Try to add timeout if possible (not in setDoc signature but maybe in settings)
    console.log('Write Success');
    const snap = await getDocFromServer(ref);
    console.log('Read Success:', snap.data());
  } catch (err) {
    console.error('Test Failed:', err.message);
  }
}

async function run() {
  await test(config.firestoreDatabaseId);
  await test('(default)');
}

run();
