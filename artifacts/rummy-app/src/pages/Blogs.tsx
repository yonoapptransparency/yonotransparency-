import { useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

export default function Blogs() {
  const { settings: mockSettings, blogs: mockBlogs } = useData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="animate-fade-in max-w-[1550px] mx-auto py-12 plain-content px-3 sm:px-6 md:px-10">
      <Helmet>
        <title>Intelligence Logs & Stories - {mockSettings.site_title}</title>
        <meta name="description" content="In-depth logs, stories, and articles about our secure ecosystem." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.origin + "/blogs"} />
      </Helmet>

      <div className="mb-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors group"
        >
          <div className="p-1.5 rounded-full bg-blue-50 group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Home
        </Link>
      </div>

      <div className="flex items-center gap-6 mb-12 border-b border-black/5 dark:border-white/5 pb-8">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-500 shadow-sm border border-blue-100 dark:border-blue-500/20">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 m-0">Editorial</h1>
      </div>

      {mockBlogs.length === 0 ? (
        <div className="text-center py-24 text-zinc-500 font-medium text-lg">
          No logs available
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-12 sm:gap-16">
          {mockBlogs.map(blog => (
            <motion.div 
               key={blog.id} 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="group flex flex-col"
            >
              <Link to={`/blog/${encodeURIComponent(blog.slug || blog.id)}`} className="block h-64 sm:h-80 rounded-[24px] overflow-hidden mb-6 shadow-sm border border-black/5">
                <img src={blog.cover_url || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop`} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </Link>
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">Article</span>
                  <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(blog.published_at).toLocaleDateString()}
                  </div>
                </div>
                <Link to={`/blog/${encodeURIComponent(blog.slug || blog.id)}`} className="text-2xl sm:text-3xl font-bold mb-3 text-zinc-900 leading-tight hover:text-blue-600 transition-colors">
                  {blog.title}
                </Link>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-xs font-semibold text-zinc-500">By {blog.author}</div>
                </div>
                <p className="text-base text-zinc-500 mb-6 line-clamp-3 leading-relaxed">{blog.content.substring(0, 150)}...</p>
                <Link to={`/blog/${encodeURIComponent(blog.slug || blog.id)}`} className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
                  Read Article <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
