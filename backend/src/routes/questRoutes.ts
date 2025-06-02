import express from 'express';
import { body, query, param } from 'express-validator';
import { protect, optionalAuth } from '@/middleware/authMiddleware';
import { validate } from '@/middleware/validationMiddleware';
import {
  getAllQuests,
  getQuestById,
  startQuest,
  completeQuestStep,
  getUserProgress
} from '@/controllers/questController';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Quest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [BASICS, WALLET, TRANSACTIONS, SMART_CONTRACTS, NFTS, DEFI, ADVANCED]
 *         difficulty:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT]
 *         estimatedTime:
 *           type: integer
 *         prerequisites:
 *           type: array
 *           items:
 *             type: string
 *         rewards:
 *           type: array
 *           items:
 *             type: object
 *         steps:
 *           type: array
 *           items:
 *             type: object
 */

/**
 * @swagger
 * /api/quests:
 *   get:
 *     summary: Get all quests with optional filtering
 *     tags: [Quests]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by quest category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by difficulty level
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
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Quests retrieved successfully
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
 *                     $ref: '#/components/schemas/Quest'
 *                 pagination:
 *                   type: object
 */
router.get(
  '/',
  [
    query('category').optional().isString(),
    query('difficulty').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  optionalAuth,
  getAllQuests
);

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
 *         description: Quest ID
 *     responses:
 *       200:
 *         description: Quest retrieved successfully
 *       404:
 *         description: Quest not found
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty()],
  validate,
  optionalAuth,
  getQuestById
);

/**
 * @swagger
 * /api/quests/{id}/start:
 *   post:
 *     summary: Start a quest
 *     tags: [Quests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quest ID
 *     responses:
 *       200:
 *         description: Quest started successfully
 *       400:
 *         description: Quest already started or prerequisites not met
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Quest not found
 */
router.post(
  '/:id/start',
  [param('id').isString().notEmpty()],
  validate,
  protect,
  startQuest
);

/**
 * @swagger
 * /api/quests/{id}/steps/{stepNumber}/complete:
 *   post:
 *     summary: Complete a quest step
 *     tags: [Quests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Quest ID
 *       - in: path
 *         name: stepNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: Step number to complete
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 description: Additional data for step completion
 *     responses:
 *       200:
 *         description: Quest step completed successfully
 *       400:
 *         description: Invalid step or requirements not met
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Quest or step not found
 */
router.post(
  '/:id/steps/:stepNumber/complete',
  [
    param('id').isString().notEmpty(),
    param('stepNumber').isInt({ min: 1 }),
    body('data').optional().isObject(),
  ],
  validate,
  protect,
  completeQuestStep
);

/**
 * @swagger
 * /api/quests/progress:
 *   get:
 *     summary: Get user's quest progress
 *     tags: [Quests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User progress retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/progress', protect, getUserProgress);

export default router;
