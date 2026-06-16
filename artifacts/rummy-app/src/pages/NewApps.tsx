import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { ShieldCheck, ShieldAlert, Sparkles, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewApps() {
  const { apps: mockApps, settings: mockSettings, loading } = useData();
  const newApps = mockApps
    .filter(app => app.is_new)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const triggerNewAppHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30); 
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
  };

  return (
    <div className="max-w-[1550px] mx-auto pb-20 px-3 sm:px-6 md:px-10 select-none">
      <div className="px-1 mb-2 pt-4">
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
      <div className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-center gap-2 text-zinc-900 dark:text-zinc-100">
          <Sparkles className="w-6 h-6 text-blue-500" /> New Arrivals
        </h1>
        <p className="text-zinc-500 font-medium text-sm">Recently added to the store</p>
      </div>

      <motion.div 
        variants={mockSettings.animations_enabled ? containerVariants : {}}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-zinc-900 p-4 rounded-[20px] border border-black/5 dark:border-white/5 flex gap-4 items-center h-[100px] select-none">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-2" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-2" />
                <div className="flex items-center gap-2">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-10" />
                </div>
              </div>
            </div>
          ))
        ) : (
          newApps.map((app) => (
            <motion.div key={app.id} variants={itemVariants}>
              <Link 
                onClick={triggerNewAppHaptic} 
                to={`/${app.slug}`} 
                className="bg-white dark:bg-zinc-900 p-4 rounded-[20px] transition-all group flex gap-4 items-center relative overflow-hidden block border border-black/5 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 shadow-sm"
              >
                <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 shadow-sm relative z-10">
                  <img src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} alt={app.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold truncate group-hover:text-blue-500 transition-colors text-zinc-900 dark:text-zinc-100">{app.name}</h3>
                    <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">New</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-500 mb-1.5 truncate">{app.category}</div>
                  <div className="flex items-center gap-2">
                     <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(app.rating || 0) ? 'fill-orange-400 text-orange-400' : 'text-zinc-200 dark:text-zinc-700 fill-zinc-200 dark:fill-zinc-700'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-zinc-400">{app.file_size}</span>
                  </div>
                </div>
                
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <ShieldCheck className="w-12 h-12 text-blue-500" />
                </div>
              </Link>
            </motion.div>
          ))
        )}

        {!loading && newApps.length === 0 && (
          <div className="col-span-full text-center py-20 text-zinc-500 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm">
            <p className="text-sm font-medium">No new apps available.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
