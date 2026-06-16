import fs from "fs";
import path from "path";
import { getRawFirebaseConfig } from "./firebaseHelper.js";

let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 3600000;
let isFetchingStoreData = false;

function parseFirestoreValue(value: any): any {
  if (!value) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return parseInt(value.integerValue, 10);
  if ("doubleValue" in value) return parseFloat(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("arrayValue" in value) {
    const list = value.arrayValue.values || [];
    return list.map((item: any) => parseFirestoreValue(item));
  }
  if ("mapValue" in value) {
    const fields = value.mapValue.fields || {};
    const obj: any = {};
    for (const key of Object.keys(fields)) {
      obj[key] = parseFirestoreValue(fields[key]);
    }
    return obj;
  }
  return null;
}

export function getField(obj: any, key: string, fallback = ""): string {
  if (!obj) return fallback;
  const value = obj[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value === "object") {
    if ("stringValue" in value) return value.stringValue ?? fallback;
    if ("integerValue" in value) return String(value.integerValue) ?? fallback;
    if ("booleanValue" in value) return String(value.booleanValue) ?? fallback;
    return fallback;
  }
  return String(value);
}

export async function fetchStoreData() {
  const now = Date.now();
  const isStale = now - lastFetchTime > CACHE_TTL;
  const isSuperStale = now - lastFetchTime > CACHE_TTL * 15;

  if (cachedData && !isSuperStale) {
    if (isStale && !isFetchingStoreData) {
      doFetchStoreData().catch((e) =>
        console.warn("Background store fetch failed:", e)
      );
    }
    return cachedData;
  }

  return await doFetchStoreData();
}

async function doFetchStoreData() {
  const now = Date.now();

  let localFullBackup: any = null;
  try {
    const fullBackupPath = path.join(
      process.cwd(),
      "src/lib/staticDataFull.json"
    );
    if (fs.existsSync(fullBackupPath)) {
      localFullBackup = JSON.parse(fs.readFileSync(fullBackupPath, "utf8"));
    }
  } catch (e) {
    console.warn("Failed to read staticDataFull.json:", e);
  }

  const emptyFallback = { apps: [], settings: {}, news: [], blogs: [], videos: [] };

  let config: any;
  try {
    config = getRawFirebaseConfig();
  } catch {
    cachedData = localFullBackup || emptyFallback;
    lastFetchTime = now;
    return cachedData;
  }

  const isApiKeyEmptyOrPlaceholder =
    !config.apiKey ||
    config.apiKey.trim() === "" ||
    config.apiKey.includes("YOUR_API_KEY");

  if (isApiKeyEmptyOrPlaceholder) {
    cachedData = localFullBackup || emptyFallback;
    lastFetchTime = now;
    return cachedData;
  }

  if (isFetchingStoreData) {
    return cachedData || emptyFallback;
  }

  try {
    isFetchingStoreData = true;
    const cacheHeaders = { "Cache-Control": "no-cache", Pragma: "no-cache" };
    const apiSuffix = config.apiKey ? `?key=${config.apiKey}` : "";
    const db = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;

    const [settingsRes, newsRes, blogsRes, videosRes, metaRes] =
      await Promise.all([
        fetch(`${db}/store_data/settings${apiSuffix}`, {
          headers: cacheHeaders,
          signal: AbortSignal.timeout(8000),
        }).catch(() => null),
        fetch(`${db}/store_data/news${apiSuffix}`, {
          headers: cacheHeaders,
          signal: AbortSignal.timeout(8000),
        }).catch(() => null),
        fetch(`${db}/store_data/blogs${apiSuffix}`, {
          headers: cacheHeaders,
          signal: AbortSignal.timeout(8000),
        }).catch(() => null),
        fetch(`${db}/store_data/videos${apiSuffix}`, {
          headers: cacheHeaders,
          signal: AbortSignal.timeout(8000),
        }).catch(() => null),
        fetch(`${db}/store_data/apps_meta${apiSuffix}`, {
          headers: cacheHeaders,
          signal: AbortSignal.timeout(8000),
        }).catch(() => null),
      ]);

    const isErrorStatus = (res: any) => {
      if (!res) return true;
      if (!res.ok && res.status !== 404) return true;
      return false;
    };

    if (
      isErrorStatus(settingsRes) ||
      isErrorStatus(metaRes) ||
      isErrorStatus(newsRes) ||
      isErrorStatus(blogsRes) ||
      isErrorStatus(videosRes)
    ) {
      throw new Error(
        `Database fetch failed: settings=${settingsRes?.status || "fail"}, meta=${metaRes?.status || "fail"}`
      );
    }

    let numChunks = 5;
    if (metaRes && metaRes.ok) {
      const metaData = await metaRes.json() as any;
      if (metaData?.fields?.numChunks?.integerValue) {
        numChunks = parseInt(metaData.fields.numChunks.integerValue, 10) || 5;
      }
    }

    const chunkResults = await Promise.all(
      Array.from({ length: numChunks }).map((_, i) =>
        fetch(`${db}/store_data/apps_chunk_${i}${apiSuffix}`, {
          headers: cacheHeaders,
          signal: AbortSignal.timeout(8000),
        })
          .then((res) => (res.ok ? res.json() as Promise<any> : null))
          .catch(() => null)
      )
    );

    let apps: any[] = [];
    for (const chunkData of chunkResults) {
      if (chunkData?.fields?.items?.arrayValue?.values) {
        apps = apps.concat(
          chunkData.fields.items.arrayValue.values.map((v: any) =>
            parseFirestoreValue(v)
          )
        );
      }
    }

    apps = apps.map((app) => {
      delete app.more_information_url;
      delete app.encrypted_download_url;
      delete app.download_url;
      return app;
    });

    const settingsData: any =
      settingsRes && settingsRes.ok ? await settingsRes.json() : null;
    let settings =
      settingsData?.fields
        ? parseFirestoreValue({ mapValue: { fields: settingsData.fields } })
        : {};
    if (!settings || Object.keys(settings).length === 0) settings = {};

    const newsData: any =
      newsRes && newsRes.ok ? await newsRes.json() : null;
    const news: any[] =
      newsData?.fields?.items?.arrayValue?.values?.map((v: any) =>
        parseFirestoreValue(v)
      ) || [];

    const blogsData: any =
      blogsRes && blogsRes.ok ? await blogsRes.json() : null;
    const blogs: any[] =
      blogsData?.fields?.items?.arrayValue?.values?.map((v: any) =>
        parseFirestoreValue(v)
      ) || [];

    const videosData: any =
      videosRes && videosRes.ok ? await videosRes.json() : null;
    const videos: any[] =
      videosData?.fields?.items?.arrayValue?.values?.map((v: any) =>
        parseFirestoreValue(v)
      ) || [];

    cachedData = { apps, settings, news, blogs, videos };
    lastFetchTime = now;
    return cachedData;
  } catch (error: any) {
    console.warn("Failed to fetch store data (using fallback):", error.message);
    const fallback = localFullBackup || emptyFallback;
    if (!cachedData) cachedData = fallback;
    return cachedData || fallback;
  } finally {
    isFetchingStoreData = false;
  }
}
