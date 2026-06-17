import fs from 'fs';

async function verify() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const projectId = config.projectId;
  const dbId = config.firestoreDatabaseId;
  const apiKey = config.apiKey;

  console.log('Project ID:', projectId);
  console.log('Database ID configured:', dbId);
  console.log('API Key:', apiKey);

  for (const databaseId of ['(default)', dbId]) {
    console.log(`\nTesting Database ID: ${databaseId}`);
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/store_data/apps_chunk_0?key=${apiKey}`;
      const res = await fetch(url);
      console.log(`GET documents/store_data/apps_chunk_0 status:`, res.status);
      const data = await res.json();
      if (res.ok) {
        console.log(`SUCCESS. Fields inside apps_chunk_0 items:`, data.fields?.items?.arrayValue?.values?.length || 0);
      } else {
        console.log(`FAILED:`, data.error || data);
      }
    } catch (err: any) {
      console.error(`Error fetching:`, err.message);
    }
  }
}

verify();
