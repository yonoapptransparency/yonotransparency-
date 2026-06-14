import fetch from "node-fetch";

async function run() {
  const config = require('./firebase-applet-config.json');
  console.log("Fetching", config.projectId, config.firestoreDatabaseId);
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_0?key=${config.apiKey}`);
  const data = await r.json();
  if (data.error) console.error("Error:", data.error.message);
  else console.log("Items:", data.fields?.items?.arrayValue?.values?.length);
}
run();
