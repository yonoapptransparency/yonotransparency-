import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function About() {
  const { apps: mockApps, settings: mockSettings, news: mockNews, blogs: mockBlogs, videos: mockVideos, saveApps: saveMockApps, saveSettings: saveMockSettings, saveNews: saveMockNews, saveBlogs: saveMockBlogs, saveVideos: saveMockVideos } = useData();
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-6">
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8"
      >
        <h1 className="text-3xl font-bold mb-8">About {mockSettings.site_title}</h1>
        
        <div 
          className="space-y-6 text-lg leading-relaxed opacity-80 markdown-body font-medium"
          dangerouslySetInnerHTML={{ __html: mockSettings.about_content || '' }}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          <div className="text-center p-6 bg-black/5 rounded-2xl border border-black/5">
            <div className="text-3xl font-bold text-pink-500 mb-2">100%</div>
            <div className="text-sm font-semibold">Verified Safe</div>
          </div>
          <div className="text-center p-6 bg-black/5 rounded-2xl border border-black/5">
            <div className="text-3xl font-bold text-blue-500 mb-2">50k+</div>
            <div className="text-sm font-semibold">Active Users</div>
          </div>
          <div className="text-center p-6 bg-black/5 rounded-2xl border border-black/5">
            <div className="text-3xl font-bold text-purple-500 mb-2">24/7</div>
            <div className="text-sm font-semibold">Security Monitoring</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
