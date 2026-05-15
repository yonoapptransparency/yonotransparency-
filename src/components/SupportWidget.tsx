import { useState, useMemo } from 'react';
import { MessageCircle, Mail, X, Send } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportWidget() {
  const { settings } = useData();
  const [isOpen, setIsOpen] = useState(false);

  const toggleWidget = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    setIsOpen(!isOpen);
  };

  // Protect email using useMemo
  const protectedEmail = useMemo(() => 
    settings.support_email.split('').map((char, i) => <span key={i}>{char}</span>),
    [settings.support_email]
  );

  return (
    <div className="relative inline-block z-50">
      <button
        onClick={toggleWidget}
        className="flex items-center gap-2 px-4 justify-center min-h-[48px] bg-red-100/30 dark:bg-pink-600/10 rounded-full border border-red-200/50 dark:border-pink-500/20 text-red-600 dark:text-pink-500 hover:bg-red-200/50 dark:hover:bg-pink-600/20 transition-all hover:scale-105 active:scale-95"
        aria-label="Support Widget"
      >
        <MessageCircle className="w-5 h-5 drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]" />
        <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline italic">Sync Helper</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="absolute right-0 top-full mt-4 bg-white/40 dark:bg-slate-900/60 backdrop-blur-3xl p-6 w-72 origin-top-right border-2 border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl z-[100]"
          >
            <div className="flex justify-between items-center mb-6 border-b-2 border-black/5 dark:border-white/5 pb-4">
              <h3 className="font-black text-xs uppercase tracking-tighter dark:text-white italic">Assistance Flow</h3>
              <button 
                onClick={toggleWidget} 
                className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-slate-500 hover:text-pink-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <a 
                href={`https://wa.me/${(settings.helpline_whatsapp || '').replace('+','')}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-4 p-4 hover:bg-pink-600/10 rounded-[1.5rem] transition-all border-2 border-transparent hover:border-pink-500/20 group shadow-lg hover:shadow-pink-500/5 dark:text-white"
              >
                <div className="bg-[#25D366]/20 p-3 rounded-xl text-[#25D366] shadow-sm border border-[#25D366]/20 group-hover:scale-110 transition-transform"><MessageCircle className="w-5 h-5"/></div>
                <div className="flex flex-col">
                  <div className="text-xs font-black uppercase tracking-tighter italic">WhatsApp</div>
                  <div className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Instant Relay</div>
                </div>
              </a>

              {settings.helpline_telegram && (
                <a 
                  href={settings.helpline_telegram.startsWith('http') ? settings.helpline_telegram : `https://t.me/${settings.helpline_telegram.replace('@', '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-4 p-4 hover:bg-blue-600/10 rounded-[1.5rem] transition-all border-2 border-transparent hover:border-blue-500/20 group shadow-lg hover:shadow-blue-500/5 dark:text-white"
                >
                  <div className="bg-[#0088cc]/20 p-3 rounded-xl text-[#0088cc] shadow-sm border border-[#0088cc]/20 group-hover:scale-110 transition-transform"><Send className="w-5 h-5"/></div>
                  <div className="flex flex-col">
                    <div className="text-xs font-black uppercase tracking-tighter italic">Telegram</div>
                    <div className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Global Broadcast</div>
                  </div>
                </a>
              )}
              
              <a 
                href={`mailto:${settings.support_email}`} 
                className="flex items-center gap-4 p-4 hover:bg-pink-600/10 rounded-[1.5rem] transition-all border-2 border-transparent hover:border-pink-500/20 group shadow-lg hover:shadow-pink-500/5 dark:text-white"
              >
                <div className="bg-pink-500/20 p-3 rounded-xl text-pink-600 shadow-sm border border-pink-500/20 group-hover:scale-110 transition-transform"><Mail className="w-5 h-5"/></div>
                <div className="flex flex-col truncate">
                  <div className="text-xs font-black uppercase tracking-tighter italic">Direct Mail</div>
                  <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest truncate">{protectedEmail}</div>
                </div>
              </a>
            </div>
            
            <div className="mt-6 pt-4 text-center border-t border-black/5 dark:border-white/5">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] opacity-30 italic dark:text-white italic">Administrator Verified Channel</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
