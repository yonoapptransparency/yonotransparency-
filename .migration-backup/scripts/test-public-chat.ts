import { fetchStoreData } from '../src/seoHelper';
import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    const data = await fetchStoreData();
    const publicContext = {
      settings: {
         site_title: data.settings?.site_title,
         meta_description: data.settings?.meta_description,
         policies: data.settings?.policies ? data.settings.policies.substring(0, 500) : "",
      },
      categories: (data.categories || []).map((cat: any) => ({
          id: cat.id,
          n: cat.name
      })),
      apps: (data.apps || []).map((app: any) => ({
         n: app.name,
         c: app.category,
         desc: app.description_html?.replace(/<[^>]+>/g, '').substring(0, 1000), // strips HTML and truncates
         r: app.rating,
         f: app.faqs, // Include FAQs
         red: app.red_box_msg,
         yel: app.yellow_box_msg
      })),
      news: (data.news || []).map((item: any) => ({
         t: item.title,
         d: item.description,
         c: item.content?.replace(/<[^>]+>/g, '').substring(0, 1000)
      })),
      blogs: (data.blogs || []).map((item: any) => ({
         t: item.title,
         d: item.description,
         c: item.content?.replace(/<[^>]+>/g, '').substring(0, 1000)
      })),
      videos: (data.videos || []).map((item: any) => ({
         t: item.title,
         d: item.description,
         c: item.content?.replace(/<[^>]+>/g, '').substring(0, 1000)
      }))
    };

    const sysInstruction = `You are the official RummyApp Online Public Assistant. Your sole purpose is to help visitors navigate the site, understand the directory structure, and find simulated card applications, news, blogs, and videos.

STRICT KNOWLEDGE BOUNDARIES:
You have been provided with the complete text and structural layout of the public RummyApp Online website. You must answer user questions ONLY using this specific provided data.
Under no circumstances are you to provide information, opinions, or advice outside of what is explicitly written in the provided site data. If a user asks about a topic, game, or concept not present on the site, you must reply: "I can only provide information directly related to the apps and policies listed on RummyApp Online."
You have absolutely no knowledge of the site's administrative panel, backend code, or hosting environment.
Maintain a helpful, objective, and transparent tone. Always remind users that all listed apps are simulated, non-wager environments for users aged 18+.

PUBLIC CONTEXT:
${JSON.stringify(publicContext, null, 2)}`;

    const apiKey = process.env.GEMINI_API_KEY;
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    try {
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "What news is available?",
            config: {
                systemInstruction: sysInstruction,
                maxOutputTokens: 350, 
                temperature: 0.3
            }
        });
        console.log("Success! Response:");
        console.log(response.text);
    } catch(e) {
        console.error("AI Error:", e);
    }
}
test();
