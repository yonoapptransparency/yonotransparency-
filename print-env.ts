console.log("AES_SECRET:", JSON.stringify(process.env.AES_SECRET));
if (process.env.AES_SECRET) {
  console.log("Length:", process.env.AES_SECRET.length);
  for (let i = 0; i < process.env.AES_SECRET.length; i++) {
    console.log(`Char ${i}: code=${process.env.AES_SECRET.charCodeAt(i)} char="${process.env.AES_SECRET[i]}"`);
  }
}
