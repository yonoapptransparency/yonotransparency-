import { useState, useEffect } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import AppDetails from '../pages/AppDetails';

export default function FallbackRouteMatcher() {
  const location = useLocation();
  const { apps, news, blogs, videos, loading, refreshAll } = useData();
  
  // Clean pathname into a lowercase slug
  const rawPath = decodeURIComponent(location.pathname);
  const slug = rawPath.replace(/^\/|\/$/g, '').toLowerCase().trim();
  
  const [resolvedType, setResolvedType] = useState<'app' | 'news' | 'blog' | 'video' | 'loading' | 'not_found'>('loading');
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!slug) {
      setResolvedType('not_found');
      return;
    }

    const appExists = apps.some(a => a.slug?.toLowerCase() === slug);
    if (appExists) {
      setResolvedType('app');
      return;
    }

    const newsExists = news.some(n => n.slug?.toLowerCase() === slug);
    if (newsExists) {
      setResolvedType('news');
      return;
    }

    const blogExists = blogs.some(b => b.slug?.toLowerCase() === slug);
    if (blogExists) {
      setResolvedType('blog');
      return;
    }

    const videoExists = videos.some(v => v.slug?.toLowerCase() === slug);
    if (videoExists) {
      setResolvedType('video');
      return;
    }

    if (loading) {
      setResolvedType('loading');
      return;
    }

    // Trigger on-demand sync from servers if we haven't found a match yet in local cache
    if (!triedRefresh && !isRefreshing) {
      setIsRefreshing(true);
      console.log(`Fallback Match: Slug "${slug}" not found in cache. Triggering full sync...`);
      refreshAll(true)
        .catch(err => console.warn("Fallback route match auto-sync failed:", err.message || err))
        .finally(() => {
          setTriedRefresh(true);
          setIsRefreshing(false);
          // Wait for next render cycle to evaluate state
        });
      setResolvedType('loading');
      return;
    }

    if (isRefreshing || !triedRefresh) {
      setResolvedType('loading');
      return;
    }

    setResolvedType('not_found');
  }, [slug, apps, news, blogs, videos, loading, triedRefresh, isRefreshing, refreshAll]);

  if (resolvedType === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide text-zinc-500 animate-pulse">Resolving URL...</p>
      </div>
    );
  }

  if (resolvedType === 'app') {
    return <AppDetails />;
  }

  if (resolvedType === 'news') {
    return <Navigate to={`/news/${slug}`} replace />;
  }

  if (resolvedType === 'blog') {
    return <Navigate to={`/blog/${slug}`} replace />;
  }

  if (resolvedType === 'video') {
    return <Navigate to={`/videos/${slug}`} replace />;
  }

  return (
    <div className="text-center py-20 px-4 min-h-[40vh] flex flex-col justify-center items-center">
      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-2xl font-bold">404</span>
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Page Not Found</h1>
      <p className="max-w-md mx-auto text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed font-medium">
        We could not resolve this link to any application listing, news bulletin, or blog post.
      </p>
      <Link 
        to="/" 
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[16px] font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
      >
        Return to Home
      </Link>
    </div>
  );
}
