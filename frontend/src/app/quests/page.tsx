'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import useAuthStore from '@/hooks/useAuthStore';
import { Quest, QuestCategory, QuestDifficulty, QuestStatus } from '@/types';

interface QuestFilters {
  category: QuestCategory | 'ALL';
  difficulty: QuestDifficulty | 'ALL';
  status: QuestStatus | 'ALL';
}

const QuestsPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [filteredQuests, setFilteredQuests] = useState<Quest[]>([]);
  const [filters, setFilters] = useState<QuestFilters>({
    category: 'ALL',
    difficulty: 'ALL',
    status: 'ALL',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [quests, filters]);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock quest data - in real implementation, this would fetch from API
      const mockQuests: Quest[] = [
        {
          id: 'quest-1',
          title: 'First Steps in Stacks',
          description: 'Learn the fundamentals of Stacks blockchain and connect your first wallet.',
          category: 'BASICS' as QuestCategory,
          difficulty: 'BEGINNER' as QuestDifficulty,
          estimatedTime: 30,
          prerequisites: [],
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          steps: [
            {
              id: 'step-1',
              questId: 'quest-1',
              stepNumber: 1,
              title: 'Connect Your Wallet',
              description: 'Connect your Hiro Wallet to StacksQuest',
              type: 'TUTORIAL' as const,
              requirements: [
                {
                  type: 'wallet_connect',
                  description: 'Connect a Stacks wallet',
                  parameters: {},
                },
              ],
              hints: ['Make sure you have the Hiro Wallet extension installed'],
            },
            {
              id: 'step-2',
              questId: 'quest-1',
              stepNumber: 2,
              title: 'Learn About Stacks',
              description: 'Read about Stacks blockchain basics',
              type: 'TUTORIAL' as const,
              requirements: [
                {
                  type: 'read_content',
                  description: 'Read the Stacks introduction',
                  parameters: {},
                },
              ],
              hints: ['Take your time to understand the concepts'],
            },
          ],
          rewards: [
            {
              type: 'nft_badge',
              nftBadgeId: 'first-quest-badge',
              description: 'First Quest Completion Badge',
            },
            {
              type: 'experience',
              amount: 100,
              description: '100 XP for completing your first quest',
            },
          ],
          userProgress: [],
        },
        {
          id: 'quest-2',
          title: 'Wallet Mastery',
          description: 'Master the art of Stacks wallet operations and transactions.',
          category: 'WALLET' as QuestCategory,
          difficulty: 'INTERMEDIATE' as QuestDifficulty,
          estimatedTime: 45,
          prerequisites: ['quest-1'],
          isActive: true,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          steps: [
            {
              id: 'step-3',
              questId: 'quest-2',
              stepNumber: 1,
              title: 'Check Your Balance',
              description: 'Learn how to check your STX balance',
              type: 'PRACTICAL' as const,
              requirements: [
                {
                  type: 'wallet_connect',
                  description: 'Check wallet balance',
                  parameters: {},
                },
              ],
              hints: ['Your balance is displayed in the wallet interface'],
            },
          ],
          rewards: [
            {
              type: 'nft_badge',
              nftBadgeId: 'wallet-master-badge',
              description: 'Wallet Master Badge',
            },
            {
              type: 'tokens',
              amount: 1000000, // 1 QUEST token with 6 decimals
              description: '1 QUEST token reward',
            },
          ],
          userProgress: [],
        },
        {
          id: 'quest-3',
          title: 'Smart Contract Basics',
          description: 'Introduction to Clarity smart contracts and how they work.',
          category: 'SMART_CONTRACTS' as QuestCategory,
          difficulty: 'ADVANCED' as QuestDifficulty,
          estimatedTime: 60,
          prerequisites: ['quest-1', 'quest-2'],
          isActive: true,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
          steps: [
            {
              id: 'step-4',
              questId: 'quest-3',
              stepNumber: 1,
              title: 'Read Contract Code',
              description: 'Examine a simple Clarity contract',
              type: 'TUTORIAL' as const,
              requirements: [
                {
                  type: 'read_content',
                  description: 'Read and understand the contract code',
                  parameters: {},
                },
              ],
              hints: ['Focus on understanding the function definitions'],
            },
          ],
          rewards: [
            {
              type: 'nft_badge',
              nftBadgeId: 'smart-contract-badge',
              description: 'Smart Contract Explorer Badge',
            },
            {
              type: 'experience',
              amount: 250,
              description: '250 XP for smart contract mastery',
            },
          ],
          userProgress: [],
        },
      ];

      setQuests(mockQuests);
    } catch (err) {
      setError('Failed to load quests');
      console.error('Quest fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...quests];

    if (filters.category !== 'ALL') {
      filtered = filtered.filter(quest => quest.category === filters.category);
    }

    if (filters.difficulty !== 'ALL') {
      filtered = filtered.filter(quest => quest.difficulty === filters.difficulty);
    }

    // Note: In a real implementation, status would come from user progress
    // For now, we'll show all quests as available

    setFilteredQuests(filtered);
  };

  const handleStartQuest = async (questId: string) => {
    if (!isAuthenticated) {
      alert('Please connect your wallet to start quests');
      return;
    }

    try {
      // In real implementation, this would call the API
      console.log('Starting quest:', questId);
      alert('Quest started! (This would navigate to the quest details page)');
    } catch (error) {
      console.error('Failed to start quest:', error);
      alert('Failed to start quest. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty: QuestDifficulty) => {
    switch (difficulty) {
      case 'BEGINNER': return 'text-green-600 bg-green-100';
      case 'INTERMEDIATE': return 'text-yellow-600 bg-yellow-100';
      case 'ADVANCED': return 'text-orange-600 bg-orange-100';
      case 'EXPERT': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: QuestCategory) => {
    switch (category) {
      case 'BASICS': return '📚';
      case 'WALLET': return '💼';
      case 'TRANSACTIONS': return '💸';
      case 'SMART_CONTRACTS': return '📜';
      case 'NFTS': return '🎨';
      case 'DEFI': return '🏦';
      case 'ADVANCED': return '🚀';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <Layout title="Quests - StacksQuest">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quests...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Quests - StacksQuest">
        <div className="text-center py-20">
          <div className="text-red-600 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button onClick={fetchQuests} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Quests - StacksQuest">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Learning Quests
          </h1>
          <p className="text-xl text-gray-600">
            Master Stacks blockchain through hands-on quests and earn rewards
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Quests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as QuestCategory | 'ALL' }))}
                className="input"
              >
                <option value="ALL">All Categories</option>
                <option value="BASICS">Basics</option>
                <option value="WALLET">Wallet</option>
                <option value="TRANSACTIONS">Transactions</option>
                <option value="SMART_CONTRACTS">Smart Contracts</option>
                <option value="NFTS">NFTs</option>
                <option value="DEFI">DeFi</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value as QuestDifficulty | 'ALL' }))}
                className="input"
              >
                <option value="ALL">All Difficulties</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as QuestStatus | 'ALL' }))}
                className="input"
              >
                <option value="ALL">All Statuses</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quest Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuests.map((quest) => (
            <div key={quest.id} className="card hover:shadow-lg transition-shadow">
              {/* Quest Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{getCategoryIcon(quest.category)}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {quest.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`badge ${getDifficultyColor(quest.difficulty)}`}>
                        {quest.difficulty}
                      </span>
                      <span className="text-sm text-gray-500">
                        {quest.estimatedTime} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quest Description */}
              <p className="text-gray-600 mb-4">{quest.description}</p>

              {/* Prerequisites */}
              {quest.prerequisites.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Prerequisites:</p>
                  <div className="flex flex-wrap gap-1">
                    {quest.prerequisites.map((prereq, index) => (
                      <span key={index} className="badge badge-secondary text-xs">
                        Quest {index + 1}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rewards */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Rewards:</p>
                <div className="space-y-1">
                  {quest.rewards.map((reward, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>
                        {reward.type === 'nft_badge' ? '🏆' : 
                         reward.type === 'tokens' ? '🪙' : '⭐'}
                      </span>
                      <span>{reward.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleStartQuest(quest.id)}
                className="btn btn-primary w-full"
                disabled={!isAuthenticated}
              >
                {isAuthenticated ? 'Start Quest' : 'Connect Wallet to Start'}
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredQuests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No quests found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters to see more quests
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuestsPage;
