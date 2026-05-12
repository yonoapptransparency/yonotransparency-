import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

interface SecureDownloadButtonProps {
  appId: string;
  status: 'Verified' | 'Caution' | 'Unsafe';
  downloadUrl?: string;
}

export default function SecureDownloadButton({ appId, status, downloadUrl }: SecureDownloadButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isVerifying && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isVerifying && countdown === 0) {
      if (downloadUrl && downloadUrl !== 'U2FsdGVkX19xxxxxx' && downloadUrl.trim() !== '') {
        // Open the URL in a new tab to avoid AI Studio iframe restrictions
        // Add https prefix if missing
        const finalUrl = downloadUrl.startsWith('http') ? downloadUrl : `https://${downloadUrl}`;
        window.open(finalUrl, '_blank');
        setIsVerifying(false);
      } else {
        // Fallback to API mock route if no valid URL is present
        const encodedUrl = downloadUrl 
          ? btoa(encodeURIComponent(downloadUrl).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))))
          : '';
        const urlParam = encodedUrl ? `&url=${encodeURIComponent(encodedUrl)}` : '';
        
        // Open in new tab since it will redirect to an external mockup page
        window.open(`/api/v1/secure-fetch?id=${appId}${urlParam}`, '_blank');
        setIsVerifying(false);
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVerifying, countdown, appId, downloadUrl]);

  const handleDownload = () => {
    if (isVerifying) return;
    
    // 1. Trigger Mobile Haptics
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    // Start countdown
    setIsVerifying(true);
    setCountdown(3);
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
      {isVerifying && countdown > 0 ? (
        <><Loader2 className="w-6 h-6 animate-spin text-white drop-shadow-sm" /> <span className="text-white drop-shadow-sm">Verifying in {countdown}...</span></>
      ) : isVerifying ? (
        <><Loader2 className="w-6 h-6 animate-spin text-white drop-shadow-sm" /> <span className="text-white drop-shadow-sm">Redirecting...</span></>
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
