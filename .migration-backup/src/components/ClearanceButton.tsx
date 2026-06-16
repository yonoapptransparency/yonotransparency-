import { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Loader2, Lock, CheckCircle2, Info } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, params: object) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
    _phantom?: unknown;
    __nightmare?: unknown;
    callPhantom?: unknown;
  }
}

// ── SHA-256 pure JS (works in sandboxed iframes — no WebCrypto needed) ──
function sha256(ascii: string): string {
  const rotR = (v: number, a: number) => (v >>> a) | (v << (32 - a));
  let i: number, j: number;
  const res: string[] = [], words: number[] = [];
  const len = ascii.length;
  const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const k = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const wLen = ((len + 8) >> 6) + 1;
  const wCnt = wLen * 16;
  for (i = 0; i < wCnt; i++) words[i] = 0;
  for (i = 0; i < len; i++) words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
  words[wCnt - 1] = len * 8;
  for (i = 0; i < wCnt; i += 16) {
    const w = words.slice(i, i + 16);
    let a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const w15=w[j-15],w2=w[j-2],w16=w[j-16],w7=w[j-7];
        w[j] = (w16+(rotR(w15,7)^rotR(w15,18)^(w15>>>3))+w7+(rotR(w2,17)^rotR(w2,19)^(w2>>>10)))|0;
      }
      const t2=(rotR(a,2)^rotR(a,13)^rotR(a,22))+((a&b)^(a&c)^(b&c));
      const t1=hh+(rotR(e,6)^rotR(e,11)^rotR(e,25))+((e&f)^(~e&g))+k[j]+(w[j]||0);
      hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    h[0]=(h[0]+a)|0;h[1]=(h[1]+b)|0;h[2]=(h[2]+c)|0;h[3]=(h[3]+d)|0;
    h[4]=(h[4]+e)|0;h[5]=(h[5]+f)|0;h[6]=(h[6]+g)|0;h[7]=(h[7]+hh)|0;
  }
  for (i = 0; i < 8; i++) res.push((h[i]>>>0).toString(16).padStart(8,'0'));
  return res.join('');
}

// ── Internal API paths (match backend) ──
const _EP = {
  challenge: '/api/v1/_chal',
  process:   '/api/v1/_proc',
  payload:   '/api/v1/file-payload',
};

interface ClearanceButtonProps {
  appId: string;
  status: 'Verified' | 'Caution' | 'Unsafe';
  variant?: 'default' | 'compact';
}

