import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '@/middleware/errorMiddleware';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

/**
 * @desc    Get all quests with optional filtering and pagination
 * @route   GET /api/quests
 * @access  Public
 */
export const getAllQuests = asyncHandler(async (req: Request, res: Response) => {
  const { category, difficulty, page = 1, limit = 10 } = req.query;
  const userId = (req as any).user?.id;

  try {
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: any = {
      isActive: true,
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (difficulty && difficulty !== 'ALL') {
      where.difficulty = difficulty;
    }

    // Get quests with user progress if authenticated
    const quests = await prisma.quest.findMany({
      where,
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        rewards: {
          include: {
            nftBadge: true,
          },
        },
        userProgress: userId ? {
          where: { userId },
        } : false,
      },
      orderBy: [
        { difficulty: 'asc' },
        { createdAt: 'asc' },
      ],
      skip,
      take: limitNum,
    });

    // Get total count for pagination
    const total = await prisma.quest.count({ where });

    // Transform data to include user progress status
    const questsWithProgress = quests.map(quest => ({
      ...quest,
      userProgress: quest.userProgress?.[0] || null,
    }));

    res.status(200).json({
      success: true,
      data: questsWithProgress,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error(`Get quests error: ${error}`);
    throw new AppError('Failed to fetch quests', 500);
  }
});

/**
 * @desc    Get quest by ID
 * @route   GET /api/quests/:id
 * @access  Public
 */
export const getQuestById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;

  try {
    const quest = await prisma.quest.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        rewards: {
          include: {
            nftBadge: true,
          },
        },
        userProgress: userId ? {
          where: { userId },
        } : false,
      },
    });

    if (!quest) {
      throw new AppError('Quest not found', 404);
    }

    if (!quest.isActive) {
      throw new AppError('Quest is not available', 404);
    }

    // Transform data to include user progress status
    const questWithProgress = {
      ...quest,
      userProgress: quest.userProgress?.[0] || null,
    };

    res.status(200).json({
      success: true,
      data: questWithProgress,
    });
  } catch (error) {
    logger.error(`Get quest by ID error: ${error}`);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch quest', 500);
  }
});

/**
 * @desc    Start a quest
 * @route   POST /api/quests/:id/start
 * @access  Private
 */
export const startQuest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  try {
    // Check if quest exists and is active
    const quest = await prisma.quest.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
      },
    });

    if (!quest || !quest.isActive) {
      throw new AppError('Quest not found or not available', 404);
    }

    // Check if user already started this quest
    const existingProgress = await prisma.userProgress.findUnique({
      where: {
        userId_questId: {
          userId,
          questId: id,
        },
      },
    });

    if (existingProgress) {
      throw new AppError('Quest already started', 400);
    }

    // Check prerequisites
    if (quest.prerequisites.length > 0) {
      const completedQuests = await prisma.userProgress.findMany({
        where: {
          userId,
          questId: { in: quest.prerequisites },
          status: 'COMPLETED',
        },
      });

      if (completedQuests.length < quest.prerequisites.length) {
        throw new AppError('Prerequisites not met', 400);
      }
    }

    // Create user progress record
    const userProgress = await prisma.userProgress.create({
      data: {
        userId,
        questId: id,
        status: 'IN_PROGRESS',
        currentStep: 1,
        completedSteps: [],
      },
      include: {
        quest: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
            rewards: {
              include: {
                nftBadge: true,
              },
            },
          },
        },
      },
    });

    logger.info(`User ${userId} started quest ${id}`);

    res.status(200).json({
      success: true,
      data: userProgress,
      message: 'Quest started successfully',
    });
  } catch (error) {
    logger.error(`Start quest error: ${error}`);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to start quest', 500);
  }
});

/**
 * @desc    Complete a quest step
 * @route   POST /api/quests/:id/steps/:stepNumber/complete
 * @access  Private
 */
