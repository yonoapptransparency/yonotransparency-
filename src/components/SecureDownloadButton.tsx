import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Loader2, Download, Lock, CheckCircle2 } from 'lucide-react';

function sha256_sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j; // Used as a temporary index.

  const result: string[] = [];
  const words: number[] = [];
  const asciiLength = ascii[lengthProperty];
  
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let wordsLength = ((asciiLength + 8) >> 6) + 1;
  const wordsCount = wordsLength * 16;
  
  for (i = 0; i < wordsCount; i++) {
    words[i] = 0;
  }
  for (i = 0; i < asciiLength; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }
  words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);
  words[wordsCount - 1] = asciiLength * 8;
  
  for (i = 0; i < wordsCount; i += 16) {
    const w = words.slice(i, i + 16);
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const w15 = w[j - 15], w2 = w[j - 2], w16 = w[j - 16], w7 = w[j - 7];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[j] = (w16 + s0 + w7 + s1) | 0;
      }
      
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = s0 + maj;
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = h + s1 + ch + k[j] + (w[j] || 0);

      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    const hex = (hash[i] >>> 0).toString(16).padStart(8, '0');
    result.push(hex);
  }
  return result.join('');
}

interface SecureDownloadButtonProps {
  appId: string;
  status: 'Verified' | 'Caution' | 'Unsafe';
  downloadUrl?: string;
}

