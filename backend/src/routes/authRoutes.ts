import express from 'express';
import { body } from 'express-validator';
import { login, register, getProfile } from '@/controllers/authController';
import { protect } from '@/middleware/authMiddleware';
import { validate } from '@/middleware/validationMiddleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - stacksAddress
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         stacksAddress:
 *           type: string
 *           description: The user's Stacks wallet address
 *         username:
 *           type: string
 *           description: The user's chosen username
 *         email:
 *           type: string
 *           description: The user's email address
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was last updated
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login or register a user with Stacks address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stacksAddress
 *             properties:
 *               stacksAddress:
 *                 type: string
 *                 description: The user's Stacks wallet address
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post(
  '/login',
  [
    body('stacksAddress')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Stacks address is required'),
  ],
  validate,
  login
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stacksAddress
 *             properties:
 *               stacksAddress:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input or user already exists
 *       500:
 *         description: Server error
 */
router.post(
  '/register',
  [
    body('stacksAddress')
      .isString()
      .isLength({ min: 1 })
      .withMessage('Stacks address is required'),
    body('username')
      .optional()
      .isString()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email'),
  ],
  validate,
  register
);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile', protect, getProfile);

export default router;
