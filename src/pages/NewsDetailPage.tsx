import { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
}

export default function NewsDetailPage() {
  const { apps: mockApps, settings: mockSettings, news: mockNews, blogs: mockBlogs, videos: mockVideos, saveApps: saveMockApps, saveSettings: saveMockSettings, saveNews: saveMockNews, saveBlogs: saveMockBlogs, saveVideos: saveMockVideos } = useData();
  const { slug } = useParams();
  const newsItem = mockNews.find(n => n.slug === slug);
  const [commentText, setCommentText] = useState('');
  
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

  if (!newsItem) {
    return <Navigate to="/news" />;
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 sm:px-6 mb-20">
      <Helmet>
        <title>{newsItem.seo_title || newsItem.title}</title>
        <meta name="description" content={newsItem.seo_description || newsItem.description} />
        {newsItem.seo_keywords && <meta name="keywords" content={newsItem.seo_keywords} />}
        <meta property="og:title" content={newsItem.seo_title || newsItem.title} />
        <meta property="og:description" content={newsItem.seo_description || newsItem.description} />
        <meta property="og:image" content={newsItem.og_image_url || newsItem.logo_url} />
        <meta property="og:type" content="article" />
      </Helmet>
      
      <div className="mb-6">
        <Link 
          to="/news" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-colors group"
        >
          <div className="p-2 rounded-full bg-black/5 border border-black/5 group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Back to news index
        </Link>
      </div>

      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl overflow-hidden border-2 border-white/20 dark:border-white/10 rounded-[3rem] shadow-2xl">
        {newsItem.logo_url && (
            <div className="w-full h-80 md:h-[450px] relative">
                <img src={newsItem.logo_url} alt={newsItem.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                   <div className="flex items-center gap-2 mb-4">
                      <span className="bg-pink-600 text-white text-[8px] font-black px-3 py-1 rounded uppercase tracking-[0.3em] italic">Official Transmission</span>
                      <span className="text-white/40 text-[8px] font-black uppercase tracking-[0.3em]">Code: NT-{newsItem.id}</span>
                   </div>
                   <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter italic leading-tight drop-shadow-2xl">
                    {newsItem.title}
                   </h1>
                </div>
            </div>
        )}
        
        <div className="p-8 sm:p-14">
            {!newsItem.logo_url && (
              <h1 className="text-3xl sm:text-5xl font-black mb-10 uppercase tracking-tighter dark:text-white italic leading-tight">
                {newsItem.title}
              </h1>
            )}
            
            <div className="flex items-center gap-6 mb-12 pb-10 border-b-2 border-black/5 dark:border-white/5">
                <div className="w-20 h-20 rounded-full bg-pink-600 text-white flex items-center justify-center font-black text-3xl italic shadow-2xl shadow-pink-500/30 border-4 border-white dark:border-white/10">
                   {newsItem.ceo_name ? newsItem.ceo_name.charAt(0) : 'C'}
                </div>
                <div>
                    <p className="font-black text-2xl uppercase tracking-tighter dark:text-white italic">{newsItem.ceo_name}</p>
                    <p className="text-xs font-black uppercase tracking-widest opacity-40 dark:text-white/60">{newsItem.ceo_description || 'Chief Intelligence Officer'}</p>
                </div>
            </div>

            <div className="prose prose-pink dark:prose-invert max-w-none mb-12">
                <p className="text-xl sm:text-2xl font-black mb-10 dark:text-white leading-relaxed italic opacity-90">{newsItem.description}</p>
                <div className="font-bold leading-relaxed opacity-80 text-sm sm:text-base">
                  <ReactMarkdown>{newsItem.content}</ReactMarkdown>
                </div>
            </div>

            {newsItem.link && (
                <div className="mt-14 pt-10 border-t-2 border-black/5 dark:border-white/5">
                    <a href={newsItem.link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center min-h-[64px] px-12 bg-pink-500 text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] hover:bg-pink-600 transition-all shadow-2xl shadow-pink-500/30 italic active:scale-95">
                        Access External Feed
                    </a>
                </div>
            )}

            <div className="mt-20 pt-14 border-t-4 border-pink-500/20">
              <h3 className="text-2xl font-black flex items-center gap-4 mb-10 uppercase tracking-tighter dark:text-white italic">
                <MessageSquare className="w-8 h-8 text-pink-500" />
                Intelligence Feed ({comments.length})
              </h3>
              
              <form onSubmit={handleAddComment} className="mb-14">
                <div className="relative group">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Broadcast your thoughts..."
                    className="w-full bg-black/5 dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-[2.5rem] p-6 pr-20 focus:border-pink-500 transition-all min-h-[150px] resize-none outline-none font-bold dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute bottom-6 right-6 w-14 h-14 bg-pink-500 text-white rounded-2xl flex items-center justify-center hover:bg-pink-600 transition-all shadow-xl shadow-pink-500/20 disabled:opacity-20 disabled:grayscale active:scale-90"
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
                        <div className="w-14 h-14 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-black text-xl italic border-2 border-pink-500/20">
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
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
