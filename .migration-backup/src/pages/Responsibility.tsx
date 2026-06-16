import { motion } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { ShieldCheck, Info, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function Responsibility() {
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
        <title>Responsibility | {mockSettings.site_title}</title>
      </Helmet>

      <motion.div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-16">
          Responsibility
        </h1>
        
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-20">
          <div className="lg:col-span-5 p-5 sm:p-8 border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl">
            <ShieldCheck className="w-10 h-10 mb-6 text-blue-500" />
            <h2 className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 mb-4">Core Principles</h2>
            <div 
              className="text-xl sm:text-2xl leading-snug font-medium text-zinc-900 dark:text-zinc-100"
              dangerouslySetInnerHTML={{ __html: (mockSettings.responsibility_content || '').split('\n\n')[0].replace(/\n/g, '<br/>') }}
            />
          </div>
          <div className="lg:col-span-7 space-y-8">
             <div className="flex items-center gap-3">
                 <Info className="w-6 h-6 text-zinc-400" />
                 <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Commitment Details</h2>
             </div>
            <div 
              className="prose prose-zinc dark:prose-invert text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-none text-base"
              dangerouslySetInnerHTML={{ __html: (mockSettings.responsibility_content || '').split('\n\n').slice(1).join('<br/><br/>').replace(/\n/g, '<br/>') }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
