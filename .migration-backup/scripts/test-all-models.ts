import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });
    const models = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-pro-latest",
        "gemini-flash-latest"
    ];
    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const response = await client.models.generateContent({
                model: m,
                contents: "Hi",
            });
            console.log(`Success with ${m}:`, response.text);
        } catch(e: any) {
            console.error(`Error with ${m}:`, e.message?.substring(0, 200).replace(/\n/g,""));
        }
    }
}
test();
