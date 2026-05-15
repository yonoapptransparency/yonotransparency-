import { motion } from 'framer-motion';
import { Mail, MessageSquare, MapPin, ArrowLeft } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';

export default function Contact() {
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
        className="glass-panel p-8"
      >
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <div 
          className="opacity-80 mb-8 markdown-body font-medium"
          dangerouslySetInnerHTML={{ __html: mockSettings.contact_content || '' }}
        />

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-pink-500/10 p-3 rounded-xl border border-pink-500/20">
                <Mail className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h3 className="font-bold">Email</h3>
                <p className="text-slate-500">{mockSettings.support_email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold">Live Chat</h3>
                <p className="text-slate-500">Available Mon-Fri, 9am - 6pm EST</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                <MapPin className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold">Office</h3>
                <p className="text-slate-500">123 Tech Avenue, Silicon Valley, CA</p>
              </div>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" className="w-full p-3 rounded-xl bg-black/5 border border-black/5" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full p-3 rounded-xl bg-black/5 border border-black/5" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea className="w-full p-3 rounded-xl bg-black/5 border border-black/5 h-32" placeholder="How can we help?"></textarea>
            </div>
            <button className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
