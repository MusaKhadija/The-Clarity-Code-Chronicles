import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AppError, asyncHandler } from '@/middleware/errorMiddleware';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Send token response
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  const token = generateToken(user.id);

  // Remove sensitive data
  const { ...userData } = user;

  res.status(statusCode).json({
    success: true,
    data: {
      user: userData,
      token,
    },
  });
};

/**
 * @desc    Login user or create if doesn't exist
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { stacksAddress } = req.body;

  if (!stacksAddress) {
    throw new AppError('Please provide a Stacks address', 400);
  }

  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { stacksAddress },
      include: {
        profile: true,
        progress: {
          include: {
            quest: true,
          },
        },
        nftBadges: {
          include: {
            nftBadge: true,
          },
        },
      },
    });

    // If user doesn't exist, create new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          stacksAddress,
          profile: {
            create: {
              level: 1,
              experience: 0,
              totalQuestsCompleted: 0,
            },
          },
        },
        include: {
          profile: true,
          progress: {
            include: {
              quest: true,
            },
          },
          nftBadges: {
            include: {
              nftBadge: true,
            },
          },
        },
      });

      logger.info(`New user created: ${stacksAddress}`);
    } else {
      logger.info(`User logged in: ${stacksAddress}`);
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`Login error: ${error}`);
    throw new AppError('Authentication failed', 500);
  }
});

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { stacksAddress, username, email } = req.body;

  if (!stacksAddress) {
    throw new AppError('Please provide a Stacks address', 400);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { stacksAddress },
    });

    if (existingUser) {
      throw new AppError('User with this Stacks address already exists', 400);
    }

    // Check if username is taken
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        throw new AppError('Username is already taken', 400);
      }
    }

    // Check if email is taken
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        throw new AppError('Email is already registered', 400);
      }
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        stacksAddress,
        username,
        email,
        profile: {
          create: {
            displayName: username,
            level: 1,
            experience: 0,
            totalQuestsCompleted: 0,
          },
        },
      },
      include: {
        profile: true,
        progress: {
          include: {
            quest: true,
          },
        },
        nftBadges: {
          include: {
            nftBadge: true,
          },
        },
      },
    });

    logger.info(`New user registered: ${stacksAddress}`);
    sendTokenResponse(user, 201, res);
  } catch (error) {
    logger.error(`Registration error: ${error}`);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Registration failed', 500);
  }
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: (req as any).user.id },
    include: {
      profile: true,
      progress: {
        include: {
          quest: true,
        },
      },
      nftBadges: {
        include: {
          nftBadge: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});
