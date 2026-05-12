import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

interface SecureDownloadButtonProps {
  appId: string;
  status: 'Verified' | 'Caution' | 'Unsafe';
}

export default function SecureDownloadButton({ appId, status }: SecureDownloadButtonProps) {
  const [loadTime, setLoadTime] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Record when the component (page) loaded
    setLoadTime(Date.now());
  }, []);

  const handleDownload = () => {
    // 1. Trigger Mobile Haptics
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    // 2. Gate 1: Human Verification
    const timeOnPage = Date.now() - loadTime;
    
    if (timeOnPage < 3000) {
      // Simulate waiting or reject if clicked instantly
      setIsVerifying(true);
      setTimeout(() => {
        window.location.replace(`/api/v1/secure-fetch?id=${appId}&timestamp=${loadTime}`);
      }, 3000 - timeOnPage);
    } else {
      // Allow download immediately if they already waited
      setIsVerifying(true);
      window.location.replace(`/api/v1/secure-fetch?id=${appId}&timestamp=${loadTime}`);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={isVerifying}
      className={`w-full sm:w-96 min-h-[64px] font-black py-4 px-10 rounded-full flex items-center justify-center gap-3 transition-all shadow-2xl text-xl shrink-0 active:scale-95 uppercase tracking-tighter
        ${status === 'Verified' ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/40 border-b-4 border-green-800' : 
          status === 'Caution' ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/40 border-b-4 border-amber-700' : 
          'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/40 border-b-4 border-red-800'}
        ${isVerifying ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {isVerifying ? (
        <><Loader2 className="w-6 h-6 animate-spin text-white drop-shadow-sm" /> <span className="text-white drop-shadow-sm">Verifying...</span></>
      ) : status === 'Verified' ? (
        <><ShieldCheck className="w-6 h-6 text-white drop-shadow-sm" /> <span className="text-white drop-shadow-sm">Secure Download</span></>
      ) : status === 'Caution' ? (
        <><AlertTriangle className="w-6 h-6 text-black drop-shadow-sm" /> <span className="text-black drop-shadow-sm">Verify Before Download</span></>
      ) : (
        <><ShieldAlert className="w-6 h-6 text-white drop-shadow-sm" /> <span className="text-white drop-shadow-sm">Download Anyway</span></>
      )}
    </button>
  );
}
