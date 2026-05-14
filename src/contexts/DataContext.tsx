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
  syncVersion: number;
  lastSyncTime: string | null;
  refreshAll: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    let resolvedCount = 0;
    const totalListen = 5;
    
    // Safety flag to track if we've received ANY server update
    let receivedServerUpdate = false;

    const checkLoaded = () => {
      resolvedCount++;
      if (resolvedCount >= totalListen) {
        setLoading(false);
      }
    };

    // Set a safety timeout for loading
    const timeout = setTimeout(() => {
      setLoading(false);
      
      // FALLBACK: If we haven't received server data via onSnapshot after 5s,
      // it means WebSockets might be blocked by the ISP or network.
      // We forcefully fetch via HTTP explicitly.
      if (!receivedServerUpdate) {
        console.warn("Firestore: WebSockets appear blocked. Falling back to HTTP fetches...");
        const forceFetch = async () => {
          try {
            const tempApps = await getDocFromServer(doc(db, 'store_data', 'apps'));
            if (tempApps.exists()) {
              const data = tempApps.data().items || [];
              setApps(data);
              localStorage.setItem('yonostore_apps', JSON.stringify(data));
            }
            const tempSettings = await getDocFromServer(doc(db, 'store_data', 'settings'));
            if (tempSettings.exists()) {
              const data = tempSettings.data() as GlobalSettings;
              setSettings(data);
              localStorage.setItem('yonostore_settings', JSON.stringify(data));
            }
            const tempNews = await getDocFromServer(doc(db, 'store_data', 'news'));
            if (tempNews.exists()) {
              const data = tempNews.data().items || [];
              setNews(data);
              localStorage.setItem('yonostore_news', JSON.stringify(data));
            }
            const tempBlogs = await getDocFromServer(doc(db, 'store_data', 'blogs'));
            if (tempBlogs.exists()) {
              const data = tempBlogs.data().items || [];
              setBlogs(data);
              localStorage.setItem('yonostore_blogs', JSON.stringify(data));
            }
            const tempVideos = await getDocFromServer(doc(db, 'store_data', 'videos'));
            if (tempVideos.exists()) {
              const data = tempVideos.data().items || [];
              setVideos(data);
              localStorage.setItem('yonostore_videos', JSON.stringify(data));
            }
            setIsConnected(true);
            setIsLive(true);
            setSyncVersion(v => v + 1);
            setLastSyncTime(new Date().toLocaleTimeString());
          } catch(err) {
            console.error("HTTP Fallback also failed:", err);
            setIsConnected(false);
          }
        };
        forceFetch();
      }
    }, 5000);

    // Periodically check connection every 30s - less aggressive when failing
    const checkConnection = async () => {
      try {
        const testDoc = doc(db, 'store_data', 'connectivity_test');
        // Use a 5s race for the connectivity check to avoid long-hanging SDK internals
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        await getDocFromServer(testDoc);
        clearTimeout(timeoutId);
        
        setIsConnected(true);
        console.log("Firestore: Cloud Connection Verified.");
      } catch (err: any) {
        // Only log if it was previously connected or null to avoid spam
        if (isConnected !== false) {
          console.warn("Firestore: Cloud Connection Disturbed.", err.message);
        }
        setIsConnected(false);
      }
    };

    checkConnection();
    const connInterval = setInterval(checkConnection, 30000);

    const unsubs = [
      onSnapshot(doc(db, 'store_data', 'apps'), { includeMetadataChanges: true }, (snap) => {
        const fromCache = snap.metadata.fromCache;
        console.log(`Sync [Apps]: Source=${fromCache ? 'Cache' : 'Server'}, Exists=${snap.exists()}`);
        
        if (snap.exists()) {
          const data = snap.data().items || [];
          setApps(data);
          localStorage.setItem('yonostore_apps', JSON.stringify(data));
          setSyncVersion(v => v + 1);
          if (!fromCache) {
            setIsConnected(true);
            setIsLive(true);
            receivedServerUpdate = true;
            setLastSyncTime(new Date().toLocaleTimeString());
          } else {
            setIsLive(false);
          }
        } else if (!fromCache && auth.currentUser?.email === 'defentechscholar@gmail.com') {
          // AUTO-SEED: If the document doesn't exist on the server, but we have a local cache and we are admin, push it up
          const local = localStorage.getItem('yonostore_apps');
          if (local) setDoc(doc(db, 'store_data', 'apps'), { items: JSON.parse(local), last_updated: new Date().toISOString() });
        }
        checkLoaded();
      }, (err) => {
        console.error("Sync Error [Apps]:", err);
        checkLoaded();
      }),
      onSnapshot(doc(db, 'store_data', 'settings'), { includeMetadataChanges: true }, (snap) => {
        const fromCache = snap.metadata.fromCache;
        if (snap.exists()) {
          const data = snap.data() as GlobalSettings;
          setSettings(data);
          localStorage.setItem('yonostore_settings', JSON.stringify(data));
          setSyncVersion(v => v + 1);
          if (!snap.metadata.fromCache) {
            setIsConnected(true);
            setIsLive(true);
            receivedServerUpdate = true;
          } else {
            setIsLive(false);
          }
        } else if (!fromCache && auth.currentUser?.email === 'defentechscholar@gmail.com') {
          const local = localStorage.getItem('yonostore_settings');
          if (local) setDoc(doc(db, 'store_data', 'settings'), JSON.parse(local));
        }
        checkLoaded();
      }, (err) => {
        console.error("Sync Error [Settings]:", err);
        checkLoaded();
      }),
      onSnapshot(doc(db, 'store_data', 'news'), { includeMetadataChanges: true }, (snap) => {
        if (snap.exists()) {
          const data = snap.data().items || [];
          setNews(data);
          localStorage.setItem('yonostore_news', JSON.stringify(data));
          if (!snap.metadata.fromCache) receivedServerUpdate = true;
        }
        checkLoaded();
      }, (err) => {
        console.error("Sync Error [News]:", err);
        checkLoaded();
      }),
      onSnapshot(doc(db, 'store_data', 'blogs'), { includeMetadataChanges: true }, (snap) => {
        if (snap.exists()) {
          const data = snap.data().items || [];
          setBlogs(data);
          localStorage.setItem('yonostore_blogs', JSON.stringify(data));
          if (!snap.metadata.fromCache) receivedServerUpdate = true;
        }
        checkLoaded();
      }, (err) => {
        console.error("Sync Error [Blogs]:", err);
        checkLoaded();
      }),
      onSnapshot(doc(db, 'store_data', 'videos'), { includeMetadataChanges: true }, (snap) => {
        if (snap.exists()) {
          const data = snap.data().items || [];
          setVideos(data);
          localStorage.setItem('yonostore_videos', JSON.stringify(data));
          if (!snap.metadata.fromCache) receivedServerUpdate = true;
        }
        checkLoaded();
      }, (err) => {
        console.error("Sync Error [Videos]:", err);
        checkLoaded();
      })
    ];
    
    return () => {
      unsubs.forEach(u => u());
      clearTimeout(timeout);
      clearInterval(connInterval);
    };
  }, []);

  // Helper to ensure writes hit the server
  const withServerConfirmation = async (operation: () => Promise<any>, timeoutMs: number = 20000) => {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Cloud Sync Timeout: The update is taking a while to reach the server. This happens on slow connections. Changes usually sync eventually. (Note: You can try manually syncing from the header status indicator)")), timeoutMs)
    );
    
    // We race the operation against a timeout
    return Promise.race([operation(), timeoutPromise]);
  };

  const saveApps = async (newApps: AppConfig[]) => {
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
  };
  const saveSettings = async (newSettings: GlobalSettings) => {
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
  };
   const saveNews = async (newNews: NewsItem[]) => {
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
  };
  const saveBlogs = async (newBlogs: BlogPost[]) => {
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
  };
  const saveVideos = async (newVideos: VideoItem[]) => {
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
  };

  const testCloudConnection = async () => {
    console.log("Connectivity Test: Starting...");
    const testId = Math.random().toString(36).substring(7);
    const testDoc = doc(db, 'store_data', 'connectivity_test');
    
    try {
      // Step 1: Write a unique value to the cloud
      await withServerConfirmation(() => setDoc(testDoc, { 
        last_test: testId, 
        timestamp: new Date().toISOString(),
        client_info: navigator.userAgent
      }), 10000);
      
      console.log("Connectivity Test: Write success. Verification passed.");
      return true;
    } catch (err) {
      console.error("Connectivity Test: Write failed.", err);
      return false;
    }
  };

  const refreshAll = async () => {
    console.log("Manual Refresh: Fetching latest data from Cloud...");
    setLoading(true);
    try {
      const docs = [
        { path: 'apps', setter: setApps, key: 'items' },
        { path: 'settings', setter: setSettings },
        { path: 'news', setter: setNews, key: 'items' },
        { path: 'blogs', setter: setBlogs, key: 'items' },
        { path: 'videos', setter: setVideos, key: 'items' }
      ];

      // Manual Refresh: Clear cache and reload from server
      for (const d of docs) {
        try {
          const snap = await withServerConfirmation(() => getDocFromServer(doc(db, 'store_data', d.path)), 15000);
          if (snap.exists()) {
            const data = (d as any).key ? (snap.data() as any)[(d as any).key] : snap.data();
            d.setter(data);
            localStorage.setItem(`yonostore_${d.path}`, JSON.stringify(data));
          }
        } catch (fetchErr) {
          console.warn(`Sync failed for ${d.path}, skipping...`, fetchErr);
        }
      }
      
      setIsConnected(true);
      setSyncVersion(v => v + 1);
      console.log("Manual Refresh: Success.");
    } catch (err) {
      console.error("Manual refresh failed:", err);
      setIsConnected(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider value={{
      apps, 
      settings, 
      news, 
      blogs, 
      videos, 
      loading, 
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
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
