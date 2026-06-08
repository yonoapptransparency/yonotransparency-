import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Loader2, Lock, CheckCircle2, Info } from 'lucide-react';

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

interface ClearanceButtonProps {
  appId: string;
  status: 'Verified' | 'Caution' | 'Unsafe';
}

export default function ClearanceButton({ appId, status }: ClearanceButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(0); // For initial 3-second gateway handshake
  const [tokenCountdown, setTokenCountdown] = useState(600); // 10-minute token lifetime visual countdown
  const [dynamicLink, setDynamicLink] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Kinetic behavioral tracking variables
  const mouseMovedRef = useRef(false);
  const touchUsedRef = useRef(false);
  const moveCountRef = useRef(0);
  const [pageLoadTime] = useState(() => Date.now());

  // Record human kinetic gestures from portal load to build physical behavior context
  useEffect(() => {
    const handleMouseActivity = () => {
      mouseMovedRef.current = true;
      moveCountRef.current += 1;
    };
    const handleTouchActivity = () => {
      touchUsedRef.current = true;
      mouseMovedRef.current = true;
      moveCountRef.current += 1;
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

  // Smooth UI timer for fingerprint verification progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating) {
      setElapsedMs(0);
      interval = setInterval(() => {
        setElapsedMs(prev => prev + 50);
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

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

    // Build generic device profile
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
          ctx.fillText("Sys-Check-9x", 2, 4);
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

    // 4. Hardware WebAudio context frequency FFT signature (bypassed with passive signature to ensure iframe sandbox compatibility)
    parts.push("audio-check-v2");

    const raw = parts.join("|");
    return sha256_sync(raw).slice(0, 32);
  };

  const solveVerification = async (nonce: string, difficulty: string): Promise<string> => {
    let n = 0;
    let lastYield = Date.now();
    while (true) {
      const attempt = nonce + n.toString();
      const hex = sha256_sync(attempt);
      
      if (hex.startsWith(difficulty)) {
        return n.toString();
      }
      n++;

      const now = Date.now();
      if (now - lastYield > 40) {
        await new Promise(resolve => setTimeout(resolve, 0));
        lastYield = Date.now();
      }

      if (n > 80000) {
        throw new Error("Mathematical limit exceeded.");
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
    const isInteractive = mouseMovedRef.current || touchUsedVal || moveCountVal >= 1;
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
      const score = Math.max(40, scoreSignals(headlessCount, moveCountRef.current, touchUsedRef.current, timeSinceLoad));

      // Step 1: Request unique dynamic sequence challenge nonce
      const challengeResponse = await fetch('/api/v1/init-file', {
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
          errorMsg = 'Link generation request was denied.';
        }
        throw new Error(errorMsg || 'Link generation request was denied.');
      }

      const { nonce, difficulty, sid } = await challengeResponse.json();

      // Actively solve Proof of Work to prevent automated bot/scraper downloads
      const [fingerprint, solution] = await Promise.all([
        getFingerprint(),
        solveVerification(nonce, difficulty),
        new Promise(resolve => setTimeout(resolve, 3000)) // Force minimum 3s timer for smooth UX interaction
      ]);

      // Step 3: Server validation handshake exchange
      const tokenResponse = await fetch('/api/v1/process-file', {
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
          moved: moveCountRef.current,
          touch: touchUsedRef.current,
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
          errorMessage = 'Link parameter validation failed.';
        }
        throw new Error(errorMessage || 'Link parameter validation failed.');
      }

      const { token } = await tokenResponse.json();

      // Step 4: Configure dynamic transient link URL
      const finalClearanceUrl = `/api/v1/file-payload?t=${token}&id=${appId}${sid ? `&sid=${encodeURIComponent(sid)}` : ''}`;

      setDynamicLink(finalClearanceUrl);
      setReady(true);
      setTokenCountdown(600); // Link valid for 10 minutes (600s) for maximum reliability

      // Trigger redirect to file immediately (No anchor tag is ever rendered in the DOM!)
      triggerExecution(finalClearanceUrl);
    } catch (err: any) {
      console.error("Link generation failure:", err);
      setErrorMsg(err.message || 'Link initialization did not successfully complete. Please refresh.');
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerExecution = (linkToUse?: string) => {
    const target = linkToUse || dynamicLink;
    if (!target) return;

    playSoftClick();

    // Use a single, highly compatible trigger method to avoid double parallel HTTP requests
    try {
      window.location.href = target;
    } catch (e) {
      console.warn("Navigation failed, attempting location redirect.", e);
    }

    // Safely auto-restore the button state so subsequent clicks or re-vists will trigger a fresh, valid clearance handshake
    setTimeout(() => {
      setReady(false);
      setDynamicLink('');
      setIsVerifying(false);
      setIsGenerating(false);
      setTokenCountdown(600);
    }, 1500);
  };

  const handleClearance = () => {
    if (isVerifying || ready || isGenerating) return;
    
    // Fallback: click acts as registered interaction
    mouseMovedRef.current = true;
    moveCountRef.current = Math.max(moveCountRef.current, 1);

    playSoftClick();

    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    setErrorMsg('');
    triggerTokenHandshake();
  };

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-semibold w-full sm:w-96 mb-2">
          Action could not be completed. Please retry.
        </div>
        <button 
          onClick={() => { setErrorMsg(''); handleClearance(); }} 
          className="w-full sm:w-96 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (ready) {
    return (
      <div className="flex flex-col items-center gap-3 w-full sm:w-96">
        <button 
          onClick={() => triggerExecution()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98] cursor-pointer shrink-0"
        >
          <span className="text-white">Continue</span>
        </button>

        <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1.5 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Checked
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <button 
        onClick={handleClearance}
        disabled={isVerifying || isGenerating}
        className={`w-full sm:w-96 py-4 px-10 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm text-base font-semibold shrink-0 active:scale-[0.98] cursor-pointer
          ${status === 'Verified' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 
            status === 'Caution' ? 'bg-amber-500 hover:bg-amber-400 text-white' : 
            'bg-zinc-800 hover:bg-zinc-700 text-white'}
          ${isVerifying || isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-current" /> 
            <span className="text-current">Loading...</span>
          </>
        ) : (
          <span className="text-current">More</span>
        )}
      </button>

      {isGenerating && (
        <div className="w-full sm:w-80 mt-3 flex justify-center px-4">
          <div className="w-full h-1 bg-red-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-600 transition-all duration-[50ms] ease-linear rounded-full"
              style={{ width: `${Math.min((elapsedMs / 3000) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

    </div>
  );
}

