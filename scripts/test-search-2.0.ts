import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "What is the capital of France?",
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        console.log("Success! Response:", response.text);
    } catch(e: any) {
        console.error("AI Error:", e.status, e.message);
    }
}
test();
