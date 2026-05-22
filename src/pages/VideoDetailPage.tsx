import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, MessageSquare, Send, Calendar, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
}

export default function VideoDetailPage() {
  const { videos: mockVideos, settings: mockSettings, loading, videosSyncedWithServer, serverVideosFetched, refreshAll } = useData();
  const { slug } = useParams();
  const videoItem = mockVideos.find(v => v.slug?.toLowerCase() === slug?.toLowerCase());
  const [commentText, setCommentText] = useState('');
  
  const [triedRefresh, setTriedRefresh] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Automatically trigger a silent cloud sync if the requested item is not found in local cache
  useEffect(() => {
    let active = true;
    const fetchLatestVideo = async () => {
      const found = mockVideos.some(v => v.slug?.toLowerCase() === slug?.toLowerCase());
      if (!found && !triedRefresh && !isRefreshing) {
        if (active) {
          setIsRefreshing(true);
        }
        console.log(`Deep Link Sync: Video "${slug}" not found in local cache. Syncing latest indices...`);
        try {
          await refreshAll(true);
        } catch (e) {
          console.error("Deep Link Video Auto-Sync failed:", e);
        } finally {
          if (active) {
            setTriedRefresh(true);
            setIsRefreshing(false);
          }
        }
      }
    };
    fetchLatestVideo();
    return () => {
      active = false;
    };
  }, [slug, mockVideos, triedRefresh, isRefreshing, refreshAll]);

  const getInitialComments = () => {
    const saved = localStorage.getItem(`video_comments_${slug}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
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
    localStorage.setItem(`video_comments_${slug}`, JSON.stringify(newCommentsList));
    setCommentText('');
  };

  // Initial loading phase (waiting for setup/cache checks)
  if (loading && !videoItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
        <div className="w-10 h-10 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(220,38,38,0.2)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600 italic animate-pulse">Loading secure transmission...</p>
      </div>
    );
  }

  // Graceful interstitial for slow database cold-starts or deep links on first visit
  if (!videoItem && (!serverVideosFetched || !videosSyncedWithServer || isRefreshing)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[40vh] text-center px-4 max-w-sm mx-auto">
        <div className="w-10 h-10 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]"></div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 mt-2">Syncing Transmission Feed</h3>
        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
          Verifying secure transmission logs with the secure database gateway. Establishing secure cloud connection...
        </p>
      </div>
    );
  }

  if (!videoItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center mb-6 border border-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.15)]">
          <ShieldAlert className="w-8 h-8 animate-pulse text-red-600" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-800">Transmission Not Found</h1>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed mb-8">
          The requested video transmission "<span className="font-mono font-bold text-red-600">{slug}</span>" could not be loaded. It may have been unlisted, or it is taking a few moments to sync database records.
        </p>
        <Link 
          to="/videos" 
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" /> View other videos
        </Link>
      </div>
    );
  }

  // Extract YouTube ID
  let videoId = '';
  try {
    const url = new URL(videoItem.youtube_url);
    if (url.hostname.includes('youtube.com')) {
      videoId = url.searchParams.get('v') || '';
    } else if (url.hostname.includes('youtu.be')) {
      videoId = url.pathname.slice(1);
    }
  } catch (e) {
    videoId = videoItem.youtube_url.split('/').pop() || '';
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      <Helmet>
        <title>{videoItem.seo_title || videoItem.title}</title>
        <meta name="description" content={videoItem.seo_description || videoItem.description} />
        {videoItem.seo_keywords && <meta name="keywords" content={videoItem.seo_keywords} />}
        <meta property="og:title" content={videoItem.seo_title || videoItem.title} />
        <meta property="og:description" content={videoItem.seo_description || videoItem.description} />
        <meta property="og:type" content="video.other" />
      </Helmet>
      
      <div className="mb-6">
        <Link 
          to="/videos" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-colors group"
        >
          <div className="p-2 rounded-full bg-black/5 border border-black/5 group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Back to all apps
        </Link>
      </div>

      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl border-2 border-white/20 dark:border-white/10 group relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"></div>
        <div className="relative aspect-video w-full bg-black shadow-2xl border-b-2 border-white/10 dark:border-white/5">
          {videoId ? (
            <iframe 
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0`} 
              title={videoItem.title}
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen>
            </iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-white font-black uppercase tracking-widest italic">Signal Error: Invalid Stream URL</div>
          )}
        </div>
        
        <div className="p-8 sm:p-14">
            <div className="flex items-center gap-3 mb-6">
                <span className="bg-pink-600 text-white text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.3em] italic shadow-xl shadow-pink-500/20">Active Stream</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 dark:text-white italic">Node: TV-{videoItem.id}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-8 tracking-tighter dark:text-white uppercase italic">
              {videoItem.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-10 pb-8 border-b-2 border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl border border-black/5 dark:border-white/5">
                <Calendar className="w-4 h-4 text-pink-500" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 dark:text-white">
                  Logged: {new Date(videoItem.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="prose prose-pink dark:prose-invert max-w-none opacity-80 font-bold leading-relaxed text-sm sm:text-base">
              <p>{videoItem.description}</p>
            </div>

            <div className="mt-20 pt-14 border-t-4 border-pink-500/20">
              <h3 className="text-2xl font-black flex items-center gap-4 mb-10 uppercase tracking-tighter dark:text-white italic">
                <MessageSquare className="w-8 h-8 text-pink-500" />
                Stream Reactions ({comments.length})
              </h3>
              
              <form onSubmit={handleAddComment} className="mb-14">
                <div className="relative group">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Provide intel..."
                    className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-[2.5rem] p-6 pr-20 focus:border-pink-500 transition-all min-h-[150px] resize-none outline-none font-bold dark:text-white placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-pink-500 text-white rounded-2xl flex items-center justify-center hover:bg-pink-600 transition-all shadow-xl shadow-pink-500/20 disabled:opacity-20 active:scale-90"
                    aria-label="Submit comment"
                  >
                    <Send className="w-6 h-6" />
                  </button>
                </div>
              </form>

              <div className="space-y-8">
                {comments.map((comment) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    key={comment.id} 
                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] p-8 border-2 border-white/20 dark:border-white/10 shadow-xl group hover:border-pink-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-black text-xl italic border-2 border-pink-500/20 shadow-inner">
                          {comment.author.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black uppercase tracking-tighter dark:text-white italic text-lg">{comment.author}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 dark:text-white">{comment.date}</p>
                        </div>
                      </div>
                    </div>
                    <p className="font-bold opacity-70 dark:text-white leading-relaxed text-sm">{comment.content}</p>
                  </motion.div>
                ))}
                {comments.length === 0 && (
                  <div className="py-20 text-center border-4 border-dashed border-black/5 dark:border-white/5 rounded-[3rem]">
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 italic dark:text-white">Secure Feed: Waiting for First Input</p>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
