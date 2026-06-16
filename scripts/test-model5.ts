import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });
    try {
        const responseList = await client.models.list();
        for await (const m of responseList) {
            console.log(m.name);
        }
    } catch(e) {
        console.error("AI Error:", e);
    }
}
test();
