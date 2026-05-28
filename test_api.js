import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
async function test() {
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/settings`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data.fields.site_title.stringValue);
}
test();
