import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const { apps: mockApps, settings: mockSettings, news: mockNews, blogs: mockBlogs, videos: mockVideos, saveApps: saveMockApps, saveSettings: saveMockSettings, saveNews: saveMockNews, saveBlogs: saveMockBlogs, saveVideos: saveMockVideos } = useData();
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-6 px-1">
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
        className="glass-panel p-8 prose prose-slate max-w-none opacity-80 font-medium"
      >
        <h1 className="text-3xl font-black mb-6 uppercase tracking-tight">Privacy Policy</h1>
        <p className="text-sm opacity-50 mb-8 font-bold">Last updated: May 11, 2026</p>

        <div 
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: mockSettings.privacy_content || '' }}
        />

        <div className="mt-12 p-4 bg-pink-500/5 rounded-xl border border-pink-500/10">
          <p className="text-sm">For any privacy-related inquiries, please contact us at {mockSettings.support_email}</p>
        </div>
      </motion.div>
    </div>
  );
}
