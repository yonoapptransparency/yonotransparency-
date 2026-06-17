/**
 * DataContext state engine
 * Manages reactive global context bindings from Firestore collections,
 * with direct failovers to local static backups for swift offline loads.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, OperationType, FirestoreErrorInfo, handleFirestoreError } from '../lib/firebase';
import { AppConfig, GlobalSettings, NewsItem, BlogPost, VideoItem } from '../lib/staticData';
import { GitConfig, generateStaticDataFileCode, commitFileToGitHub } from '../lib/githubSync';
import { secureStorage } from '../lib/secureStorage';

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
  quotaExceeded: boolean;
  
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
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(new Date().toLocaleTimeString());

  const checkIsQuotaError = React.useCallback((err: any) => {
    const msg = String(err?.message || err || '').toLowerCase();
    const code = String(err?.code || '').toLowerCase();
    return msg.includes('quota') || msg.includes('exhausted') || code.includes('quota') || code.includes('exhausted') || msg.includes('429');
  }, []);

  // GitHub Integration States
  const [gitConfig, setGitConfig] = useState<GitConfig | null>(null);
  const [gitConfigLoading, setGitConfigLoading] = useState(false);

  // Load GitHub config on admin session auth via secure server-side lookup
  useEffect(() => {
    if (!auth) return;
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

  // Load local secure-links and baseline backup-data from the Express server backup to ensure instant offline & quota-proof loading
  useEffect(() => {
    const fetchBackupData = async () => {
      try {
        const res = await fetch('/api/v1/public/backup-data');
        if (res.ok) {
          const backup = await res.json();
          if (backup) {
            setApps(prev => {
              if (prev.length === 0 && backup.apps && backup.apps.length > 0) {
                secureStorage.setItem('rummystore_apps', JSON.stringify(backup.apps));
                return backup.apps;
              }
              return prev;
            });
            setSettings(prev => {
              if ((!prev || !prev.site_title) && backup.settings && backup.settings.site_title) {
                secureStorage.setItem('rummystore_settings', JSON.stringify(backup.settings));
                return backup.settings;
              }
              return prev;
            });
            setNews(prev => {
              if (prev.length === 0 && backup.news && backup.news.length > 0) {
                secureStorage.setItem('rummystore_news', JSON.stringify(backup.news));
                return backup.news;
              }
              return prev;
            });
            setBlogs(prev => {
              if (prev.length === 0 && backup.blogs && backup.blogs.length > 0) {
                secureStorage.setItem('rummystore_blogs', JSON.stringify(backup.blogs));
                return backup.blogs;
              }
              return prev;
            });
            setVideos(prev => {
              if (prev.length === 0 && backup.videos && backup.videos.length > 0) {
                secureStorage.setItem('rummystore_videos', JSON.stringify(backup.videos));
                return backup.videos;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn("Failed to load background public backup data:", err);
      }
    };
    
    fetchBackupData();
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

    const isPublicVisitorOnStaticDeploy = typeof window !== 'undefined' 
        && window.location.pathname.indexOf('/admin') !== 0
        && (window as any).__INITIAL_DATA__;

    const checkConnection = async () => {
      if (!isFirebaseConfigured || isPublicVisitorOnStaticDeploy) {
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
        if (checkIsQuotaError(err)) {
          setQuotaExceeded(true);
        }
        // Only set disconnected if we are sure
        const errMsg = err.message || '';
        const errCode = err.code || '';
        if (checkIsQuotaError(err) || errMsg.includes('offline') || errCode === 'unavailable' || errCode === 'permission-denied') {
          setIsConnected(false);
          setIsLive(false);
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

    if (!isFirebaseConfigured || isPublicVisitorOnStaticDeploy) {
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
        let chunkFetchFailed = false;
        
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
                chunkFetchFailed = true;
              }
              return [];
            })());
          }
          const chunkResults = await Promise.all(fetchPromises);
          chunkResults.forEach(items => loadedApps.push(...items));
          fetchedData = !chunkFetchFailed;
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
        } else if (!chunkFetchFailed) {
          setApps([]);
          secureStorage.setItem('rummystore_apps', JSON.stringify([]));
          setAppsSyncedWithServer(true);
          setServerAppsFetched(true);
          setLoadedFromServer(true);
          checkLoaded('apps');
        } else {
           console.warn("Aborted fetching apps due to chunk fail. Preserving local cache.");
           setAppsSyncedWithServer(true);
           setServerAppsFetched(true);
           setLoadedFromServer(true);
           checkLoaded('apps');
        }
      }, (err) => {
        console.warn("Firestore apps listener error, falling back:", err);
        if (checkIsQuotaError(err)) {
          setQuotaExceeded(true);
        }
        // Do not clear apps on error (quota exceeded, offline), keep cached value
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
        if (checkIsQuotaError(err)) {
          setQuotaExceeded(true);
        }
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
        if (checkIsQuotaError(err)) {
          setQuotaExceeded(true);
        }
        // Do not clear data on error
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
        if (checkIsQuotaError(err)) {
          setQuotaExceeded(true);
        }
        // Do not clear data on error
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
        if (checkIsQuotaError(err)) {
          setQuotaExceeded(true);
        }
        // Do not clear data on error
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

  const updateLocalContainerBackup = React.useCallback(async (
    appsList: AppConfig[],
    settingsObj: GlobalSettings,
    newsList: NewsItem[],
    blogsList: BlogPost[],
    videosList: VideoItem[]
  ) => {
    try {
      const { getAuth } = await import('firebase/auth');
      const authObj = getAuth();
      const idToken = await authObj.currentUser?.getIdToken();
      if (!idToken) {
        console.warn("Could not retrieve idToken for local backup.");
        return;
      }
      const res = await fetch('/api/v1/admin/backup-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          apps: appsList,
          settings: settingsObj,
          news: newsList,
          blogs: blogsList,
          videos: videosList
        })
      });
      if (!res.ok) {
        console.warn("backup-data endpoint failed:", await res.text());
      } else {
        console.log("Local filesystem backup successful");
      }
    } catch (e) {
      console.warn("Failed to write local filesystem backup:", e);
    }
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
      
      try {
        for (let i = 0; i < numChunks; i++) {
          const chunk = JSON.parse(JSON.stringify(newApps.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)));
          chunk.forEach((app: any) => { 
            // Inject public-safe metadata indicator for secure link availability
            app.link_configured = !!(app.more_information_url || app.download_url || app.encrypted_download_url);
            delete app.more_information_url; 
            delete app.encrypted_download_url;
            delete app.download_url;
          });
          await setDoc(doc(db, 'store_data', `apps_chunk_${i}`), { items: chunk });
        }
        
        const metaRef = doc(db, 'store_data', 'apps_meta');
        await setDoc(metaRef, { numChunks, last_updated: now });
        console.log("Cloud: Pushed Apps catalog update to Firestore.");
      } catch (dbErr) {
        console.warn("Failed to push Apps catalog to Firestore (Quota exceeded or network issue). Proceeding with local/GitHub backups.", dbErr);
      }
      
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
        try {
          await setDoc(doc(db, 'store_data', 'secure_links'), { encryptedData });
          await setDoc(doc(db, 'store_data', 'sec_public_links'), { encryptedData });
          console.log("Cloud: Pushed encrypted secure links map to Firestore.");
        } catch (dbErr) {
          console.warn("Failed to push secure links map to Firestore (Quota exceeded or network issue). Proceeding with local/GitHub backups.", dbErr);
        }
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
    } finally {
      await updateLocalContainerBackup(newApps, settings, news, blogs, videos).catch(e => console.error(e));
    }
  }, [gitConfig, settings, news, blogs, videos, updateLocalContainerBackup]);

  const saveSettings = React.useCallback(async (newSettings: GlobalSettings) => {
    const now = new Date().toISOString();
    const settingsWithTime = { ...newSettings, last_updated: now };

    // 1. Snappy optimistic update to local state and local memory first
    setSettings(settingsWithTime);
    secureStorage.setItem('rummystore_settings', JSON.stringify(settingsWithTime));

    try {
      const docRef = doc(db, 'store_data', 'settings');
      console.log("Cloud: Pushing Settings update...");
      // Sanitize settings payload to exclude any 'undefined' properties, preventing Firestore write failures
      const sanitized = JSON.parse(JSON.stringify(settingsWithTime));
      await setDoc(docRef, sanitized);
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
    } finally {
      await updateLocalContainerBackup(apps, settingsWithTime, news, blogs, videos).catch(e => console.error(e));
    }
  }, [gitConfig, apps, news, blogs, videos, updateLocalContainerBackup]);

  const saveNews = React.useCallback(async (newNews: NewsItem[]) => {
    // 1. Snappy optimistic update to local state and local memory first
    setNews(newNews);
    secureStorage.setItem('rummystore_news', JSON.stringify(newNews));

    try {
      const docRef = doc(db, 'store_data', 'news');
      console.log("Cloud: Pushing News update...");
      // Sanitize payload to exclude any 'undefined' properties, preventing Firestore write failures
      const sanitized = JSON.parse(JSON.stringify({ items: newNews }));
      await setDoc(docRef, sanitized);
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
    } finally {
      await updateLocalContainerBackup(apps, settings, newNews, blogs, videos).catch(e => console.error(e));
    }
  }, [gitConfig, apps, settings, blogs, videos, updateLocalContainerBackup]);

  const saveBlogs = React.useCallback(async (newBlogs: BlogPost[]) => {
    // 1. Snappy optimistic update to local state and local memory first
    setBlogs(newBlogs);
    secureStorage.setItem('rummystore_blogs', JSON.stringify(newBlogs));

    try {
      const docRef = doc(db, 'store_data', 'blogs');
      console.log("Cloud: Pushing Blogs update...");
      // Sanitize payload to exclude any 'undefined' properties, preventing Firestore write failures
      const sanitized = JSON.parse(JSON.stringify({ items: newBlogs }));
      await setDoc(docRef, sanitized);
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
    } finally {
      await updateLocalContainerBackup(apps, settings, news, newBlogs, videos).catch(e => console.error(e));
    }
  }, [gitConfig, apps, settings, news, videos, updateLocalContainerBackup]);

  const saveVideos = React.useCallback(async (newVideos: VideoItem[]) => {
    // 1. Snappy optimistic update to local state and local memory first
    setVideos(newVideos);
    secureStorage.setItem('rummystore_videos', JSON.stringify(newVideos));

    try {
      const docRef = doc(db, 'store_data', 'videos');
      console.log("Cloud: Pushing Videos update...");
      // Sanitize payload to exclude any 'undefined' properties, preventing Firestore write failures
      const sanitized = JSON.parse(JSON.stringify({ items: newVideos }));
      await setDoc(docRef, sanitized);
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
    } finally {
      await updateLocalContainerBackup(apps, settings, news, blogs, newVideos).catch(e => console.error(e));
    }
  }, [gitConfig, apps, settings, news, blogs, updateLocalContainerBackup]);

  const saveGitConfig = React.useCallback(async (newConfig: GitConfig) => {
    try {
      const docRef = doc(db, 'sec_git', 'cfg');
      console.log("Cloud: Pushing Git Configuration update...");
      // Sanitize payload to exclude any 'undefined' properties, preventing Firestore write failures
      const sanitized = JSON.parse(JSON.stringify(newConfig));
      await setDoc(docRef, sanitized);
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
    const settingsDoc = doc(db, 'store_data', 'settings');
    
    try {
      await getDocFromServer(settingsDoc);
      return true;
    } catch (err: any) {
      console.warn("Connectivity Test: Read failed.", err.message || err);
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
    } catch (err: any) {
      console.warn("Manual refresh failed (using fallback memory mode):", err.message || err);
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
    quotaExceeded,
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
    isConnected, isLive, quotaExceeded, gitConfig, gitConfigLoading, saveGitConfig, pushAllToGitHub
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
