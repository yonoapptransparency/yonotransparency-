/**
 * StarRatingFeedback general layout review widget
 * Displays custom inputs to capture overall user ratings and feedback on the experience.
 */

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
      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden"
    >
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
                className="bg-blue-500/20 text-blue-400 p-2 rounded-xl"
              >
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 
                  id="feedback-title" 
                  className="text-sm font-bold text-white"
                >
                  Rate Your Experience
                </h3>
                <p 
                  id="feedback-subtitle" 
                  className="text-[11px] text-slate-400 font-medium"
                >
                  Your feedback helps us maintain a reliable platform.
                </p>
              </div>
            </div>

            {/* Interactive Stars Block */}
            <div 
              id="feedback-stars-wrapper" 
              className="flex items-center gap-1.5 py-3"
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
                    className={`w-7 h-7 transition-all duration-200 ${
                      s <= (hoveredRating !== null ? hoveredRating : (rating || 0))
                        ? 'fill-[#FBBC05] text-[#FBBC05] drop-shadow-[0_2px_8px_rgba(251,191,36,0.3)]' 
                        : 'text-slate-700'
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
                className="pt-3 space-y-4"
              >
                {/* Branch 1: High Rating (4 or 5 stars) -> Promote Google Review Link */}
                {rating >= 4 ? (
                  <div 
                    id="feedback-positive-branch" 
                    className="space-y-3 bg-white/5 border border-white/5 p-4 rounded-xl"
                  >
                    <h4 
                      id="feedback-positive-title" 
                      className="text-xs font-bold text-white flex items-center gap-2"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Thank you for your feedback
                    </h4>
                    <p 
                      id="feedback-positive-desc" 
                      className="text-[11px] text-slate-400 leading-relaxed"
                    >
                      Your rating of <span className="font-bold text-white">{rating} stars</span> is highly appreciated. Please consider leaving a review on Google to support our platform.
                    </p>

                    <div className="pt-1">
                      <a
                        id="google-review-primary-button"
                        href="https://g.page/r/Cd8k-znwB0BDEBI/review"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleGoogleReviewClick}
                        className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 font-bold py-2 px-4 rounded-lg shadow-md transition-all active:scale-95 text-[11px]"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Review on Google
                      </a>
                    </div>
                  </div>
                ) : (
                  // Branch 2: Low Rating (1-3 stars)
                  <div 
                    id="feedback-negative-branch" 
                    className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-start gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-white">We value your feedback</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                        We take platform reliability seriously. Please let us know how we can improve.
                      </p>
                    </div>
                  </div>
                )}

                {/* Local Form Field for everyone */}
                <form onSubmit={handleTextSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <input
                        id="feedback-username"
                        type="text"
                        required
                        maxLength={30}
                        placeholder="Your Name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-xs font-medium text-white outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <textarea
                        id="feedback-comment"
                        maxLength={400}
                        placeholder="Additional comments (optional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2.5 text-xs font-medium text-white outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none min-h-[50px] placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  {errorText && (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-400">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{errorText}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      id="feedback-submit-button"
                      type="submit"
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg cursor-pointer disabled:opacity-50 transition-all"
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
            className="py-6 text-left"
          >
            <motion.div 
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
              className="inline-flex p-2 bg-emerald-500/20 text-emerald-400 rounded-lg mb-3"
            >
              <Check className="w-5 h-5" />
            </motion.div>
            
            <motion.h3 
              id="feedback-success-title" 
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5, delay: 0.18 }}
              className="text-sm font-bold text-white mb-2"
            >
              Feedback Submitted
            </motion.h3>
            
            <motion.p 
              id="feedback-success-desc" 
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.5, delay: 0.24 }}
              className="text-[11px] text-slate-400 mb-4 leading-relaxed"
            >
              Thank you for taking the time to share your experience with us.
            </motion.p>

            {rating && rating >= 4 && !hasReviewedOnGoogle && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.32 }}
                className="bg-white/5 border border-white/5 p-4 rounded-xl mt-4"
              >
                <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                  Please consider sharing your review on our Google profile.
                </p>
                <a
                  id="google-review-success-button"
                  href="https://g.page/r/Cd8k-znwB0BDEBI/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleGoogleReviewClick}
                  className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 font-bold py-2 px-4 rounded-lg transition-all pointer-events-auto text-[11px]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Review on Google</span>
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
              className="text-[11px] text-slate-400 hover:text-white mt-4 underline cursor-pointer"
            >
              Update your feedback
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
