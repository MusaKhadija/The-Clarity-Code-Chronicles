import express from 'express';
import { protect, optionalAuth } from '@/middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/quests:
 *   get:
 *     summary: Get all quests
 *     tags: [Quests]
 *     responses:
 *       200:
 *         description: Quests retrieved successfully
 */
router.get('/', optionalAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Quest routes - Coming soon',
    data: [],
  });
});

/**
 * @swagger
 * /api/quests/{id}:
 *   get:
 *     summary: Get quest by ID
 *     tags: [Quests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quest retrieved successfully
 *       404:
 *         description: Quest not found
 */
router.get('/:id', optionalAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Quest detail routes - Coming soon',
    data: { id: req.params.id },
  });
});

export default router;
