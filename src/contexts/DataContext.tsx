import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import { AppConfig, GlobalSettings, NewsItem, BlogPost, VideoItem } from '../lib/staticData';
import { GitConfig, generateStaticDataFileCode, commitFileToGitHub } from '../lib/githubSync';
import { secureStorage } from '../lib/secureStorage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const user = auth.currentUser;
  const userEmail = user?.email || 'Anonymous/Not logged in';
  const userId = user?.uid || 'No UID';
  
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: userId,
      email: userEmail,
      emailVerified: user?.emailVerified,
      isAnonymous: user?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', errInfo);
  
  if (errorMessage.includes('permissions') || errorMessage.includes('permission-denied')) {
    const dbId = (auth.app.options as any).projectId;
    const fullMsg = `Permission Denied!
Path: ${path}
Op: ${operationType}
User: ${userEmail} (${userId})
Verified: ${user?.emailVerified}
Project: ${dbId}
Raw Error: ${errorMessage}`;
    
    console.warn(`PERMISSION DENIED DEBUG: ${fullMsg}`);
    throw new Error(fullMsg);
  }
  
  throw new Error(errorMessage);
}

// Providing fallback data immediately helps avoid layout shifts
import { mockApps, mockSettings, mockNews, mockBlogs, mockVideos } from '../lib/staticData';

interface DataContextType {
  apps: AppConfig[];
  settings: GlobalSettings;
  news: NewsItem[];
  blogs: BlogPost[];
  videos: VideoItem[];
  loading: boolean;
  loadedFromServer: boolean;
  appsSyncedWithServer: boolean;
  settingsSyncedWithServer: boolean;
  newsSyncedWithServer: boolean;
  blogsSyncedWithServer: boolean;
  videosSyncedWithServer: boolean;
  serverAppsFetched: boolean;
  serverNewsFetched: boolean;
  serverBlogsFetched: boolean;
  serverVideosFetched: boolean;
  syncVersion: number;
  lastSyncTime: string | null;
  refreshAll: (silent?: boolean) => Promise<void>;
  testCloudConnection: () => Promise<boolean>;
  saveApps: (apps: AppConfig[]) => Promise<void>;
  saveSettings: (settings: GlobalSettings) => Promise<void>;
  saveNews: (news: NewsItem[]) => Promise<void>;
  saveBlogs: (blogs: BlogPost[]) => Promise<void>;
  saveVideos: (videos: VideoItem[]) => Promise<void>;
  isConnected: boolean | null;
  isLive: boolean;
  
  // GitHub Integration States & Methods
  gitConfig: GitConfig | null;
  gitConfigLoading: boolean;
  saveGitConfig: (config: GitConfig) => Promise<void>;
  pushAllToGitHub: (customConfig?: GitConfig) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const initialData = (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__) || null;

