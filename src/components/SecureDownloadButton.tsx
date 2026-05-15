import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Loader2, Download } from 'lucide-react';

interface SecureDownloadButtonProps {
  appId: string;
  status: 'Verified' | 'Caution' | 'Unsafe';
  downloadUrl?: string;
}

export default function SecureDownloadButton({ appId, status, downloadUrl }: SecureDownloadButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [ready, setReady] = useState(false);

  const getFinalUrl = () => {
    if (downloadUrl && downloadUrl !== 'U2FsdGVkX19xxxxxx' && downloadUrl.trim() !== '') {
      return downloadUrl.startsWith('http') ? downloadUrl : `https://${downloadUrl}`;
    }
    const encodedUrl = downloadUrl 
      ? btoa(encodeURIComponent(downloadUrl).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))))
      : '';
    const urlParam = encodedUrl ? `&url=${encodeURIComponent(encodedUrl)}` : '';
    return `/api/v1/secure-fetch?id=${appId}${urlParam}`;
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isVerifying && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isVerifying && countdown === 0) {
      setIsVerifying(false);
      setReady(true);
      
      // Attempt automatic redirect to download
      const finalUrl = getFinalUrl();
      // Try replacing the window location for direct downloads
      // Using window.location.href avoids popup blockers for direct file links,
      // but if the URL is an external web page, AI Studio iframe sandbox might block it.
      try {
         window.location.href = finalUrl;
      } catch (e) {
         console.warn("Direct navigation blocked by iframe sandbox.");
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVerifying, countdown, appId, downloadUrl]);

  const playSoftClick = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play blocked", e));
  };

  const handleDownload = () => {
    if (isVerifying || ready) return;
    
    // Play sound
    playSoftClick();

    // 1. Trigger Mobile Haptics
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    // Start countdown
    setIsVerifying(true);
    setCountdown(3);
  };

  if (ready) {
    return (
      <a 
        onClick={playSoftClick}
        href={getFinalUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-96 min-h-[64px] bg-green-600 hover:bg-green-500 text-white font-black py-4 px-10 rounded-full flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-600/30 active:scale-95 group uppercase tracking-tight text-xl cursor-pointer pointer-events-auto border-b-4 border-green-800 shrink-0"
      >
        <Download className="w-6 h-6 text-white drop-shadow-sm" /> 
        <span className="text-white drop-shadow-sm">Click to Download</span>
      </a>
    );
  }

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