export const completeQuestStep = asyncHandler(async (req: Request, res: Response) => {
  const { id, stepNumber } = req.params;
  const { data: stepData } = req.body;
  const userId = (req as any).user.id;
  const stepNum = parseInt(stepNumber);

  try {
    // Get user progress
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_questId: {
          userId,
          questId: id,
        },
      },
      include: {
        quest: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
            rewards: {
              include: {
                nftBadge: true,
              },
            },
          },
        },
      },
    });

    if (!userProgress) {
      throw new AppError('Quest not started', 400);
    }

    if (userProgress.status === 'COMPLETED') {
      throw new AppError('Quest already completed', 400);
    }

    // Check if step exists
    const step = userProgress.quest.steps.find(s => s.stepNumber === stepNum);
    if (!step) {
      throw new AppError('Step not found', 404);
    }

    // Check if step is already completed
    if (userProgress.completedSteps.includes(stepNum)) {
      throw new AppError('Step already completed', 400);
    }

    // Check if previous steps are completed (sequential completion)
    if (stepNum > 1) {
      const previousStepsCompleted = userProgress.completedSteps.filter(s => s < stepNum);
      if (previousStepsCompleted.length !== stepNum - 1) {
        throw new AppError('Previous steps must be completed first', 400);
      }
    }

    // Validate step requirements (simplified for demo)
    // In a real implementation, this would check specific requirements
    // like wallet connection, transaction completion, etc.

    // Update user progress
    const updatedCompletedSteps = [...userProgress.completedSteps, stepNum];
    const isQuestCompleted = updatedCompletedSteps.length === userProgress.quest.steps.length;

    const updatedProgress = await prisma.userProgress.update({
      where: {
        userId_questId: {
          userId,
          questId: id,
        },
      },
      data: {
        completedSteps: updatedCompletedSteps,
        currentStep: isQuestCompleted ? stepNum : stepNum + 1,
        status: isQuestCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isQuestCompleted ? new Date() : null,
      },
      include: {
        quest: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
            rewards: {
              include: {
                nftBadge: true,
              },
            },
          },
        },
      },
    });

    // If quest is completed, award rewards
    if (isQuestCompleted) {
      await awardQuestRewards(userId, userProgress.quest);
      
      // Update user profile
      await prisma.userProfile.update({
        where: { userId },
        data: {
          totalQuestsCompleted: { increment: 1 },
          experience: { increment: 100 }, // Base XP for quest completion
        },
      });

      logger.info(`User ${userId} completed quest ${id}`);
    }

    res.status(200).json({
      success: true,
      data: updatedProgress,
      message: isQuestCompleted ? 'Quest completed!' : 'Step completed successfully',
    });
  } catch (error) {
    logger.error(`Complete quest step error: ${error}`);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to complete quest step', 500);
  }
});

/**
 * @desc    Get user's quest progress
 * @route   GET /api/quests/progress
 * @access  Private
 */
export const getUserProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const userProgress = await prisma.userProgress.findMany({
      where: { userId },
      include: {
        quest: {
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
            rewards: {
              include: {
                nftBadge: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: userProgress,
    });
  } catch (error) {
    logger.error(`Get user progress error: ${error}`);
    throw new AppError('Failed to fetch user progress', 500);
  }
});

/**
 * Helper function to award quest rewards
 */
async function awardQuestRewards(userId: string, quest: any) {
  try {
    for (const reward of quest.rewards) {
      if (reward.type === 'NFT_BADGE' && reward.nftBadge) {
        // Check if user already has this badge
        const existingBadge = await prisma.userNFTBadge.findUnique({
          where: {
            userId_nftBadgeId: {
              userId,
              nftBadgeId: reward.nftBadgeId,
            },
          },
        });

        if (!existingBadge) {
          await prisma.userNFTBadge.create({
            data: {
              userId,
              nftBadgeId: reward.nftBadgeId,
            },
          });
          logger.info(`Awarded NFT badge ${reward.nftBadgeId} to user ${userId}`);
        }
      } else if (reward.type === 'EXPERIENCE' && reward.amount) {
        await prisma.userProfile.update({
          where: { userId },
          data: {
            experience: { increment: reward.amount },
          },
        });
        logger.info(`Awarded ${reward.amount} XP to user ${userId}`);
      }
    }
  } catch (error) {
    logger.error(`Award rewards error: ${error}`);
    // Don't throw error here to avoid breaking quest completion
  }
}
