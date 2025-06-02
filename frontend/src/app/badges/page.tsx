'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import useAuthStore from '@/hooks/useAuthStore';
import { NFTBadge, BadgeCategory, BadgeRarity } from '@/types';

interface BadgeFilters {
  category: BadgeCategory | 'ALL';
  rarity: BadgeRarity | 'ALL';
  earned: 'ALL' | 'EARNED' | 'NOT_EARNED';
}

const BadgesPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [badges, setBadges] = useState<NFTBadge[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<NFTBadge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<BadgeFilters>({
    category: 'ALL',
    rarity: 'ALL',
    earned: 'ALL',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBadges();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [badges, filters, earnedBadges]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock badge data - in real implementation, this would fetch from API
      const mockBadges: NFTBadge[] = [
        {
          id: 'first-quest-badge',
          name: 'First Quest Champion',
          description: 'Completed your first StacksQuest adventure! This badge marks the beginning of your blockchain learning journey.',
          imageUrl: 'https://stacksquest.com/badges/first-quest.png',
          category: 'ACHIEVEMENT' as BadgeCategory,
          rarity: 'COMMON' as BadgeRarity,
          requirements: ['Complete the "First Steps in Stacks" quest'],
          contractTokenId: 1,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          userBadges: [],
          questRewards: [],
        },
        {
          id: 'wallet-master-badge',
          name: 'Wallet Master',
          description: 'Mastered the art of Stacks wallet operations. You can now confidently manage your digital assets.',
          imageUrl: 'https://stacksquest.com/badges/wallet-master.png',
          category: 'SKILL' as BadgeCategory,
          rarity: 'UNCOMMON' as BadgeRarity,
          requirements: ['Complete the "Wallet Mastery" quest'],
          contractTokenId: 2,
          isActive: true,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          userBadges: [],
          questRewards: [],
        },
        {
          id: 'smart-contract-badge',
          name: 'Smart Contract Explorer',
          description: 'Explored the world of Clarity smart contracts. You understand the fundamentals of blockchain programming.',
          imageUrl: 'https://stacksquest.com/badges/smart-contract.png',
          category: 'SKILL' as BadgeCategory,
          rarity: 'RARE' as BadgeRarity,
          requirements: ['Complete the "Smart Contract Basics" quest'],
          contractTokenId: 3,
          isActive: true,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          userBadges: [],
          questRewards: [],
        },
        {
          id: 'early-adopter-badge',
          name: 'Early Adopter',
          description: 'One of the first 100 users to join StacksQuest. Your pioneering spirit is recognized!',
          imageUrl: 'https://stacksquest.com/badges/early-adopter.png',
          category: 'SPECIAL' as BadgeCategory,
          rarity: 'EPIC' as BadgeRarity,
          requirements: ['Be among the first 100 users to register'],
          contractTokenId: 4,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          userBadges: [],
          questRewards: [],
        },
        {
          id: 'blockchain-legend-badge',
          name: 'Blockchain Legend',
          description: 'Achieved mastery across all aspects of Stacks blockchain. You are a true blockchain legend!',
          imageUrl: 'https://stacksquest.com/badges/blockchain-legend.png',
          category: 'MILESTONE' as BadgeCategory,
          rarity: 'LEGENDARY' as BadgeRarity,
          requirements: [
            'Complete all available quests',
            'Reach level 50',
            'Help 10 other users complete quests'
          ],
          contractTokenId: 5,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          userBadges: [],
          questRewards: [],
        },
      ];

      setBadges(mockBadges);

      // Mock earned badges - in real implementation, this would come from user data
      if (isAuthenticated) {
        setEarnedBadges(new Set(['first-quest-badge']));
      }
    } catch (err) {
      setError('Failed to load badges');
      console.error('Badge fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...badges];

    if (filters.category !== 'ALL') {
      filtered = filtered.filter(badge => badge.category === filters.category);
    }

    if (filters.rarity !== 'ALL') {
      filtered = filtered.filter(badge => badge.rarity === filters.rarity);
    }

    if (filters.earned !== 'ALL') {
      if (filters.earned === 'EARNED') {
        filtered = filtered.filter(badge => earnedBadges.has(badge.id));
      } else if (filters.earned === 'NOT_EARNED') {
        filtered = filtered.filter(badge => !earnedBadges.has(badge.id));
      }
    }

    setFilteredBadges(filtered);
  };

  const getRarityColor = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'COMMON': return 'text-gray-600 bg-gray-100 border-gray-300';
      case 'UNCOMMON': return 'text-green-600 bg-green-100 border-green-300';
      case 'RARE': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'EPIC': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'LEGENDARY': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getCategoryIcon = (category: BadgeCategory) => {
    switch (category) {
      case 'ACHIEVEMENT': return '🏆';
      case 'MILESTONE': return '🎯';
      case 'SKILL': return '⚡';
      case 'SPECIAL': return '⭐';
      default: return '🏅';
    }
  };

  const getRarityGlow = (rarity: BadgeRarity) => {
    switch (rarity) {
      case 'EPIC': return 'shadow-lg shadow-purple-200';
      case 'LEGENDARY': return 'shadow-xl shadow-yellow-200';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Layout title="Badges - StacksQuest">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading badges...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Badges - StacksQuest">
        <div className="text-center py-20">
          <div className="text-red-600 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button onClick={fetchBadges} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="NFT Badges - StacksQuest">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            NFT Badge Collection
          </h1>
          <p className="text-xl text-gray-600">
            Earn unique NFT badges by completing quests and achieving milestones
          </p>
          {isAuthenticated && (
            <div className="mt-4 flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{earnedBadges.size}</span> of{' '}
                <span className="font-semibold">{badges.length}</span> badges earned
              </div>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(earnedBadges.size / badges.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as BadgeCategory | 'ALL' }))}
                className="input"
              >
                <option value="ALL">All Categories</option>
                <option value="ACHIEVEMENT">Achievement</option>
                <option value="MILESTONE">Milestone</option>
                <option value="SKILL">Skill</option>
                <option value="SPECIAL">Special</option>
              </select>
            </div>

            {/* Rarity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rarity
              </label>
              <select
                value={filters.rarity}
                onChange={(e) => setFilters(prev => ({ ...prev, rarity: e.target.value as BadgeRarity | 'ALL' }))}
                className="input"
              >
                <option value="ALL">All Rarities</option>
                <option value="COMMON">Common</option>
                <option value="UNCOMMON">Uncommon</option>
                <option value="RARE">Rare</option>
                <option value="EPIC">Epic</option>
                <option value="LEGENDARY">Legendary</option>
              </select>
            </div>

            {/* Earned Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.earned}
                onChange={(e) => setFilters(prev => ({ ...prev, earned: e.target.value as 'ALL' | 'EARNED' | 'NOT_EARNED' }))}
                className="input"
              >
                <option value="ALL">All Badges</option>
                <option value="EARNED">Earned</option>
                <option value="NOT_EARNED">Not Earned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBadges.map((badge) => {
            const isEarned = earnedBadges.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`card hover:shadow-lg transition-all duration-300 ${
                  isEarned ? getRarityGlow(badge.rarity) : 'opacity-75'
                } ${isEarned ? 'ring-2 ring-primary-200' : ''}`}
              >
                {/* Badge Image */}
                <div className="text-center mb-4">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-3 ${
                    isEarned ? 'bg-gradient-to-br from-primary-100 to-secondary-100' : 'bg-gray-100'
                  }`}>
                    {getCategoryIcon(badge.category)}
                  </div>
                  {isEarned && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Earned
                    </div>
                  )}
                </div>

                {/* Badge Info */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {badge.name}
                  </h3>
                  <div className="flex justify-center items-center space-x-2 mb-3">
                    <span className={`badge border ${getRarityColor(badge.rarity)}`}>
                      {badge.rarity}
                    </span>
                    <span className="badge badge-secondary">
                      {badge.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {badge.description}
                  </p>
                </div>

                {/* Requirements */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Requirements:</p>
                  <ul className="space-y-1">
                    {badge.requirements.map((requirement, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="text-primary-500 mr-1">•</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Token ID */}
                {isEarned && badge.contractTokenId && (
                  <div className="text-center">
                    <span className="text-xs text-gray-500">
                      Token #{badge.contractTokenId}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBadges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No badges found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters to see more badges
            </p>
          </div>
        )}

        {/* Call to Action */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Start Earning Badges Today!
            </h3>
            <p className="text-gray-600 mb-6">
              Connect your wallet and complete quests to earn these unique NFT badges
            </p>
            <button className="btn btn-primary">
              Connect Wallet
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BadgesPage;
