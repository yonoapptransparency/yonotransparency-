import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });
    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Hi",
        });
        console.log("Success! Response:");
        console.log(response.text);
    } catch(e) {
        console.error("AI Error:", e);
    }
}
test();
