import fs from 'fs';

for (const file of ['server.ts', 'api/index.ts']) {
    let content = fs.readFileSync(file, 'utf8');

    // Add safeDecrypt helper if not present
    if (!content.includes('function safeDecrypt(')) {
        content = content.replace(
            "import CryptoJS from 'crypto-js';", 
            `import CryptoJS from 'crypto-js';

function safeDecrypt(ciphertext: string, primarySecret: string) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, primarySecret);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        if (text) return text;
    } catch(e) {}
    
    // Fallback to old secret
    try {
        const fallbackSecret = ['RUMMY', 'APP', 'SECRET', '2026'].join('_');
        if (primarySecret !== fallbackSecret) {
            const bytes = CryptoJS.AES.decrypt(ciphertext, fallbackSecret);
            const text = bytes.toString(CryptoJS.enc.Utf8);
            if (text) return text;
        }
    } catch(e) {}
    
    return '';
}
`
        );
    }
    
    // Replace the specific decryption logic blocks
    // 1.
    content = content.replace(
        /const bytes = CryptoJS\.AES\.decrypt\(encryptedBlob, AES_SECRET\);\s*const decryptedText = bytes\.toString\(CryptoJS\.enc\.Utf8\);/,
        `const decryptedText = safeDecrypt(encryptedBlob, AES_SECRET);`
    );
    // 2.
    content = content.replace(
        /const decryptBytes = CryptoJS\.AES\.decrypt\(encryptedUrl, AES_SECRET\);\s*targetUrl = decryptBytes\.toString\(CryptoJS\.enc\.Utf8\);/,
        `targetUrl = safeDecrypt(encryptedUrl, AES_SECRET);`
    );
    // 3.
    content = content.replace(
        /const bytes = CryptoJS\.AES\.decrypt\(encryptedUrl, AES_SECRET\);\s*targetUrl = bytes\.toString\(CryptoJS\.enc\.Utf8\);/,
        `targetUrl = safeDecrypt(encryptedUrl, AES_SECRET);`
    );
    // 4.
    content = content.replace(
        /const bytes = CryptoJS\.AES\.decrypt\(encryptedUrlField, AES_SECRET\);\s*targetUrl = bytes\.toString\(CryptoJS\.enc\.Utf8\);/g,
        `targetUrl = safeDecrypt(encryptedUrlField, AES_SECRET);`
    );
    // 5.
    content = content.replace(
        /finalUrl = CryptoJS\.AES\.decrypt\(finalUrl, AES_SECRET\)\.toString\(CryptoJS\.enc\.Utf8\);/g,
        `finalUrl = safeDecrypt(finalUrl, AES_SECRET);`
    );
    // 6.
    content = content.replace(
        /const bytes = CryptoJS\.AES\.decrypt\(encryptedData, AES_SECRET\);\s*const decryptedText = bytes\.toString\(CryptoJS\.enc\.Utf8\);/g,
        `const decryptedText = safeDecrypt(encryptedData, AES_SECRET);`
    );

    fs.writeFileSync(file, content);
}
console.log('Fixed malformed utf-8 decryption');
