import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, MessageSquare, Calendar, Clock, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

export default function BlogDetailPage() {
  const { blogs: mockBlogs, settings: mockSettings, loading, blogsSyncedWithServer, serverBlogsFetched, refreshAll } = useData();
  const { slug } = useParams();
  const blog = mockBlogs.find(b => b.slug?.toLowerCase() === slug?.toLowerCase() || b.id?.toLowerCase() === slug?.toLowerCase());
  
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Automatically trigger a silent cloud sync if the requested item is not found in local cache
  useEffect(() => {
    let active = true;
    const fetchLatestBlog = async () => {
      const found = mockBlogs.some(b => b.slug?.toLowerCase() === slug?.toLowerCase() || b.id?.toLowerCase() === slug?.toLowerCase());
      if (!found && !triedRefresh && !isRefreshing) {
        if (active) {
          setIsRefreshing(true);
        }
        console.log(`Deep Link Sync: Blog "${slug}" not found in local cache. Syncing latest indices...`);
        try {
          await refreshAll(true);
        } catch (e: any) {
          console.warn("Deep Link Blog Auto-Sync failed:", e.message || e);
        } finally {
          if (active) {
            setTriedRefresh(true);
            setIsRefreshing(false);
          }
        }
      }
    };
    fetchLatestBlog();
    return () => {
      active = false;
    };
  }, [slug, mockBlogs, triedRefresh, isRefreshing, refreshAll]);

  if (loading && !blog) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide text-zinc-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  // Graceful interstitial for slow database cold-starts or deep links on first visit
  if (!blog && (!serverBlogsFetched || !blogsSyncedWithServer || isRefreshing || !triedRefresh)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2">Syncing</h3>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          Retrieving expert editorial analysis.
        </p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Editorial Not Found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-3 leading-relaxed mb-8">
          The requested article "<span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{slug}</span>" could not be located.
        </p>
        <Link 
          to="/blogs" 
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[16px] font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> View other editorials
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-[1550px] mx-auto px-3 sm:px-6 md:px-10 plain-content mb-20">
      <Helmet>
        <title>{blog.title} - {mockSettings.site_title}</title>
        <meta name="description" content={blog.content.substring(0, 160).replace(/<[^>]*>?/gm, '')} />
        {blog.seo_keywords && <meta name="keywords" content={blog.seo_keywords} />}
        <meta name="author" content={blog.author || "Administrator"} />
        <meta name="robots" content="index, follow" />
        {blog.target_region && <meta name="geo.region" content={blog.target_region} />}
        {blog.target_region && <meta name="coverage" content={blog.target_region} />}
        <link rel="canonical" href={window.location.origin + "/blog/" + encodeURIComponent(blog.slug || blog.id)} />

        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.content.substring(0, 160).replace(/<[^>]*>?/gm, '')} />
        <meta property="og:image" content={blog.cover_url} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="article:published_time" content={new Date(blog.published_at).toISOString()} />
        <meta property="article:author" content={blog.author} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={blog.content.substring(0, 160).replace(/<[^>]*>?/gm, '')} />
        <meta name="twitter:image" content={blog.cover_url} />
      </Helmet>
      
      <div className="mb-10">
        <Link 
          to="/blogs" 
           className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors group"
        >
          <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Editorials
        </Link>
      </div>

      <motion.article 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="mb-12">
            <h1 className="text-3xl sm:text-5xl font-bold mb-8 text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.1]">
                {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-zinc-500">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(blog.published_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    5 min read
                </div>
                <div className="flex items-center gap-2 py-1 px-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-700 dark:text-zinc-300">
                    {blog.author}
                </div>
            </div>
        </header>

        {blog.cover_url && (
            <div className="w-full aspect-video mb-12 rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
                <img src={blog.cover_url} alt={blog.title} className="w-full h-full object-cover" />
            </div>
        )}
        
        <div className="prose prose-zinc dark:prose-invert max-w-none mb-20 font-normal text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            <ReactMarkdown>{blog.content}</ReactMarkdown>
        </div>

        <footer className="border-t border-black/5 dark:border-white/5 pt-12">
            <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Discussion</h3>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-[24px] text-center border border-black/5 dark:border-white/5">
                <p className="text-sm font-medium text-zinc-500 mb-6">Want to join the conversation?</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-[16px] font-semibold text-sm transition-all active:scale-[0.98]">
                    Sign In to Comment
                </button>
            </div>
        </footer>
      </motion.article>
    </div>
  );
}
