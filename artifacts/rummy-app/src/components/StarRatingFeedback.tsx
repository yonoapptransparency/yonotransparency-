import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Check, X, Chrome, ShieldAlert, Heart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function StarRatingFeedback() {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [hasReviewedOnGoogle, setHasReviewedOnGoogle] = useState(false);

  // Load state from localStorage on init to see if they already gave feedback
  useEffect(() => {
    try {
      const alreadyReviewed = localStorage.getItem('user_feedback_submitted');
      if (alreadyReviewed) {
        setSubmitted(true);
        const storedRating = localStorage.getItem('user_feedback_rating');
        if (storedRating) {
          setRating(parseInt(storedRating, 10));
        }
      }
    } catch (e) {
      console.warn('LocalStorage not accessible', e);
    }
  }, []);

  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(12);
      } catch (e) {}
    }
  };

  const handleRatingSelect = (selected: number) => {
    triggerHaptic();
    setRating(selected);
    setErrorText('');
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!rating) {
      setErrorText('Please select a star rating first.');
      return;
    }

    const cleanName = username.trim().replace(/<[^>]*>?/gm, '');
    const cleanComment = comment.trim().replace(/<[^>]*>?/gm, '');

    if (!cleanName) {
      setErrorText('Please provide a name/nickname.');
      return;
    }
    if (cleanName.length < 2) {
      setErrorText('Name must be at least 2 characters.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Store in localStorage
      localStorage.setItem('user_feedback_submitted', 'true');
      localStorage.setItem('user_feedback_rating', rating.toString());

      // 2. Try writing to Firestore inside a separate collections "website_feedback"
      if (isFirebaseConfigured) {
        await addDoc(collection(db, 'website_feedback'), {
          username: cleanName,
          rating: rating,
          comment: cleanComment,
          created_at: new Date().toISOString(),
          source: window.location.hostname
        });
      }

      setSubmitted(true);
      triggerHaptic();
    } catch (err) {
      console.warn('Could not post website feedback to firebase, saved locally instead', err);
      handleFirestoreError(err, OperationType.CREATE, 'website_feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleReviewClick = () => {
    triggerHaptic();
    setHasReviewedOnGoogle(true);
    try {
      localStorage.setItem('user_google_review_clicked', 'true');
    } catch (e) {}
  };

  return (
    <div 
      id="feedback-ratings-container" 
      className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm text-left transition-all relative overflow-hidden"
    >
      {/* Background soft element for responsive look */}
      <div 
        id="feedback-bg-glow" 
        className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" 
      />

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="feedback-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                id="feedback-badge" 
                className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-2 rounded-xl"
              >
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 
                  id="feedback-title" 
                  className="text-lg font-bold text-zinc-900 dark:text-zinc-100"
                >
                  Rate Your Experience
                </h3>
                <p 
                  id="feedback-subtitle" 
                  className="text-xs text-zinc-500 dark:text-zinc-400 font-medium"
                >
                  Help us make this clearance portal safer and better for everyone.
                </p>
              </div>
            </div>

            {/* Interactive Stars Block */}
            <div 
              id="feedback-stars-wrapper" 
              className="flex items-center justify-center gap-2 py-4 border-b border-dashed border-zinc-100 dark:border-zinc-800"
            >
              {[1, 2, 3, 4, 5].map((s) => (
                <motion.button
                  key={s}
                  id={`feedback-star-${s}`}
                  type="button"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHoveredRating(s)}
                  onMouseLeave={() => setHoveredRating(null)}
                  onClick={() => handleRatingSelect(s)}
                  className="p-1 focus:outline-none cursor-pointer group"
                >
                  <Star 
                    className={`w-10 h-10 transition-all duration-200 ${
                      s <= (hoveredRating !== null ? hoveredRating : (rating || 0))
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]' 
                        : 'text-zinc-300 dark:text-zinc-700'
                    }`} 
                  />
                </motion.button>
              ))}
            </div>

            {/* Dynamic Content based on selection */}
            {rating !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-5 space-y-4"
              >
                {/* Branch 1: High Rating (4 or 5 stars) -> Promote Google Review Link */}
                {rating >= 4 ? (
                  <div 
                    id="feedback-positive-branch" 
                    className="space-y-4 text-center bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 p-5 rounded-2xl"
                  >
                    <div className="flex justify-center mb-1 text-amber-400 animate-pulse">
                      <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
                    </div>
                    <h4 
                      id="feedback-positive-title" 
                      className="text-sm font-bold text-zinc-900 dark:text-zinc-100"
                    >
                      Wow! Thank you for the positive vibes! 🌟
                    </h4>
                    <p 
                      id="feedback-positive-desc" 
                      className="text-xs text-zinc-650 dark:text-zinc-400 max-w-md mx-auto leading-relaxed"
                    >
                      Since you rate us <span className="font-bold text-blue-600 dark:text-blue-400">{rating} Stars</span>, could you take 5 seconds to voice your support on Google? Google reviews protect our active gamer base from ISP blocking!
                    </p>

                    <div className="pt-2 flex justify-center">
                      <a
                        id="google-review-primary-button"
                        href="https://g.page/r/Cd8k-znwB0BDEBI/review"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleGoogleReviewClick}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all divide-x divide-white/20 active:scale-95 text-xs uppercase tracking-wider group"
                      >
                        <span className="flex items-center gap-1.5 pr-2.5">
                          <Chrome className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                          Rate us on Google
                        </span>
                        <span className="pl-2.5 flex items-center gap-1">
                          Review 🚀
                        </span>
                      </a>
                    </div>
                  </div>
                ) : (
                  // Branch 2: Low Rating (1-3 stars)
                  <div 
                    id="feedback-negative-branch" 
                    className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border border-black/5 dark:border-white/5 rounded-2xl flex items-start gap-3"
                  >
                    <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">How can we win back your trust?</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                        We take safety and platform reliability extremely seriously. Tell us what went wrong so we can debug, update the gateway clearance routes, or enhance security.
                      </p>
                    </div>
                  </div>
                )}

                {/* Local Form Field for everyone */}
                <form onSubmit={handleTextSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label 
                        id="feedback-name-label"
                        htmlFor="feedback-username" 
                        className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1"
                      >
                        Your Name
                      </label>
                      <input
                        id="feedback-username"
                        type="text"
                        required
                        maxLength={30}
                        placeholder="e.g. Rahul Singh"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-zinc-50 focus:bg-white dark:bg-zinc-950 border border-black/5 dark:border-white/10 rounded-xl p-3 text-xs font-medium text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label 
                        id="feedback-comment-label"
                        htmlFor="feedback-comment" 
                        className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1"
                      >
                        On-Site Feedback Comment (Optional)
                      </label>
                      <textarea
                        id="feedback-comment"
                        maxLength={400}
                        placeholder="Write dynamic elements or platform details you loved or want us to resolve..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        className="w-full bg-zinc-50 focus:bg-white dark:bg-zinc-950 border border-black/5 dark:border-white/10 rounded-xl p-3 text-xs font-medium text-zinc-800 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none min-h-[50px]"
                      />
                    </div>
                  </div>

                  {errorText && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{errorText}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      id="feedback-submit-button"
                      type="submit"
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 h-10 px-6 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                    >
                      {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Submission Screen State */
          <motion.div
            key="feedback-success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="py-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
              className="inline-flex p-3 bg-emerald-500/10 text-emerald-500 rounded-full mb-4"
            >
              <Check className="w-8 h-8" />
            </motion.div>
            
            <motion.h3 
              id="feedback-success-title" 
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5, delay: 0.18 }}
              className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2"
            >
              Feedback Successfully Logged!
            </motion.h3>
            
            <motion.p 
              id="feedback-success-desc" 
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5, delay: 0.24 }}
              className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6 leading-relaxed"
            >
              Thank you for verifying your visit. Every rating allows us to maintain stable server mirrors and clean APK audits.
            </motion.p>

            {rating && rating >= 4 && !hasReviewedOnGoogle && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.32 }}
                className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 p-5 rounded-2xl max-w-md mx-auto"
              >
                <p className="text-xs text-zinc-650 dark:text-zinc-400 mb-3.5 leading-relaxed">
                  To complete your review audit, please write your review directly on our official Google Business page:
                </p>
                <a
                  id="google-review-success-button"
                  href="https://g.page/r/Cd8k-znwB0BDEBI/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleGoogleReviewClick}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl text-xs transition-all pointer-events-auto shadow-md"
                >
                  <Chrome className="w-4 h-4" />
                  <span>Post on Google Reviews</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            )}

            <motion.button
              id="feedback-re-evaluate-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              onClick={() => {
                try {
                  localStorage.removeItem('user_feedback_submitted');
                } catch(e){}
                setSubmitted(false);
                setRating(null);
                setHasReviewedOnGoogle(false);
              }}
              className="text-xs text-blue-500 hover:text-blue-600 font-bold mt-6 underline cursor-pointer"
            >
              Update my review / Change rating
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
