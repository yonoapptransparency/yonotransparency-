require('dotenv').config();
const fs = require('fs');

async function fix() {
    const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

    const chunkResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_0`);
    const chunkData = await chunkResponse.json();
    let apps = [];
    if (!chunkData.error && chunkData.fields?.items?.arrayValue?.values) {
        apps = chunkData.fields.items.arrayValue.values.map(v => v.mapValue.fields.id.stringValue);
    }
    const chunk1Response = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_1`);
    const chunk1Data = await chunk1Response.json();
    if (!chunk1Data.error && chunk1Data.fields?.items?.arrayValue?.values) {
        apps = apps.concat(chunk1Data.fields.items.arrayValue.values.map(v => v.mapValue.fields.id.stringValue));
    }

    const secureLinks = apps.map(id => ({
        mapValue: {
            fields: {
                id: { stringValue: id },
                url: { stringValue: "https://example.com/download/" + id }
            }
        }
    }));

    const payload = {
        fields: {
            items: {
                arrayValue: {
                    values: secureLinks
                }
            }
        }
    };
    
    // Save as plaintext items to secure_links database document
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/secure_links?updateMask.fieldPaths=items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    console.log("RESTORE RES:", await res.json());
}
fix().catch(console.error);
