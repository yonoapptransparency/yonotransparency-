import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';

export default function Ticker() {
  const { settings } = useData();
  if (!settings.ticker_text) return null;

  return (
    <div className="bg-transparent py-2.5 overflow-hidden border-b border-black/5 flex items-center relative z-[70] select-none pointer-events-none">
      <div className="bg-red-600 w-1.5 h-1.5 rounded-full absolute left-4 z-10 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.3)]" />
      
      <div className="flex whitespace-nowrap overflow-hidden pl-10 w-full relative">
        <motion.div
          className="inline-block whitespace-nowrap min-w-full font-black text-[10px] sm:text-xs uppercase tracking-[0.25em] italic magic-text"
          animate={{ x: ["0%", "-100%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 35
          }}
        >
          <span className="mx-10">{settings.ticker_text}</span>
          <span className="mx-10">{settings.ticker_text}</span>
          <span className="mx-10">{settings.ticker_text}</span>
          <span className="mx-10">{settings.ticker_text}</span>
        </motion.div>
      </div>
    </div>
  );
}
