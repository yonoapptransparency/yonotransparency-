import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocFromServer } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);

async function test(dbId) {
  console.log(`\n--- Testing Database ID: ${dbId} ---`);
  try {
    const db = getFirestore(app, dbId);
    const ref = doc(db, 'test_collection', 'verify_' + Date.now());
    await setDoc(ref, { test: true });
    console.log('Write: SUCCESS');
    const snap = await getDocFromServer(ref);
    console.log('Read: SUCCESS', snap.data());
  } catch (err) {
    console.error(`ERROR on ${dbId}:`, err.message);
  }
}

async function run() {
  await test('(default)');
  await test('ai-studio-yonostore-886315a4-8b9f-4ff6-8986-a90ad172210a');
}

run();
