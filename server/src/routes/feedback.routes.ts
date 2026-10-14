/**
 * [routes/feedback.routes.ts]
 * User feedback submission and retrieval routes.
 * Supports rating, category, comments, honeypot anti-spam, and rate-limiting.
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { Feedback, FeedbackSchema } from '../db/schema.js';

export const feedbackRouter = Router();

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_FEEDBACK_PER_MINUTE = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= MAX_FEEDBACK_PER_MINUTE) return true;
  valid.push(now);
  rateLimitMap.set(ip, valid);
  return false;
}

// POST /api/feedback - Submit new feedback
feedbackRouter.post('/', (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
      return res.status(429).json({ success: false, error: 'Too many feedback submissions. Please wait a moment.' });
    }

    // Honeypot check: 'hp_field' or 'website_bot' must be completely empty
    if (req.body.hp_bot_check || req.body.website_trap) {
      // Quietly reject bot
      return res.json({ success: true, message: 'Feedback received.' });
    }

    const { rating, category, comment, email } = req.body;

    const cleanComment = typeof comment === 'string' ? comment.trim().replace(/[<>]/g, '').slice(0, 500) : '';
    if (!cleanComment) {
      return res.status(400).json({ success: false, error: 'Comment text is required.' });
    }

    const cleanEmail = typeof email === 'string' ? email.trim().slice(0, 150) : '';

    const newFeedback: Feedback = {
      id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rating: Number(rating) || 5,
      category: ['UI', 'Detection accuracy', 'Performance', 'Other'].includes(category) ? category : 'Other',
      comment: cleanComment,
      email: cleanEmail || undefined,
      createdAt: new Date().toISOString(),
    };

    // Validate schema
    FeedbackSchema.parse(newFeedback);

    db.addFeedback(newFeedback);

    res.json({
      success: true,
      data: newFeedback,
    });
  } catch (error: any) {
    console.error(`[routes/feedback.routes.ts] Error saving feedback: ${error.message}`);
    res.status(400).json({
      success: false,
      file: 'routes/feedback.routes.ts',
      error: error.message,
    });
  }
});

// GET /api/feedback - Retrieve all submissions (admin/audit view)
feedbackRouter.get('/', (_req: Request, res: Response) => {
  try {
    const list = db.getFeedbacks();
    res.json({
      success: true,
      count: list.length,
      feedbacks: list,
    });
  } catch (error: any) {
    console.error(`[routes/feedback.routes.ts] Error fetching feedback: ${error.message}`);
    res.status(500).json({
      success: false,
      file: 'routes/feedback.routes.ts',
      error: error.message,
    });
  }
});