export default function ClearanceButton({ appId, status, variant = 'default' }: ClearanceButtonProps) {
  const [phase, setPhase] = useState<'idle'|'working'|'ready'|'error'>('idle');
  const [dynamicLink, setDynamicLink] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [tokenCountdown, setTokenCountdown] = useState(600);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pageLoadTime] = useState(() => Date.now());
  const [linkConfigured, setLinkConfigured] = useState<boolean | null>(null);
  const [reportingStatus, setReportingStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Behavioral tracking
  const mouseMoved  = useRef(false);
  const touchUsed   = useRef(false);
  const moveCount   = useRef(0);
  const scrollCount = useRef(0);
  const keyCount    = useRef(0);
  const focusCount  = useRef(0);
  const velSamples  = useRef<{t:number;x:number;y:number}[]>([]);

  // Cloudflare Turnstile
  const cfWidgetId    = useRef<string>('');
  const cfTokenRef    = useRef<string>('');
  const cfContainerRef = useRef<HTMLDivElement>(null);
  const rawSiteKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CF_TURNSTILE_SITE_KEY) || '';
  const isRealValue = (id: string | undefined): boolean => {
    if (!id) return false;
    if (id === 'PLACEHOLDER') return false;
    if (id.includes('#') || id.includes('!') || id.includes('@') || id.includes('$') || id.includes('^') || id.includes('*') || id.includes('+')) return false;
    return true;
  };
  const SITE_KEY = isRealValue(rawSiteKey) ? rawSiteKey : '';

  // Load Turnstile script once on mount
  useEffect(() => {
    if (!SITE_KEY) return;
    if (document.querySelector('script[data-cf-ts]')) return;
    window.onTurnstileLoad = () => {};
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
    s.async = true; s.defer = true;
    s.setAttribute('data-cf-ts', '1');
    document.head.appendChild(s);
    return () => { window.onTurnstileLoad = undefined; };
  }, [SITE_KEY]);

  // Render invisible widget after mount
  useEffect(() => {
    if (!SITE_KEY || !cfContainerRef.current) return;
    const tryRender = () => {
      if (!window.turnstile || !cfContainerRef.current) { setTimeout(tryRender, 300); return; }
      if (cfWidgetId.current) return;
      cfWidgetId.current = window.turnstile.render(cfContainerRef.current, {
        sitekey: SITE_KEY,
        size: 'invisible',
        callback: (token: string) => { cfTokenRef.current = token; },
        'error-callback': () => { cfTokenRef.current = ''; },
        'expired-callback': () => { cfTokenRef.current = ''; },
      });
    };
    setTimeout(tryRender, 600);
    return () => {
      if (cfWidgetId.current && window.turnstile) {
        try { window.turnstile.remove(cfWidgetId.current); } catch {}
        cfWidgetId.current = '';
      }
    };
  }, [SITE_KEY]);

  // Behavioral listeners
  useEffect(() => {
    const onMove = (e: MouseEvent | PointerEvent) => {
      mouseMoved.current = true; moveCount.current++;
      const now = Date.now();
      const s = velSamples.current;
      s.push({ t: now, x: (e as MouseEvent).clientX||0, y: (e as MouseEvent).clientY||0 });
      if (s.length > 20) s.shift();
    };
    const onTouch = () => { touchUsed.current = true; mouseMoved.current = true; moveCount.current++; };
    const onScroll = () => { scrollCount.current++; };
    const onKey = () => { keyCount.current++; };
    const onFocus = () => { focusCount.current++; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('mousedown', onMove as any);
    window.addEventListener('pointerdown', onMove as any);
    window.addEventListener('click', onMove as any);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('focus', onFocus, true);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('mousedown', onMove as any);
      window.removeEventListener('pointerdown', onMove as any);
      window.removeEventListener('click', onMove as any);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('focus', onFocus, true);
    };
  }, []);

  useEffect(() => { resetState(); }, [appId]);

  // Check if a download link is actually configured for this app before showing the button.
  // If not, show a clear message rather than letting users waste time on verification.
  useEffect(() => {
    setLinkConfigured(null);
    let cancelled = false;
    fetch(`/api/v1/link-check?id=${encodeURIComponent(appId)}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setLinkConfigured(data.configured !== false); })
      .catch(() => { if (!cancelled) setLinkConfigured(true); }); // fail-open
    return () => { cancelled = true; };
  }, [appId]);

  useEffect(() => {
    const h = () => resetState();
    window.addEventListener('pageshow', h);
    return () => window.removeEventListener('pageshow', h);
  }, []);

  // Token countdown
  useEffect(() => {
    if (phase !== 'ready') return;
    const iv = setInterval(() => {
      setTokenCountdown(prev => {
        if (prev <= 1) { resetState(); return 600; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // Elapsed ms
  useEffect(() => {
    if (phase !== 'working') return;
    setElapsedMs(0);
    const iv = setInterval(() => setElapsedMs(p => p + 50), 50);
    return () => clearInterval(iv);
  }, [phase]);

  function resetState() {
    setPhase('idle');
    setDynamicLink('');
    setErrorMsg('');
    setTokenCountdown(600);
    setElapsedMs(0);
    setReportingStatus('idle');
    cfTokenRef.current = '';
    if (cfWidgetId.current && window.turnstile) {
      try { window.turnstile.reset(cfWidgetId.current); } catch {}
    }
  }

  const handleReportMissing = async () => {
    if (reportingStatus === 'submitting' || reportingStatus === 'success') return;
    setReportingStatus('submitting');
    try {
      const response = await fetch('/api/v1/report-missing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ appId })
      });
      const data = await response.json();
      if (response.ok && !data.error) {
        setReportingStatus('success');
      } else {
        setReportingStatus('error');
      }
    } catch {
      setReportingStatus('error');
    }
  };

  const playSoftClick = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play blocked", e));
  };

  // 14-signal device fingerprint
  const getFingerprint = useCallback(async (): Promise<string> => {
    const parts: string[] = [];
    // 1. Canvas 2D rendering
    try {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top'; ctx.font = '14px Arial';
        ctx.fillStyle = '#f00'; ctx.fillRect(0, 0, 100, 30);
        ctx.fillStyle = '#00f'; ctx.fillText('Sys9x-Check', 2, 4);
        ctx.fillStyle = 'rgba(100,200,50,0.7)'; ctx.fillText('Security', 10, 14);
        parts.push(c.toDataURL().slice(-48));
      } else parts.push('no-ctx');
    } catch { parts.push('no-canvas'); }

    // 2. WebGL vendor + renderer
    try {
      const cv = document.createElement('canvas');
      const gl = (cv.getContext('webgl') || cv.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          parts.push(String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).slice(0,32));
          parts.push(String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)).slice(0,20));
        } else parts.push('no-ext');
      } else parts.push('no-gl');
    } catch { parts.push('no-webgl'); }

    // 3. Screen geometry + pixel ratio
    parts.push(`${window.screen?.width||0}x${window.screen?.height||0}`);
    parts.push(String(window.screen?.colorDepth||0));
    parts.push(String(window.devicePixelRatio||1));

    // 4. Timezone
    try { parts.push(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { parts.push('tz?'); }

    // 5. Hardware concurrency + memory
    try { parts.push(String(navigator.hardwareConcurrency||0)); } catch { parts.push('0'); }
    try { parts.push(String((navigator as any).deviceMemory||0)); } catch { parts.push('0'); }

    // 6. Audio context fingerprint
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (AudioCtx) {
        const ac = new AudioCtx();
        const osc = ac.createOscillator();
        const analyser = ac.createAnalyser();
        const gain = ac.createGain();
        gain.gain.value = 0;
        osc.connect(analyser); analyser.connect(gain); gain.connect(ac.destination);
        osc.start(0);
        const buf = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(buf);
        osc.stop(); ac.close();
        const sig = buf.slice(0,10).reduce((a,b) => a+Math.abs(b),0).toFixed(4);
        parts.push(`aud:${sig}`);
      } else parts.push('no-audio');
    } catch { parts.push('no-audio'); }

    // 7. Font detection
    try {
      const base = 'monospace', testStr = 'mmmmmmmmmmlli';
      const cv2 = document.createElement('canvas');
      const ctx2 = cv2.getContext('2d')!;
      ctx2.font = `16px ${base}`;
      const baseW = ctx2.measureText(testStr).width;
      const fonts = ['Arial','Times New Roman','Courier New','Georgia','Verdana'];
      const detected = fonts.map(f => {
        ctx2.font = `16px '${f}',${base}`;
        return ctx2.measureText(testStr).width !== baseW ? '1' : '0';
      });
      parts.push(`f:${detected.join('')}`);
    } catch { parts.push('f:?'); }

    // 8. Touch + plugins
    parts.push(`t:${navigator.maxTouchPoints||0}`);
    try { parts.push(`p:${navigator.plugins?.length||0}`); } catch { parts.push('p:0'); }

    // 9. Color gamut
    try {
      const g = window.matchMedia('(color-gamut: p3)').matches ? 'p3'
        : window.matchMedia('(color-gamut: srgb)').matches ? 'srgb' : 'none';
      parts.push(`cg:${g}`);
    } catch { parts.push('cg:?'); }

    // 10. Performance timing
    try { parts.push(`pt:${performance.now().toFixed(2)}`); } catch { parts.push('pt:0'); }

    // 11. Language + platform
    parts.push((navigator.language||'und').slice(0,5));
    parts.push((navigator.platform||'unk').slice(0,10));

    // 12. Battery (async best-effort)
    try {
      const bat = await (navigator as any).getBattery?.();
      parts.push(bat ? `bat:${bat.charging?1:0}` : 'bat:na');
    } catch { parts.push('bat:na'); }

    // 13. CSS env() support
    try {
      const el = document.createElement('div');
      el.style.paddingTop = 'env(safe-area-inset-top, 0px)';
      document.body.appendChild(el);
      const val = window.getComputedStyle(el).paddingTop;
      document.body.removeChild(el);
      parts.push(`env:${val === '0px' ? '0' : '1'}`);
    } catch { parts.push('env:?'); }

    // 14. Connection type
    try {
      const conn = (navigator as any).connection;
      parts.push(conn ? `net:${conn.effectiveType||'?'}` : 'net:na');
    } catch { parts.push('net:na'); }

    return sha256(parts.join('|')).slice(0, 32);
  }, []);

  // Multi-layer bot detection
  const detectBotSignals = (): number => {
    const flags: boolean[] = [
      navigator.webdriver === true,
      '__playwright' in window || '__pw_manual' in window,
      typeof window._phantom !== 'undefined' || typeof window.callPhantom !== 'undefined',
      typeof window.__nightmare !== 'undefined',
      !!document.documentElement?.getAttribute('webdriver'),
      navigator.plugins?.length === 0 && /Chrome/i.test(navigator.userAgent),
      !navigator.languages || navigator.languages.length === 0,
      window.screen?.width === 0 || window.screen?.height === 0,
    ];
    return flags.filter(Boolean).length;
  };

  // Behavioral score
  const computeScore = (): number => {
    const timeSinceLoad = Date.now() - pageLoadTime;
    const botFlags = detectBotSignals();
    const isInteractive = mouseMoved.current || touchUsed.current || moveCount.current >= 1;
    let score = 0;
    
    if (isInteractive) score += 40;
    if (moveCount.current >= 3) score += 10;
    if (touchUsed.current) score += 10;
    if (timeSinceLoad > 800) score += 10;
    if (timeSinceLoad > 2000) score += 10;
    if (scrollCount.current >= 1) score += 7;
    if (keyCount.current >= 1) score += 7;
    if (focusCount.current >= 1) score += 6;

    if (botFlags > 0 && !isInteractive) {
      score -= botFlags * 40;
    }

    return score;
  };

  const solveVerification = async (nonce: string, difficulty: string): Promise<string> => {
    let n = 0;
    let lastYield = Date.now();
    while (true) {
      const attempt = nonce + n.toString();
      const hex = sha256(attempt);
      
      if (hex.startsWith(difficulty)) {
        return n.toString();
      }
      n++;

      const now = Date.now();
      if (now - lastYield > 40) {
        await new Promise(resolve => setTimeout(resolve, 0));
        lastYield = Date.now();
      }

      if (n > 5000000) {
        throw new Error("Mathematical limit exceeded.");
      }
    }
  };

  const triggerHandshake = async () => {
    setPhase('working');
    setErrorMsg('');

    try {
      if (window.turnstile && cfWidgetId.current) {
        window.turnstile.execute(cfWidgetId.current);
      }

      const score = computeScore();

      // Step 1: Get challenge nonce
      const challengeResponse = await fetch(_EP.challenge, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!challengeResponse.ok) {
        const errorData = await challengeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Initialization request was denied.');
      }

      const { nonce, difficulty, sid } = await challengeResponse.json();

      // Step 2: Solve PoW + fingerprint in parallel
      const [fingerprint, solution] = await Promise.all([
        getFingerprint(),
        solveVerification(nonce, difficulty),
      ]);

      // Step 3: Submit verification → receive HMAC token
      const tokenResponse = await fetch(_EP.process, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          nonce,
          solution,
          fingerprint,
          score,
          moved: moveCount.current,
          touch: touchUsed.current,
          cfToken: cfTokenRef.current,
          sid,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Verification failed. Please try again.');
      }

      const { token } = await tokenResponse.json();
      if (!token) throw new Error('No token received. Please try again.');

      // Step 4: Build the clearance URL — the backend 302-redirects to the real link.
      // DO NOT fetch() this URL — fetch follows the redirect to the external site (HTML),
      // which cannot be parsed as JSON. Just open it directly in the browser.
      const params = new URLSearchParams({ t: token, id: appId });
      if (sid) params.set('sid', sid);
      const finalUrl = `${_EP.payload}?${params.toString()}`;

      setDynamicLink(finalUrl);
      setPhase('ready');
      setTokenCountdown(600);

    } catch (err: any) {
      console.error('Clearance handshake failed:', err);
      setErrorMsg(err.message || 'Initialization did not complete. Please retry.');
      setPhase('error');
      setTimeout(resetState, 4000);
    }
  };

  const handleClearance = () => {
    if (phase === 'ready' || phase === 'working') return;
    
    mouseMoved.current = true;
    moveCount.current = Math.max(moveCount.current, 1);

    playSoftClick();

    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    triggerHandshake();
  };

  const isGenerating = phase === 'working';

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div ref={cfContainerRef} className="hidden" aria-hidden="true" />
      {/* Link not configured — show clear message instead of letting user verify for nothing */}
      {linkConfigured === false ? (
        <div className="w-full sm:w-96 flex flex-col items-center gap-2">
          <div className="w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-3 bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-zinc-400 dark:text-zinc-500 cursor-not-allowed select-none">
            <Lock className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-sm">Service Clearance Pending</span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
            The secure access gateway for this application is currently undergoing scheduled system synchronization or administrative integration.<br/>
            You can dispatch a notice to the Support Desk to expedite this configuration.
          </p>

          {reportingStatus === 'idle' && (
            <button
              onClick={handleReportMissing}
              className="mt-2.5 px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Contact Support Desk</span>
            </button>
          )}

          {reportingStatus === 'submitting' && (
            <button
              disabled
              className="mt-2.5 px-4 py-2 text-xs font-semibold text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl flex items-center gap-1.5 cursor-not-allowed select-none"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              <span>Contacting Support...</span>
            </button>
          )}

          {reportingStatus === 'success' && (
            <div className="mt-2.5 px-4 py-2 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl flex items-center gap-1.5 select-none">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 animate-pulse" />
              <span>Support team notified successfully!</span>
            </div>
          )}

          {reportingStatus === 'error' && (
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <p className="text-[10px] text-red-500 font-semibold">Failed to send report. Try again?</p>
              <button
                onClick={handleReportMissing}
                className="px-4 py-1.5 text-xs font-semibold text-zinc-600 hover:text-blue-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-xl transition-all shadow-sm active:scale-95"
              >
                <span>Retry Notification</span>
              </button>
            </div>
          )}
        </div>
      ) : linkConfigured === null ? (
        <div className="w-full sm:w-96 flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-zinc-200 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {phase === 'error' && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-semibold w-full sm:w-96 mb-2 text-center shadow-sm">
              {errorMsg || "Action could not be completed. Please retry."}
            </div>
          )}

          {phase === 'ready' ? (
            variant === 'compact' ? (
              <a 
                href={dynamicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm shadow-md h-[44px]"
              >
                <span className="font-bold flex items-center gap-1.5">More Information <CheckCircle2 className="w-4 h-4" /></span>
              </a>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full sm:w-96">
                <a 
                  href={dynamicLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98] shrink-0"
                >
                  <span>More Information</span>
                </a>
                <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Checked
                </span>
              </div>
            )
          ) : (
            <button 
              onClick={handleClearance}
              disabled={isGenerating}
              className={variant === 'compact' 
                ? `w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm shadow-md h-[44px] ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`
                : `w-full sm:w-96 py-4 px-10 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm text-base font-semibold shrink-0 active:scale-[0.98] ${
                    status === 'Verified' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 
                    status === 'Caution' ? 'bg-amber-500 hover:bg-amber-400 text-white' : 
                    'bg-zinc-800 hover:bg-zinc-700 text-white'
                  } ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className={`animate-spin text-current ${variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'}`} /> 
                  <span className="font-bold">{variant === 'compact' ? 'Verifying...' : 'Loading...'}</span>
                </>
              ) : (
                <span className={variant === 'compact' ? "flex items-center gap-1.5 font-bold" : "text-current"}>
                  {variant === 'compact' ? 'Get Access' : 'More Information'}
                </span>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
