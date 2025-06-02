import express from 'express';
import { protect, optionalAuth } from '@/middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/badges:
 *   get:
 *     summary: Get all NFT badges
 *     tags: [Badges]
 *     responses:
 *       200:
 *         description: Badges retrieved successfully
 */
router.get('/', optionalAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Badge routes - Coming soon',
    data: [],
  });
});

/**
 * @swagger
 * /api/badges/user:
 *   get:
 *     summary: Get user's earned badges
 *     tags: [Badges]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User badges retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/user', protect, (req, res) => {
  res.json({
    success: true,
    message: 'User badge routes - Coming soon',
    data: [],
  });
});

export default router;
