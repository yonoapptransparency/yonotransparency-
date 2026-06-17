import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Disclaimer() {
  const { settings: mockSettings } = useData();
  
  return (
    <div className="max-w-[1550px] mx-auto plain-content px-3 sm:px-6 md:px-10 animate-fade-in pb-20">
      <div className="mb-12 pt-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors group"
        >
          <div className="p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 group-hover:-translate-x-1 transition-transform">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Home
        </Link>
      </div>
      <Helmet>
        <title>{mockSettings.disclaimer_heading || 'Disclaimer'} | {mockSettings.site_title}</title>
      </Helmet>

      <motion.div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-16">
          {mockSettings.disclaimer_heading || 'Disclaimer'}
        </h1>
        
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-32 self-start">
            <div className="p-5 sm:p-6 bg-zinc-50 dark:bg-zinc-800/30 border border-black/5 dark:border-white/5 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-1">Status</h3>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Notice</p>
            </div>
            <div className="p-5 sm:p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">Support Email</h3>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 break-all">{mockSettings.support_email}</p>
            </div>
          </aside>
          
          <article className="lg:col-span-9 p-5 sm:p-8 md:p-14 bg-white dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
            <div 
              className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed"
              dangerouslySetInnerHTML={{ __html: mockSettings.disclaimer_text || '<p>Disclaimer information goes here.</p>' }}
            />
          </article>
        </div>
      </motion.div>
    </div>
  );
}
