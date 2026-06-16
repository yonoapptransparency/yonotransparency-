import { Router } from "express";
import { fetchStoreData } from "../lib/storeData.js";

const router = Router();

const publicChatRateLimits = new Map<string, { count: number; resetTime: number }>();

router.post("/v1/public/chat", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown") as string;
  const now = Date.now();
  const rateLimitWindow = 60 * 60 * 1000;
  const maxMessages = 10;

  let userLimit = publicChatRateLimits.get(ip);
  if (!userLimit || now > userLimit.resetTime) {
    userLimit = { count: 0, resetTime: now + rateLimitWindow };
  }
  if (userLimit.count >= maxMessages) {
    return res.status(429).json({ error: "Rate limit exceeded. Maximum 10 messages per hour." });
  }
  userLimit.count += 1;
  publicChatRateLimits.set(ip, userLimit);

  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message payload is required." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI service is currently offline.");

    const data = await fetchStoreData();

    const publicContext = {
      settings: {
        site_title: data.settings?.site_title,
        meta_description: data.settings?.meta_description,
        policies: data.settings?.policies ? data.settings.policies.substring(0, 500) : "",
      },
      categories: (data.categories || []).map((cat: any) => ({ id: cat.id, n: cat.name })),
      apps: (data.apps || []).map((app: any) => ({
        n: app.name,
        c: app.category,
        desc: app.description_html?.replace(/<[^>]+>/g, "").substring(0, 200),
        r: app.rating,
      })),
      news: (data.news || []).map((item: any) => ({
        t: item.title,
        d: item.description?.substring(0, 200),
        c: item.content?.replace(/<[^>]+>/g, "").substring(0, 300),
      })),
      blogs: (data.blogs || []).map((item: any) => ({
        t: item.title,
        d: item.description?.substring(0, 200),
        c: item.content?.replace(/<[^>]+>/g, "").substring(0, 300),
      })),
      videos: (data.videos || []).map((item: any) => ({
        t: item.title,
        d: item.description,
        c: item.content?.replace(/<[^>]+>/g, "").substring(0, 1000),
      })),
    };

    const { GoogleGenAI } = await import("@google/genai");
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const sysInstruction = `You are a helpful, lively, and knowledgeable AI assistant. While you are integrated into the RummyApp Online website, you are ALSO a general-purpose AI capable of answering ANY question from the user.
You MUST answer queries about general knowledge, current events, programming, science, everyday facts, or anything else the user asks.
IMPORTANT: Use your Google Search capabilities to find answers from the real internet whenever the user asks for up-to-date information, facts, news, or external context. Do not restrict yourself to only website-related topics. Never say you can only answer website-related questions. Give comprehensive, lively answers just like Google or Gemini would.

If the user asks about the site structure, simulated games, news, or blogs, you can use the PUBLIC CONTEXT provided below.

PUBLIC CONTEXT (Website Data):
${JSON.stringify(publicContext, null, 2)}`;

    try {
      const responseStream = await client.models.generateContentStream({
        model: "gemini-2.0-flash",
        contents: message.trim(),
        config: {
          systemInstruction: sysInstruction,
          maxOutputTokens: 1000,
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        },
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write(`data: [DONE]\n\n`);
      return res.end();
    } catch (err: any) {
      if (!res.headersSent) throw err;
      res.write(`data: ${JSON.stringify({ error: err.message || "Streaming failed" })}\n\n`);
      return res.end();
    }
  } catch (err: any) {
    if (err.status === 429 || err.message?.includes("429")) {
      return res.json({
        success: true,
        answer: "🚨 **API Quota Exceeded:** The system is currently overloaded. Please try again later.",
      });
    } else if (err.status === 403 || err.message?.includes("403")) {
      return res.json({
        success: true,
        answer: "🚨 **API Access Denied:** Your Gemini API key does not have permission or is invalid.",
      });
    }

    const lowerMessage = message.trim().toLowerCase();
    try {
      const data = await fetchStoreData();
      const apps = data.apps || [];
      const matches = apps.filter(
        (a: any) =>
          (a.name && a.name.toLowerCase().includes(lowerMessage)) ||
          (a.category && a.category.toLowerCase().includes(lowerMessage))
      );
      if (matches.length > 0) {
        const names = matches
          .slice(0, 3)
          .map((a: any) => a.name)
          .join(", ");
        return res.json({
          success: true,
          answer: `(Offline Fallback): I found some apps matching your query: ${names}${matches.length > 3 ? " and more." : "."}`,
        });
      } else if (lowerMessage.includes("hello") || lowerMessage === "hi") {
        return res.json({
          success: true,
          answer: "(Offline Fallback): Hello! Our AI is currently in offline mode but I can still help you search for apps!",
        });
      }
    } catch {}

    return res.json({
      success: true,
      answer: "(Offline Fallback): I am experiencing high traffic right now. Please browse the directory directly.",
    });
  }
});

export default router;
