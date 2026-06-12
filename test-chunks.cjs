require('dotenv').config();
const fs = require('fs');
const CryptoJS = require('crypto-js');

function safeDecrypt(ciphertext, primarySecret) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, primarySecret);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        if (text) return text;
    } catch(e) {}
    try {
        const fallbackSecret = ['RUMMY', 'APP', 'SECRET', '2026'].join('_');
        const bytes = CryptoJS.AES.decrypt(ciphertext, fallbackSecret);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        if (text) return text;
    } catch(e) {}
    return '';
}


async function test() {
    const AES_SECRET = process.env.AES_SECRET || ['RUMMY', 'APP', 'SECRET', '2026'].join('_');
    const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

    const metaResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_meta`);
    const metaData = await metaResponse.json();
    let numChunks = 1;
    if (!metaData.error && metaData.fields?.numChunks?.integerValue) {
        numChunks = parseInt(metaData.fields.numChunks.integerValue, 10);
    }
    
    console.log("Num chunks:", numChunks);
    let allUrlFields = 0;
            
    for (let i = 0; i < numChunks; i++) {
        const chunkResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_${i}`);
        const chunkData = await chunkResponse.json();
        if (!chunkData.error && chunkData.fields?.items?.arrayValue?.values) {
            const values = chunkData.fields.items.arrayValue.values;
            console.log("Chunk", i, "items:", values.length);
            for(const item of values) {
                const encryptedUrlField = item.mapValue.fields.more_information_url?.stringValue || item.mapValue.fields.download_url?.stringValue;
                if (encryptedUrlField) {
                     allUrlFields++;
                     console.log("URL field for id", item.mapValue.fields.id.stringValue, ":", encryptedUrlField.substring(0, 50));
                     if (encryptedUrlField.startsWith('U2FsdGVkX1')) {
                             const bytes = CryptoJS.AES.decrypt(encryptedUrlField, AES_SECRET);
                             const targetUrl = bytes.toString(CryptoJS.enc.Utf8);
                             console.log("Decrypted to: ", targetUrl);
                     }
                }
            }
        }
    }
    console.log("Total url fields found:", allUrlFields);
}
test().catch(console.error);