  const [apps, setApps] = useState<AppConfig[]>(() => {
    if (initialData?.apps && initialData.apps.length > 0) return initialData.apps;
    try {
      const cached = secureStorage.getItem('rummystore_apps');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    if (initialData?.settings && initialData.settings.site_title) return initialData.settings;
    try {
      const cached = secureStorage.getItem('rummystore_settings');
      return cached ? JSON.parse(cached) : {
        site_title: "",
        meta_description: "",
        logo_url: "",
        favicon_url: "",
        helpline_whatsapp: "",
        helpline_telegram: "",
        support_email: "",
        disclaimer_text: "",
        ethics_discrimination_text: "",
        ticker_text: "",
        animations_enabled: true,
        categories: [],
        banners: []
      };
    } catch {
      return {
        site_title: "",
        meta_description: "",
        logo_url: "",
        favicon_url: "",
        helpline_whatsapp: "",
        helpline_telegram: "",
        support_email: "",
        disclaimer_text: "",
        ethics_discrimination_text: "",
        ticker_text: "",
        animations_enabled: true,
        categories: [],
        banners: []
      };
    }
  });
  const [news, setNews] = useState<NewsItem[]>(() => {
    if (initialData?.news && initialData.news.length > 0) return initialData.news;
    try {
      const cached = secureStorage.getItem('rummystore_news');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    if (initialData?.blogs && initialData.blogs.length > 0) return initialData.blogs;
    try {
      const cached = secureStorage.getItem('rummystore_blogs');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    if (initialData?.videos && initialData.videos.length > 0) return initialData.videos;
    try {
      const cached = secureStorage.getItem('rummystore_videos');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  // Fast persistent loading state management - initialized dynamically based on cache
  const [loading, setLoading] = useState(() => {
    if (initialData?.apps && initialData.apps.length > 0) return false;
    try {
      const cachedApps = secureStorage.getItem('rummystore_apps');
      return !cachedApps || cachedApps === '[]';
    } catch {
      return true;
    }
  });
  
  useEffect(() => {
    if (apps && apps.length > 0) setLoading(false);
  }, [apps]);
  
  const [loadedFromServer, setLoadedFromServer] = useState(() => {
    if (initialData) return true;
    try {
      return !!secureStorage.getItem('rummystore_apps');
    } catch {
      return false;
    }
  });
  const [appsSyncedWithServer, setAppsSyncedWithServer] = useState(() => {
    if (initialData?.apps) return true;
    try {
      return !!secureStorage.getItem('rummystore_apps');
    } catch {
      return false;
    }
  });
  const [settingsSyncedWithServer, setSettingsSyncedWithServer] = useState(() => {
    if (initialData?.settings) return true;
    try {
      return !!secureStorage.getItem('rummystore_settings');
    } catch {
      return false;
    }
  });
  const [newsSyncedWithServer, setNewsSyncedWithServer] = useState(() => {
    if (initialData?.news) return true;
    try {
      return !!secureStorage.getItem('rummystore_news');
    } catch {
      return false;
    }
  });
  const [blogsSyncedWithServer, setBlogsSyncedWithServer] = useState(() => {
    if (initialData?.blogs) return true;
    try {
      return !!secureStorage.getItem('rummystore_blogs');
    } catch {
      return false;
    }
  });
  const [videosSyncedWithServer, setVideosSyncedWithServer] = useState(() => {
    if (initialData?.videos) return true;
    try {
      return !!secureStorage.getItem('rummystore_videos');
    } catch {
      return false;
    }
  });

  const [serverAppsFetched, setServerAppsFetched] = useState(() => {
    try {
      return !!secureStorage.getItem('rummystore_apps');
    } catch {
      return false;
    }
  });
  const [serverNewsFetched, setServerNewsFetched] = useState(() => {
    try {
      return !!secureStorage.getItem('rummystore_news');
    } catch {
      return false;
    }
  });
  const [serverBlogsFetched, setServerBlogsFetched] = useState(() => {
    try {
      return !!secureStorage.getItem('rummystore_blogs');
    } catch {
      return false;
    }
  });
  const [serverVideosFetched, setServerVideosFetched] = useState(() => {
    try {
      return !!secureStorage.getItem('rummystore_videos');
    } catch {
      return false;
    }
  });
  
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(new Date().toLocaleTimeString());

  // GitHub Integration States
  const [gitConfig, setGitConfig] = useState<GitConfig | null>(null);
  const [gitConfigLoading, setGitConfigLoading] = useState(false);

  // Load GitHub config on admin session auth via secure server-side lookup
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        let isAuthorized = false;

        try {
          const idToken = await currentUser.getIdToken();
          const verifyRes = await fetch('/api/v1/admin/verify', {
            headers: {
              'Authorization': `Bearer ${idToken}`
            }
          });
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (verifyData.authorized) {
              isAuthorized = true;
            }
          }
        } catch (e) {
          console.warn("Server admin verification for GitHub context failed:", e);
        }

        if (isAuthorized) {
          setGitConfigLoading(true);
          try {
            const configDoc = doc(db, 'sec_git', 'cfg');
            const snap = await getDoc(configDoc);
            if (snap.exists()) {
              setGitConfig(snap.data() as GitConfig);
            }
          } catch (err) {
            console.warn("Secure GitHub configuration read bypassed or not initialized:", err);
          } finally {
            setGitConfigLoading(false);
          }
        } else {
          setGitConfig(null);
        }
      } else {
        setGitConfig(null);
      }
    });

    return () => unsubAuth();
  }, []);

