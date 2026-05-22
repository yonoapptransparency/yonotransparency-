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
  const blog = mockBlogs.find(b => b.slug?.toLowerCase() === slug?.toLowerCase());
  
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Automatically trigger a silent cloud sync if the requested item is not found in local cache
  useEffect(() => {
    let active = true;
    const fetchLatestBlog = async () => {
      const found = mockBlogs.some(b => b.slug?.toLowerCase() === slug?.toLowerCase());
      if (!found && !triedRefresh && !isRefreshing) {
        if (active) {
          setIsRefreshing(true);
        }
        console.log(`Deep Link Sync: Blog "${slug}" not found in local cache. Syncing latest indices...`);
        try {
          await refreshAll(true);
        } catch (e) {
          console.error("Deep Link Blog Auto-Sync failed:", e);
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

  // Initial loading phase (waiting for setup/cache checks)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="w-10 h-10 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600 italic animate-pulse">Loading editorial feed...</p>
      </div>
    );
  }

  // Graceful interstitial for slow database cold-starts or deep links on first visit
  if (!blog && (!serverBlogsFetched || !blogsSyncedWithServer || isRefreshing)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-10 h-10 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]"></div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mt-2">Syncing Editorial Feed</h3>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          Retrieving expert editorial analysis with the secure database gateway. Establishing secure cloud connection...
        </p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center mb-6 border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.15)]">
          <ShieldAlert className="w-8 h-8 animate-pulse text-red-600" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-800">Editorial Not Found</h1>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed mb-8">
          The requested editorial article "<span className="font-mono font-bold text-red-600">{slug}</span>" could not be located. It may have been archived, or it is taking a few moments to sync database records.
        </p>
        <Link 
          to="/blogs" 
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" /> View other editorials
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 plain-content mb-20">
      <Helmet>
        <title>{blog.seo_title || blog.title} - {mockSettings.site_title}</title>
        <meta name="description" content={blog.seo_description || blog.content.substring(0, 160)} />
        {blog.seo_keywords && <meta name="keywords" content={blog.seo_keywords} />}
        <meta name="author" content={blog.author || "Administrator"} />
        <meta name="robots" content="index, follow" />
        {blog.target_region && <meta name="geo.region" content={blog.target_region} />}
        {blog.target_region && <meta name="coverage" content={blog.target_region} />}
        <link rel="canonical" href={window.location.origin + "/blog/" + blog.slug} />

        <meta property="og:title" content={blog.seo_title || blog.title} />
        <meta property="og:description" content={blog.seo_description || blog.content.substring(0, 160)} />
        <meta property="og:image" content={blog.cover_url} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="article:published_time" content={new Date(blog.published_at).toISOString()} />
        <meta property="article:author" content={blog.author} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.seo_title || blog.title} />
        <meta name="twitter:description" content={blog.seo_description || blog.content.substring(0, 160)} />
        <meta name="twitter:image" content={blog.cover_url} />
      </Helmet>
      
      <div className="mb-10">
        <Link 
          to="/blogs" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] opacity-40 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-3 h-3" />
          Intelligence Logs
        </Link>
      </div>

      <motion.article 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="mb-12">
            <h1 className="text-4xl sm:text-7xl font-black mb-8 uppercase tracking-tighter italic leading-none text-slate-900">
                {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(blog.published_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    5 min read
                </div>
                <div className="flex items-center gap-2 py-1 px-3 border border-black/10 rounded-full">
                    {blog.author}
                </div>
            </div>
        </header>

        {blog.cover_url && (
            <div className="w-full aspect-video mb-12 rounded-3xl overflow-hidden shadow-lg">
                <img src={blog.cover_url} alt={blog.title} className="w-full h-full object-cover" />
            </div>
        )}
        
        <div className="prose prose-slate max-w-none mb-20 font-medium text-lg leading-relaxed text-slate-600">
            <ReactMarkdown>{blog.content}</ReactMarkdown>
        </div>

        <footer className="border-t border-black/5 pt-12">
            <div className="flex items-center gap-4 mb-8">
                <MessageSquare className="w-5 h-5 text-red-600" />
                <h3 className="text-xs font-black uppercase tracking-widest italic">Transmission Feed</h3>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl text-center border border-black/5">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 italic">Secure Channel Awaiting Input</p>
                <button className="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] italic active:scale-95 transition-transform">
                    Authorize Transmission
                </button>
            </div>
        </footer>
      </motion.article>
    </div>
  );
}
