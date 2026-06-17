/**
 * About page layout
 * Explains the verification frameworks, safe apk guidelines, and the platform mission statement.
 */

import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function About() {
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
      <motion.div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-16">
          About Us
        </h1>
        
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-24">
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-sm uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">Our Mission</h2>
            <div 
              className="text-2xl sm:text-3xl leading-snug font-bold text-zinc-900 dark:text-zinc-100"
              dangerouslySetInnerHTML={{ __html: (mockSettings.about_content || '').split('\n\n')[0].replace(/\n/g, '<br/>') }}
            />
          </div>
          <div className="lg:col-span-8 p-5 sm:p-8 md:p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Who We Are & What We Do</h2>
            <div 
              className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: (mockSettings.about_content || '').split('\n\n').slice(1).join('<br/><br/>').replace(/\n/g, '<br/>') }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-20">
          {[
            { val: '100%', label: 'Verified Safe' },
            { val: 'Elite', label: 'Quality Grade' },
            { val: 'Realtime', label: 'Threat Monitoring' },
            { val: 'Stable', label: 'Node Status' },
          ].map((stat, i) => (
            <div key={i} className="p-4 sm:p-6 border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl flex flex-col items-center text-center">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400 mb-2">{stat.val}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
