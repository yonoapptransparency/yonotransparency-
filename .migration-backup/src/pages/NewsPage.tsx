import { Newspaper, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

export default function NewsPage() {
  const { news: mockNews, settings: mockSettings } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredNews = mockNews.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ceo_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in min-h-screen max-w-[1550px] mx-auto plain-content px-3 sm:px-6 md:px-10">
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
      <Helmet>
        <title>Latest News & Updates - {mockSettings.site_title}</title>
        <meta name="description" content="Stay updated with the latest news, transmissions, and intel from our secure network." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={window.location.origin + "/news"} />
      </Helmet>

      <div className="mb-12">
        <h1 className="text-3xl sm:text-5xl font-bold mb-6 text-zinc-900 tracking-tight">
          News & Updates
        </h1>
        <div className="relative max-w-xl">
          <input
            type="text"
            className="block w-full py-4 text-zinc-900 bg-transparent border-b-2 border-black/10 placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-all font-medium text-lg"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16">
        {filteredNews.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="group flex flex-col"
          >
            <Link to={`/news/${item.slug}`} className="block h-64 sm:h-80 rounded-[24px] overflow-hidden mb-6 shadow-sm border border-black/5">
              <img src={item.logo_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80'} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">{item.category || 'Report'}</span>
                <span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">NT-{item.id}</span>
              </div>
              <Link to={`/news/${item.slug}`} className="text-2xl sm:text-3xl font-bold mb-3 text-zinc-900 leading-tight hover:text-blue-600 transition-colors">
                {item.title}
              </Link>
              <div 
                className="text-base text-zinc-500 mb-6 line-clamp-3 leading-relaxed prose prose-sm prose-zinc" 
                dangerouslySetInnerHTML={{ __html: item.description || '' }} 
              />
              
              <Link to={`/news/${item.slug}`} className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
                Read More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
        {filteredNews.length === 0 && (
          <div className="col-span-full py-20 text-center text-zinc-500 font-medium text-lg">
            No news found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
