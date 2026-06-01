import fs from 'fs';
import path from 'path';
import { mockApps, mockSettings, mockNews, mockBlogs, mockVideos } from './lib/staticData';
import { getAdminPath } from './lib/utils';

let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 120000; // 2 minutes cache to prevent extreme blocking on each pageload
let isFetchingStoreData = false;

function getRawFirebaseConfig(): any {
  try {
    const rawData = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
    return JSON.parse(rawData);
  } catch (err) {
    try {
      const rawData = fs.readFileSync(path.resolve('firebase-applet-config.json'), 'utf8');
      return JSON.parse(rawData);
    } catch(e) {
      console.error("Error reading config in seoHelper:", err);
    }
  }
  return null;
}

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

export function getField(obj: any, key: string, fallback = ''): string {
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

export async function fetchStoreData() {
  const now = Date.now();

  // If we have cached data, always serve it instantly
  if (cachedData) {
    if ((now - lastFetchTime) >= CACHE_TTL && !isFetchingStoreData) {
      isFetchingStoreData = true;
      // Fetch updated data in background, allowing this function to return the cached data immediately
      (async () => {
        const config = getRawFirebaseConfig();
        if (!config) return;

        const isApiKeyEmptyOrPlaceholder = 
          !config.apiKey || 
          config.apiKey.trim() === "" || 
          config.apiKey.includes("YOUR_API_KEY");

        if (isApiKeyEmptyOrPlaceholder) {
          cachedData = {
            apps: mockApps,
            settings: mockSettings,
            news: mockNews,
            blogs: mockBlogs,
            videos: mockVideos
          };
          lastFetchTime = Date.now();
          return;
        }

        const cacheHeaders = {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };

        const [settingsRes, newsRes, blogsRes, videosRes, metaRes] = await Promise.all([
          fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/settings`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
          fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/news`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
          fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/blogs`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
          fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/videos`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
          fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_meta`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null)
        ]);

        let numChunks = 5;
        if (metaRes && metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData && metaData.fields && metaData.fields.numChunks && metaData.fields.numChunks.integerValue) {
            numChunks = parseInt(metaData.fields.numChunks.integerValue, 10) || 5;
          }
        }

        const chunkPromises = Array.from({ length: numChunks }).map((_, i) => 
          fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_${i}`, {
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
        lastFetchTime = Date.now();
      })().catch(err => {
        console.error("Background fetchStoreData failed:", err);
      }).finally(() => {
        isFetchingStoreData = false;
      });
    }
    return cachedData;
  }

  const config = getRawFirebaseConfig();
  if (!config) {
    console.warn('No firebase config found for SEO rendering, using static mock fallback.');
    const mockData = {
      apps: mockApps,
      settings: mockSettings,
      news: mockNews,
      blogs: mockBlogs,
      videos: mockVideos
    };
    cachedData = mockData;
    lastFetchTime = now;
    return mockData;
  }

  const isApiKeyEmptyOrPlaceholder = 
    !config.apiKey || 
    config.apiKey.trim() === "" || 
    config.apiKey.includes("YOUR_API_KEY");

  if (isApiKeyEmptyOrPlaceholder) {
    const mockData = {
      apps: mockApps,
      settings: mockSettings,
      news: mockNews,
      blogs: mockBlogs,
      videos: mockVideos
    };
    cachedData = mockData;
    lastFetchTime = now;
    return mockData;
  }

  try {
    isFetchingStoreData = true;
    const cacheHeaders = {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    const [settingsRes, newsRes, blogsRes, videosRes, metaRes] = await Promise.all([
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/settings`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/news`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/blogs`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/videos`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null),
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_meta`, { cache: 'no-store', headers: cacheHeaders }).catch(() => null)
    ]);

    let numChunks = 5;
    if (metaRes && metaRes.ok) {
      const metaData = await metaRes.json();
      if (metaData && metaData.fields && metaData.fields.numChunks && metaData.fields.numChunks.integerValue) {
        numChunks = parseInt(metaData.fields.numChunks.integerValue, 10) || 5;
      }
    }

    const chunkPromises = Array.from({ length: numChunks }).map((_, i) => 
      fetch(`https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/store_data/apps_chunk_${i}`, {
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
    const mockFallback = {
      apps: mockApps,
      settings: mockSettings,
      news: mockNews,
      blogs: mockBlogs,
      videos: mockVideos
    };
    if (!cachedData) {
      cachedData = mockFallback;
    }
    return cachedData || mockFallback;
  } finally {
    isFetchingStoreData = false;
  }
}

// Pre-load data in background on server start to completely eliminate first-load blocking latency
fetchStoreData().catch(err => {
  console.warn("Initial data pre-load failed (will retry dynamically on demand):", err);
});

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

function cleanSeoDescription(desc: string): string {
  if (!desc) return '';
  const trimmed = desc.trim();
  if (trimmed.startsWith('<') || trimmed.includes('<meta ')) {
    const metaMatch = trimmed.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    if (metaMatch && metaMatch[1]) {
      return metaMatch[1].trim();
    }
    const ogMatch = trimmed.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    if (ogMatch && ogMatch[1]) {
      return ogMatch[1].trim();
    }
    return stripHtml(trimmed).substring(0, 160);
  }
  return trimmed;
}

async function getPagePreRender(urlPath: string, data: any): Promise<string> {
  const { apps, settings, news, blogs, videos } = data;
  const cleanPath = urlPath.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const cleanPathLower = cleanPath.toLowerCase();

  let bodyContent = '';

  if (cleanPathLower === '/' || cleanPathLower === '') {
    bodyContent = renderHome(apps, settings, news, blogs, videos);
  } else if (cleanPathLower === '/new-apps') {
    bodyContent = renderNewApps(apps, settings);
  } else if (cleanPathLower.startsWith('/app/')) {
    const slug = cleanPath.split('/app/')[1];
    bodyContent = renderAppDetails(slug, apps, settings);
  } else if (cleanPathLower.startsWith('/info/') || cleanPathLower.startsWith('/gateway/')) {
    const slug = cleanPathLower.startsWith('/info/') ? cleanPath.split('/info/')[1] : cleanPath.split('/gateway/')[1];
    bodyContent = renderGateway(slug, apps, settings);
  } else if (cleanPathLower === '/news') {
    bodyContent = renderNewsList(news, settings);
  } else if (cleanPathLower.startsWith('/news/')) {
    const slug = cleanPath.split('/news/')[1];
    bodyContent = renderNewsDetail(slug, news, settings);
  } else if (cleanPathLower === '/blogs') {
    bodyContent = renderBlogsList(blogs, settings);
  } else if (cleanPathLower.startsWith('/blog/')) {
    const slug = cleanPath.split('/blog/')[1];
    bodyContent = renderBlogDetail(slug, blogs, settings);
  } else if (cleanPathLower === '/videos') {
    bodyContent = renderVideosList(videos, settings);
  } else if (cleanPathLower.startsWith('/videos/')) {
    const slug = cleanPath.split('/videos/')[1];
    bodyContent = renderVideoDetail(slug, videos, settings);
  } else if (cleanPathLower === '/about') {
    bodyContent = renderAbout(settings);
  } else if (cleanPathLower === '/contact') {
    bodyContent = renderContact(settings);
  } else if (cleanPathLower === '/privacy') {
    bodyContent = renderPrivacy(settings);
  } else if (cleanPathLower === '/terms') {
    bodyContent = renderTerms(settings);
  } else if (cleanPathLower === '/responsibility') {
    bodyContent = renderResponsibility(settings);
  } else {
    // Dynamic fallback for canonical root-level slugs (new direct path structure)
    const possibleSlug = cleanPathLower.replace(/^\/|\/$/g, '');
    if (apps.some((a: any) => a.slug?.toLowerCase() === possibleSlug)) {
      bodyContent = renderAppDetails(possibleSlug, apps, settings);
    } else if (news.some((n: any) => n.slug?.toLowerCase() === possibleSlug)) {
      bodyContent = renderNewsDetail(possibleSlug, news, settings);
    } else if (blogs.some((b: any) => b.slug?.toLowerCase() === possibleSlug)) {
      bodyContent = renderBlogDetail(possibleSlug, blogs, settings);
    } else if (videos.some((v: any) => v.slug?.toLowerCase() === possibleSlug)) {
      bodyContent = renderVideoDetail(possibleSlug, videos, settings);
    } else {
      bodyContent = renderHome(apps, settings, news, blogs, videos);
    }
  }

  const header = renderHeader(settings);
  const footer = renderFooter(settings);

  return `
    <div class="flex flex-col min-h-screen">
      ${header}
      <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-1.5 sm:py-3 pb-16 sm:pb-24 overflow-x-hidden relative">
        ${bodyContent}
      </main>
      ${footer}
    </div>
  `;
}

function renderHeader(settings: any) {
  const siteTitle = getField(settings, 'site_title');
  const logoUrl = getField(settings, 'logo_url');
  return `
    <header class="py-3 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-8 flex justify-between items-center">
        <a href="/" class="flex items-center gap-3 font-bold text-lg text-zinc-900 dark:text-white">
          ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" class="w-10 h-10 object-contain" alt="Logo"/>` : ''}
          <span>${escapeHtml(siteTitle)}</span>
        </a>
        <nav class="hidden md:flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <a href="/">Home</a>
          <a href="/new-apps">New Apps</a>
          <a href="/news">News</a>
          <a href="/blogs">Blogs</a>
          <a href="/videos">Videos</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </header>
  `;
}

function renderFooter(settings: any) {
  const siteTitle = getField(settings, 'site_title');
  const logoUrl = getField(settings, 'logo_url');
  const metaDescription = getField(settings, 'meta_description');
  const disclaimerText = getField(settings, 'disclaimer_text');
  const ethicsText = getField(settings, 'ethics_discrimination_text');
  const importantNotice = getField(settings, 'important_notice');

  return `
    <footer class="pt-12 pb-8 border-t border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950 mt-12 text-center text-zinc-500 dark:text-zinc-400">
      <div class="max-w-7xl mx-auto px-6">
        <h3 class="text-xl font-bold flex items-center justify-center gap-2 text-zinc-900 dark:text-white mb-2">
          ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" class="w-8 h-8 object-contain" alt="Logo" />` : ''}
          <span>${escapeHtml(siteTitle)}</span>
        </h3>
        <p class="text-sm max-w-xl mx-auto mb-6 leading-relaxed">${escapeHtml(metaDescription)}</p>
        <div class="flex flex-wrap justify-center gap-6 text-xs font-semibold mb-8 text-zinc-600 dark:text-zinc-400">
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/responsibility">Safety</a>
        </div>
        
        <div class="max-w-7xl mx-auto flex flex-col gap-4 text-left text-xs text-zinc-500 leading-relaxed">
          ${disclaimerText ? `<div class="bg-white dark:bg-zinc-900 border border-black/5 rounded-2xl p-6"><strong>Disclaimer:</strong> ${disclaimerText}</div>` : ''}
          ${ethicsText ? `<div class="bg-white dark:bg-zinc-900 border border-black/5 rounded-2xl p-6"><strong>Ethics & Safety:</strong> ${ethicsText}</div>` : ''}
          ${importantNotice ? `<div class="bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 rounded-2xl p-6"><strong>Notice:</strong> ${importantNotice}</div>` : ''}
        </div>
        <div class="text-xs text-zinc-400 mt-8">&copy; ${new Date().getFullYear()} ${escapeHtml(siteTitle)}. All rights reserved.</div>
      </div>
    </footer>
  `;
}

function renderHome(apps: any[], settings: any, news: any[], blogs: any[], videos: any[]) {
  const siteTitle = getField(settings, 'site_title');
  const desc = getField(settings, 'meta_description');
  
  let appsHtml = '';
  const sorted = [...apps].sort((a,b) => parseInt(getField(a, 'serial_number','999'), 10) - parseInt(getField(b, 'serial_number','999'), 10));
  
  sorted.forEach((app, i) => {
    const name = getField(app, 'name');
    const slug = getField(app, 'slug');
    const category = getField(app, 'category');
    const rating = getField(app, 'rating', '5.0');
    const icon = getField(app, 'icon_url');
    const isNew = app.is_new === true || (app.is_new && app.is_new.booleanValue === true);
    
    appsHtml += `
      <a href="/${encodeURIComponent(slug)}" class="flex items-center gap-4 p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition border-b border-black/5 dark:border-white/5">
        <span class="text-sm font-bold text-zinc-400 shrink-0 w-8 text-center">${i + 1}</span>
        <img src="${icon || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&fit=crop'}" class="w-16 h-16 rounded-[18px] object-cover bg-white shadow-sm shrink-0" alt="${escapeHtml(name)}"/>
        <div class="flex-1 min-w-0 text-left">
          <h3 class="font-bold text-base text-zinc-900 dark:text-zinc-100 truncate">${escapeHtml(name)}</h3>
          <p class="text-xs text-zinc-500 truncate">${escapeHtml(category)}</p>
          <div class="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
            <span>${rating}</span><span class="text-zinc-400">★</span>
            ${isNew ? `<span class="bg-blue-500/10 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>` : ''}
          </div>
        </div>
        <span class="bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 px-4 py-1 text-xs font-bold rounded-full select-none">MORE</span>
      </a>
    `;
  });

  let newsHtml = '';
  news.slice(0, 3).forEach(n => {
    newsHtml += `
      <a href="/news/${encodeURIComponent(getField(n, 'slug'))}" class="block p-4 bg-zinc-50 dark:bg-zinc-900 border border-black/5 rounded-xl text-left">
        <h4 class="font-bold text-sm text-zinc-900 dark:text-white leading-tight mb-1">${escapeHtml(getField(n, 'title'))}</h4>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">${escapeHtml(getField(n, 'description'))}</p>
      </a>
    `;
  });

  return `
    <div>
      <div class="text-center py-12 max-w-2xl mx-auto px-4">
        <h1 class="text-4xl font-extrabold text-zinc-900 dark:text-white mb-4">${escapeHtml(siteTitle)}</h1>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">${escapeHtml(desc)}</p>
      </div>
      <div class="grid lg:grid-cols-[2fr,1fr] gap-8">
        <div class="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-black/5 shadow-sm">
          <h2 class="text-xl font-bold mb-4 px-2 text-left">Popular E-Sports virtual clients</h2>
          <div class="flex flex-col">${appsHtml}</div>
        </div>
        <div class="space-y-6">
          <div class="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-black/5 shadow-sm">
            <h3 class="font-bold text-md mb-4 text-left">Latest Archives</h3>
            <div class="flex flex-col gap-3">${newsHtml}</div>
            <a href="/news" class="block text-xs font-bold text-blue-500 hover:underline mt-4 text-left">View All Updates →</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNewApps(apps: any[], settings: any) {
  let grid = '';
  const list = apps.filter(a => a.is_new === true || (a.is_new && a.is_new.booleanValue === true));
  const display = list.length > 0 ? list : apps;
  
  display.forEach(app => {
    const name = getField(app, 'name');
    const slug = getField(app, 'slug');
    const cat = getField(app, 'category');
    const rating = getField(app, 'rating', '5.0');
    const icon = getField(app, 'icon_url');
    
    grid += `
      <a href="/${encodeURIComponent(slug)}" class="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 text-center flex flex-col items-center">
        <img src="${icon || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&fit=crop'}" class="w-20 h-20 rounded-2xl object-cover mb-3 shadow-sm bg-white" alt="icon"/>
        <h3 class="font-bold text-sm text-zinc-900 dark:text-white truncate w-full">${escapeHtml(name)}</h3>
        <p class="text-xs text-zinc-500 mt-1 truncate w-full">${escapeHtml(cat)}</p>
        <span class="text-xs text-zinc-650 dark:text-zinc-400 mt-2 font-bold">${rating} ★</span>
      </a>
    `;
  });

  return `
    <div class="py-6">
      <h1 class="text-3xl font-extrabold mb-2 text-center text-zinc-900 dark:text-white">Verified New Additions</h1>
      <p class="text-sm text-zinc-500 text-center mb-8">Our latest verified client lists</p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">${grid}</div>
    </div>
  `;
}

function renderAppDetails(slug: string, apps: any[], settings: any) {
  const cleanSlug = decodeURIComponent(slug).toLowerCase();
  const app = apps.find(a => getField(a, 'slug').toLowerCase() === cleanSlug);
  if (!app) return `<div class="py-12 text-center"><h1 class="text-2xl font-bold mb-4">App Not Found</h1><a href="/" class="text-blue-500 hover:underline">Go Home</a></div>`;

  const name = getField(app, 'name');
  const cat = getField(app, 'category');
  const version = getField(app, 'version', 'Latest');
  const size = getField(app, 'file_size', 'Variable');
  const rating = getField(app, 'rating', '5.0');
  const icon = getField(app, 'icon_url');
  const desc = getField(app, 'description_html') || `<p>No comprehensive details are configured yet for ${escapeHtml(name)}.</p>`;
  const pkg = getField(app, 'package_name', 'Not published');

  return `
    <div class="py-6">
      <div class="flex flex-col items-center text-center pb-8 border-b border-black/5 mb-8">
        <img src="${icon || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&fit=crop'}" class="w-24 h-24 sm:w-32 sm:h-32 rounded-[22px] object-cover mb-4 shadow" alt="icon"/>
        <h1 class="text-3xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white leading-tight mb-2">${escapeHtml(name)}</h1>
        <div class="flex gap-2 text-xs font-semibold mb-6">
          <span class="bg-blue-50 px-2.5 py-1 rounded-full text-blue-600">${escapeHtml(cat)}</span>
          <span class="bg-green-50 px-2.5 py-1 rounded-full text-green-600">Verified Safety</span>
        </div>
        
        <div class="grid grid-cols-4 gap-2 w-full max-w-sm mb-6 text-center text-xs">
          <div class="p-2 border border-black/5 bg-zinc-50 rounded-xl"><span class="text-zinc-400 block pb-1 font-semibold text-[10px]">Version</span><strong>${escapeHtml(version)}</strong></div>
          <div class="p-2 border border-black/5 bg-zinc-50 rounded-xl"><span class="text-zinc-400 block pb-1 font-semibold text-[10px]">Size</span><strong>${escapeHtml(size)}</strong></div>
          <div class="p-2 border border-black/5 bg-zinc-50 rounded-xl"><span class="text-zinc-400 block pb-1 font-semibold text-[10px]">Type</span><strong>${escapeHtml(cat.split(',')[0])}</strong></div>
          <div class="p-2 border border-black/5 bg-zinc-50 rounded-xl"><span class="text-zinc-400 block pb-1 font-semibold text-[10px]">Rating</span><strong>${escapeHtml(rating)} ★</strong></div>
        </div>

        <a href="/info/${encodeURIComponent(slug)}" class="bg-blue-600 text-white font-bold py-4 px-10 rounded-2xl shadow hover:opacity-95">Install Direct Access Mirror 🚀</a>
      </div>

      <div class="grid md:grid-cols-[2fr,1fr] gap-8">
        <div class="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 shadow-sm text-left">
          <h2 class="text-lg font-bold mb-4">Detailed Game Review & Safe Guidelines</h2>
          <div class="prose dark:prose-invert text-zinc-650 leading-relaxed font-semibold">${desc}</div>
        </div>
        <div class="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 shadow-sm h-fit text-left">
          <h3 class="text-sm font-bold mb-4 uppercase tracking-wider text-zinc-400">Specifications</h3>
          <table class="w-full text-xs text-left">
            <tr class="border-b"><td class="py-2 text-zinc-400 font-semibold">Developer</td><td class="py-2 font-bold text-right text-zinc-900 dark:text-white">Store Certified</td></tr>
            <tr class="border-b"><td class="py-2 text-zinc-400 font-semibold">Package Name</td><td class="py-2 font-bold text-right text-zinc-900 dark:text-white truncate max-w-[150px]">${escapeHtml(pkg)}</td></tr>
            <tr class="border-b"><td class="py-2 text-zinc-400 font-semibold">Status</td><td class="py-2 font-bold text-right text-green-500">Safe & Clean</td></tr>
            <tr><td class="py-2 text-zinc-400 font-semibold">System Code</td><td class="py-2 font-bold text-right text-zinc-900 dark:text-white">Android / iOS</td></tr>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderGateway(slug: string, apps: any[], settings: any) {
  const cleanSlug = decodeURIComponent(slug).toLowerCase();
  const app = apps.find(a => getField(a, 'slug').toLowerCase() === cleanSlug);
  if (!app) return `<div class="py-12 text-center"><h1 class="text-2xl font-bold mb-4">No App Detected</h1><a href="/" class="text-blue-500 hover:underline">Return Home</a></div>`;

  const name = getField(app, 'name');
  const icon = getField(app, 'icon_url');
  
  return `
    <div class="max-w-xl mx-auto py-12 px-4 shadow-sm bg-white dark:bg-zinc-900 rounded-3xl border border-black/5">
      <div class="text-center">
        <img src="${icon || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&fit=crop'}" class="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border" alt="icon"/>
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white leading-snug mb-1">${escapeHtml(name)}</h1>
        <p class="text-xs text-zinc-400 uppercase tracking-widest font-black mb-6">Download Redirection Hub</p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold mb-8">You are accessing the download redirect portal to initiate the application package extraction on your device. Ensure you have a stable network connection.</p>
        <a href="/" class="block w-full py-4 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold rounded-2xl">Download / Install Client</a>
        <a href="/${encodeURIComponent(slug)}" class="block text-xs font-semibold text-blue-500 hover:underline mt-4">Read Technical Security Description</a>
      </div>
    </div>
  `;
}

function renderNewsList(news: any[], settings: any) {
  let cards = '';
  news.forEach(n => {
    cards += `
      <a href="/news/${encodeURIComponent(getField(n, 'slug'))}" class="block p-6 bg-white dark:bg-zinc-900 border border-black/5 hover:border-blue-500/25 rounded-3xl transition text-left">
        <span class="text-[10px] font-bold text-zinc-400 uppercase">${escapeHtml(getField(n, 'created_at') || 'May 2026')}</span>
        <h3 class="text-xl font-bold mt-1 mb-2 text-zinc-900 dark:text-white leading-snug">${escapeHtml(getField(n, 'title'))}</h3>
        <p class="text-sm text-zinc-500 max-w-3xl line-clamp-2 leading-relaxed">${escapeHtml(getField(n, 'description'))}</p>
      </a>
    `;
  });
  return `<div class="py-6 text-center container max-w-3xl mx-auto"><h1 class="text-3xl font-extrabold mb-8 text-zinc-900 dark:text-white">Gaming News & Updates</h1><div class="flex flex-col gap-4">${cards || '<p class="text-zinc-400 py-10">No publications.</p>'}</div></div>`;
}

function renderNewsDetail(slug: string, news: any[], settings: any) {
  const cleanSlug = decodeURIComponent(slug).toLowerCase();
  const item = news.find(n => getField(n, 'slug').toLowerCase() === cleanSlug);
  if (!item) return `<div class="py-12 text-center"><h1 class="text-2xl font-bold">Failed to load article.</h1><a href="/news" class="text-blue-500 hover:underline">Go Back</a></div>`;
  
  const title = getField(item, 'title');
  const dateStr = getField(item, 'created_at') || 'May 2026';
  const author = getField(item, 'ceo_name', 'System Author');
  const content = getField(item, 'content') || getField(item, 'description', '');

  return `
    <article class="max-w-3xl mx-auto py-12 px-4 text-left">
      <header class="mb-6"><span class="text-xs text-zinc-400 uppercase font-bold">${dateStr} | By ${escapeHtml(author)}</span><h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 leading-tight">${escapeHtml(title)}</h1></header>
      <section class="prose dark:prose-invert text-zinc-700 leading-relaxed font-semibold">${content.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</section>
    </article>
  `;
}

function renderBlogsList(blogs: any[], settings: any) {
  let cards = '';
  blogs.forEach(b => {
    cards += `
      <a href="/blog/${encodeURIComponent(getField(b, 'slug'))}" class="block p-6 bg-white dark:bg-zinc-900 border border-black/5 hover:border-blue-500/25 rounded-3xl transition text-left">
        <span class="text-[10px] font-bold text-zinc-400 uppercase">${escapeHtml(getField(b, 'created_at') || 'May 2026')}</span>
        <h3 class="text-xl font-bold mt-1 mb-2 text-zinc-900 dark:text-white leading-snug">${escapeHtml(getField(b, 'title'))}</h3>
        <p class="text-sm text-zinc-500 max-w-3xl line-clamp-2 leading-relaxed">${escapeHtml(stripHtml(getField(b, 'excerpt') || getField(b, 'content', '').substring(0, 140)))}</p>
      </a>
    `;
  });
  return `<div class="py-6 text-center container max-w-3xl mx-auto"><h1 class="text-3xl font-extrabold mb-8 text-zinc-900 dark:text-white">Strategy Guides & Analysis</h1><div class="flex flex-col gap-4">${cards || '<p class="text-zinc-400 py-10">No strategy posts.</p>'}</div></div>`;
}

function renderBlogDetail(slug: string, blogs: any[], settings: any) {
  const cleanSlug = decodeURIComponent(slug).toLowerCase();
  const item = blogs.find(b => getField(b, 'slug').toLowerCase() === cleanSlug);
  if (!item) return `<div class="py-12 text-center"><h1 class="text-2xl font-bold">Failed to load guide.</h1><a href="/blogs" class="text-blue-500 hover:underline">Go Back</a></div>`;
  
  const title = getField(item, 'title');
  const dateStr = getField(item, 'created_at') || 'May 2026';
  const author = getField(item, 'author', 'System Author');
  const content = getField(item, 'content', '');

  return `
    <article class="max-w-3xl mx-auto py-12 px-4 text-left">
      <header class="mb-6"><span class="text-xs text-zinc-400 uppercase font-bold">${dateStr} | Strategy by ${escapeHtml(author)}</span><h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 leading-tight">${escapeHtml(title)}</h1></header>
      <section class="prose dark:prose-invert text-zinc-700 leading-relaxed font-semibold">${content.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</section>
    </article>
  `;
}

function renderVideosList(videos: any[], settings: any) {
  let cards = '';
  videos.forEach(v => {
    const title = getField(v, 'title');
    const slug = getField(v, 'slug');
    const desc = getField(v, 'description','');
    cards += `
      <a href="/videos/${encodeURIComponent(slug)}" class="block p-4 border border-black/5 bg-white rounded-3xl text-left">
        <h3 class="font-bold text-lg text-zinc-900 truncate">${escapeHtml(title)}</h3>
        <p class="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">${escapeHtml(desc)}</p>
      </a>
    `;
  });
  return `<div class="py-6 text-center container max-w-3xl mx-auto"><h1 class="text-3xl font-extrabold mb-8 text-zinc-900 dark:text-white">Video Reviews</h1><div class="grid sm:grid-cols-3 gap-4">${cards || '<p class="text-zinc-400 py-10 col-span-full">No video guides.</p>'}</div></div>`;
}

function renderVideoDetail(slug: string, videos: any[], settings: any) {
  const cleanSlug = decodeURIComponent(slug).toLowerCase();
  const v = videos.find(item => getField(item, 'slug').toLowerCase() === cleanSlug);
  if (!v) return `<div class="py-12 text-center"><h1 class="text-2xl font-bold">Video not found.</h1><a href="/videos" class="text-blue-500 hover:underline">Go Back</a></div>`;
  const title = getField(v, 'title');
  const desc = getField(v, 'description');
  return `<div class="max-w-2xl mx-auto py-12 text-left"><h1 class="text-3xl font-extrabold mb-4">${escapeHtml(title)}</h1><p class="prose text-zinc-650 leading-relaxed font-semibold">${desc.replace(/\n\n/g, '<br/><br/>')}</p></div>`;
}

function renderAbout(settings: any) {
  const content = getField(settings, 'about_content') || 'About our Rummy verification services.';
  return `<div class="max-w-3xl mx-auto py-12 text-left bg-white p-8 rounded-3xl border border-black/5"><h1 class="text-4xl font-bold mb-6">About Us</h1><article class="prose text-zinc-750 leading-relaxed font-semibold">${content.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</article></div>`;
}

function renderContact(settings: any) {
  const content = getField(settings, 'contact_content') || 'Get in touch for active client files help.';
  const email = getField(settings, 'support_email', 'support@example.com');
  return `<div class="max-w-3xl mx-auto py-12 text-left bg-white p-8 rounded-3xl border border-black/5"><h1 class="text-4xl font-bold mb-6">Contact Us</h1><p class="prose mb-6 leading-relaxed font-semibold">${content}</p><div class="p-6 bg-zinc-50 rounded-2xl"><strong>Email support address:</strong><p class="text-blue-500 font-bold mt-1">${escapeHtml(email)}</p></div></div>`;
}

function renderPrivacy(settings: any) {
  const content = getField(settings, 'privacy_content') || 'No private data tracking.';
  return `<div class="max-w-3xl mx-auto py-12 text-left bg-white p-8 rounded-3xl border border-black/5"><h1 class="text-4xl font-bold mb-6">Privacy Policy</h1><article class="prose text-zinc-750 leading-relaxed font-semibold">${content.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</article></div>`;
}

function renderTerms(settings: any) {
  const content = getField(settings, 'terms_content') || 'Service code terms of compliance.';
  return `<div class="max-w-3xl mx-auto py-12 text-left bg-white p-8 rounded-3xl border border-black/5"><h1 class="text-4xl font-bold mb-6">Terms of Service</h1><article class="prose text-zinc-750 leading-relaxed font-semibold">${content.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</article></div>`;
}

function renderResponsibility(settings: any) {
  const content = getField(settings, 'responsibility_content') || 'Play safe for custom virtual entertainment.';
  return `<div class="max-w-3xl mx-auto py-12 text-left bg-white p-8 rounded-3xl border border-black/5"><h1 class="text-4xl font-bold mb-6">Responsible Gaming</h1><article class="prose text-zinc-750 leading-relaxed font-semibold">${content.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}</article></div>`;
}

function getSafeFirebaseConfig(): any {
  try {
    const config = getRawFirebaseConfig();
    if (!config) {
      return null;
    }
    
    // Check if the API key is empty/absent/placeholder or matches the empty system default api key
    const isApiKeyEmptyOrPlaceholder = 
      !config.apiKey || 
      config.apiKey.trim() === "" || 
      config.apiKey.includes("YOUR_API_KEY");
    
    if (isApiKeyEmptyOrPlaceholder) {
      // Use clean, anonymous placeholders so absolutely zero project-identifying domains (such as gen-lang-client-*) are ever leaked
      return {
        projectId: "placeholder-project-id",
        appId: "placeholder-app-id",
        apiKey: "PLACEHOLDER",
        authDomain: "placeholder-project.firebaseapp.com",
        firestoreDatabaseId: "(default)",
        storageBucket: "placeholder-project.firebasestorage.app",
        messagingSenderId: "000000000",
        measurementId: ""
      };
    }
    
    return config;
  } catch (error) {
    console.error('Error reading firebase config for safety masking:', error);
    return null;
  }
}

export async function injectSeoTags(template: string, urlPath: string, hostUrl?: string): Promise<string> {
  let data = await fetchStoreData();
  if (!data || !data.settings) return template;

  const apps = data.apps || [];
  const settings = data.settings || {};
  const news = data.news || [];
  const blogs = data.blogs || [];
  const videos = data.videos || [];
  const siteTitle = getField(settings, 'site_title');
  let title = siteTitle;
  let description = getField(settings, 'meta_description', '');
  let keywords = getField(settings, 'seo_keywords', '');
  let ogImage = getField(settings, 'logo_url', '');
  let author = siteTitle;
  
  if (urlPath.startsWith('/app/')) {
    const slug = decodeURIComponent(urlPath.split('/app/')[1].split('/')[0].split('?')[0]);
    const app = apps.find((a: any) => {
      const aSlug = getField(a, 'slug');
      return aSlug && aSlug.toLowerCase() === slug.toLowerCase();
    });
    
    if (app) {
      const appName = getField(app, 'name');
      title = `${getField(app, 'seo_title') || appName}`;
      const descHtml = getField(app, 'description_html');
      description = cleanSeoDescription(getField(app, 'seo_description')) || (descHtml ? stripHtml(descHtml).substring(0, 160) : '');
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
      const appName = getField(app, 'name');
      title = `${getField(app, 'seo_title') || appName} - Technical Info`;
      const descHtml = getField(app, 'description_html');
      description = cleanSeoDescription(getField(app, 'seo_description')) || (descHtml ? stripHtml(descHtml).substring(0, 160) : '');
      keywords = getField(app, 'seo_keywords');
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
      description = cleanSeoDescription(getField(newsItem, 'seo_description')) || (descHtml ? stripHtml(descHtml).substring(0, 160) : '');
      keywords = getField(newsItem, 'seo_keywords');
      ogImage = getField(newsItem, 'og_image_url') || getField(newsItem, 'logo_url') || ogImage;
      author = getField(newsItem, 'ceo_name') || siteTitle;
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
      description = cleanSeoDescription(getField(blogItem, 'seo_description')) || (descHtml ? stripHtml(descHtml).substring(0, 160) : '');
      keywords = getField(blogItem, 'seo_keywords');
      ogImage = getField(blogItem, 'cover_url') || ogImage;
      author = getField(blogItem, 'author') || siteTitle;
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
      description = cleanSeoDescription(getField(videoItem, 'seo_description')) || (descHtml ? stripHtml(descHtml).substring(0, 160) : '');
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
  } else {
    // Dynamic mapping for root-level routes
    const possibleSlug = decodeURIComponent(urlPath.replace(/^\/|\/$/g, '').split('?')[0]);
    if (possibleSlug && possibleSlug !== '') {
      const app = apps.find((a: any) => getField(a, 'slug')?.toLowerCase() === possibleSlug.toLowerCase());
      if (app) {
        const appName = getField(app, 'name', 'Rummy App');
        title = `${getField(app, 'seo_title') || appName} | ${siteTitle}`;
        const descHtml = getField(app, 'description_html');
        const fallbackDesc = `Download the verified ${appName} app instantly. Smooth gameplay, professional reviews, e-sports integration, and exclusive daily features.`;
        description = cleanSeoDescription(getField(app, 'seo_description')) || (descHtml ? stripHtml(descHtml).substring(0, 160) : fallbackDesc);
        keywords = getField(app, 'seo_keywords');
        ogImage = getField(app, 'og_image_url') || getField(app, 'icon_url') || ogImage;
      }
    }
  }

  const fallbackHost = hostUrl || 'https://rummystore.com';
  const cleanHost = fallbackHost.replace(/\/+$/, '');
  const absoluteUrl = `${cleanHost}${urlPath}`;

  let absoluteOgImage = ogImage;
  if (ogImage) {
    const trimmedOg = ogImage.trim();
    if (trimmedOg.startsWith('//')) {
      absoluteOgImage = `https:${trimmedOg}`;
    } else if (!trimmedOg.startsWith('http://') && !trimmedOg.startsWith('https://')) {
      const cleanImg = trimmedOg.startsWith('/') ? trimmedOg : `/${trimmedOg}`;
      absoluteOgImage = `${cleanHost}${cleanImg}`;
    } else {
      absoluteOgImage = trimmedOg;
    }
  }

  const faviconUrl = getField(settings, 'favicon_url');
  let absoluteFaviconUrl = faviconUrl;
  if (faviconUrl) {
    const trimmedFav = faviconUrl.trim();
    if (trimmedFav.startsWith('//')) {
      absoluteFaviconUrl = `https:${trimmedFav}`;
    } else if (!trimmedFav.startsWith('http://') && !trimmedFav.startsWith('https://')) {
      const cleanFav = trimmedFav.startsWith('/') ? trimmedFav : `/${trimmedFav}`;
      absoluteFaviconUrl = `${cleanHost}${cleanFav}`;
    } else {
      absoluteFaviconUrl = trimmedFav;
    }
  }

  const isAdmin = urlPath.startsWith(`/${getAdminPath()}`);

  // Construct replacement tags
  const tags = isAdmin ? `
    <title>Admin Portal</title>
    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
    ${absoluteFaviconUrl ? `
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    ` : ''}
  ` : `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ''}
    <meta name="author" content="${escapeHtml(author)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(absoluteUrl)}" />
    ${absoluteOgImage ? `<meta property="og:image" content="${escapeHtml(absoluteOgImage)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${absoluteOgImage ? `<meta name="twitter:image" content="${escapeHtml(absoluteOgImage)}" />` : ''}
    ${absoluteFaviconUrl ? `
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    ` : ''}
  `;

  // Regex to remove any existing <title>, OpenGraph and favicon tags
  let newTemplate = template.replace(/<title>.*?<\/title>/ims, '');
  newTemplate = newTemplate.replace(/<link[^>]*rel=["']?(icon|shortcut icon|apple-touch-icon)["']?[^>]*>/gims, '');
  newTemplate = newTemplate.replace(/<meta[^>]*(name|property)=["'](description|keywords|og:title|og:description|og:image|og:type|og:url|twitter:.*?)["'][^>]*>/gims, '');
  
  // Inject the safe/dynamic Firebase configuration into the window object to keep it entirely out of compiled JS assets.
  const safeFirebaseConfig = getSafeFirebaseConfig();
  const configScript = safeFirebaseConfig ? `
    <script id="firebase-config-loader">
      window.__FIREBASE_CONFIG__ = ${JSON.stringify(safeFirebaseConfig)};
    </script>
  ` : '';

  // Insert new tags and configuration before head close
  newTemplate = newTemplate.replace('</head>', `${configScript}${tags}</head>`);

  // Dynamically inject fully pre-rendered body content inside <div id="root"> for crawlers and indexers.
  // When the React client mounts, it will cleanly overwrite the markup with interactive components.
  try {
    const preRenderedBody = await getPagePreRender(urlPath, data);
    newTemplate = newTemplate.replace(/<div\s+id=["']root["']\s*>\s*<\/div>/ims, `<div id="root">${preRenderedBody}</div>`);
  } catch (renderErr) {
    console.error("Static pre-rendering body injection failed:", renderErr);
  }
  
  return newTemplate;
}
