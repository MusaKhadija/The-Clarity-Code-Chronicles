import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '@/middleware/errorMiddleware';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

/**
 * @desc    Get all NFT badges with optional filtering and pagination
 * @route   GET /api/badges
 * @access  Public
 */
export const getAllBadges = asyncHandler(async (req: Request, res: Response) => {
  const { category, rarity, page = 1, limit = 20 } = req.query;
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

    if (rarity && rarity !== 'ALL') {
      where.rarity = rarity;
    }

    // Get badges with user earned status if authenticated
    const badges = await prisma.nFTBadge.findMany({
      where,
      include: {
        userBadges: userId ? {
          where: { userId },
        } : false,
        questRewards: {
          include: {
            quest: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: [
        { rarity: 'asc' },
        { category: 'asc' },
        { createdAt: 'asc' },
      ],
      skip,
      take: limitNum,
    });

    // Get total count for pagination
    const total = await prisma.nFTBadge.count({ where });

    // Transform data to include earned status
    const badgesWithEarnedStatus = badges.map(badge => ({
      ...badge,
      isEarned: userId ? badge.userBadges.length > 0 : false,
      earnedAt: userId && badge.userBadges.length > 0 ? badge.userBadges[0].earnedAt : null,
      userBadges: undefined, // Remove from response
    }));

    res.status(200).json({
      success: true,
      data: badgesWithEarnedStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error(`Get badges error: ${error}`);
    throw new AppError('Failed to fetch badges', 500);
  }
});

/**
 * @desc    Get badge by ID
 * @route   GET /api/badges/:id
 * @access  Public
 */
export const getBadgeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;

  try {
    const badge = await prisma.nFTBadge.findUnique({
      where: { id },
      include: {
        userBadges: userId ? {
          where: { userId },
        } : false,
        questRewards: {
          include: {
            quest: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!badge) {
      throw new AppError('Badge not found', 404);
    }

    if (!badge.isActive) {
      throw new AppError('Badge is not available', 404);
    }

    // Transform data to include earned status
    const badgeWithEarnedStatus = {
      ...badge,
      isEarned: userId ? badge.userBadges.length > 0 : false,
      earnedAt: userId && badge.userBadges.length > 0 ? badge.userBadges[0].earnedAt : null,
      userBadges: undefined, // Remove from response
    };

    res.status(200).json({
      success: true,
      data: badgeWithEarnedStatus,
    });
  } catch (error) {
    logger.error(`Get badge by ID error: ${error}`);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to fetch badge', 500);
  }
});

/**
 * @desc    Get user's earned badges
 * @route   GET /api/badges/user
 * @access  Private
 */
export const getUserBadges = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const userBadges = await prisma.userNFTBadge.findMany({
      where: { userId },
      include: {
        nftBadge: {
          include: {
            questRewards: {
              include: {
                quest: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { earnedAt: 'desc' },
    });

    // Transform data for response
    const badgesData = userBadges.map(userBadge => ({
      ...userBadge.nftBadge,
      earnedAt: userBadge.earnedAt,
      transactionId: userBadge.transactionId,
      isEarned: true,
    }));

    res.status(200).json({
      success: true,
      data: badgesData,
    });
  } catch (error) {
    logger.error(`Get user badges error: ${error}`);
    throw new AppError('Failed to fetch user badges', 500);
  }
});

/**
 * @desc    Get badge statistics
 * @route   GET /api/badges/stats
 * @access  Public
 */
export const getBadgeStats = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get total badges count
    const totalBadges = await prisma.nFTBadge.count({
      where: { isActive: true },
    });

    // Get badges by category
    const badgesByCategory = await prisma.nFTBadge.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: {
        id: true,
      },
    });

    // Get badges by rarity
    const badgesByRarity = await prisma.nFTBadge.groupBy({
      by: ['rarity'],
      where: { isActive: true },
      _count: {
        id: true,
      },
    });

    // Get total earned badges
    const totalEarnedBadges = await prisma.userNFTBadge.count();

    // Get most popular badges (most earned)
    const popularBadges = await prisma.userNFTBadge.groupBy({
      by: ['nftBadgeId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Get badge details for popular badges
    const popularBadgeIds = popularBadges.map(b => b.nftBadgeId);
    const popularBadgeDetails = await prisma.nFTBadge.findMany({
      where: {
        id: { in: popularBadgeIds },
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        rarity: true,
      },
    });

    // Combine popular badges with their counts
    const popularBadgesWithDetails = popularBadges.map(badge => {
      const details = popularBadgeDetails.find(d => d.id === badge.nftBadgeId);
      return {
        ...details,
        earnedCount: badge._count.id,
      };
    });

    // Get recent badge awards
    const recentAwards = await prisma.userNFTBadge.findMany({
      take: 10,
      orderBy: { earnedAt: 'desc' },
      include: {
        nftBadge: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            rarity: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            stacksAddress: true,
          },
        },
      },
    });

    const stats = {
      totalBadges,
      totalEarnedBadges,
      badgesByCategory: badgesByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      badgesByRarity: badgesByRarity.reduce((acc, item) => {
        acc[item.rarity] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      popularBadges: popularBadgesWithDetails,
      recentAwards: recentAwards.map(award => ({
        badgeId: award.nftBadge.id,
        badgeName: award.nftBadge.name,
        badgeImageUrl: award.nftBadge.imageUrl,
        badgeRarity: award.nftBadge.rarity,
        userId: award.user.id,
        username: award.user.username,
        userAddress: award.user.stacksAddress,
        earnedAt: award.earnedAt,
      })),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error(`Get badge stats error: ${error}`);
    throw new AppError('Failed to fetch badge statistics', 500);
  }
});
