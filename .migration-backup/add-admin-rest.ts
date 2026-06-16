import fs from 'fs';

async function run() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const adminEmail = (process.argv[2] || process.env.ADMIN_EMAIL || 'defentechscholar@gmail.com').toLowerCase().trim();
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/admins/${adminEmail}`;
  
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          email: { stringValue: adminEmail },
          role: { stringValue: 'admin' },
          created_at: { stringValue: new Date().toISOString() }
        }
      })
    });
    console.log("REST PATCH status:", res.status);
    console.log("REST PATCH body:", await res.text());
  } catch (err) {
    console.error("error:", err);
  }
}
run();
