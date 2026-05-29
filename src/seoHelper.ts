import fs from 'fs';
import path from 'path';

let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000; // 1 second cache for instant updates and excellent performance

function parseFirestoreValue(value: any): any {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return parseFloat(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) {
    const list = value.arrayValue.values || [];
    return list.map((item: any) => parseFirestoreValue(item));
  }
  if ('mapValue' in value) {
    const fields = value.mapValue.fields || {};
    const obj: any = {};
    for (const key of Object.keys(fields)) {
      obj[key] = parseFirestoreValue(fields[key]);
    }
    return obj;
  }
  return null;
}

function parseFirestoreDoc(docFields: any): any {
  if (!docFields) return {};
  const obj: any = {};
  for (const key of Object.keys(docFields)) {
    obj[key] = parseFirestoreValue(docFields[key]);
  }
  return obj;
}

function getField(obj: any, key: string, fallback = ''): string {
  if (!obj) return fallback;
  const value = obj[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'object') {
    if ('stringValue' in value) return value.stringValue ?? fallback;
    if ('integerValue' in value) return String(value.integerValue) ?? fallback;
    if ('booleanValue' in value) return String(value.booleanValue) ?? fallback;
    return fallback;
  }
  return String(value);
}

async function fetchStoreData() {
  const now = Date.now();
  if (cachedData && (now - lastFetchTime) < CACHE_TTL) {
    return cachedData;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
  } catch (e) {
    console.error('No firebase config found for SEO rendering.');
    return null;
  }

  try {
    const cacheHeaders = {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Parallel Group 1: Fetch metadata and global collections concurrently
    const [settingsRes, newsRes, blogsRes, videosRes, metaRes] = await Promise.all([
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/settings?nocache=${now}`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/news?nocache=${now}`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/blogs?nocache=${now}`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/videos?nocache=${now}`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_meta?nocache=${now}`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null)
    ]);

    let numChunks = 5; // Default fallback chunks
    if (metaRes && metaRes.ok) {
      const metaData = await metaRes.json();
      if (metaData && metaData.fields && metaData.fields.numChunks && metaData.fields.numChunks.integerValue) {
        numChunks = parseInt(metaData.fields.numChunks.integerValue, 10) || 5;
      }
    }

    // Parallel Group 2: Fetch only the necessary app chunks using cache-busted fetch requests
    const chunkPromises = Array.from({ length: numChunks }).map((_, i) => 
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_${i}?nocache=${now}`, {
        cache: 'no-store',
        headers: cacheHeaders
      })
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    );

    const chunkResults = await Promise.all(chunkPromises);

    let apps: any[] = [];
    for (const chunkData of chunkResults) {
      if (chunkData && chunkData.fields && chunkData.fields.items && chunkData.fields.items.arrayValue && chunkData.fields.items.arrayValue.values) {
        apps = apps.concat(chunkData.fields.items.arrayValue.values.map((v: any) => v.mapValue.fields));
      }
    }
    
    let settings = null;
    const settingsData = settingsRes && settingsRes.ok ? await settingsRes.json() : null;
    if (settingsData && settingsData.fields) {
      settings = settingsData.fields;
    }

    let news: any[] = [];
    const newsData = newsRes && newsRes.ok ? await newsRes.json() : null;
    if (newsData && newsData.fields && newsData.fields.items && newsData.fields.items.arrayValue && newsData.fields.items.arrayValue.values) {
      news = newsData.fields.items.arrayValue.values.map((v: any) => v.mapValue.fields);
    }

    let blogs: any[] = [];
    const blogsData = blogsRes && blogsRes.ok ? await blogsRes.json() : null;
    if (blogsData && blogsData.fields && blogsData.fields.items && blogsData.fields.items.arrayValue && blogsData.fields.items.arrayValue.values) {
      blogs = blogsData.fields.items.arrayValue.values.map((v: any) => v.mapValue.fields);
    }

    let videos: any[] = [];
    const videosData = videosRes && videosRes.ok ? await videosRes.json() : null;
    if (videosData && videosData.fields && videosData.fields.items && videosData.fields.items.arrayValue && videosData.fields.items.arrayValue.values) {
      videos = videosData.fields.items.arrayValue.values.map((v: any) => v.mapValue.fields);
    }

    cachedData = { apps, settings, news, blogs, videos };
    lastFetchTime = now;
    return cachedData;
  } catch (error) {
    console.error('Failed to fetch store data for SEO:', error);
    return cachedData;
  }
}

function escapeHtml(unsafe: string) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(html: string) {
  if (!html) return '';
  const stripped = html.replace(/<[^>]*>?/gm, ' ');
  return stripped.replace(/\s+/g, ' ').trim();
}

export async function injectSeoTags(template: string, urlPath: string): Promise<string> {
  const data = await fetchStoreData();
  if (!data || !data.settings) return template;

  const { apps, settings, news, blogs, videos } = data;
  const siteTitle = getField(settings, 'site_title', 'RUMMY STORE');
  let title = siteTitle;
  let description = getField(settings, 'meta_description', '');
  let keywords = getField(settings, 'seo_keywords', '');
  let ogImage = getField(settings, 'logo_url', '');
  let author = 'RUMMY STORE';
  
  if (urlPath.startsWith('/app/')) {
    const slug = decodeURIComponent(urlPath.split('/app/')[1].split('/')[0].split('?')[0]);
    const app = apps.find((a: any) => {
      const aSlug = getField(a, 'slug');
      return aSlug && aSlug.toLowerCase() === slug.toLowerCase();
    });
    
    if (app) {
      const appName = getField(app, 'name', 'Rummy App');
      title = `${getField(app, 'seo_title') || appName} | ${siteTitle}`;
      const descHtml = getField(app, 'description_html');
      const fallbackDesc = `Download the verified ${appName} app instantly. Smooth gameplay, professional reviews, e-sports integration, and exclusive daily features.`;
      description = getField(app, 'seo_description') || (descHtml ? stripHtml(descHtml).substring(0, 160) : fallbackDesc);
      keywords = getField(app, 'seo_keywords');
      ogImage = getField(app, 'og_image_url') || getField(app, 'icon_url') || ogImage;
    }
  } else if (urlPath.startsWith('/info/') || urlPath.startsWith('/gateway/')) {
    const prefix = urlPath.startsWith('/info/') ? '/info/' : '/gateway/';
    const slug = decodeURIComponent(urlPath.split(prefix)[1].split('/')[0].split('?')[0]);
    const app = apps.find((a: any) => {
      const aSlug = getField(a, 'slug');
      return aSlug && aSlug.toLowerCase() === slug.toLowerCase();
    });
    
    if (app) {
      const appName = getField(app, 'name', 'Rummy App');
      title = `${getField(app, 'seo_title') || appName} - Technical Info | ${siteTitle}`;
      const descHtml = getField(app, 'description_html');
      const fallbackDesc = `Verified technical specifications, secure download links, package size, and dynamic gateway profiles for ${appName}.`;
      description = getField(app, 'seo_description') || (descHtml ? stripHtml(descHtml).substring(0, 160) : fallbackDesc);
      keywords = `${getField(app, 'seo_keywords')}, info ${appName}, secure ${appName}`;
      ogImage = getField(app, 'og_image_url') || getField(app, 'icon_url') || ogImage;
    }
  } else if (urlPath.startsWith('/news/') && urlPath.length > 6) {
    const slug = decodeURIComponent(urlPath.split('/news/')[1].split('/')[0].split('?')[0]);
    const newsItem = news.find((n: any) => {
      const nSlug = getField(n, 'slug');
      return nSlug && nSlug.toLowerCase() === slug.toLowerCase();
    });
    
    if (newsItem) {
      const itemTitle = getField(newsItem, 'title', 'Latest News');
      title = `${getField(newsItem, 'seo_title') || itemTitle} | ${siteTitle}`;
      const descHtml = getField(newsItem, 'description') || getField(newsItem, 'content');
      description = getField(newsItem, 'seo_description') || (descHtml ? stripHtml(descHtml).substring(0, 160) : '');
      keywords = getField(newsItem, 'seo_keywords');
      ogImage = getField(newsItem, 'og_image_url') || getField(newsItem, 'logo_url') || ogImage;
      author = getField(newsItem, 'ceo_name') || 'RUMMY STORE';
    }
  } else if (urlPath.startsWith('/blog/') && urlPath.length > 6) {
    const slug = decodeURIComponent(urlPath.split('/blog/')[1].split('/')[0].split('?')[0]);
    const blogItem = blogs.find((b: any) => {
      const bSlug = getField(b, 'slug');
      return bSlug && bSlug.toLowerCase() === slug.toLowerCase();
    });
    
    if (blogItem) {
      const itemTitle = getField(blogItem, 'title', 'Blog Post');
      title = `${getField(blogItem, 'seo_title') || itemTitle} | ${siteTitle}`;
      const descHtml = getField(blogItem, 'excerpt') || getField(blogItem, 'content');
      description = getField(blogItem, 'seo_description') || (descHtml ? stripHtml(descHtml).substring(0, 160) : '');
      keywords = getField(blogItem, 'seo_keywords');
      ogImage = getField(blogItem, 'cover_url') || ogImage;
      author = getField(blogItem, 'author') || 'RUMMY STORE';
    }
  } else if (urlPath.startsWith('/videos/') && urlPath.length > 8) {
    const slug = decodeURIComponent(urlPath.split('/videos/')[1].split('/')[0].split('?')[0]);
    const videoItem = videos.find((v: any) => {
      const vSlug = getField(v, 'slug');
      return vSlug && vSlug.toLowerCase() === slug.toLowerCase();
    });
    
    if (videoItem) {
      const itemTitle = getField(videoItem, 'title', 'Video Specs');
      title = `${getField(videoItem, 'seo_title') || itemTitle} | ${siteTitle}`;
      const descHtml = getField(videoItem, 'description');
      description = getField(videoItem, 'seo_description') || (descHtml ? stripHtml(descHtml).substring(0, 160) : '');
      keywords = getField(videoItem, 'seo_keywords');
      const youtubeUrl = getField(videoItem, 'youtube_url');
      let videoId = '';
      if (youtubeUrl) {
        const m = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
        if (m) videoId = m[1];
      }
      if (videoId) {
        ogImage = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
  }

  const faviconUrl = getField(settings, 'favicon_url');

  // Construct replacement tags
  const tags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ''}
    <meta name="author" content="${escapeHtml(author)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://rummystore.in${escapeHtml(urlPath)}" />
    ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : ''}
    ${faviconUrl ? `
    <link rel="icon" type="image/x-icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="shortcut icon" href="${escapeHtml(faviconUrl)}" />
    <link rel="apple-touch-icon" href="${escapeHtml(faviconUrl)}" />
    ` : ''}
  `;

  // Regex to remove any existing <title>, OpenGraph and favicon tags
  let newTemplate = template.replace(/<title>.*?<\/title>/ims, '');
  newTemplate = newTemplate.replace(/<link[^>]*rel=["']?(icon|shortcut icon|apple-touch-icon)["']?[^>]*>/gims, '');
  newTemplate = newTemplate.replace(/<meta[^>]*(name|property)=["'](description|keywords|og:title|og:description|og:image|og:type|og:url|twitter:.*?)["'][^>]*>/gims, '');
  
  // Insert new tags before </head>
  newTemplate = newTemplate.replace('</head>', `${tags}</head>`);
  
  return newTemplate;
}
