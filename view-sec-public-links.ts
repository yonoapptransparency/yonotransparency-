import CryptoJS from "crypto-js";

async function run() {
  const enc = "U2FsdGVkX19iqS1Ysynumq6ExRUaWZbsC/SOKPO//yhq31AKRKl9Bn+nrnfmEnCrhLv/dDhmTNQS6nYvZ7Wl0Ja5ZsQyzfbYEdVKrnUY5QZ+FMB8jhKm0mDXgA2hcJ6Sr6UfPEBaXRXqQU9pznwF5UinWXFeYxmJ3+sESBWNlsa/1lMA3ViEpVkpiQMgoX0bEkm085lTUlQWsyoA2tMX5TafpsRYl60U4F36GT/9iHs=";
  const key = "Shehzad@4874";
  try {
    const bytes = CryptoJS.AES.decrypt(enc, key);
    const dec = bytes.toString(CryptoJS.enc.Utf8);
    console.log("Length:", dec.length);
    console.log("Decrypted raw characters code:");
    for (let i = 0; i < dec.length; i++) {
      console.log(`Char ${i}: code=${dec.charCodeAt(i)} char="${dec[i]}"`);
    }
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}
run();
