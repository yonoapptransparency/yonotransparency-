import { Router } from "express";
import { fetchStoreData, getField } from "../lib/storeData.js";

const router = Router();

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

router.get(["/sitemap.xml", "/sitemap", "/v1/sitemap", "/v1/sitemap.xml"], async (req, res) => {
  try {
    const data = await fetchStoreData();
    if (!data) throw new Error("Unable to fetch store data");
    const { apps = [], news = [], blogs = [], videos = [] } = data;

    const baseUrl = "https://rummyapp.online";
    const host = req.headers.host ? `https://${req.headers.host}` : baseUrl;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const addUrl = (loc: string, changefreq: string, priority: string) => {
      xml += `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
    };

    addUrl(`${host}/`, "daily", "1.0");
    addUrl(`${host}/new-apps`, "daily", "0.8");
    addUrl(`${host}/news`, "daily", "0.8");
    addUrl(`${host}/blogs`, "daily", "0.8");
    addUrl(`${host}/videos`, "daily", "0.8");
    addUrl(`${host}/about`, "weekly", "0.5");
    addUrl(`${host}/contact`, "weekly", "0.5");
    addUrl(`${host}/privacy`, "weekly", "0.3");
    addUrl(`${host}/terms`, "weekly", "0.3");
    addUrl(`${host}/responsibility`, "weekly", "0.3");

    for (const app of apps) {
      const slug = getField(app, "slug");
      if (slug) {
        addUrl(`${host}/app/${escapeXml(slug)}`, "weekly", "0.9");
        addUrl(`${host}/${escapeXml(slug)}`, "weekly", "0.8");
        addUrl(`${host}/gateway/${escapeXml(slug)}`, "weekly", "0.8");
      }
    }

    for (const newsItem of news) {
      const slug = getField(newsItem, "slug");
      if (slug) addUrl(`${host}/news/${escapeXml(slug)}`, "weekly", "0.7");
    }

    for (const blog of blogs) {
      const slug = getField(blog, "slug");
      if (slug) addUrl(`${host}/blog/${escapeXml(slug)}`, "weekly", "0.7");
    }

    for (const video of videos) {
      const slug = getField(video, "slug");
      if (slug) addUrl(`${host}/videos/${escapeXml(slug)}`, "weekly", "0.6");
    }

    xml += `</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (e) {
    console.error("Sitemap generation error:", e);
    res.status(500).send("Error generating sitemap");
  }
});

router.get("/robots.txt", async (req, res) => {
  try {
    const data = await fetchStoreData();
    const { news = [], blogs = [], videos = [] } = data || {};

    let robots = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n`;
    if (blogs.length === 0) robots += `Disallow: /blogs\n`;
    if (news.length === 0) robots += `Disallow: /news\n`;
    if (videos.length === 0) robots += `Disallow: /videos\n`;
    robots += `\nSitemap: https://rummyapp.online/sitemap.xml\n`;

    res.set("Content-Type", "text/plain");
    res.send(robots);
  } catch {
    res.set("Content-Type", "text/plain");
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://rummyapp.online/sitemap.xml\n`);
  }
});

export default router;
