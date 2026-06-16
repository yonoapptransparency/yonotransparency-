import { GoogleGenAI } from "@google/genai";

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const client = new GoogleGenAI({
    apiKey,
  });

  const modelsToTest = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro-latest"
  ];

  for (const m of modelsToTest) {
      try {
        console.log(`Testing ${m}...`);
        const response = await client.models.generateContent({
          model: m,
          contents: "hello",
        });
        console.log(`Success ${m}:`, response.text);
      } catch (err: any) {
        console.error(`Error ${m}:`, err.message.substring(0, 50));
      }
  }
}
run();
