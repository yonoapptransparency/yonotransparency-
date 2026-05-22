import { useState, useEffect } from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function FallbackRouteMatcher() {
  const location = useLocation();
  const { apps, news, blogs, videos, loading, refreshAll } = useData();
  
  // Clean pathname into a lowercase slug
  const rawPath = location.pathname;
  const slug = rawPath.replace(/^\/|\/$/g, '').toLowerCase().trim();
  
  const [resolvedType, setResolvedType] = useState<'app' | 'news' | 'blog' | 'video' | 'loading' | 'not_found'>('loading');
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (loading) {
      setResolvedType('loading');
      return;
    }

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

    // Trigger on-demand sync from servers if we haven't found a match yet in local cache
    if (!triedRefresh && !isRefreshing) {
      setIsRefreshing(true);
      console.log(`Fallback Match: Slug "${slug}" not found in cache. Triggering full sync...`);
      refreshAll(true)
        .catch(err => console.error("Fallback route match auto-sync failed:", err))
        .finally(() => {
          setTriedRefresh(true);
          setIsRefreshing(false);
        });
      setResolvedType('loading');
      return;
    }

    if (isRefreshing) {
      setResolvedType('loading');
      return;
    }

    setResolvedType('not_found');
  }, [slug, apps, news, blogs, videos, loading, triedRefresh, isRefreshing, refreshAll]);

  if (resolvedType === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-10 h-10 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600 italic animate-pulse">Resolving secure URL...</p>
      </div>
    );
  }

  if (resolvedType === 'app') {
    return <Navigate to={`/app/${slug}`} replace />;
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
    <div className="text-center py-20 text-slate-500 px-4 min-h-[40vh] flex flex-col justify-center items-center">
      <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center mb-6 border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.15)] mx-auto">
        <span className="text-2xl font-black italic">404</span>
      </div>
      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-800">Connection Failed</h1>
      <p className="max-w-md mx-auto text-sm text-slate-500 mt-3 mb-8 leading-relaxed">
        We could not resolve this link to any secure application listing, news bulletin, or blog dispatch in our dynamic cloud repository.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Return to Storefront
      </Link>
    </div>
  );
}
