import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We alert the error string so the user can see it in the UI and report back
  if (errInfo.error.includes('permissions')) {
    console.warn("Permission denied for route: " + path + ". Current user: " + (errInfo.authInfo.email || 'Not logged in'));
  }
  throw new Error(JSON.stringify(errInfo));
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
  saveApps: (apps: AppConfig[]) => Promise<void>;
  saveSettings: (settings: GlobalSettings) => Promise<void>;
  saveNews: (news: NewsItem[]) => Promise<void>;
  saveBlogs: (blogs: BlogPost[]) => Promise<void>;
  saveVideos: (videos: VideoItem[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<AppConfig[]>(mockApps);
  const [settings, setSettings] = useState<GlobalSettings>(mockSettings);
  const [news, setNews] = useState<NewsItem[]>(mockNews);
  const [blogs, setBlogs] = useState<BlogPost[]>(mockBlogs);
  const [videos, setVideos] = useState<VideoItem[]>(mockVideos);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We could read/write individual documents, but since the previous code managed whole arrays,
    // we'll store the whole array in a single document for each type for simplicity given the current mockup status.
    const unsubs = [
      onSnapshot(doc(db, 'store_data', 'apps'), (snap) => {
        if (snap.exists()) setApps(snap.data().items || []);
      }, (err) => {
        if (err.message.includes('permissions')) return; // Ignore permission errors on initial load if not logged in for private docs (though these are public)
        console.error(err);
      }),
      onSnapshot(doc(db, 'store_data', 'settings'), (snap) => {
        if (snap.exists()) setSettings(snap.data() as GlobalSettings);
      }, (err) => {
        if (err.message.includes('permissions')) return;
        console.error(err);
      }),
      onSnapshot(doc(db, 'store_data', 'news'), (snap) => {
        if (snap.exists()) setNews(snap.data().items || []);
      }, (err) => {
        if (err.message.includes('permissions')) return;
        console.error(err);
      }),
      onSnapshot(doc(db, 'store_data', 'blogs'), (snap) => {
        if (snap.exists()) setBlogs(snap.data().items || []);
      }, (err) => {
        if (err.message.includes('permissions')) return;
        console.error(err);
      }),
      onSnapshot(doc(db, 'store_data', 'videos'), (snap) => {
        if (snap.exists()) setVideos(snap.data().items || []);
      }, (err) => {
        if (err.message.includes('permissions')) return;
        console.error(err);
      })
    ];
    
    // Simulate loading for UI
    setTimeout(() => setLoading(false), 500);

    return () => unsubs.forEach(u => u());
  }, []);

  const saveApps = async (newApps: AppConfig[]) => {
    try {
      await setDoc(doc(db, 'store_data', 'apps'), { items: newApps });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'store_data/apps');
    }
  };
  const saveSettings = async (newSettings: GlobalSettings) => {
    try {
      await setDoc(doc(db, 'store_data', 'settings'), newSettings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'store_data/settings');
    }
  };
  const saveNews = async (newNews: NewsItem[]) => {
    try {
      await setDoc(doc(db, 'store_data', 'news'), { items: newNews });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'store_data/news');
    }
  };
  const saveBlogs = async (newBlogs: BlogPost[]) => {
    try {
      await setDoc(doc(db, 'store_data', 'blogs'), { items: newBlogs });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'store_data/blogs');
    }
  };
  const saveVideos = async (newVideos: VideoItem[]) => {
    try {
      await setDoc(doc(db, 'store_data', 'videos'), { items: newVideos });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'store_data/videos');
    }
  };

  return (
    <DataContext.Provider value={{ apps, settings, news, blogs, videos, loading, saveApps, saveSettings, saveNews, saveBlogs, saveVideos }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
