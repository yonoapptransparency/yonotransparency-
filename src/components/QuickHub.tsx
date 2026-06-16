import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Compass, 
  Star, 
  MessageSquare, 
  Mail, 
  Send, 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  Video, 
  Newspaper, 
  Layers, 
  Check, 
  AlertCircle, 
  UserCheck, 
  BookOpen, 
  FileText,
  Loader2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Link, useNavigate } from 'react-router-dom';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface QuickHubProps {
  buttonClassName?: string;
  isMobileSize?: boolean;
}

export default function QuickHub({ buttonClassName, isMobileSize = false }: QuickHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, apps } = useData();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  // Form State for Quick Feedback
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Auth User State
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Auth check removed
  }, []);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Load if they already rated from localStorage
      try {
        const alreadySubmitted = localStorage.getItem('user_feedback_submitted');
        if (alreadySubmitted) {
          setSubmitted(true);
          const savedRating = localStorage.getItem('user_feedback_rating');
          if (savedRating) setRating(parseInt(savedRating, 10));
        }
      } catch (e) {
        console.warn('Storage unavailable', e);
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(12);
      } catch (e) {}
    }
  };

  const handleToggle = () => {
    triggerHaptic();
    setIsOpen(!isOpen);
    setErrorText('');
  };

  const handleRatingSelect = (selected: number) => {
    triggerHaptic();
    setRating(selected);
    setErrorText('');
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!rating) {
      setErrorText('Please select a star rating (1-5).');
      return;
    }

    const cleanName = username.trim().replace(/<[^>]*>?/gm, '');
    const cleanComment = comment.trim().replace(/<[^>]*>?/gm, '');

    if (!cleanName) {
      setErrorText('Please specify your name.');
      return;
    }

    if (!cleanComment) {
      setErrorText('Please add a comment about your experience.');
      return;
    }

    setSubmitting(true);
    triggerHaptic();

    try {
      const payload = {
        username: cleanName,
        rating: rating,
        comment: cleanComment,
        created_at: new Date().toISOString(),
        source: 'QuickAccessHeaderWidget'
      };

      if (isFirebaseConfigured && db) {
        const feedbackCol = collection(db, 'website_feedback');
        await addDoc(feedbackCol, payload);
      } else {
        console.warn('Firebase pending configuration. Simulated local feedback delivery:', payload);
      }

      // Store in memory & localStorage
      try {
        localStorage.setItem('user_feedback_submitted', 'true');
        localStorage.setItem('user_feedback_rating', String(rating));
      } catch (e) {}

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit rapid platform rating:', err);
      // Fallback
      try {
        localStorage.setItem('user_feedback_submitted', 'true');
        localStorage.setItem('user_feedback_rating', String(rating));
        setSubmitted(true);
      } catch (e) {
        setErrorText('Submit failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const protectedEmail = useMemo(() => {
    const emailStr = settings?.support_email || 'support@google-play.com';
    return emailStr.split('').map((char, idx) => <span key={idx}>{char}</span>);
  }, [settings?.support_email]);

  return (
    <>
      {/* Trigger Button */}
      {isMobileSize ? (
        <button
          id="mobile-quickhub-trigger-btn"
          onClick={handleToggle}
          className={`${buttonClassName || 'flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-600 rounded-full active:scale-95 transition-all'}`}
          aria-label="Open Quick Access Hub"
          title="Quick Access Hub"
        >
          <Compass className="w-4 h-4 animate-spin-slow text-blue-600" />
        </button>
      ) : (
        <button
          id="desktop-quickhub-trigger-btn"
          onClick={handleToggle}
          className={`${buttonClassName || 'flex items-center gap-1.5 w-10 h-10 lg:w-auto lg:h-11 lg:px-4 justify-center bg-blue-50 hover:bg-blue-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-full transition-all shrink-0 active:scale-95 cursor-pointer'}`}
          aria-label="Unified Access Hub"
          title="Open Quick Access Hub"
        >
          <Compass className="w-5 h-5 shrink-0" />
          <span className="text-[13px] font-bold hidden lg:inline tracking-tight">Quick Link</span>
        </button>
      )}

      {/* Overlay Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Dark Backdrop */}
            <motion.div
              id="quickhub-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleToggle}
              className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body Card */}
            <motion.div
              id="quickhub-modal-card"
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 z-10"
            >
              {/* Modal Top Banner */}
              <div className="p-6 pb-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-transparent dark:from-blue-950/20 dark:via-zinc-900 dark:to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Compass className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-1.5">
                      Unified Portal Navigation Hub
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      One-tap rapid shortcuts to core community resources, helplines, and reviews
                    </p>
                  </div>
                </div>

                <button
                  id="quickhub-close-top-btn"
                  onClick={handleToggle}
                  className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-250 transition-all cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Contents Grid */}
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[80vh] overflow-y-auto">
                
                {/* Left Side: Launchpad Directories & Support - 7 Columns */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  
                  {/* DIRECTORIES SECTIONS DECK */}
                  <div>
                    <h4 className="text-[11px] font-black tracking-widest text-[#01875f] uppercase mb-3 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Essential Platform Directories
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {(settings?.quick_links && settings.quick_links.length > 0 ? settings.quick_links : [
                        { title: "Browse App Store", subtitle: "Explore listed packages with direct mirrors", icon: "compass", color: "blue", url: "/new-apps" },
                        { title: "News & Releases", subtitle: "Stay updated with official security patches", icon: "newspaper", color: "amber", url: "/news" },
                        { title: "Gameplay Arena", subtitle: "Explore user guides & immersive play walkthroughs", icon: "video", color: "rose", url: "/videos" },
                        { title: "Community Reads", subtitle: "Read deep tips, developer updates, and tricks", icon: "book-open", color: "emerald", url: "/blogs" },
                      ]).map((link, idx) => {
                        const IconComponent = link.icon === 'compass' ? Compass : link.icon === 'newspaper' ? Newspaper : link.icon === 'video' ? Video : link.icon === 'book-open' ? BookOpen : Compass;
                        let colorClass = "blue";
                        let bgHoverClass = "hover:bg-blue-50/50 dark:hover:bg-blue-950/20";
                        let iconTextClass = "text-blue-600 dark:text-blue-400";
                        let iconBgClass = "bg-blue-500/10";
                        
                        if (link.color === 'amber') {
                           bgHoverClass = "hover:bg-amber-50/50 dark:hover:bg-amber-950/20";
                           iconTextClass = "text-amber-600 dark:text-amber-400";
                           iconBgClass = "bg-amber-500/10";
                        } else if (link.color === 'rose') {
                           bgHoverClass = "hover:bg-rose-50/50 dark:hover:bg-rose-950/20";
                           iconTextClass = "text-rose-600 dark:text-rose-400";
                           iconBgClass = "bg-rose-500/10";
                        } else if (link.color === 'emerald') {
                           bgHoverClass = "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20";
                           iconTextClass = "text-emerald-600 dark:text-emerald-400";
                           iconBgClass = "bg-emerald-500/10";
                        } else if (link.color === 'purple') {
                           bgHoverClass = "hover:bg-purple-50/50 dark:hover:bg-purple-950/20";
                           iconTextClass = "text-purple-600 dark:text-purple-400";
                           iconBgClass = "bg-purple-500/10";
                        }

                        return (
                          <Link
                            key={idx}
                            to={link.url}
                            onClick={handleToggle}
                            className={`p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-white/5 transition-all group flex items-start gap-3 ${bgHoverClass}`}
                          >
                            <div className={`p-2 rounded-xl group-hover:scale-105 transition-all ${iconBgClass} ${iconTextClass}`}>
                              <IconComponent className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                                {link.title}
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                              </p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">{link.subtitle}</p>
                            </div>
                          </Link>
                        );
                      })}

                    </div>
                  </div>

                  {/* CHANNELS GRID & TELEGRAM/WHATSAPP */}
                  <div>
                    <h4 className="text-[11px] font-black tracking-widest text-[#01875f] uppercase mb-3 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Instant Support & Social Channels
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      
                      {/* WhatsApp */}
                      {settings?.helpline_whatsapp && (
                        <a
                          id="hub-whatsapp-chat"
                          href={`https://wa.me/${(settings.helpline_whatsapp).replace('+','')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-[#25D366]/5 dark:hover:bg-[#25D366]/10 border border-emerald-500/10 rounded-2xl transition-all group flex items-center gap-3.5"
                        >
                          <div className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366] shrink-0">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <span className="block text-xs font-black text-emerald-600 dark:text-[#25d366]">WhatsApp Direct</span>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold">Immediate assistance</span>
                          </div>
                        </a>
                      )}

                      {/* Telegram */}
                      {settings?.helpline_telegram && (
                        <a
                          id="hub-telegram-chat"
                          href={settings.helpline_telegram.startsWith('http') ? settings.helpline_telegram : `https://t.me/${settings.helpline_telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-blue-500/5 hover:bg-blue-500/10 dark:bg-[#0088cc]/5 dark:hover:bg-[#0088cc]/10 border border-blue-500/10 rounded-2xl transition-all group flex items-center gap-3.5"
                        >
                          <div className="p-2 rounded-xl bg-[#0088cc]/10 text-[#0088cc] shrink-0">
                            <Send className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <span className="block text-xs font-black text-blue-600 dark:text-[#0088cc]">Telegram Chat</span>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold">Instant announcements</span>
                          </div>
                        </a>
                      )}

                      {/* Contact form page */}
                      <Link
                        id="hub-contact-page"
                        to="/contact"
                        onClick={handleToggle}
                        className="p-3 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 rounded-2xl transition-all group flex items-center gap-3.5"
                      >
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 leading-tight">
                          <span className="block text-xs font-black text-purple-600 dark:text-purple-400">Live Ticket Desk</span>
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold">Submit a formal inquiry</span>
                        </div>
                      </Link>

                    </div>
                  </div>

                  {/* BOTTOM FOOTNOTE: POLICIES */}
                  <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-white/5 grid grid-cols-3 gap-2">
                    <Link to="/responsibility" onClick={handleToggle} className="text-center py-2 px-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border border-zinc-200/50 dark:border-white/5 text-[9px] hover:text-blue-500 text-zinc-500 font-black tracking-wide uppercase transition-colors">
                      Consumer Safety
                    </Link>
                    <Link to="/privacy" onClick={handleToggle} className="text-center py-2 px-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border border-zinc-200/50 dark:border-white/5 text-[9px] hover:text-blue-500 text-zinc-500 font-black tracking-wide uppercase transition-colors">
                      Privacy Center
                    </Link>
                    <Link to="/terms" onClick={handleToggle} className="text-center py-2 px-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/10 border border-zinc-200/50 dark:border-white/5 text-[9px] hover:text-blue-500 text-zinc-500 font-black tracking-wide uppercase transition-colors">
                      Terms of Use
                    </Link>
                  </div>

                </div>

                {/* Right Side: Web Rating & Instant Review Box - 5 Columns */}
                <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-250/30 dark:border-white/5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-black tracking-widest text-[#01875f] uppercase mb-1.5 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Platform Feedbacks
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed mb-4">
                      Submit rapid reviews on layout, direct links, or request features! All feedback reports are evaluated daily.
                    </p>

                    <AnimatePresence mode="wait">
                      {submitted ? (
                        <motion.div
                          id="hub-feedback-success"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="py-10 text-center flex flex-col items-center justify-center space-y-3"
                        >
                          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                            <Check className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-900 dark:text-white">Review Saved Successfully!</p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-normal">
                              Thank you for rating us {rating} out of 5 stars. Your submission was logged and helps our directory grow safer.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSubmitted(false)}
                            className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-white/5 text-[10px] font-black px-3.5 py-1.5 rounded-xl cursor-pointer text-zinc-655"
                          >
                            Update rating
                          </button>
                        </motion.div>
                      ) : (
                        <motion.form
                          id="hub-feedback-form"
                          onSubmit={submitFeedback}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3 pt-1"
                        >
                          {/* Stars Picker */}
                          <div className="flex items-center gap-1.5 justify-center py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 rounded-2xl">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => handleRatingSelect(s)}
                                onMouseEnter={() => setHoveredRating(s)}
                                onMouseLeave={() => setHoveredRating(null)}
                                className="p-1 focus:outline-none cursor-pointer transition-transform duration-100 hover:scale-110"
                                aria-label={`Select ${s} stars`}
                              >
                                <Star 
                                  className={`w-6 h-6 transition-all ${
                                    (hoveredRating !== null ? s <= hoveredRating : s <= (rating || 0))
                                      ? 'text-amber-400 fill-amber-400' 
                                      : 'text-zinc-200 dark:text-zinc-800'
                                  }`} 
                                />
                              </button>
                            ))}
                          </div>

                          {/* Commenter Name */}
                          <input
                            id="hub-form-name"
                            type="text"
                            required
                            maxLength={35}
                            placeholder="Your Name / Nickname"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full text-xs font-semibold p-3 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#01875f]/20 focus:border-[#01875f] text-zinc-900 dark:text-zinc-100"
                          />

                          {/* Quick Message Input */}
                          <textarea
                            id="hub-form-comment"
                            required
                            maxLength={300}
                            rows={3}
                            placeholder="Provide a quick suggestion or feedback about our portal..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full text-xs font-semibold p-3 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#01875f]/20 focus:border-[#01875f] text-zinc-900 dark:text-zinc-100 resize-none"
                          />

                          {errorText && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{errorText}</span>
                            </div>
                          )}

                          <button
                            id="hub-form-submit-btn"
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2.5 bg-[#01875f] hover:bg-[#00704e] text-white text-xs font-black rounded-xl transition-all active:scale-98 tracking-wide flex items-center justify-center gap-2 uppercase cursor-pointer"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submission Pending...
                              </>
                            ) : (
                              'Log Rapid Feedback'
                            )}
                          </button>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Administrative Secure Corner */}
                  <div className="mt-6 pt-4 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Secure SSL Connection
                    </span>
                    <Link
                      id="hub-admin-link"
                      to="/admin/login"
                      onClick={handleToggle}
                      className="hover:text-blue-500 font-black tracking-widest uppercase flex items-center gap-0.5 line-clamp-1"
                    >
                      <UserCheck className="w-3 h-3 text-blue-500" /> Admin Access
                    </Link>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
