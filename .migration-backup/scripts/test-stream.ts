import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });
    try {
        const responseStream = await client.models.generateContentStream({
            model: "gemini-2.0-flash",
            contents: "Count to 5."
        });
        for await (const chunk of responseStream) {
            process.stdout.write(chunk.text);
        }
        console.log("\nDone!");
    } catch(e) {
        console.error("AI Error:", e);
    }
}
test();
