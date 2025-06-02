import express from 'express';
import { protect } from '@/middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', protect, (req, res) => {
  res.json({
    success: true,
    message: 'User routes - Coming soon',
    data: req.user,
  });
});

export default router;
