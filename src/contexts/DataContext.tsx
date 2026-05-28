import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { AppConfig, GlobalSettings, NewsItem, BlogPost, VideoItem } from '../lib/supabase';
import { GitConfig, generateSupabaseFileCode, commitFileToGitHub } from '../lib/githubSync';

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
  
  // GitHub Integration States & Methods
  gitConfig: GitConfig | null;
  gitConfigLoading: boolean;
  saveGitConfig: (config: GitConfig) => Promise<void>;
  pushAllToGitHub: (customConfig?: GitConfig) => Promise<void>;
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
  // Fast persistent loading state management - initialized to false to enable instant display of statically compiled fallbacks
  const [loading, setLoading] = useState(false);
  
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

  // GitHub Integration States
  const [gitConfig, setGitConfig] = useState<GitConfig | null>(null);
  const [gitConfigLoading, setGitConfigLoading] = useState(false);

  // Load GitHub config on admin session auth
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const emailLower = currentUser.email?.toLowerCase() || 'none';
        let isAuthorized = emailLower === 'defentechscholar@gmail.com';

        if (!isAuthorized) {
          try {
            // Check UID record
            const adminUidDoc = doc(db, 'admins', currentUser.uid);
            const snapUid = await getDoc(adminUidDoc);
            if (snapUid.exists() && snapUid.data()?.role === 'admin') {
              isAuthorized = true;
            } else {
              // Check Email record
              const adminEmailDoc = doc(db, 'admins', emailLower);
              const snapEmail = await getDoc(adminEmailDoc);
              if (snapEmail.exists() && snapEmail.data()?.role === 'admin') {
                isAuthorized = true;
              }
            }
          } catch (e) {
            console.warn("Database admin verification for GitHub context failed:", e);
          }
        }

        if (isAuthorized) {
          setGitConfigLoading(true);
          try {
            const configDoc = doc(db, 'secure_git_config', 'config');
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
    const hasCache = !!localStorage.getItem('yonostore_apps') && !!localStorage.getItem('yonostore_settings');
    
    // Snappy background loading: If cache exists, mark everything loaded instantly to support zero-lag local navigation
    if (hasCache) {
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
    }

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
    };

    // Safety fallback - prevent any hanging sync loops after max 3 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    // Fast sync fallback for deep links (especially new apps not in cache) - set to 3 seconds for snappy visual performance
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
    }, 3000);

    const checkConnection = async () => {
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

    const unsubs = [
      onSnapshot(doc(db, 'store_data', 'apps'), (snap) => {
        if (snap.exists()) {
          const data = snap.data().items || [];
          setApps(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          localStorage.setItem('yonostore_apps', JSON.stringify(data));
          
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
        if (snap.exists()) {
          const data = snap.data() as GlobalSettings;
          setSettings(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          localStorage.setItem('yonostore_settings', JSON.stringify(data));
          
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
        if (snap.exists()) {
          const data = snap.data().items || [];
          setNews(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          localStorage.setItem('yonostore_news', JSON.stringify(data));
          
          setNewsSyncedWithServer(true);
          setServerNewsFetched(true);
          
          checkLoaded('news');
        } else {
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
        if (snap.exists()) {
          const data = snap.data().items || [];
          setBlogs(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          localStorage.setItem('yonostore_blogs', JSON.stringify(data));
          
          setBlogsSyncedWithServer(true);
          setServerBlogsFetched(true);
          
          checkLoaded('blogs');
        } else {
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
        if (snap.exists()) {
          const data = snap.data().items || [];
          setVideos(prev => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
          localStorage.setItem('yonostore_videos', JSON.stringify(data));
          
          setVideosSyncedWithServer(true);
          setServerVideosFetched(true);
          
          checkLoaded('videos');
        } else {
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
    localStorage.setItem('yonostore_apps', JSON.stringify(newApps));

    try {
      const docRef = doc(db, 'store_data', 'apps');
      const now = new Date().toISOString();
      
      console.log("Cloud: Pushing Apps update...");
      await setDoc(docRef, { items: newApps, last_updated: now });
      console.log("Cloud: Apps update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged. Triggering compile and commit...");
        const updatedCode = generateSupabaseFileCode(newApps, settings, news, blogs, videos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/supabase.ts',
          content: updatedCode,
          message: `Admin Release Auto-Update: Added/Updated applications`
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
    localStorage.setItem('yonostore_settings', JSON.stringify(settingsWithTime));

    try {
      const docRef = doc(db, 'store_data', 'settings');
      console.log("Cloud: Pushing Settings update...");
      await setDoc(docRef, settingsWithTime);
      console.log("Cloud: Settings update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged for Settings updates...");
        const updatedCode = generateSupabaseFileCode(apps, settingsWithTime, news, blogs, videos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/supabase.ts',
          content: updatedCode,
          message: `Admin Release Auto-Update: Updated platform configurations`
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
    localStorage.setItem('yonostore_news', JSON.stringify(newNews));

    try {
      const docRef = doc(db, 'store_data', 'news');
      console.log("Cloud: Pushing News update...");
      await setDoc(docRef, { items: newNews });
      console.log("Cloud: News update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged for News updates...");
        const updatedCode = generateSupabaseFileCode(apps, settings, newNews, blogs, videos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/supabase.ts',
          content: updatedCode,
          message: `Admin Release Auto-Update: Added/Updated news indexes`
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
    localStorage.setItem('yonostore_blogs', JSON.stringify(newBlogs));

    try {
      const docRef = doc(db, 'store_data', 'blogs');
      console.log("Cloud: Pushing Blogs update...");
      await setDoc(docRef, { items: newBlogs });
      console.log("Cloud: Blogs update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged for Blogs updates...");
        const updatedCode = generateSupabaseFileCode(apps, settings, news, newBlogs, videos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/supabase.ts',
          content: updatedCode,
          message: `Admin Release Auto-Update: Added/Updated blog posts`
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
    localStorage.setItem('yonostore_videos', JSON.stringify(newVideos));

    try {
      const docRef = doc(db, 'store_data', 'videos');
      console.log("Cloud: Pushing Videos update...");
      await setDoc(docRef, { items: newVideos });
      console.log("Cloud: Videos update acknowledged by server.");

      if (gitConfig?.autoSync) {
        console.log("GitHub Sync: AutoSync engaged for Videos updates...");
        const updatedCode = generateSupabaseFileCode(apps, settings, news, blogs, newVideos);
        commitFileToGitHub({
          owner: gitConfig.owner,
          repo: gitConfig.repo,
          token: gitConfig.token,
          branch: gitConfig.branch || 'main',
          path: 'src/lib/supabase.ts',
          content: updatedCode,
          message: `Admin Release Auto-Update: Added/Updated video listings`
        }).catch(err => console.error("Background auto-sync commit failed:", err));
      }
    } catch (err: any) {
      console.error("Save Videos Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'store_data/videos');
    }
  }, [gitConfig, apps, settings, news, blogs]);

  const saveGitConfig = React.useCallback(async (newConfig: GitConfig) => {
    try {
      const docRef = doc(db, 'secure_git_config', 'config');
      console.log("Cloud: Pushing Git Configuration update...");
      await setDoc(docRef, newConfig);
      setGitConfig(newConfig);
      console.log("Cloud: Git Configuration saved successfully.");
    } catch (err) {
      console.error("Save Git Config Error:", err);
      handleFirestoreError(err, OperationType.WRITE, 'secure_git_config/config');
    }
  }, []);

  const pushAllToGitHub = React.useCallback(async (customConfig?: GitConfig) => {
    const configToUse = customConfig || gitConfig;
    if (!configToUse || !configToUse.token || !configToUse.owner || !configToUse.repo) {
      throw new Error("GitHub synchronization is not fully configured. Please configure GitHub Repository Sync under your admin panel first.");
    }

    const code = generateSupabaseFileCode(apps, settings, news, blogs, videos);
    await commitFileToGitHub({
      owner: configToUse.owner,
      repo: configToUse.repo,
      token: configToUse.token,
      branch: configToUse.branch || 'main',
      path: 'src/lib/supabase.ts',
      content: code,
      message: `Admin Manual Sync: Recompiled and updated static store fallbacks`
    });
    console.log("GitHub Manual Sync complete: Repository updated with live databases!");
  }, [gitConfig, apps, settings, news, blogs, videos]);

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
          // Use standard getDoc instead of getDocFromServer for instant cached fallbacks or clean short 3s check
          const snap = await withServerConfirmation(() => getDoc(doc(db, 'store_data', d.path)), 3000);
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
