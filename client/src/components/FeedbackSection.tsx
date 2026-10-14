/**
 * [client/src/components/FeedbackSection.tsx]
 * User feedback submission widget and admin review modal for BrandShield AI.
 * Includes interactive 1-5 star rating, categorization, 500-char comment counter,
 * honeypot anti-spam field, and instant submission via POST /api/feedback.
 */

import React, { useState } from 'react';
import {
  Star,
  Send,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  X,
  Clock,
  Mail,
  User,
} from 'lucide-react';
import { Card } from './ui/Card.js';
import { Button } from './ui/Button.js';
import { api } from '../lib/api.js';
import { Feedback } from '../types/index.js';

export const FeedbackSection: React.FC = () => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<
    'detection_accuracy' | 'performance' | 'ui_experience' | 'feature_request' | 'general'
  >('detection_accuracy');
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // hp_bot_check hidden field

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin Feedback Viewer State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage('Please provide a short comment or observation.');
      return;
    }

    if (comment.length > 500) {
      setErrorMessage('Comments are capped at 500 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.submitFeedback({
        rating,
        category,
        comment: comment.trim(),
        email: email.trim() || undefined,
        hp_bot_check: honeypot || undefined,
      });

      setIsSuccess(true);
      setComment('');
      setEmail('');
      setRating(5);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdminModal = async () => {
    setShowAdminModal(true);
    setLoadingFeedbacks(true);
    try {
      const data = await api.getFeedbacks();
      setFeedbacks(data);
    } catch (err) {
      console.error('[FeedbackSection.tsx] Failed to load feedbacks:', err);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  return (
    <div id="feedback" className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <Card className="p-6 sm:p-8 border border-[#E3DFD6] dark:border-[#243140] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DFD6] dark:border-[#243140]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                Feedback & Detection Insights
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#E6F0EE] text-[#0E5A52] dark:bg-[#0E5A52]/20 dark:text-[#A8DBC5]">
                Continuous Improvement
              </span>
            </div>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] mt-0.5">
              Help us tune our look-alike sensitivity, brand coverage, and false-positive guards.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenAdminModal}
            className="text-xs text-[#0E5A52] dark:text-[#A8DBC5] flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            View Community Submissions
          </Button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F0F9F5] dark:bg-[#2E7D5B]/20 text-[#2E7D5B] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
              Thank you for your feedback!
            </h3>
            <p className="text-xs text-[#5B6675] dark:text-[#8B97A7] max-w-sm mx-auto">
              Your observation has been persisted to the server store and will help tune our threat detection heuristics.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSuccess(false)}
              className="text-xs mt-2"
            >
              Submit Another Response
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-[#FDF2F2] dark:bg-[#B3261E]/20 border border-[#B3261E]/30 text-xs text-[#B3261E] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* Star Rating */}
            <div>
              <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1.5">
                Overall Accuracy & System Utility Rating *
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (hoverRating || rating) >= star
                          ? 'fill-[#C8791A] text-[#C8791A]'
                          : 'text-[#E3DFD6] dark:text-[#243140]'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-medium text-[#5B6675] ml-2">
                  {rating === 5 && 'Outstanding accuracy'}
                  {rating === 4 && 'Very good'}
                  {rating === 3 && 'Acceptable with minor issues'}
                  {rating === 2 && 'Needs improvement'}
                  {rating === 1 && 'Unsatisfactory'}
                </span>
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                Feedback Focus Area *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
              >
                <option value="detection_accuracy">Detection Accuracy & False Positive Guard</option>
                <option value="performance">Engine Performance & Latency</option>
                <option value="ui_experience">User Interface & Layout Design</option>
                <option value="feature_request">New Feature or Platform Request</option>
                <option value="general">General Remarks</option>
              </select>
            </div>

            {/* Comment Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2]">
                  Observations or Details *
                </label>
                <span className="text-[10px] text-[#5B6675]">
                  {comment.length} / 500 characters
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any false positives, missing look-alike patterns, or workflow improvements..."
                className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
              />
            </div>

            {/* Optional Email */}
            <div>
              <label className="block text-xs font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] mb-1">
                Contact Email <span className="font-normal text-[#5B6675]">(optional, for follow-up)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="security-team@example.com"
                className="w-full px-3 py-2 text-xs rounded-md bg-white dark:bg-[#0B1118] border border-[#E3DFD6] dark:border-[#243140] text-[#0F1B2D] dark:text-[#E8EDF2] focus:outline-none focus:ring-1 focus:ring-[#0E5A52]"
              />
            </div>

            {/* Honeypot field (hidden from genuine users) */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="w-full sm:w-auto text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Submit Feedback
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Admin / Community Submissions Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#121B25] rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-[#E3DFD6] dark:border-[#243140]">
            <div className="p-4 border-b border-[#E3DFD6] dark:border-[#243140] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E8EDF2]">
                  Submitted Feedback Records
                </h3>
                <p className="text-xs text-[#5B6675] dark:text-[#8B97A7]">
                  Stored on server in feedbacks.json
                </p>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-1 rounded hover:bg-[#F7F5F0] dark:hover:bg-[#0B1118] text-[#5B6675]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {loadingFeedbacks ? (
                <div className="py-8 text-center text-xs text-[#5B6675]">Loading feedback entries...</div>
              ) : feedbacks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#5B6675]">
                  No feedback records received yet. Be the first to submit!
                </div>
              ) : (
                feedbacks.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg border border-[#E3DFD6] dark:border-[#243140] bg-[#F7F5F0]/40 dark:bg-[#0B1118]/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < item.rating
                                ? 'fill-[#C8791A] text-[#C8791A]'
                                : 'text-[#E3DFD6] dark:text-[#243140]'
                            }`}
                          />
                        ))}
                        <span className="text-[11px] font-semibold text-[#0F1B2D] dark:text-[#E8EDF2] ml-1.5">
                          {item.rating}/5
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white dark:bg-[#1A2634] text-[10px] font-medium border border-[#E3DFD6] dark:border-[#243140] uppercase tracking-wider text-[#5B6675]">
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-[#0F1B2D] dark:text-[#E8EDF2] leading-relaxed">
                      "{item.comment}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#5B6675] pt-1 border-t border-[#E3DFD6]/60 dark:border-[#243140]/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {item.email}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#E3DFD6] dark:border-[#243140] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdminModal(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
