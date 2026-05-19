import { Newspaper, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

export default function NewsPage() {
  const { apps: mockApps, settings: mockSettings, news: mockNews, blogs: mockBlogs, videos: mockVideos, saveApps: saveMockApps, saveSettings: saveMockSettings, saveNews: saveMockNews, saveBlogs: saveMockBlogs, saveVideos: saveMockVideos } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredNews = mockNews.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ceo_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in min-h-screen">
      <div className="px-1 mb-6">
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
      <Helmet>
        <title>Latest News & Updates - {mockSettings.site_title}</title>
        <meta name="description" content="Stay updated with the latest news, transmissions, and intel from our secure network." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.origin + "/news"} />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Latest News & Updates - ${mockSettings.site_title}`} />
        <meta property="og:description" content="Stay updated with the latest news, transmissions, and intel from our secure network." />
        <meta property="og:image" content={mockSettings.logo_url} />
        <meta property="og:url" content={window.location.origin + "/news"} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Latest News & Updates - ${mockSettings.site_title}`} />
        <meta name="twitter:description" content="Stay updated with the latest news, transmissions, and intel from our secure network." />
        <meta name="twitter:image" content={mockSettings.logo_url} />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Latest News",
            "description": "Latest news and updates from our portal.",
            "url": window.location.origin + "/news"
          })}
        </script>
      </Helmet>
      <div className="mb-8 px-1">
        <h1 className="text-3xl font-black mb-6 flex items-center gap-3 uppercase tracking-tighter dark:text-white italic">
          <Newspaper className="w-8 h-8 text-pink-500" /> Latest Intel
        </h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
            <Search className="h-5 w-5 text-pink-500 opacity-40" />
          </div>
          <input
            type="text"
            className="block w-full pl-14 pr-6 py-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-2 border-white/20 dark:border-white/10 rounded-[1.5rem] placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-pink-500/10 transition-all font-bold dark:text-white shadow-2xl"
            placeholder="DECRYPT NEWS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-1 overflow-hidden">
        {filteredNews.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border-2 border-white/20 dark:border-white/10 rounded-[2.5rem] p-4 flex flex-col hover:border-pink-500/30 transition-all shadow-2xl group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="h-52 rounded-[1.8rem] overflow-hidden border-2 border-white/20 dark:border-white/10 shrink-0 relative mb-6 shadow-xl">
              <img src={item.logo_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="px-2 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-pink-500 italic bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">Transmission verified</span>
                <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 dark:text-white">v3.0</span>
              </div>
              <h3 className="text-xl font-black mb-3 line-clamp-2 uppercase tracking-tighter dark:text-white italic leading-tight group-hover:text-pink-500 transition-colors">{item.title}</h3>
              <p className="text-xs opacity-60 mb-6 line-clamp-3 font-bold dark:text-white leading-relaxed">{item.description}</p>
              
              <div className="mt-auto pt-6 border-t border-black/5 dark:border-white/5">
                <Link to={`/news/${item.slug}`} className="flex items-center justify-between text-pink-500 font-black uppercase text-[10px] tracking-widest group-hover:gap-2 transition-all">
                  <span>Access Article</span>
                  <div className="p-2 bg-pink-500 rounded-lg text-white shadow-lg shadow-pink-500/20 group-hover:translate-x-1 transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredNews.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500">
            No news found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
