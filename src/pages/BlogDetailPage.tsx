import { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, MessageSquare, Send, Calendar, User, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

export default function BlogDetailPage() {
  const { blogs: mockBlogs, settings: mockSettings } = useData();
  const { slug } = useParams();
  const blog = mockBlogs.find(b => b.slug === slug);
  const [commentText, setCommentText] = useState('');
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!blog) {
    return <Navigate to="/blogs" />;
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 sm:px-6 mb-20">
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

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": blog.title,
            "description": blog.content.substring(0, 160),
            "image": [blog.cover_url],
            "datePublished": new Date(blog.published_at).toISOString(),
            "author": [{
              "@type": "Person",
              "name": blog.author || "Admin"
            }]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": window.location.origin
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Blogs",
                "item": window.location.origin + "/blogs"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": blog.title,
                "item": window.location.href
              }
            ]
          })}
        </script>
      </Helmet>
      
      <div className="mb-8">
        <Link 
          to="/blogs" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-colors group"
        >
          <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Back to logs
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl overflow-hidden border-2 border-white/20 dark:border-white/10 rounded-[3rem] shadow-2xl"
      >
        {blog.cover_url && (
            <div className="w-full h-80 md:h-[450px] relative">
                <img src={blog.cover_url} alt={blog.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-pink-500" />
                        <span className="text-white text-[8px] font-black uppercase tracking-[0.3em] italic">{new Date(blog.published_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-pink-500" />
                        <span className="text-white text-[8px] font-black uppercase tracking-[0.3em] italic">Extraction Time: 5 min</span>
                      </div>
                   </div>
                   <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter italic leading-tight drop-shadow-2xl">
                    {blog.title}
                   </h1>
                </div>
            </div>
        )}
        
        <div className="p-8 sm:p-14">
            {!blog.cover_url && (
              <h1 className="text-3xl sm:text-5xl font-black mb-10 uppercase tracking-tighter dark:text-white italic leading-tight">
                {blog.title}
              </h1>
            )}
            
            <div className="flex items-center gap-6 mb-12 pb-10 border-b-2 border-black/5 dark:border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-pink-600 text-white flex items-center justify-center font-black text-2xl italic shadow-2xl shadow-pink-500/30 border-2 border-white dark:border-white/10">
                   {blog.author ? blog.author.charAt(0) : 'A'}
                </div>
                <div>
                    <p className="font-black text-xl uppercase tracking-tighter dark:text-white italic">Administrator: {blog.author}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 dark:text-white/60">Intelligence & Strategy Wing</p>
                </div>
            </div>

            <div className="prose prose-pink dark:prose-invert max-w-none mb-12 font-bold opacity-80 leading-relaxed text-sm sm:text-base">
                <ReactMarkdown>{blog.content}</ReactMarkdown>
            </div>

            <div className="mt-20 pt-14 border-t-4 border-pink-500/20">
              <h3 className="text-2xl font-black flex items-center gap-4 mb-10 uppercase tracking-tighter dark:text-white italic">
                <MessageSquare className="w-8 h-8 text-pink-500" />
                Transmission Feed
              </h3>
              
              <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[2.5rem] border-2 border-dashed border-black/10 dark:border-white/10 text-center">
                 <p className="text-xs font-black uppercase tracking-widest opacity-40 dark:text-white mb-6 italic">Secure Channel Awaiting Input</p>
                 <div className="flex justify-center">
                   <button className="bg-pink-500 text-white px-10 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] italic shadow-2xl shadow-pink-500/30 active:scale-95">Open Channel</button>
                 </div>
              </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
