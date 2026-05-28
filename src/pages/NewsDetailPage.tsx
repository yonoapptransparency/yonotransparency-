import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, MessageSquare, Send, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
        } catch (e) {
          console.error("Deep Link News Auto-Sync failed:", e);
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

  // Initial loading phase (waiting for setup/cache checks)
  if (loading && !newsItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="w-10 h-10 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600 italic animate-pulse">Loading intel feed...</p>
      </div>
    );
  }

  // Graceful interstitial for slow database cold-starts or deep links on first visit
  if (!newsItem && (!serverNewsFetched || !newsSyncedWithServer || isRefreshing)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-10 h-10 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]"></div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mt-2">Syncing Intel Feed</h3>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          Retrieving live updates from our transparent security intel network. Establishing secure cloud connection...
        </p>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center mb-6 border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.15)]">
          <ShieldAlert className="w-8 h-8 animate-pulse text-red-600" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-800">Intel Feed Not Found</h1>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed mb-8">
          The requested intel feed item "<span className="font-mono font-bold text-red-600">{slug}</span>" could not be located. It may have been archived, or it is taking a few moments to sync database records.
        </p>
        <Link 
          to="/news" 
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" /> View other news
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 plain-content mb-20">
      <Helmet>
        <title>{newsItem.seo_title || newsItem.title} - {mockSettings.site_title}</title>
        <meta name="description" content={newsItem.seo_description || newsItem.description} />
        {newsItem.seo_keywords && <meta name="keywords" content={newsItem.seo_keywords} />}
        <meta name="author" content={newsItem.ceo_name || "RUMMY STORE"} />
        <meta name="robots" content="index, follow" />
        {newsItem.target_region && <meta name="geo.region" content={newsItem.target_region} />}
        {newsItem.target_region && <meta name="coverage" content={newsItem.target_region} />}
        <link rel="canonical" href={window.location.origin + "/news/" + newsItem.slug} />

        <meta property="og:title" content={newsItem.seo_title || newsItem.title} />
        <meta property="og:description" content={newsItem.seo_description || newsItem.description} />
        <meta property="og:image" content={newsItem.og_image_url || newsItem.logo_url} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta property="article:published_time" content={newsItem.published_at || new Date().toISOString()} />
        <meta property="article:author" content={newsItem.ceo_name} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={newsItem.seo_title || newsItem.title} />
        <meta name="twitter:description" content={newsItem.seo_description || newsItem.description} />
        <meta name="twitter:image" content={newsItem.og_image_url || newsItem.logo_url} />
      </Helmet>
      
      <div className="mb-10">
        <Link 
          to="/news" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] opacity-40 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-3 h-3" />
          News Index
        </Link>
      </div>

      <motion.article 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
                <span className="bg-red-600 text-white text-[8px] font-black px-3 py-1 rounded uppercase tracking-[0.3em] italic shadow-lg shadow-red-600/20">Official Transmission</span>
                <span className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em]">Code: NT-{newsItem.id}</span>
            </div>
            <h1 className="text-4xl sm:text-7xl font-black mb-8 uppercase tracking-tighter italic leading-none text-slate-900">
                {newsItem.title}
            </h1>
            
            <div className="flex items-center gap-6 pb-8 border-b border-black/5">
                <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-2xl italic shadow-lg shadow-red-600/20 m-0">
                   {newsItem.ceo_name ? newsItem.ceo_name.charAt(0) : 'C'}
                </div>
                <div>
                    <p className="font-black text-xl uppercase tracking-tighter italic leading-none">{newsItem.ceo_name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">{newsItem.ceo_description || 'Chief Intelligence Officer'}</p>
                </div>
            </div>
        </header>

        {newsItem.logo_url && (
            <div className="w-full aspect-video mb-12 rounded-3xl overflow-hidden shadow-lg">
                <img src={newsItem.logo_url} alt={newsItem.title} className="w-full h-full object-cover" />
            </div>
        )}
        
        <div className="prose prose-slate max-w-none mb-16">
            <p className="text-xl sm:text-2xl font-black mb-12 text-slate-900 leading-relaxed italic opacity-90">{newsItem.description}</p>
            <div className="font-medium text-lg text-slate-600 leading-relaxed">
              <ReactMarkdown>{newsItem.content}</ReactMarkdown>
            </div>
        </div>

        {newsItem.link && (
            <div className="mb-20">
                <a href={newsItem.link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center min-h-[56px] px-10 bg-slate-900 text-white font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-black transition-all italic active:scale-95 shadow-xl">
                    Access External Feed
                </a>
            </div>
        )}

        <footer className="border-t border-black/5 pt-12">
            <div className="flex items-center gap-4 mb-10">
                <MessageSquare className="w-5 h-5 text-red-600" />
                <h3 className="text-xs font-black uppercase tracking-widest italic">Intelligence Feed ({comments.length})</h3>
            </div>
            
            <form onSubmit={handleAddComment} className="mb-14">
                <div className="relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Broadcast your thoughts..."
                    className="w-full bg-slate-50 border border-black/5 rounded-3xl p-6 pr-20 transition-all min-h-[120px] resize-none outline-none font-bold text-slate-900 focus:bg-white focus:border-red-600/20"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute bottom-6 right-6 w-12 h-12 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-20 active:scale-90"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
            </form>

            <div className="space-y-6">
                {comments.map((comment) => (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={comment.id} 
                    className="p-8 border border-black/5 rounded-3xl"
                  >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-sm italic">
                            {comment.author.charAt(0)}
                        </div>
                        <div>
                            <p className="font-black uppercase tracking-tighter italic text-sm">{comment.author}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-30">{comment.date}</p>
                        </div>
                    </div>
                    <p className="font-bold text-slate-600 leading-relaxed text-sm">{comment.content}</p>
                  </motion.div>
                ))}
            </div>
        </footer>
      </motion.article>
    </div>
  );
}
