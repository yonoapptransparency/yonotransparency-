/**
 * Terms and Conditions page layout
 * Displays basic user agreement protocols, cookies consent directives, and listing responsibility guidelines.
 */

import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Terms() {
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
        <title>Terms & Conditions | {mockSettings.site_title}</title>
      </Helmet>

      <motion.div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-12">
          Terms & Conditions
        </h1>
        
        <div className="bg-white dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 shadow-sm rounded-2xl p-5 sm:p-8 md:p-14 mb-16 max-w-none">
          <div 
            className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed"
            dangerouslySetInnerHTML={{ __html: (mockSettings.terms_content || '').replace(/\n/g, '<br/>') }}
          />
        </div>
        
      </motion.div>
    </div>
  );
}
