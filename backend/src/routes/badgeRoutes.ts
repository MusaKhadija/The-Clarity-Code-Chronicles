import express from 'express';
import { query, param } from 'express-validator';
import { protect, optionalAuth } from '@/middleware/authMiddleware';
import { validate } from '@/middleware/validationMiddleware';
import {
  getAllBadges,
  getBadgeById,
  getUserBadges,
  getBadgeStats
} from '@/controllers/badgeController';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     NFTBadge:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *         category:
 *           type: string
 *           enum: [ACHIEVEMENT, MILESTONE, SKILL, SPECIAL]
 *         rarity:
 *           type: string
 *           enum: [COMMON, UNCOMMON, RARE, EPIC, LEGENDARY]
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *         contractTokenId:
 *           type: integer
 */

/**
 * @swagger
 * /api/badges:
 *   get:
 *     summary: Get all NFT badges with optional filtering
 *     tags: [Badges]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by badge category
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *         description: Filter by badge rarity
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Badges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NFTBadge'
 *                 pagination:
 *                   type: object
 */
router.get(
  '/',
  [
    query('category').optional().isString(),
    query('rarity').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  optionalAuth,
  getAllBadges
);

/**
 * @swagger
 * /api/badges/{id}:
 *   get:
 *     summary: Get badge by ID
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Badge ID
 *     responses:
 *       200:
 *         description: Badge retrieved successfully
 *       404:
 *         description: Badge not found
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty()],
  validate,
  optionalAuth,
  getBadgeById
);

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
router.get('/user', protect, getUserBadges);

/**
 * @swagger
 * /api/badges/stats:
 *   get:
 *     summary: Get badge statistics
 *     tags: [Badges]
 *     responses:
 *       200:
 *         description: Badge statistics retrieved successfully
 */
router.get('/stats', getBadgeStats);

export default router;
