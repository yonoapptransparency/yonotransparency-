import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
        model: "gemini-pro",
        contents: "Hello",
    });
    console.log(response.text);
}
test();
