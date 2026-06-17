import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({ apiKey });
    
    const models = await client.models.list();
    for await (const m of models) {
        if (!m.name.includes('vision') && !m.name.includes('embedding') && !m.name.includes('audio') && !m.name.includes('imagen') && !m.name.includes('veo') && !m.name.includes('robotics') && !m.name.includes('aqa') && !m.name.includes('lyria') && !m.name.includes('deep-research')) {
            try {
                //console.log(`Testing ${m.name}...`);
                const response = await client.models.generateContent({
                    model: m.name.replace("models/", ""),
                    contents: "Hi",
                });
                console.log(`\n✅ ✅ ✅ SUCCESS with ${m.name}:`, response.text);
                break;
            } catch(e: any) {
                // console.error(`Error with ${m.name}:`, e.message?.substring(0, 50).replace(/\n/g,""));
            }
        }
    }
}
test();
