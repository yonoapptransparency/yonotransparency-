import { motion } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { ShieldCheck, Info, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function Responsibility() {
  const { settings: mockSettings } = useData();
  
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
      <Helmet>
        <title>Responsibility | {mockSettings.site_title}</title>
        <meta name="description" content="Our website responsibility and user responsibility guidelines." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-8 sm:p-14 rounded-[3rem] border-2 border-white/20 dark:border-white/10 prose prose-slate dark:prose-invert max-w-none shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"></div>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-12 pb-10 border-b-2 border-black/5 dark:border-white/5">
          <div className="p-5 bg-pink-600 rounded-[1.5rem] shadow-2xl shadow-pink-500/30 border-2 border-white/20">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-0 dark:text-white italic leading-none">Security Protocol</h1>
            <p className="text-[10px] font-black text-pink-600 uppercase tracking-[0.3em] mt-3 italic">Autonomous Oversight & Safeguards</p>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mb-10 font-black uppercase tracking-[0.4em] italic opacity-60">
          - Identity Verified - Last Auth Sync: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div 
          className="markdown-body space-y-6 font-bold opacity-80 leading-relaxed text-sm sm:text-base dark:text-white/80"
          dangerouslySetInnerHTML={{ __html: mockSettings.responsibility_content || '<p className="italic opacity-40 uppercase tracking-widest text-xs">- Content Stream Encrypted -</p>' }}
        />

        <div className="mt-16 p-8 bg-pink-600/5 dark:bg-pink-600/10 rounded-[2rem] border-2 border-pink-500/20 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="shrink-0">
            <div className="w-12 h-12 rounded-xl bg-pink-600/20 flex items-center justify-center border border-pink-500/20">
               <Info className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <div className="text-center sm:text-left relative">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-3 dark:text-white italic">Oversight Notice</h3>
            <p className="text-xs font-bold leading-relaxed dark:text-white/70 opacity-80">
              We strive to provide the safest experience possible. However, the nature of third-party applications means you must always exercise caution. If you have any concerns regarding a specific app, please contact us at <span className="text-pink-600 font-black italic">{mockSettings.support_email}</span>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
