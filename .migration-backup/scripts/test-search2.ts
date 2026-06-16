import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });
    try {
        const response = await client.models.generateContent({
            model: "gemini-flash-latest",
            contents: "What is the latest news?",
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        console.log("Success! Response:", response.text);
    } catch(e) {
        console.error("AI Error:", e);
    }
}
test();