  // Helper to ensure writes hit the server
  const withServerConfirmation = React.useCallback(async (operation: () => Promise<any>, timeoutMs: number = 20000) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Cloud Sync Timeout: The update is taking a while to reach the server. This happens on slow connections. Changes usually sync eventually. (Note: You can try manually syncing from the header status indicator)")), timeoutMs)
    );
    return Promise.race([operation(), timeoutPromise]);
  }, []);

  useEffect(() => {
    const loadedDocs = {
      apps: false,
      settings: false,
      news: false,
      blogs: false,
      videos: false
    };

    const checkLoaded = (docName: keyof typeof loadedDocs) => {
      loadedDocs[docName] = true;
      if (loadedDocs.apps && loadedDocs.settings) {
        setLoading(false);
      }
      if (loadedDocs.apps && loadedDocs.settings && loadedDocs.news && loadedDocs.blogs && loadedDocs.videos) {
        setLoadedFromServer(true);
      }
    };

    // Safety fallback - prevent any hanging sync loops after max 400ms
    const timeout = setTimeout(() => {
      setLoading(false);
      setLoadedFromServer(true);
    }, 400);

    // Fast sync fallback for deep links (especially new apps not in cache) - set to 400ms for snappy visual performance
    const syncTimeout = setTimeout(() => {
      setLoadedFromServer(true);
      setAppsSyncedWithServer(true);
      setSettingsSyncedWithServer(true);
      setNewsSyncedWithServer(true);
      setBlogsSyncedWithServer(true);
      setVideosSyncedWithServer(true);
      
      setServerAppsFetched(true);
      setServerNewsFetched(true);
      setServerBlogsFetched(true);
      setServerVideosFetched(true);
      setLoading(false);
    }, 400);

    const checkConnection = async () => {
      if (!isFirebaseConfigured) {
          setIsConnected(false);
          setLoadedFromServer(true);
          setLoading(false);
          return;
      }
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setIsConnected(false);
          setLoadedFromServer(true); // default to True if offline/stuck
          setAppsSyncedWithServer(true);
          setSettingsSyncedWithServer(true);
          setNewsSyncedWithServer(true);
          setBlogsSyncedWithServer(true);
          setVideosSyncedWithServer(true);
          
          setServerAppsFetched(true);
          setServerNewsFetched(true);
          setServerBlogsFetched(true);
          setServerVideosFetched(true);
          setLoading(false);
          return;
        }

        const testDoc = doc(db, 'store_data', 'connectivity_test');
        // Use soft cached getDoc instead of getDocFromServer to avoid active network error logs
        await getDoc(testDoc);
        setIsConnected(true);
      } catch (err: any) {
        // Only set disconnected if we are sure
        const errMsg = err.message || '';
        const errCode = err.code || '';
        if (errMsg.includes('offline') || errCode === 'unavailable' || errCode === 'permission-denied') {
          setIsConnected(false);
          setLoadedFromServer(true); // default to True if offline/stuck
          setAppsSyncedWithServer(true);
          setSettingsSyncedWithServer(true);
          setNewsSyncedWithServer(true);
          setBlogsSyncedWithServer(true);
          setVideosSyncedWithServer(true);
          
          setServerAppsFetched(true);
          setServerNewsFetched(true);
          setServerBlogsFetched(true);
          setServerVideosFetched(true);
          setLoading(false);
        }
      }
    };

    checkConnection();
    const connInterval = setInterval(checkConnection, 60000);

    if (!isFirebaseConfigured) {
        return () => {
            if (timeout) clearTimeout(timeout);
            clearTimeout(syncTimeout);
            clearInterval(connInterval);
        };
    }

    const unsubs = [
      onSnapshot(doc(db, 'store_data', 'apps_meta'), async (snap) => {
        if (snap.metadata.fromCache && (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__)) return;
        let loadedApps: any[] = [];
        let fetchedData = false;
        
        if (snap.exists()) {
          const numChunks = snap.data().numChunks || 1;
          const fetchPromises = [];
          for (let i = 0; i < numChunks; i++) {
            fetchPromises.push((async () => {
              try {
                const chunkSnap = await getDoc(doc(db, 'store_data', `apps_chunk_${i}`));
                if (chunkSnap.exists() && chunkSnap.data().items) {
                  return chunkSnap.data().items;
                }
              } catch (err) {
                console.warn(`Failed to fetch chunk ${i} explicitly from server, falling back to cache`, err);
                try {
                  const localChunkSnap = await getDoc(doc(db, 'store_data', `apps_chunk_${i}`));
                  if (localChunkSnap.exists() && localChunkSnap.data().items) return localChunkSnap.data().items;
                } catch (e) { }
              }
              return [];
            })());
          }
          const chunkResults = await Promise.all(fetchPromises);
          chunkResults.forEach(items => loadedApps.push(...items));
          fetchedData = true;
        } else {
          // Fallback to old apps document
          try {
            const oldSnap = await getDoc(doc(db, 'store_data', 'apps'));
            if (oldSnap.exists() && oldSnap.data().items) {
              loadedApps = oldSnap.data().items;
              fetchedData = true;
            }
          } catch (err) {
            console.warn("Failed to fetch legacy apps document", err);
          }
        }
        
        if (fetchedData) {
          const data = loadedApps.map((app: any) => {
            delete app.more_information_url;
            delete app.encrypted_download_url;
            delete app.download_url;
            return app;
          });
          setApps(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          secureStorage.setItem('rummystore_apps', JSON.stringify(data));
          
          setAppsSyncedWithServer(true);
          setServerAppsFetched(true);
          setLoadedFromServer(true);
          
          if (!snap.metadata.fromCache) {
            setIsConnected(true);
            setIsLive(true);
            setLastSyncTime(new Date().toLocaleTimeString());
          }
          checkLoaded('apps');
        } else {
          setApps([]);
          secureStorage.setItem('rummystore_apps', JSON.stringify([]));
          setAppsSyncedWithServer(true);
          setServerAppsFetched(true);
          setLoadedFromServer(true);
          checkLoaded('apps');
        }
      }, (err) => {
        console.warn("Firestore apps listener error, falling back:", err);
        setAppsSyncedWithServer(true);
        setServerAppsFetched(true);
        setLoadedFromServer(true);
        checkLoaded('apps');
      }),
      onSnapshot(doc(db, 'store_data', 'settings'), (snap) => {
        if (snap.metadata.fromCache && (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__)) return;
        if (snap.exists()) {
          const data = snap.data() as GlobalSettings;
          setSettings(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          secureStorage.setItem('rummystore_settings', JSON.stringify(data));
          
          setSettingsSyncedWithServer(true);
          setLoadedFromServer(true);
          
          if (!snap.metadata.fromCache) {
            setIsConnected(true);
            setIsLive(true);
          }
        } else {
          setSettingsSyncedWithServer(true);
          setLoadedFromServer(true);
        }
        checkLoaded('settings');
      }, (err) => {
        console.warn("Firestore settings listener error, falling back:", err);
        setSettingsSyncedWithServer(true);
        setLoadedFromServer(true);
        checkLoaded('settings');
      }),
      onSnapshot(doc(db, 'store_data', 'news'), (snap) => {
        if (snap.metadata.fromCache && (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__)) return;
        if (snap.exists()) {
          const data = snap.data().items || [];
          setNews(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          secureStorage.setItem('rummystore_news', JSON.stringify(data));
          
          setNewsSyncedWithServer(true);
          setServerNewsFetched(true);
          
          checkLoaded('news');
        } else {
          setNews([]);
          secureStorage.setItem('rummystore_news', JSON.stringify([]));
          setNewsSyncedWithServer(true);
          setServerNewsFetched(true);
          checkLoaded('news');
        }
      }, (err) => {
        console.warn("Firestore news listener error, falling back:", err);
        setNewsSyncedWithServer(true);
        setServerNewsFetched(true);
        checkLoaded('news');
      }),
      onSnapshot(doc(db, 'store_data', 'blogs'), (snap) => {
        if (snap.metadata.fromCache && (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__)) return;
        if (snap.exists()) {
          const data = snap.data().items || [];
          setBlogs(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          secureStorage.setItem('rummystore_blogs', JSON.stringify(data));
          
          setBlogsSyncedWithServer(true);
          setServerBlogsFetched(true);
          
          checkLoaded('blogs');
        } else {
          setBlogs([]);
          secureStorage.setItem('rummystore_blogs', JSON.stringify([]));
          setBlogsSyncedWithServer(true);
          setServerBlogsFetched(true);
          checkLoaded('blogs');
        }
      }, (err) => {
        console.warn("Firestore blogs listener error, falling back:", err);
        setBlogsSyncedWithServer(true);
        setServerBlogsFetched(true);
        checkLoaded('blogs');
      }),
      onSnapshot(doc(db, 'store_data', 'videos'), (snap) => {
        if (snap.metadata.fromCache && (typeof window !== 'undefined' && (window as any).__INITIAL_DATA__)) return;
        if (snap.exists()) {
          const data = snap.data().items || [];
          setVideos(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          secureStorage.setItem('rummystore_videos', JSON.stringify(data));
          
          setVideosSyncedWithServer(true);
          setServerVideosFetched(true);
          
          checkLoaded('videos');
        } else {
          setVideos([]);
          secureStorage.setItem('rummystore_videos', JSON.stringify([]));
          setVideosSyncedWithServer(true);
          setServerVideosFetched(true);
          checkLoaded('videos');
        }
      }, (err) => {
        console.warn("Firestore videos listener error, falling back:", err);
        setVideosSyncedWithServer(true);
        setServerVideosFetched(true);
        checkLoaded('videos');
      })
    ];

    return () => {
      unsubs.forEach(u => u());
      if (timeout) clearTimeout(timeout);
      clearTimeout(syncTimeout);
      clearInterval(connInterval);
    };
  }, []);

  // Memoized actions to prevent re-renders in children
  const saveApps = React.useCallback(async (newApps: AppConfig[]) => {
    // 1. Snappy optimistic update to local state and local memory first
    setApps(newApps);
    secureStorage.setItem('rummystore_apps', JSON.stringify(newApps));

    try {
      console.log("Cloud: Pushing Apps update in chunks...");
      const CHUNK_SIZE = 25; // number of apps per document
      const numChunks = Math.ceil(newApps.length / CHUNK_SIZE) || 1;
      const now = new Date().toISOString();
      
      for (let i = 0; i < numChunks; i++) {
        const chunk = JSON.parse(JSON.stringify(newApps.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)));
        chunk.forEach((app: any) => { 
          delete app.more_information_url; 
          delete app.encrypted_download_url;
          delete app.download_url;
        });
        await setDoc(doc(db, 'store_data', `apps_chunk_${i}`), { items: chunk });
      }
      
      const metaRef = doc(db, 'store_data', 'apps_meta');
      await setDoc(metaRef, { numChunks, last_updated: now });
      
      // Save secure links mapping separately (fully encrypted to prevent read-leak of download URLs)
      const secureLinks = newApps.map(a => ({ id: a.id, url: a.more_information_url || '' }));
      let encryptedData = '';
      try {
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken();
        const encRes = await fetch('/api/v1/admin/encrypt-links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ items: secureLinks })
        });
        if (encRes.ok) {
          const encJSON = await encRes.json();
          encryptedData = encJSON.encrypted;
        } else {
          const errText = await encRes.text();
          console.warn("Server encryption of secure links failed:", errText);
          alert(`Server encryption of secure links failed: ${errText}`);
        }
      } catch (encErr: any) {
        console.error("Encryption of secure links on save failed, falling back to plaintext compatibility", encErr);
        alert(`Encryption of secure links on save failed: ${encErr.message}`);
      }

      if (encryptedData) {
        await setDoc(doc(db, 'store_data', 'secure_links'), { encryptedData });
      } else {
        console.error("Skipping secure_links update due to encryption failure to prevent data leak.");
        throw new Error("Link encryption failed. Check network or auth token.");
      }
      
      console.log("Cloud: Apps update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged for Apps updates...");
        // This generate static data will automatically scrub the more_information_url for security
        const updatedCode = generateStaticDataFileCode(newApps, settings, news, blogs, videos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/staticData.ts',
          content: updatedCode,
          message: `Admin Release: Added/Updated apps catalog`
        }).catch(err => console.error("Background auto-sync commit failed:", err));
      }
    } catch (err: any) {
      console.error("Save Apps Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/apps');
    }
  }, [gitConfig, settings, news, blogs, videos]);

  const saveSettings = React.useCallback(async (newSettings: GlobalSettings) => {
    const now = new Date().toISOString();
    const settingsWithTime = { ...newSettings, last_updated: now };

    // 1. Snappy optimistic update to local state and local memory first
    setSettings(settingsWithTime);
    secureStorage.setItem('rummystore_settings', JSON.stringify(settingsWithTime));

    try {
      const docRef = doc(db, 'store_data', 'settings');
      console.log("Cloud: Pushing Settings update...");
      await setDoc(docRef, settingsWithTime);
      console.log("Cloud: Settings update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged for Settings updates...");
        const updatedCode = generateStaticDataFileCode(apps, settingsWithTime, news, blogs, videos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/staticData.ts',
          content: updatedCode,
          message: `Admin Release: Updated platform configurations`
        }).catch(err => console.error("Background auto-sync commit failed:", err));
      }
    } catch (err: any) {
      console.error("Save Settings Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/settings');
    }
  }, [gitConfig, apps, news, blogs, videos]);

  const saveNews = React.useCallback(async (newNews: NewsItem[]) => {
    // 1. Snappy optimistic update to local state and local memory first
    setNews(newNews);
    secureStorage.setItem('rummystore_news', JSON.stringify(newNews));

    try {
      const docRef = doc(db, 'store_data', 'news');
      console.log("Cloud: Pushing News update...");
      await setDoc(docRef, { items: newNews });
      console.log("Cloud: News update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged for News updates...");
        const updatedCode = generateStaticDataFileCode(apps, settings, newNews, blogs, videos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/staticData.ts',
          content: updatedCode,
          message: `Admin Release: Added/Updated news indexes`
        }).catch(err => console.error("Background auto-sync commit failed:", err));
      }
    } catch (err: any) {
      console.error("Save News Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/news');
    }
  }, [gitConfig, apps, settings, blogs, videos]);

  const saveBlogs = React.useCallback(async (newBlogs: BlogPost[]) => {
    // 1. Snappy optimistic update to local state and local memory first
    setBlogs(newBlogs);
    secureStorage.setItem('rummystore_blogs', JSON.stringify(newBlogs));

    try {
      const docRef = doc(db, 'store_data', 'blogs');
      console.log("Cloud: Pushing Blogs update...");
      await setDoc(docRef, { items: newBlogs });
      console.log("Cloud: Blogs update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged for Blogs updates...");
        const updatedCode = generateStaticDataFileCode(apps, settings, news, newBlogs, videos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/staticData.ts',
          content: updatedCode,
          message: `Admin Release: Added/Updated blog posts`
        }).catch(err => console.error("Background auto-sync commit failed:", err));
      }
    } catch (err: any) {
      console.error("Save Blogs Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/blogs');
    }
  }, [gitConfig, apps, settings, news, videos]);

  const saveVideos = React.useCallback(async (newVideos: VideoItem[]) => {
    // 1. Snappy optimistic update to local state and local memory first
    setVideos(newVideos);
    secureStorage.setItem('rummystore_videos', JSON.stringify(newVideos));

    try {
      const docRef = doc(db, 'store_data', 'videos');
      console.log("Cloud: Pushing Videos update...");
      await setDoc(docRef, { items: newVideos });
      console.log("Cloud: Videos update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged for Videos updates...");
        const updatedCode = generateStaticDataFileCode(apps, settings, news, blogs, newVideos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/staticData.ts',
          content: updatedCode,
          message: `Admin Release: Added/Updated video listings`
        }).catch(err => console.error("Background auto-sync commit failed:", err));
      }
    } catch (err: any) {
      console.error("Save Videos Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/videos');
    }
  }, [gitConfig, apps, settings, news, blogs]);

  const saveGitConfig = React.useCallback(async (newConfig: GitConfig) => {
    try {
      const docRef = doc(db, 'sec_git', 'cfg');
      console.log("Cloud: Pushing Git Configuration update...");
      await setDoc(docRef, newConfig);
      setGitConfig(newConfig);
      console.log("Cloud: Git Configuration saved successfully.");
    } catch (err) {
      console.error("Save Git Config Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'sec_git/cfg');
    }
  }, []);

  const pushAllToGitHub = React.useCallback(async (customConfig?: GitConfig, onProgress?: (msg: string) => void) => {
    const configToUse = customConfig || gitConfig;
    if (!configToUse) {
      throw new Error("GitHub synchronization is not configured.");
    }
    const log = (msg: string) => {
      console.log(msg);
      if (onProgress) onProgress(msg);
    };

    log("GitHub Sync: Manually pushing all static data to repository...");
    log("GitHub Sync: Generating secure payload...");
    const updatedCode = generateStaticDataFileCode(apps, settings, news, blogs, videos);
    
    log(`GitHub Sync: Payload generated successfully (${apps.length} apps, ${news.length} news items).`);
    log("GitHub Sync: Uploading to GitHub...");
    
    await commitFileToGitHub({
      owner: configToUse.owner,
      repo: configToUse.repo,
      token: configToUse.token,
      branch: configToUse.branch || 'main',
      path: 'src/lib/staticData.ts',
      content: updatedCode,
      message: `Admin Release: Manual platform synchronization triggered`
    });
    log("GitHub Sync: Manual push successful!");
  }, [gitConfig, apps, settings, news, blogs, videos]);

  const testCloudConnection = React.useCallback(async () => {
    if (!isFirebaseConfigured) return false;
    console.log("Connectivity Test: Starting...");
    const testDoc = doc(db, 'store_data', 'connectivity_test');
    
    try {
      await withServerConfirmation(() => setDoc(testDoc, { 
        last_test: Math.random().toString(36).substring(7), 
        timestamp: new Date().toISOString()
      }), 10000);
      
      return true;
    } catch (err) {
      console.error("Connectivity Test: Write failed.", err);
      return false;
    }
  }, []);

  const refreshAll = React.useCallback(async (silent = false) => {
    if (!isFirebaseConfigured) {
        setIsConnected(false);
        setLoading(false);
        return;
    }
    console.log("Manual Refresh: Fetching latest data from Cloud...");
    if (!silent) setLoading(true);
    try {
      const docsToFetch = [
        { path: 'apps', setter: setApps, key: 'items' },
        { path: 'settings', setter: setSettings },
        { path: 'news', setter: setNews, key: 'items' },
        { path: 'blogs', setter: setBlogs, key: 'items' },
        { path: 'videos', setter: setVideos, key: 'items' }
      ];

      await Promise.all(docsToFetch.map(async (d) => {
        try {
          if (d.path === 'apps') {
            const snapMeta = await withServerConfirmation(() => getDoc(doc(db, 'store_data', 'apps_meta')), 10000);
            if (snapMeta.exists()) {
              const numChunks = snapMeta.data().numChunks || 1;
              const allApps = [];
              for(let i=0; i<numChunks; i++) {
                try {
                  const snapChunk = await withServerConfirmation(() => getDocFromServer(doc(db, 'store_data', `apps_chunk_${i}`)), 10000);
                  if(snapChunk.exists() && snapChunk.data().items) {
                    allApps.push(...snapChunk.data().items);
                  }
                } catch (e) {
                  console.warn(`Failed to chunk ${i} on manual refresh`, e);
                }
              }
              const cleanApps = allApps.map((a: any) => {
                delete a.more_information_url;
                delete a.encrypted_download_url;
                delete a.download_url;
                return a;
              });
              setApps(cleanApps);
              secureStorage.setItem('rummystore_apps', JSON.stringify(cleanApps));
            } else {
              // Fallback to old document
              const oldSnap = await withServerConfirmation(() => getDoc(doc(db, 'store_data', 'apps')), 10000);
              if (oldSnap.exists() && oldSnap.data().items) {
                const data = oldSnap.data().items.map((a: any) => {
                  delete a.more_information_url;
                  delete a.encrypted_download_url;
                  delete a.download_url;
                  return a;
                });
                setApps(data);
                secureStorage.setItem('rummystore_apps', JSON.stringify(data));
              } else {
                setApps([]);
                secureStorage.setItem('rummystore_apps', JSON.stringify([]));
              }
            }
          } else {
            // Use getDocFromServer to ensure it receives fresh updates
            const snap = await withServerConfirmation(() => getDocFromServer(doc(db, 'store_data', d.path)), 10000);
            if (snap.exists()) {
              const data = (d as any).key ? (snap.data() as any)[(d as any).key] : snap.data();
              d.setter(data);
              secureStorage.setItem(`rummystore_${d.path}`, JSON.stringify(data));
            } else if ((d as any).key === 'items') {
              d.setter([] as any);
              secureStorage.setItem(`rummystore_${d.path}`, JSON.stringify([]));
            }
          }
        } catch (fetchErr) {
          console.warn(`Parallel Sync failed for ${d.path}, skipping...`, fetchErr);
        }
      }));
      
      setIsConnected(true);
      setSyncVersion(v => v + 1);
      setAppsSyncedWithServer(true);
      setSettingsSyncedWithServer(true);
      setNewsSyncedWithServer(true);
      setBlogsSyncedWithServer(true);
      setVideosSyncedWithServer(true);
      setServerAppsFetched(true);
      setServerNewsFetched(true);
      setServerBlogsFetched(true);
      setServerVideosFetched(true);
      setLoadedFromServer(true);
      console.log("Manual Refresh: Parallel Fetch Success.");
    } catch (err) {
      console.error("Manual refresh failed:", err);
      setIsConnected(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders of consuming components
  const value = React.useMemo(() => ({
    apps, 
    settings, 
    news, 
    blogs, 
    videos, 
    loading, 
    loadedFromServer,
    appsSyncedWithServer,
    settingsSyncedWithServer,
    newsSyncedWithServer,
    blogsSyncedWithServer,
    videosSyncedWithServer,
    serverAppsFetched,
    serverNewsFetched,
    serverBlogsFetched,
    serverVideosFetched,
    syncVersion,
    lastSyncTime,
    refreshAll,
    testCloudConnection,
    saveApps, 
    saveSettings, 
    saveNews, 
    saveBlogs, 
    saveVideos,
    isConnected,
    isLive,
    gitConfig,
    gitConfigLoading,
    saveGitConfig,
    pushAllToGitHub
  }), [
    apps, settings, news, blogs, videos, loading, loadedFromServer,
    appsSyncedWithServer, settingsSyncedWithServer, newsSyncedWithServer, blogsSyncedWithServer, videosSyncedWithServer,
    serverAppsFetched, serverNewsFetched, serverBlogsFetched, serverVideosFetched,
    syncVersion, lastSyncTime,
    refreshAll, testCloudConnection, saveApps, saveSettings, saveNews, saveBlogs, saveVideos,
    isConnected, isLive, gitConfig, gitConfigLoading, saveGitConfig, pushAllToGitHub
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