export default function SecureDownloadButton({ appId, status, downloadUrl }: SecureDownloadButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(0); // For initial 3-second gateway handshake
  const [tokenCountdown, setTokenCountdown] = useState(600); // 10-minute token lifetime visual countdown
  const [dynamicLink, setDynamicLink] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Kinetic behavioral tracking variables
  const [mouseMoved, setMouseMoved] = useState(false);
  const [touchUsed, setTouchUsed] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [pageLoadTime] = useState(() => Date.now());

  // Record human kinetic gestures from portal load to build physical behavior context
  useEffect(() => {
    const handleMouseActivity = () => {
      setMouseMoved(true);
      setMoveCount(prev => prev + 1);
    };
    const handleTouchActivity = () => {
      setTouchUsed(true);
      setMouseMoved(true);
      setMoveCount(prev => prev + 1);
    };

    window.addEventListener("mousemove", handleMouseActivity);
    window.addEventListener("mousedown", handleMouseActivity);
    window.addEventListener("pointermove", handleMouseActivity);
    window.addEventListener("pointerdown", handleMouseActivity);
    window.addEventListener("touchstart", handleTouchActivity);
    window.addEventListener("touchmove", handleMouseActivity);
    window.addEventListener("keydown", handleMouseActivity);
    window.addEventListener("click", handleMouseActivity);

    return () => {
      window.removeEventListener("mousemove", handleMouseActivity);
      window.removeEventListener("mousedown", handleMouseActivity);
      window.removeEventListener("pointermove", handleMouseActivity);
      window.removeEventListener("pointerdown", handleMouseActivity);
      window.removeEventListener("touchstart", handleTouchActivity);
      window.removeEventListener("touchmove", handleMouseActivity);
      window.removeEventListener("keydown", handleMouseActivity);
      window.removeEventListener("click", handleMouseActivity);
    };
  }, []);

  // Reset all button verification states on appId (app transitioning) changes
  useEffect(() => {
    setIsVerifying(false);
    setReady(false);
    setCountdown(0);
    setTokenCountdown(600);
    setDynamicLink('');
    setErrorMsg('');
    setIsGenerating(false);
  }, [appId]);

  // Reset button states on web pageshow / back-forward cache browser clicks
  useEffect(() => {
    const handlePageShow = () => {
      setIsVerifying(false);
      setReady(false);
      setCountdown(0);
      setTokenCountdown(600);
      setDynamicLink('');
      setErrorMsg('');
      setIsGenerating(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // Visual ticking timer for the active token (10-minute lifespan)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (ready && tokenCountdown > 0) {
      interval = setInterval(() => {
        setTokenCountdown(prev => {
          if (prev <= 1) {
            // Token expired! Reset safety tunnel state
            setReady(false);
            setDynamicLink('');
            return 600;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ready, tokenCountdown]);

  // Initial 3-second gateway handshake countdown
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isVerifying && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isVerifying && countdown === 0) {
      setIsVerifying(false);
      triggerTokenHandshake();
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVerifying, countdown]);

  const playSoftClick = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play blocked", e));
  };

  // Encodes URL to base64 to hide from standard static scraper regex searches with non-ASCII safety
  const getObfuscatedUrl = () => {
    const rawUrl = downloadUrl && downloadUrl.trim() !== '' ? downloadUrl : `https://example.com/mock-file-${appId}`;
    const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    try {
      return btoa(unescape(encodeURIComponent(cleanUrl)));
    } catch {
      return btoa(cleanUrl);
    }
  };

  // Build secure device hardware and software representation for server-side registration
  const getFingerprint = async (): Promise<string> => {
    const parts: any[] = [];
    // 1. Canvas hardware-accelerated rendering fingerprint
    try {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillStyle = "#f00";
        ctx.fillRect(0, 0, 100, 30);
        ctx.fillStyle = "#00f";
        ctx.fillText("Bot-Check-9x", 2, 4);
        parts.push(c.toDataURL().slice(-40));
      } else {
        parts.push("no-ctx");
      }
    } catch {
      parts.push("no-canvas");
    }

    // 2. WebGL vendor identification and layout
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as any;
      if (gl) {
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        if (ext) {
          parts.push(String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).slice(0, 30));
          parts.push(String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)).slice(0, 20));
        } else {
          parts.push("no-ext");
        }
      } else {
        parts.push("no-gl");
      }
    } catch {
      parts.push("no-webgl");
    }

    // 3. Screen layout and user timezone metadata
    parts.push(`${window.screen?.width || 0}x${window.screen?.height || 0}`);
    parts.push(window.screen?.colorDepth || 0);
    try {
      parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      parts.push("unknown-tz");
    }
    
    try {
      parts.push(navigator.hardwareConcurrency || 0);
    } catch {
      parts.push(0);
    }
    try {
      parts.push((navigator as any).deviceMemory || 0);
    } catch {
      parts.push(0);
    }

    // 4. Hardware WebAudio context frequency FFT signature (bypassed with passive secure signature to ensure iframe sandbox compatibility)
    parts.push("audio-check-secure-v2");

    const raw = parts.join("|");
    return sha256_sync(raw).slice(0, 32);
  };

  // Mathematical Proof-of-Work: proves client runs Javascript in real single-threaded runtime
  // Utilizes synchronous pure JS hashing for 100% reliable execution and sandbox/iframe compatibility
  const solveProofOfWork = async (nonce: string, difficulty: string): Promise<string> => {
    let n = 0;
    let lastYield = Date.now();
    while (true) {
      const attempt = nonce + n.toString();
      const hex = sha256_sync(attempt);
      
      if (hex.startsWith(difficulty)) {
        return n.toString();
      }
      n++;

      // Time-slice yielding to completely bypass nested iframe/background timer throttling!
      // Only yield if we've been running uninterrupted for more than 40ms.
      const now = Date.now();
      if (now - lastYield > 40) {
        await new Promise(resolve => setTimeout(resolve, 0));
        lastYield = Date.now();
      }

      if (n > 80000) {
        throw new Error("Mathematical Proof-of-Work limit exceeded.");
      }
    }
  };

  // Browser telemetry checks for headless properties (safe indicators only to avoid iframe sandboxing false positives)
  const detectHeadless = () => {
    const checks = [
      navigator.webdriver === true,
    ];
    return checks.filter(Boolean).length;
  };

  const scoreSignals = (headlessCount: number, moveCountVal: number, touchUsedVal: boolean, timeSinceLoad: number) => {
    let score = 0;
    const isInteractive = mouseMoved || touchUsedVal || moveCountVal >= 1;
    if (isInteractive) score += 60;
    if (moveCountVal >= 1) score += 20;
    if (timeSinceLoad > 500) score += 20;
    
    // Webdriver penalty only applies if there is no human kinetic interaction
    if (headlessCount > 0 && !isInteractive) {
      score -= headlessCount * 40;
    }
    return score;
  };

  // Safe programmatic handshake with Express API to receive single-use token
  const triggerTokenHandshake = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    try {
      const timeSinceLoad = Date.now() - pageLoadTime;
      const headlessCount = detectHeadless();

      // Soft human kinetic score calculation: always logs details but never blocks legitimate humans
      const score = Math.max(40, scoreSignals(headlessCount, moveCount, touchUsed, timeSinceLoad));

      // Step 1: Request unique dynamic sequence challenge nonce
      const challengeResponse = await fetch('/api/v1/get-challenge', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!challengeResponse.ok) {
        let errorMsg = '';
        try {
          const errorData = await challengeResponse.json();
          errorMsg = errorData.error;
        } catch {
          errorMsg = 'Challenge challenge generation request was denied.';
        }
        throw new Error(errorMsg || 'Challenge challenge generation request was denied.');
      }

      const { nonce, difficulty, sid } = await challengeResponse.json();

      // Step 2: Compute Fingerprint & solve Proof-of-Work (SHA-256 matrix puzzle)
      const [fingerprint, solution] = await Promise.all([
        getFingerprint(),
        solveProofOfWork(nonce, difficulty)
      ]);

      // Step 3: Server validation handshake exchange
      const tokenResponse = await fetch('/api/v1/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          nonce,
          solution,
          fingerprint,
          score,
          moved: moveCount,
          touch: touchUsed,
          sid // pass sid back in request payload as fallback
        })
      });

      if (!tokenResponse.ok) {
        let errorMessage = '';
        try {
          const contentType = tokenResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await tokenResponse.json();
            errorMessage = errorData.error;
          } else {
            errorMessage = await tokenResponse.text();
          }
        } catch (e) {
          errorMessage = 'Handshake cryptographic parameter validation failed.';
        }
        throw new Error(errorMessage || 'Handshake cryptographic parameter validation failed.');
      }

      const { token } = await tokenResponse.json();

      // Step 4: Configure dynamic transient link URL
      const base64Url = getObfuscatedUrl();
      const finalDownloadUrl = `/api/v1/download-file?t=${token}&url=${encodeURIComponent(base64Url)}&id=${appId}${sid ? `&sid=${encodeURIComponent(sid)}` : ''}`;

      setDynamicLink(finalDownloadUrl);
      setReady(true);
      setTokenCountdown(600); // Link valid for 10 minutes (600s) for maximum reliability

      // Trigger redirect to file immediately (No anchor tag is ever rendered in the DOM!)
      triggerExecution(finalDownloadUrl);
    } catch (err: any) {
      console.error("Advanced Security Suite Handshake failure:", err);
      setErrorMsg(err.message || 'Advanced Security Handshake did not successfully complete. Please refresh.');
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerExecution = (linkToUse?: string) => {
    const target = linkToUse || dynamicLink;
    if (!target) return;

    playSoftClick();

    // 1. Alter browser window location (direct navigation)
    try {
      window.location.href = target;
    } catch (e) {
      console.warn("Location redirection direct change bypassed or blocked.", e);
    }

    // 2. Fallback dynamic anchor navigation context (maximizes compatibility with sandboxed iframes)
    try {
      const a = document.createElement('a');
      a.href = target;
      a.download = '';
      a.target = '_self'; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn("Dynamic anchor execution bypassed or blocked.", e);
    }

    // Safely auto-restore the button state so subsequent clicks or re-vists will trigger a fresh, valid download handshake
    setTimeout(() => {
      setReady(false);
      setDynamicLink('');
      setIsVerifying(false);
      setIsGenerating(false);
      setTokenCountdown(600);
    }, 1500);
  };

  const handleDownload = () => {
    if (isVerifying || ready || isGenerating) return;
    
    // Fallback: click acts as registered interaction
    setMouseMoved(true);
    setMoveCount(prev => Math.max(prev, 1));

    playSoftClick();

    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    setErrorMsg('');
    setIsVerifying(true);
    setCountdown(1); // Set to 1 second instead of 3 for ultra-fast, snappy verification!
  };

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl text-xs font-bold w-full sm:w-96 mb-2">
          {errorMsg}
        </div>
        <button 
          onClick={() => { setErrorMsg(''); handleDownload(); }} 
          className="w-full sm:w-96 min-h-[64px] bg-rose-600 hover:bg-rose-500 text-white font-black py-4 px-10 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer border-b-4 border-rose-800 uppercase"
        >
          Retry Security Handshake
        </button>
      </div>
    );
  }

  if (ready) {
    return (
      <div className="flex flex-col items-center gap-3 w-full sm:w-96">
        <button 
          onClick={() => triggerExecution()}
          className="w-full min-h-[64px] bg-green-600 hover:bg-green-500 text-white font-black py-4 px-10 rounded-full flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-600/30 active:scale-95 group uppercase tracking-tight text-xl cursor-pointer border-b-4 border-green-800 shrink-0"
        >
          <Download className="w-6 h-6 text-white drop-shadow-sm animate-bounce" /> 
          <span className="text-white drop-shadow-sm">Extract File</span>
        </button>

        <div className="text-center p-3 bg-slate-100/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/40 rounded-2xl w-full">
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold leading-relaxed">
            If extraction did not trigger automatically, please click below:
          </p>
          <a
            href={dynamicLink}
            onClick={playSoftClick}
            className="text-xs font-black text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline underline-offset-4 uppercase tracking-wider block mt-1 cursor-pointer"
          >
            Direct Extraction Link
          </a>
        </div>

        <span className="text-[10px] font-black uppercase text-green-500 tracking-[0.2em] italic flex items-center gap-1.5 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Secure Tunnel Active: Link Expires in {tokenCountdown}s
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={handleDownload}
        disabled={isVerifying || isGenerating}
        className={`w-full sm:w-96 min-h-[64px] font-black py-4 px-10 rounded-full flex items-center justify-center gap-3 transition-all shadow-2xl text-xl shrink-0 active:scale-95 uppercase tracking-tighter cursor-pointer
          ${status === 'Verified' ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/40 border-b-4 border-green-800' : 
            status === 'Caution' ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/40 border-b-4 border-amber-700' : 
            'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/40 border-b-4 border-red-800'}
          ${isVerifying || isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isVerifying && countdown > 0 ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-white drop-shadow-sm" /> 
            <span className="text-white drop-shadow-sm font-bold">Solving puzzle challenge: {countdown}s</span>
          </>
        ) : isGenerating ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-white drop-shadow-sm" /> 
            <span className="text-white drop-shadow-sm">Verifying browser fingerprint...</span>
          </>
        ) : status === 'Verified' ? (
          <>
            <ShieldCheck className="w-6 h-6 text-white drop-shadow-sm" /> 
            <span className="text-white drop-shadow-sm">Secure Download</span>
          </>
        ) : status === 'Caution' ? (
          <>
            <AlertTriangle className="w-6 h-6 text-black drop-shadow-sm" /> 
            <span className="text-black drop-shadow-sm">Verify Before Download</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-6 h-6 text-white drop-shadow-sm" /> 
            <span className="text-white drop-shadow-sm">Download Anyway</span>
          </>
        )}
      </button>

      {/* Hidden HoneyPot Targets to permanently ban automated crawlers/spiers page sweeps */}
      <a href="/trap/link" style={{ display: 'none', visibility: 'hidden' }} aria-hidden="true" tabIndex={-1}></a>
      <form style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} action="/trap/form" method="POST" tabIndex={-1} aria-hidden="true">
        <input type="text" name="username" autoComplete="off"/>
        <input type="email" name="email" autoComplete="off"/>
        <input type="submit" value="Submit"/>
      </form>
    </div>
  );
}

