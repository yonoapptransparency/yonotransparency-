import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { ShieldCheck, ShieldAlert, Sparkles, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewApps() {
  const { apps: mockApps, settings: mockSettings } = useData();
  const newApps = mockApps
    .filter(app => app.is_new)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15);

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
    <div className="max-w-5xl mx-auto pb-20 px-4 select-none">
      <div className="px-1 mb-2 pt-4">
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
      <div className="text-center mb-8 pt-8">
        <h1 className="text-2xl font-black tracking-tighter mb-1 flex items-center justify-center gap-2 uppercase italic">
          <Sparkles className="w-6 h-6 text-red-600" /> New Arrivals
        </h1>
        <p className="opacity-50 font-black uppercase tracking-widest text-[10px]">Hand-checked software added this week</p>
      </div>

      <motion.div 
        variants={mockSettings.animations_enabled ? containerVariants : {}}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {newApps.map((app) => (
          <motion.div key={app.id} variants={itemVariants}>
            <Link 
              onClick={triggerNewAppHaptic} 
              to={`/app/${app.slug}`} 
              className="glass-panel p-3 hover:brightness-110 transition-all group flex gap-4 items-center relative overflow-hidden block border border-white/60 shadow-sm"
            >
              <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden bg-white/40 border border-white/20 shadow-sm relative z-10">
                <img src={app.icon_url || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=128&h=128&fit=crop"} alt={app.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-sm font-black truncate group-hover:text-red-600 transition-colors uppercase tracking-tight italic">{app.name}</h3>
                  <span className="bg-red-600 text-white text-[7px] font-black px-1 py-0.5 rounded-[1px] uppercase tracking-widest shrink-0">NEW</span>
                </div>
                <div className="text-[10px] font-black opacity-60 mb-1 uppercase tracking-tight">{app.category}</div>
                <div className="flex items-center gap-2">
                   <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-2.5 h-2.5 ${i < Math.floor(app.rating || 0) ? 'fill-amber-400 text-amber-400' : 'opacity-20'}`} />
                    ))}
                  </div>
                  <span className="text-[9px] font-black opacity-40 uppercase">{app.file_size}</span>
                </div>
              </div>
              
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                 <ShieldCheck className="w-12 h-12 text-red-600" />
              </div>
            </Link>
          </motion.div>
        ))}

        {newApps.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400 glass-panel">
            <p className="text-sm font-bold uppercase tracking-widest">No new applications at this time.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
