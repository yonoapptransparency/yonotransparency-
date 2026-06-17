require('dotenv').config();
const fs = require('fs');

async function test() {
    const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

    const chunkResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_0`);
    const chunkData = await chunkResponse.json();
    if (!chunkData.error && chunkData.fields?.items?.arrayValue?.values) {
        const values = chunkData.fields.items.arrayValue.values;
        console.log("Chunk 0 items:", values.length);
        if (values.length > 0) {
            console.log(JSON.stringify(values[0].mapValue.fields, null, 2));
        }
    }
}
test().catch(console.error);
