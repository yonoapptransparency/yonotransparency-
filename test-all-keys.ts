import CryptoJS from 'crypto-js';

const ciphertext = "U2FsdGVkX19iqS1Ysynumq6ExRUaWZbsC/SOKPO//yhq31AKRKl9Bn+nrnfmEnCrhLv/dDhmTNQS6nYvZ7Wl0Ja5ZsQyzfbYEdVKrnUY5QZ+FMB8jhKm0mDXgA2hcJ6Sr6UfPEBaXRXqQU9pznwF5UinWXFeYxmJ3+sESBWNlsa/1lMA3ViEpVkpiQMgoX0bEkm085lTUlQWsyoA2tMX5TafpsRYl60U4F36GT/9iHs=";

const keys = [
    "Shehzad@78",
    "Shehzad@4874",
    ["fallback", "secure", "store", "key", "19482"].join("-")
];

for (const key of keys) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const text = bytes.toString(CryptoJS.enc.Utf8);
        console.log(`Key ${key}:`, text);
    } catch(e) {
        console.log(`Key ${key} failed`);
    }
}
