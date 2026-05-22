import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AppConfig, GlobalSettings, NewsItem, BlogPost, VideoItem } from '../lib/supabase';

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
  }
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
import { mockApps, mockSettings, mockNews, mockBlogs, mockVideos } from '../lib/supabase';

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
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<AppConfig[]>(() => {
    const saved = localStorage.getItem('yonostore_apps');
    return saved ? JSON.parse(saved) : mockApps;
  });
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    const saved = localStorage.getItem('yonostore_settings');
    return saved ? JSON.parse(saved) : mockSettings;
  });
  const [news, setNews] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('yonostore_news');
    return saved ? JSON.parse(saved) : mockNews;
  });
  const [blogs, setBlogs] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('yonostore_blogs');
    return saved ? JSON.parse(saved) : mockBlogs;
  });
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    const saved = localStorage.getItem('yonostore_videos');
    return saved ? JSON.parse(saved) : mockVideos;
  });
  // Fast persistent loading state management
  const [loading, setLoading] = useState(() => {
    // If we have cached apps and settings, we can show them immediately
    const hasApps = !!localStorage.getItem('yonostore_apps');
    const hasSettings = !!localStorage.getItem('yonostore_settings');
    // Pre-emptively false if we have the critical data cached
    return !(hasApps && hasSettings);
  });
  
  const [loadedFromServer, setLoadedFromServer] = useState(false);
  const [appsSyncedWithServer, setAppsSyncedWithServer] = useState(false);
  const [settingsSyncedWithServer, setSettingsSyncedWithServer] = useState(false);
  const [newsSyncedWithServer, setNewsSyncedWithServer] = useState(false);
  const [blogsSyncedWithServer, setBlogsSyncedWithServer] = useState(false);
  const [videosSyncedWithServer, setVideosSyncedWithServer] = useState(false);

  const [serverAppsFetched, setServerAppsFetched] = useState(false);
  const [serverNewsFetched, setServerNewsFetched] = useState(false);
  const [serverBlogsFetched, setServerBlogsFetched] = useState(false);
  const [serverVideosFetched, setServerVideosFetched] = useState(false);
  
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(new Date().toLocaleTimeString());

  // Helper to ensure writes hit the server
  const withServerConfirmation = React.useCallback(async (operation: () => Promise<any>, timeoutMs: number = 20000) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Cloud Sync Timeout: The update is taking a while to reach the server. This happens on slow connections. Changes usually sync eventually. (Note: You can try manually syncing from the header status indicator)")), timeoutMs)
    );
    return Promise.race([operation(), timeoutPromise]);
  }, []);

  useEffect(() => {
    const hasCache = !!localStorage.getItem('yonostore_apps') && !!localStorage.getItem('yonostore_settings');
    
    const loadedDocs = {
      apps: false,
      settings: false,
      news: false,
      blogs: false,
      videos: false
    };

    const checkLoaded = (docName: keyof typeof loadedDocs) => {
      loadedDocs[docName] = true;
      // If we have cache, we already set loading to false in initial state
      // If no cache, we wait for at least core collections (apps and settings) to pull once
      if (loadedDocs.apps && loadedDocs.settings) {
        setLoading(false);
      }
    };

    // Safety fallback only if no cache - allow database up to 10 seconds to resolve initially
    const timeout = !hasCache ? setTimeout(() => {
      setLoading(false);
    }, 10000) : null;

    // Fast sync fallback for deep links (especially new apps not in cache) - raised to 10 seconds to prevent premature failure states
    const syncTimeout = setTimeout(() => {
      setLoadedFromServer(true);
      setAppsSyncedWithServer(true);
      setSettingsSyncedWithServer(true);
      setNewsSyncedWithServer(true);
      setBlogsSyncedWithServer(true);
      setVideosSyncedWithServer(true);
      
      // Prevent dynamic page loader from hanging when server cold start exceeds 10 seconds
      setServerAppsFetched(true);
      setServerNewsFetched(true);
      setServerBlogsFetched(true);
      setServerVideosFetched(true);
    }, 10000);

    const checkConnection = async () => {
      try {
        const testDoc = doc(db, 'store_data', 'connectivity_test');
        await getDocFromServer(testDoc);
        setIsConnected(true);
      } catch (err: any) {
        // Only set disconnected if we are sure
        if (err.message?.includes('offline') || err.code === 'unavailable') {
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
        }
      }
    };

    checkConnection();
    const connInterval = setInterval(checkConnection, 60000);

    const unsubs = [
      onSnapshot(doc(db, 'store_data', 'apps'), { includeMetadataChanges: true }, (snap) => {
        if (snap.exists()) {
          const data = snap.data().items || [];
          setApps(data);
          localStorage.setItem('yonostore_apps', JSON.stringify(data));
          if (!snap.metadata.fromCache) {
            setIsConnected(true);
            setIsLive(true);
            setLastSyncTime(new Date().toLocaleTimeString());
            setAppsSyncedWithServer(true);
            setServerAppsFetched(true);
            setLoadedFromServer(true);
          }
        } else {
          setAppsSyncedWithServer(true);
          setServerAppsFetched(true);
          setLoadedFromServer(true);
        }
        checkLoaded('apps');
      }, (err) => {
        console.warn("Firestore apps listener error, falling back:", err);
        setAppsSyncedWithServer(true);
        setServerAppsFetched(true);
        setLoadedFromServer(true);
        checkLoaded('apps');
      }),
      onSnapshot(doc(db, 'store_data', 'settings'), { includeMetadataChanges: true }, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as GlobalSettings;
          setSettings(data);
          localStorage.setItem('yonostore_settings', JSON.stringify(data));
          if (!snap.metadata.fromCache) {
            setIsConnected(true);
            setIsLive(true);
            setSettingsSyncedWithServer(true);
            setLoadedFromServer(true);
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
      onSnapshot(doc(db, 'store_data', 'news'), { includeMetadataChanges: true }, (snap) => {
        if (snap.exists()) {
          const data = snap.data().items || [];
          setNews(data);
          localStorage.setItem('yonostore_news', JSON.stringify(data));
          if (!snap.metadata.fromCache) {
            setNewsSyncedWithServer(true);
            setServerNewsFetched(true);
          }
        } else {
          setNewsSyncedWithServer(true);
          setServerNewsFetched(true);
        }
        checkLoaded('news');
      }, (err) => {
        console.warn("Firestore news listener error, falling back:", err);
        setNewsSyncedWithServer(true);
        setServerNewsFetched(true);
        checkLoaded('news');
      }),
      onSnapshot(doc(db, 'store_data', 'blogs'), { includeMetadataChanges: true }, (snap) => {
        if (snap.exists()) {
          const data = snap.data().items || [];
          setBlogs(data);
          localStorage.setItem('yonostore_blogs', JSON.stringify(data));
          if (!snap.metadata.fromCache) {
            setBlogsSyncedWithServer(true);
            setServerBlogsFetched(true);
          }
        } else {
          setBlogsSyncedWithServer(true);
          setServerBlogsFetched(true);
        }
        checkLoaded('blogs');
      }, (err) => {
        console.warn("Firestore blogs listener error, falling back:", err);
        setBlogsSyncedWithServer(true);
        setServerBlogsFetched(true);
        checkLoaded('blogs');
      }),
      onSnapshot(doc(db, 'store_data', 'videos'), { includeMetadataChanges: true }, (snap) => {
        if (snap.exists()) {
          const data = snap.data().items || [];
          setVideos(data);
          localStorage.setItem('yonostore_videos', JSON.stringify(data));
          if (!snap.metadata.fromCache) {
            setVideosSyncedWithServer(true);
            setServerVideosFetched(true);
          }
        } else {
          setVideosSyncedWithServer(true);
          setServerVideosFetched(true);
        }
        checkLoaded('videos');
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
    try {
      const docRef = doc(db, 'store_data', 'apps');
      const now = new Date().toISOString();
      
      console.log("Cloud: Pushing Apps update...");
      await withServerConfirmation(() => setDoc(docRef, { items: newApps, last_updated: now }));
      
      setApps(newApps);
      localStorage.setItem('yonostore_apps', JSON.stringify(newApps));
      console.log("Cloud: Apps update acknowledged by server.");
    } catch (err) {
      console.error("Save Apps Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/apps');
    }
  }, []);

  const saveSettings = React.useCallback(async (newSettings: GlobalSettings) => {
    try {
      const now = new Date().toISOString();
      const settingsWithTime = { ...newSettings, last_updated: now };

      const docRef = doc(db, 'store_data', 'settings');
      console.log("Cloud: Pushing Settings update...");
      await withServerConfirmation(() => setDoc(docRef, settingsWithTime));

      setSettings(settingsWithTime);
      localStorage.setItem('yonostore_settings', JSON.stringify(settingsWithTime));
      console.log("Cloud: Settings update acknowledged by server.");
    } catch (err) {
      console.error("Save Settings Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/settings');
    }
  }, []);

  const saveNews = React.useCallback(async (newNews: NewsItem[]) => {
    try {
      const docRef = doc(db, 'store_data', 'news');
      console.log("Cloud: Pushing News update...");
      await withServerConfirmation(() => setDoc(docRef, { items: newNews }));

      setNews(newNews);
      localStorage.setItem('yonostore_news', JSON.stringify(newNews));
      console.log("Cloud: News update acknowledged by server.");
    } catch (err) {
      console.error("Save News Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/news');
    }
  }, []);

  const saveBlogs = React.useCallback(async (newBlogs: BlogPost[]) => {
    try {
      const docRef = doc(db, 'store_data', 'blogs');
      console.log("Cloud: Pushing Blogs update...");
      await withServerConfirmation(() => setDoc(docRef, { items: newBlogs }));

      setBlogs(newBlogs);
      localStorage.setItem('yonostore_blogs', JSON.stringify(newBlogs));
      console.log("Cloud: Blogs update acknowledged by server.");
    } catch (err) {
      console.error("Save Blogs Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/blogs');
    }
  }, []);

  const saveVideos = React.useCallback(async (newVideos: VideoItem[]) => {
    try {
      const docRef = doc(db, 'store_data', 'videos');
      console.log("Cloud: Pushing Videos update...");
      await withServerConfirmation(() => setDoc(docRef, { items: newVideos }));

      setVideos(newVideos);
      localStorage.setItem('yonostore_videos', JSON.stringify(newVideos));
      console.log("Cloud: Videos update acknowledged by server.");
    } catch (err) {
      console.error("Save Videos Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/videos');
    }
  }, []);

  const testCloudConnection = React.useCallback(async () => {
    console.log("Connectivity Test: Starting...");
    const testDoc = doc(db, 'store_data', 'connectivity_test');
    
    try {
      await withServerConfirmation(() => setDoc(testDoc, { 
        last_test: Math.random().toString(36).substring(7), 
        timestamp: new Date().toISOString(),
        client_info: navigator.userAgent
      }), 10000);
      
      return true;
    } catch (err) {
      console.error("Connectivity Test: Write failed.", err);
      return false;
    }
  }, []);

  const refreshAll = React.useCallback(async (silent = false) => {
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
          const snap = await withServerConfirmation(() => getDocFromServer(doc(db, 'store_data', d.path)), 15000);
          if (snap.exists()) {
            const data = (d as any).key ? (snap.data() as any)[(d as any).key] : snap.data();
            d.setter(data);
            localStorage.setItem(`yonostore_${d.path}`, JSON.stringify(data));
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
    isLive
  }), [
    apps, settings, news, blogs, videos, loading, loadedFromServer,
    appsSyncedWithServer, settingsSyncedWithServer, newsSyncedWithServer, blogsSyncedWithServer, videosSyncedWithServer,
    serverAppsFetched, serverNewsFetched, serverBlogsFetched, serverVideosFetched,
    syncVersion, lastSyncTime,
    refreshAll, testCloudConnection, saveApps, saveSettings, saveNews, saveBlogs, saveVideos,
    isConnected, isLive
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
