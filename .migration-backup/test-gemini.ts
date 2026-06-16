import { GoogleGenAI } from "@google/genai";

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const client = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  try {
    const response = await client.models.generateContent({
      model: "gemini-1.5-pro",
      contents: "hello",
    });
    console.log("Success:", response.text);
  } catch (err: any) {
    console.error("Gemini Error:", err.message);
  }
}

run();
