import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, MessageSquare, Send, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
}

export default function NewsDetailPage() {
  const { news: mockNews, settings: mockSettings, loading, newsSyncedWithServer, serverNewsFetched, refreshAll } = useData();
  const { slug } = useParams();
  const newsItem = mockNews.find(n => n.slug?.toLowerCase() === slug?.toLowerCase());
  const [commentText, setCommentText] = useState('');
  
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Automatically trigger a silent cloud sync if the requested item is not found in local cache
  useEffect(() => {
    let active = true;
    const fetchLatestNews = async () => {
      const found = mockNews.some(n => n.slug?.toLowerCase() === slug?.toLowerCase());
      if (!found && !triedRefresh && !isRefreshing) {
        if (active) {
          setIsRefreshing(true);
        }
        console.log(`Deep Link Sync: News "${slug}" not found in local cache. Syncing latest indices...`);
        try {
          await refreshAll(true);
        } catch (e: any) {
          console.warn("Deep Link News Auto-Sync failed:", e.message || e);
        } finally {
          if (active) {
            setTriedRefresh(true);
            setIsRefreshing(false);
          }
        }
      }
    };
    fetchLatestNews();
    return () => {
      active = false;
    };
  }, [slug, mockNews, triedRefresh, isRefreshing, refreshAll]);

  const getInitialComments = () => {
    const saved = localStorage.getItem(`comments_${slug}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        id: '1',
        author: 'Jane Doe',
        content: 'Thanks for sharing this news. Very informative!',
        date: new Date(Date.now() - 86400000).toLocaleDateString()
      }
    ];
  };

  const [comments, setComments] = useState<Comment[]>(getInitialComments);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      author: 'Guest User',
      content: commentText,
      date: new Date().toLocaleDateString()
    };

    const newCommentsList = [newComment, ...comments];
    setComments(newCommentsList);
    localStorage.setItem(`comments_${slug}`, JSON.stringify(newCommentsList));
    setCommentText('');
  };

  if (loading && !newsItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide text-zinc-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  // Graceful interstitial for slow database cold-starts or deep links on first visit
  if (!newsItem && (!serverNewsFetched || !newsSyncedWithServer || isRefreshing || !triedRefresh)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-8 h-8 border-[3px] border-black/10 dark:border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2">Syncing</h3>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          Retrieving live updates from our network.
        </p>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">News Not Found</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-3 leading-relaxed mb-8">
          The requested article "<span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{slug}</span>" could not be located.
        </p>
        <Link 
          to="/news" 
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[16px] font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> View other news
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-[1550px] mx-auto px-3 sm:px-6 md:px-10 plain-content mb-20">
      <Helmet>
        <title>{newsItem.title} - {mockSettings.site_title}</title>
        <meta name="description" content={newsItem.description} />
        {newsItem.seo_keywords && <meta name="keywords" content={newsItem.seo_keywords} />}
        <meta name="author" content={newsItem.ceo_name || mockSettings.site_title} />
        <meta name="robots" content="index, follow" />
        {newsItem.target_region && <meta name="geo.region" content={newsItem.target_region} />}
        {newsItem.target_region && <meta name="coverage" content={newsItem.target_region} />}
        <link rel="canonical" href={window.location.origin + "/news/" + newsItem.slug} />

        <meta property="og:title" content={newsItem.title} />
        <meta property="og:description" content={newsItem.description} />
        <meta property="og:image" content={newsItem.og_image_url || newsItem.logo_url} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="article:published_time" content={newsItem.published_at || new Date().toISOString()} />
        <meta property="article:author" content={newsItem.ceo_name} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={newsItem.title} />
        <meta name="twitter:description" content={newsItem.description} />
        <meta name="twitter:image" content={newsItem.og_image_url || newsItem.logo_url} />
      </Helmet>
      
      <div className="mb-10">
        <Link 
          to="/news" 
           className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors group"
        >
          <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          News Index
        </Link>
      </div>

      <motion.article 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{newsItem.category || 'Official Report'}</span>
                <span className="text-zinc-400 text-[10px] font-medium tracking-wider uppercase">Code: NT-{newsItem.id}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-6 text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.1]">
                {newsItem.title}
            </h1>
            
            <div className="flex items-center gap-4 pb-8 border-b border-black/5 dark:border-white/5">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center font-bold text-xl m-0">
                   {newsItem.ceo_name ? newsItem.ceo_name.charAt(0) : 'C'}
                </div>
                <div>
                    <p className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 leading-tight">{newsItem.ceo_name}</p>
                    <p className="text-sm font-medium text-zinc-500 mt-0.5">{newsItem.ceo_description || 'Chief Intelligence Officer'}</p>
                </div>
            </div>
        </header>

        {newsItem.logo_url && (
            <div className="w-full aspect-video mb-12 rounded-3xl overflow-hidden shadow-sm border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900">
                <img src={newsItem.logo_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80'} alt={newsItem.title} loading="eager" decoding="async" className="w-full h-full object-cover" />
            </div>
        )}
        
        <div className="prose prose-zinc dark:prose-invert max-w-none mb-16">
            <p className="text-xl sm:text-2xl font-medium mb-12 text-zinc-700 dark:text-zinc-300 leading-relaxed">{newsItem.description}</p>
            <div 
              className="font-normal text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-none prose prose-zinc dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: newsItem.content || newsItem.description_html || '' }} 
            />
        </div>

        {(newsItem as any).link && (
            <div className="mb-20">
                <a href={newsItem.link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-[16px] hover:bg-blue-700 transition-all active:scale-[0.98] shadow-md">
                    Get App Details
                </a>
            </div>
        )}

        <footer className="border-t border-black/5 dark:border-white/5 pt-12">
            <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Discussion ({comments.length})</h3>
            </div>
            
            <form onSubmit={handleAddComment} className="mb-12">
                <div className="relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl p-4 pr-16 transition-all min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 font-normal text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-[0.95]"
                  >
                    <Send className="w-4 h-4 mr-0.5" />
                  </button>
                </div>
            </form>

            <div className="space-y-4">
                {comments.map((comment) => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={comment.id} 
                    className="p-6 border border-black/5 dark:border-white/10 rounded-[20px] bg-white dark:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-600 dark:text-zinc-400 shrink-0">
                            {comment.author.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-none mb-1">{comment.author}</p>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{comment.date}</p>
                        </div>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">{comment.content}</p>
                  </motion.div>
                ))}
            </div>
        </footer>
      </motion.article>
    </div>
  );
}
