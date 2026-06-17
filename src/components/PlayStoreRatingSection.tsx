/**
 * PlayStoreRatingSection reviews feedback star rating form
 * Integrates directly with Firestore DB, prompting authentic user feedback overlays.
 */

import React, { useState, useEffect } from 'react';
import { Star, Check, AlertCircle, Sparkles, MessageSquare, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface PlayStoreRatingSectionProps {
  appId: string;
  appTitle: string;
  onReviewSubmitted?: () => void;
}

export default function PlayStoreRatingSection({ appId, appTitle, onReviewSubmitted }: PlayStoreRatingSectionProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [googleOpened, setGoogleOpened] = useState(false);

  // State for username
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Auth check removed to reduce Firebase quotas. Only admin uses auth.
  }, []);

  // Check if user has already rated this app in this browser session or memory
  useEffect(() => {
    try {
      const alreadyRated = localStorage.getItem(`playstore_rated_${appId}`);
      if (alreadyRated) {
        setSubmitted(true);
        const stored = localStorage.getItem(`playstore_rating_val_${appId}`);
        if (stored) {
          setRating(parseInt(stored, 10));
        }
      }
    } catch (e) {
      console.warn('LocalStorage access blocked', e);
    }
  }, [appId]);

  const handleStarClick = (selectedRating: number) => {
    if (window.navigator && window.navigator.vibrate) {
      try { window.navigator.vibrate(10); } catch (e) {}
    }
    setRating(selectedRating);
    setErrorText('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!rating) {
      setErrorText('Please select a rating of 1 to 5 stars.');
      return;
    }

    const cleanName = username.trim().replace(/<[^>]*>?/gm, ''); // Secure XSS protection
    const cleanComment = comment.trim().replace(/<[^>]*>?/gm, ''); // Secure XSS protection

    if (!cleanName) {
      setErrorText('Please provide a name/nickname.');
      return;
    }
    if (cleanName.length < 2) {
      setErrorText('Name must be at least 2 chars.');
      return;
    }
    if (!cleanComment) {
      setErrorText('Please write a brief comment.');
      return;
    }
    if (cleanComment.length < 8) {
      setErrorText('Comment must be at least 8 characters.');
      return;
    }

    setSubmitting(true);

    const newReview = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      app_id: appId,
      username: cleanName,
      rating: rating,
      comment: cleanComment,
      created_at: new Date().toISOString(),
      helpful_count: 0
    };

    try {
      // 1. Save locally so it manifests on the page immediately
      let existing: any[] = [];
      try {
        const stored = localStorage.getItem(`local_user_reviews_${appId}`);
        if (stored) {
          existing = JSON.parse(stored);
        }
      } catch (e) {}
      
      localStorage.setItem(`local_user_reviews_${appId}`, JSON.stringify([newReview, ...existing]));
      localStorage.setItem(`playstore_rated_${appId}`, 'true');
      localStorage.setItem(`playstore_rating_val_${appId}`, rating.toString());

      // 2. Transmit to Firebase for live synchronization
      if (isFirebaseConfigured) {
        await addDoc(collection(db, 'reviews'), {
          app_id: appId,
          username: cleanName,
          rating: rating,
          comment: cleanComment,
          created_at: newReview.created_at,
          helpful_count: 0,
          is_approved: false,
          source: 'community'
        });
      }

      setSubmitted(true);
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      console.warn('Saved local review (firebase connection pending/unreachable):', err);
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      id="play-store-rating-sec" 
      className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 rounded-2xl p-5 sm:p-6 text-left my-4 select-none relative overflow-hidden transition-all duration-300"
    >
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="rate-form-container"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div>
              <h3 
                id="play-rating-header-title" 
                className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"
              >
                <span>Rate this app</span>
                <span className="text-[10px] bg-[#01875f]/10 dark:bg-[#01875f]/20 text-[#01875f] dark:text-[#00a170] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-95 origin-left">
                  Play Store Range
                </span>
              </h3>
              <p 
                id="play-rating-header-desc" 
                className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5"
              >
                Describe your authentic gameplay experience below.
              </p>
            </div>

            {/* Interactive Stars Panel */}
            <div 
              id="play-stars-interactive-row" 
              className="flex items-center gap-3 py-1.5 justify-start"
            >
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isActive = starValue <= (hoveredRating !== null ? hoveredRating : (rating || 0));
                return (
                  <motion.button
                    key={starValue}
                    id={`play-star-button-${starValue}`}
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => handleStarClick(starValue)}
                    className="focus:outline-none cursor-pointer p-0.5 transition-transform"
                    aria-label={`Rate ${starValue} Stars`}
                  >
                    <Star 
                      className={`w-8 h-8 transition-colors duration-150 ${
                        isActive 
                          ? 'fill-[#01875f] text-[#01875f] dark:fill-[#00a170] dark:text-[#00a170] drop-shadow-[0_2px_4px_rgba(1,135,95,0.15)]' 
                          : 'text-zinc-300 dark:text-zinc-700'
                      }`} 
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Star selection expanded form */}
            {rating !== null && (
              <motion.form
                id="play-feedback-form-expanded"
                onSubmit={handleSubmitReview}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2"
              >
                {rating >= 4 && (
                  <motion.div
                    id="play-google-redirect-badge"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 rounded-xl space-y-2 text-xs"
                  >
                    <p className="text-zinc-600 dark:text-zinc-300 leading-normal font-medium">
                      📱 Awesome review! Since you rated us <span className="font-bold text-blue-600 dark:text-blue-400">{rating} Stars</span>, could you also take 5 seconds to submit a rating on our official Google Business Listing? This prevents malicious internet blocking of our stable APK mirrors!
                    </p>
                    <div>
                      <a
                        id="play-stars-google-cta"
                        href="https://g.page/r/Cd8k-znwB0BDEBI/review"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setGoogleOpened(true)}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3.5 rounded-lg transition-transform active:scale-95 text-[11px] shadow-sm uppercase tracking-wider font-mono cursor-pointer"
                      >
                        Rate us on Google 🚀
                      </a>
                    </div>
                  </motion.div>
                )}

                  <>
                    <div id="play-input-block-group" className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <div className="md:col-span-1">
                        <input
                          id="play-reviewer-name-field"
                          type="text"
                          required
                          maxLength={30}
                          placeholder="Your Name"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full text-xs font-semibold p-2.5 bg-white dark:bg-zinc-950 border border-black/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#01875f]/20 focus:border-[#01875f] text-zinc-900 dark:text-zinc-100 transition-all h-[38px]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          id="play-reviewer-comment-field"
                          type="text"
                          required
                          maxLength={200}
                          placeholder="Comment (e.g. Gameplay was super smooth, zero touch lag)"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full text-xs font-semibold p-2.5 bg-white dark:bg-zinc-950 border border-black/10 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-[#01875f]/20 focus:border-[#01875f] text-zinc-900 dark:text-zinc-100 transition-all"
                        />
                      </div>
                    </div>

                    {errorText && (
                      <div className="flex items-center gap-1 text-xs text-rose-500 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errorText}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Fully secured listing
                      </span>
                      <button
                        id="play-reviewer-submit-btn"
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 bg-[#01875f] hover:bg-[#00704e] text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 active:scale-95 uppercase tracking-wide flex items-center gap-1.5"
                      >
                        {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                        {submitting ? 'Posting...' : 'Submit review'}
                      </button>
                    </div>
                  </>
              </motion.form>
            )}
          </motion.div>
        ) : (
          /* Submission complete */
          <motion.div
            key="rate-success-container"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-4 text-center"
          >
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 text-[#01875f] dark:text-[#00a170] rounded-full flex items-center justify-center mb-2.5">
              <Check className="w-5 h-5 font-bold" />
            </div>
            
            <h4 
              id="play-reviewer-confirmed-heading"
              className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100"
            >
              Review submitted successfully!
            </h4>
            
            <p 
              id="play-reviewer-confirmed-msg"
              className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 leading-normal"
            >
              Thank you for contributing to the range audit. Your stars are updated on our server and visible in reviews.
            </p>

            {rating && rating >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 rounded-xl p-3 max-w-md w-full"
              >
                <p className="text-[10px] sm:text-xs text-zinc-650 dark:text-zinc-400 mb-2 leading-relaxed font-semibold">
                  To complete the audit fully, please write a brief sentence on Google Reviews:
                </p>
                <a
                  id="google-review-redirect-final-btn"
                  href="https://g.page/r/Cd8k-znwB0BDEBI/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-lg text-[10px] sm:text-xs tracking-wider transition-all"
                >
                  Post on Google Business
                  <ArrowRight className="w-3 h-3" />
                </a>
              </motion.div>
            )}

            <button
              id="play-reviewer-update-link"
              type="button"
              onClick={() => {
                setSubmitted(false);
                setRating(null);
                try {
                  localStorage.removeItem(`playstore_rated_${appId}`);
                } catch(e){}
              }}
              className="text-[10px] text-blue-500 hover:text-blue-600 underline font-bold mt-3.5 cursor-pointer"
            >
              Update rating or submit a new comment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
