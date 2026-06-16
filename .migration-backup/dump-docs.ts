import fetch from "node-fetch";

async function run() {
  const projectId = "gen-lang-client-0825832493";
  const firestoreDatabaseId = "ai-studio-886315a4-8b9f-4ff6-8986-a90ad172210a";
  const apiKey = "AIzaSbey9sUbeWlrcXS2kl4ewOzkTy4arg03Ok";

  const db = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents`;
  
  for (const docName of ['sec_public_links', 'secure_links', 'sec_vault']) {
    console.log(`\n=== FETCHING ${docName} ===`);
    const r = await fetch(`${db}/store_data/${docName}?key=${apiKey}`);
    const data = await r.json();
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
