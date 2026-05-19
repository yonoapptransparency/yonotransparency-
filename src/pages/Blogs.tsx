import { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function Blogs() {
  const { settings: mockSettings, blogs: mockBlogs } = useData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto py-8">
      <Helmet>
        <title>Intelligence Logs & Stories - {mockSettings.site_title}</title>
        <meta name="description" content="In-depth logs, stories, and articles about our secure ecosystem." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.origin + "/blogs"} />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Intelligence Logs & Stories - ${mockSettings.site_title}`} />
        <meta property="og:description" content="In-depth logs, stories, and articles about our secure ecosystem." />
        <meta property="og:image" content={mockSettings.logo_url} />
        <meta property="og:url" content={window.location.origin + "/blogs"} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Intelligence Logs & Stories - ${mockSettings.site_title}`} />
        <meta name="twitter:description" content="In-depth logs, stories, and articles about our secure ecosystem." />
        <meta name="twitter:image" content={mockSettings.logo_url} />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Intelligence Logs",
            "description": "Blogs and stories from our portal.",
            "url": window.location.origin + "/blogs"
          })}
        </script>
      </Helmet>
      <div className="px-4 mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-colors group"
        >
          <div className="p-2 rounded-full bg-black/5 border border-black/5 group-hover:scale-110 transition-transform">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          Back to storefront
        </Link>
      </div>
      <div className="flex items-center gap-6 mb-12 border-b-4 border-black/5 dark:border-white/5 pb-8 px-4">
        <div className="p-4 bg-pink-600/10 rounded-[1.5rem] text-pink-600 shadow-2xl shadow-pink-500/20">
          <FileText className="w-10 h-10" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter dark:text-white italic">Intelligence Logs</h1>
      </div>

      {mockBlogs.length === 0 ? (
        <div className="text-center py-24 text-slate-500 font-black uppercase tracking-[0.4em] opacity-40 italic">
          - Feed Encrypted: No Logs Available -
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-10 px-4">
          {mockBlogs.map(blog => (
            <Link key={blog.id} to={`/blog/${blog.slug}`} className="group">
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-2 border-white/20 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl hover:border-pink-500/30 transition-all group relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="h-60 overflow-hidden border-b-2 border-white/10 relative">
                  <img src={blog.cover_url || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop`} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-6 flex items-center gap-2 text-[8px] text-white font-black uppercase tracking-widest italic">
                    <Calendar className="w-3 h-3 text-pink-500" />
                    {new Date(blog.published_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black mb-3 line-clamp-2 uppercase tracking-tighter dark:text-white italic leading-tight group-hover:text-pink-500 transition-colors">{blog.title}</h3>
                  <p className="text-xs opacity-60 line-clamp-3 mb-6 font-bold dark:text-white/60 leading-relaxed tracking-tight">{blog.content}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-[10px] font-black text-pink-500 uppercase tracking-widest italic flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center border border-pink-500/20">
                          {blog.author.charAt(0)}
                       </div>
                       By Administrator: {blog.author}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
