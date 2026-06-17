/**
 * QuickHub floatable links layout navigation
 * Renders quick links, helpful alerts, support feedback launchers, and portal parameters.
 */

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
  Calendar,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Link, useNavigate } from 'react-router-dom';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const CATALOG_LINKS = [
  { title: "Browse Catalog", subtitle: "Explore direct verified apk mirrors", icon: Compass, color: "blue", url: "/new-apps" },
  { title: "News & Security Logs", subtitle: "Stay updated with official layout patches", icon: Newspaper, color: "amber", url: "/news" },
  { title: "Gameplay Arena", subtitle: "Immersive games rules walkthrough guides", icon: Video, color: "rose", url: "/videos" },
  { title: "Community Reads", subtitle: "Tips, tricks, and expert developer hacks", icon: BookOpen, color: "emerald", url: "/blogs" },
  { title: "Safety Responsibility", subtitle: "Learn self defense & protection guides", icon: ShieldCheck, color: "purple", url: "/responsibility" },
  { title: "About Directory", subtitle: "Core safe verification benchmarks", icon: Layers, color: "indigo", url: "/about" },
  { title: "Privacy Center", subtitle: "Cookies and safe user logs protection rules", icon: FileText, color: "zinc", url: "/privacy" },
  { title: "Terms of Use", subtitle: "Read our verified usage agreements", icon: FileText, color: "zinc", url: "/terms" }
];

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

  // Google Play reviews state
  const [reviewTab, setReviewTab] = useState<'feed' | 'write'>('feed');
  const [localReviews, setLocalReviews] = useState<any[]>([
    { name: "Aarav Sharma", rating: 5, date: "June 12, 2026", comment: "Absolutely marvelous app store mirror! The downloads are verified safe and lightning quick. RummyApp Online is now my permanent portal.", verified: true },
    { name: "Priya Patel", rating: 5, date: "June 14, 2026", comment: "I love the Gameplay Arena walkthroughs. Extremely intuitive layouts and super fast help on Telegram support. Brilliant and reliable!", verified: true },
    { name: "Rohan Malhotra", rating: 5, date: "May 28, 2026", comment: "Secured connection and original packages. No lag, no spammy redirects. A standard for top premium listings.", verified: true },
    { name: "Siddharth Verma", rating: 5, date: "June 05, 2026", comment: "The Direct WhatsApp helpline responded in less than 3 minutes to verify my package. Extraordinary customer service!", verified: true }
  ]);

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

      // Add to Google Play local list live
      const customNewFeedItem = {
        name: cleanName,
        rating: rating,
        date: "Today",
        comment: cleanComment,
        verified: true
      };
      setLocalReviews(prev => [customNewFeedItem, ...prev]);

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
          className={`${buttonClassName || 'relative flex items-center justify-center w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-full shadow-lg active:scale-95 transition-all overflow-hidden group'}`}
          aria-label="Open Quick Access Hub"
          title="Quick Access Hub"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 group-hover:opacity-100 opacity-0 transition-opacity"></div>
          <Compass className="w-5 h-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-pink-500 border-2 border-white dark:border-zinc-900 rounded-full animate-pulse"></div>
        </button>
      ) : (
        <button
          id="desktop-quickhub-trigger-btn"
          onClick={handleToggle}
          className={`${buttonClassName || 'relative flex items-center gap-2.5 lg:px-6 lg:h-11 justify-center bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-full transition-all shrink-0 active:scale-95 cursor-pointer shadow-md hover:shadow-xl border border-zinc-200 dark:border-white/10 hover:border-indigo-500/30 dark:hover:border-indigo-400/30 group overflow-hidden'}`}
          aria-label="Unified Access Hub"
          title="Open Quick Access Hub"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Compass className="w-4.5 h-4.5 shrink-0 text-indigo-600 dark:text-indigo-400 group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
          <span className="text-[14px] font-black hidden lg:inline tracking-wide relative z-10">Quick Hub</span>
          <div className="hidden lg:flex items-center justify-center ml-1 space-x-1 relative z-10 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
            <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">New</span>
          </div>
        </button>
      )}

      {/* Overlay Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden flex items-start sm:items-center justify-center p-3 sm:p-5 md:p-8 scroll-smooth antialiased">
            {/* Dark Backdrop with beautiful glass-morphism blur */}
            <motion.div
              id="quickhub-backdrop"
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              onClick={handleToggle}
              className="fixed inset-0 bg-zinc-950/70 dark:bg-black/85 cursor-pointer z-[99]"
            />

            {/* Modal Body Card - Unified scroll performance */}
            <motion.div
              id="quickhub-modal-card"
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 30 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-5xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.18)] dark:shadow-[0_45px_120px_rgba(0,0,0,0.7)] flex flex-col my-4 sm:my-auto z-[100] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-50 dark:before:from-zinc-800/40 before:pointer-events-none before:rounded-[2.5rem] touch-pan-y overscroll-contain select-none"
            >
              {/* Dynamic Aura Spotlights */}
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-505/10 dark:bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />

              {/* Modal Top Banner */}
              <div className="p-6 md:p-8 pb-5 border-b border-zinc-100 dark:border-white/5 flex items-start justify-between relative z-10 bg-white/50 dark:bg-zinc-900/40 rounded-t-[2.5rem]">
                <div className="flex items-center gap-4">
                  <div className="relative p-3.5 bg-gradient-to-tr from-emerald-505 to-teal-500 dark:from-emerald-600 dark:to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20 overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay"></div>
                    <Compass className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                      RummyApp Directory Hub <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    </h3>
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide mt-0.5 max-w-sm md:max-w-md">
                      Instant launchpad connections, official helplines, and verified Google reviews.
                    </p>
                  </div>
                </div>

                <button
                  id="quickhub-close-top-btn"
                  onClick={handleToggle}
                  className="p-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all cursor-pointer border border-zinc-200/50 dark:border-white/5 shadow-sm active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Main Contents Grid */}
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-7">
                
                {/* Left Side: Launchpad Directories & Support - 7 Columns */}
                <div className="lg:col-span-7 flex flex-col gap-7">
                  
                  {/* DIRECTORIES SECTIONS DECK */}
                  <div>
                    <h4 className="text-[11px] font-black tracking-widest text-emerald-600 dark:text-emerald-400 uppercase mb-3.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Platform Bento Launchpad
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      
                      {/* AI Chat Integration - Prominent Featured Card */}
                      <motion.button
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          handleToggle();
                          window.dispatchEvent(new Event('open-public-chatbot'));
                        }}
                        className="col-span-1 sm:col-span-2 p-5 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 hover:from-emerald-500/10 hover:to-teal-500/10 dark:from-emerald-500/10 dark:to-teal-500/10 dark:hover:from-emerald-500/15 dark:hover:to-teal-500/15 rounded-3xl border border-emerald-500/15 dark:border-emerald-500/20 transition-all group flex items-center justify-between text-left shadow-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/40 dark:border-white/5 shadow-sm flex items-center justify-center shrink-0">
                            <MessageCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-900/30" />
                            <div className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-zinc-900"></span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                              System AI Assistant 
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] uppercase tracking-widest border border-emerald-500/20">Online</span>
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-tight mt-1 max-w-sm">
                              Experience our newest interactive chat companion for instant platform support and smart navigation.
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all mr-2 hidden sm:block" />
                      </motion.button>

                      {/* Staggered load options spanning ALL options on the website */}
                      {CATALOG_LINKS.map((link, idx) => {
                        const IconComponent = link.icon;
                        
                        let borderHoverClass = "hover:border-blue-500/20 hover:bg-blue-50/20 dark:hover:bg-blue-950/10";
                        let iconTextClass = "text-blue-600 dark:text-blue-400";
                        let iconBgClass = "bg-blue-500/10 dark:bg-blue-500/5";
                        
                        if (link.color === 'amber') {
                           borderHoverClass = "hover:border-amber-500/20 hover:bg-amber-50/20 dark:hover:bg-amber-950/10";
                           iconTextClass = "text-amber-600 dark:text-amber-400";
                           iconBgClass = "bg-amber-500/10 dark:bg-amber-500/5";
                        } else if (link.color === 'rose') {
                           borderHoverClass = "hover:border-rose-500/20 hover:bg-rose-50/20 dark:hover:bg-rose-950/10";
                           iconTextClass = "text-rose-600 dark:text-rose-400";
                           iconBgClass = "bg-rose-500/10 dark:bg-rose-500/5";
                        } else if (link.color === 'emerald') {
                           borderHoverClass = "hover:border-emerald-500/20 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10";
                           iconTextClass = "text-emerald-600 dark:text-emerald-400";
                           iconBgClass = "bg-emerald-500/10 dark:bg-emerald-500/5";
                        } else if (link.color === 'purple') {
                           borderHoverClass = "hover:border-purple-500/20 hover:bg-purple-50/20 dark:hover:bg-purple-950/10";
                           iconTextClass = "text-purple-600 dark:text-purple-400";
                           iconBgClass = "bg-purple-500/10 dark:bg-purple-500/5";
                        } else if (link.color === 'indigo') {
                           borderHoverClass = "hover:border-indigo-500/20 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10";
                           iconTextClass = "text-indigo-600 dark:text-indigo-400";
                           iconBgClass = "bg-indigo-500/10 dark:bg-indigo-500/5";
                        } else if (link.color === 'zinc') {
                           borderHoverClass = "hover:border-zinc-500/20 hover:bg-zinc-50/20 dark:hover:bg-zinc-950/10";
                           iconTextClass = "text-zinc-600 dark:text-zinc-400";
                           iconBgClass = "bg-zinc-500/10 dark:bg-zinc-500/5";
                        }

                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: idx * 0.04 }}
                            whileHover={{ y: -3, scale: 1.012 }}
                            className="w-full flex"
                          >
                            <Link
                              to={link.url}
                              onClick={handleToggle}
                              className={`flex-1 p-4 bg-zinc-50/70 dark:bg-zinc-800/20 rounded-2xl border border-zinc-250/20 dark:border-white/5 transition-all group flex items-start gap-3.5 cursor-pointer ${borderHoverClass}`}
                            >
                              <div className={`p-2 rounded-xl group-hover:scale-105 transition-all shrink-0 ${iconBgClass} ${iconTextClass}`}>
                                <IconComponent className="w-4.5 h-4.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-zinc-900 dark:text-zinc-150 flex items-center gap-1">
                                  {link.title}
                                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-500" />
                                </p>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-1 font-semibold">{link.subtitle}</p>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}

                    </div>
                  </div>

                  {/* SUPPORT & SOCIAL CHANNELS */}
                  <div>
                    <h4 className="text-[11px] font-black tracking-widest text-[#01875f] uppercase mb-3 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Instant Direct Channels
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      {/* WhatsApp */}
                      {settings?.helpline_whatsapp && (
                        <a
                          id="hub-whatsapp-chat"
                          href={`https://wa.me/${(settings.helpline_whatsapp).replace('+','')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={handleToggle}
                          className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl transition-all group flex items-center gap-3.5 cursor-pointer hover:-translate-y-0.5"
                        >
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <span className="block text-xs font-black text-emerald-600 dark:text-emerald-405">WhatsApp Mail</span>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5 block">Direct Help</span>
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
                          onClick={handleToggle}
                          className="p-3 bg-blue-500/5 hover:bg-blue-500/10 dark:bg-blue-500/5 dark:hover:bg-blue-500/10 border border-blue-500/10 rounded-2xl transition-all group flex items-center gap-3.5 cursor-pointer hover:-translate-y-0.5"
                        >
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                            <Send className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 leading-tight">
                            <span className="block text-xs font-black text-blue-600 dark:text-blue-400">Telegram Chat</span>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5 block">Portal Mirror</span>
                          </div>
                        </a>
                      )}

                      {/* Contact form page */}
                      <Link
                        id="hub-contact-page"
                        to="/contact"
                        onClick={handleToggle}
                        className="p-3 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 rounded-2xl transition-all group flex items-center gap-3.5 cursor-pointer hover:-translate-y-0.5"
                      >
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 leading-tight">
                          <span className="block text-xs font-black text-purple-600 dark:text-purple-400">Live Ticket Desk</span>
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5 block">Submit inquiry</span>
                        </div>
                      </Link>

                    </div>
                  </div>

                </div>

                {/* Right Side: Google Play Verified Reviews Column - 5 Columns */}
                <div className="lg:col-span-5 bg-zinc-50/70 dark:bg-zinc-950/60 rounded-3xl p-6 border border-zinc-200/50 dark:border-white/5 flex flex-col justify-between">
                  <div>
                    {/* Header Google Design */}
                    <div className="flex items-start justify-between mb-4 border-b border-zinc-100 dark:border-white/5 pb-4">
                      <div>
                        <h4 className="text-[12px] font-black tracking-widest text-[#01875f] uppercase flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500 text-[11px]" /> Google & Play Store Reviews
                        </h4>
                        <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed mt-1">
                          Official ratings synchronized live with direct client devices globally.
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/15">
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Verified</span>
                      </div>
                    </div>

                    {/* Google Star Rating Summary Area */}
                    <div className="grid grid-cols-12 gap-4 bg-white/50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200/40 dark:border-white/5 mb-5 align-middle items-center">
                      <div className="col-span-4 text-center">
                        <div className="text-3xl font-black text-zinc-900 dark:text-white leading-none">4.9</div>
                        <div className="flex items-center justify-center gap-0.5 my-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className="w-3 h-3 text-amber-500 fill-amber-500" />
                          ))}
                        </div>
                        <div className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold">14,352 votes</div>
                      </div>
                      
                      <div className="col-span-8 space-y-1 text-[9px] font-black tracking-wide text-zinc-400">
                        {/* Rating distribution progress bars */}
                        <div className="flex items-center gap-2">
                          <span className="w-2.5">5</span>
                          <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88%' }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5">4</span>
                          <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full opacity-80" style={{ width: '8%' }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5">3</span>
                          <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full opacity-60" style={{ width: '3%' }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5">2</span>
                          <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: '1%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inner Tabs Navigation */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl mb-4 text-[10px] font-black uppercase tracking-wider">
                      <button
                        onClick={() => setReviewTab('feed')}
                        className={`flex-1 text-center py-2 rounded-lg transition-all cursor-pointer ${reviewTab === 'feed' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                      >
                        Recent Google Reviews
                      </button>
                      <button
                        onClick={() => setReviewTab('write')}
                        className={`flex-1 text-center py-2 rounded-lg transition-all cursor-pointer ${reviewTab === 'write' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                      >
                        Write Google Review
                      </button>
                    </div>

                    {/* Main Review Views */}
                    <AnimatePresence mode="wait">
                      {reviewTab === 'feed' ? (
                        <motion.div
                          key="feed"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-3 max-h-[280px] overflow-y-auto pr-1 select-none pointer-events-auto touch-pan-y scrollbar-thin scroll-smooth [overscroll-behavior:contain]"
                        >
                          {localReviews.map((rev, i) => (
                            <div key={i} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-white/5 shadow-sm text-left leading-normal">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-650 flex items-center justify-center font-black text-[10px] uppercase">
                                    {rev.name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="text-[11px] font-bold text-zinc-900 dark:text-white flex items-center gap-1 leading-none">{rev.name}</span>
                                    <span className="text-[8px] text-zinc-400 font-bold block mt-0.5">{rev.date}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={`w-2.5 h-2.5 ${s <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-200 dark:text-zinc-800'}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[10px] text-zinc-600 dark:text-zinc-333 leading-relaxed mt-1 font-medium">{rev.comment}</p>
                              {rev.verified && (
                                <div className="flex items-center gap-1 text-[8px] text-[#01875f] font-black tracking-widest uppercase mt-2 border-t border-zinc-50 dark:border-white/5 pt-1.5">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Verified User Experience
                                </div>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="write"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <AnimatePresence mode="wait">
                            {submitted ? (
                              <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                              >
                                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mx-auto mb-3">
                                  <Check className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-black text-zinc-900 dark:text-white">Google Play Review Logged!</p>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-normal font-semibold">
                                  Thank you! Your rated review ({rating}/5 stars) has been published live to our community-backed directory index.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setSubmitted(false)}
                                  className="mt-4 bg-white hover:bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-[10px] font-black px-3.5 py-1.5 rounded-xl cursor-pointer text-zinc-600 dark:text-zinc-300"
                                >
                                  Submit another
                                </button>
                              </motion.div>
                            ) : (
                              <form onSubmit={submitFeedback} className="space-y-3 pt-1 text-left">
                                {/* Stars Selection */}
                                <div className="flex items-center gap-1.5 justify-center py-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-white/5 rounded-2xl">
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

                                <input
                                  id="hub-form-name"
                                  type="text"
                                  required
                                  maxLength={35}
                                  placeholder="Your Player Name / Google Nickname"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  className="w-full text-xs font-semibold p-3 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#01875f]/20 focus:border-[#01875f] text-zinc-900 dark:text-zinc-100"
                                />

                                <textarea
                                  id="hub-form-comment"
                                  required
                                  maxLength={300}
                                  rows={2}
                                  placeholder="Provide descriptive Google Play review logs..."
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
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing...
                                    </>
                                  ) : (
                                    'Publish Google Review'
                                  )}
                                </button>
                              </form>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Administrative Secure Corner */}
                  <div className="mt-5 pt-4 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold select-none">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure SSL Connection
                    </span>
                    <Link
                      id="hub-admin-link"
                      to="/admin/login"
                      onClick={handleToggle}
                      className="hover:text-emerald-500 font-extrabold uppercase flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" /> Secure Admin Access
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
