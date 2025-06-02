'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import useAuthStore from '@/hooks/useAuthStore';
import { User, UserNFTBadge, UserProgress } from '@/types';

interface ProfileStats {
  totalQuests: number;
  completedQuests: number;
  totalBadges: number;
  currentLevel: number;
  experience: number;
  experienceToNext: number;
}

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, walletConnection } = useAuthStore();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    fetchProfileData();
  }, [isAuthenticated]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would fetch from the API
      // For now, we'll use mock data based on the user
      const mockProfileData: User = {
        id: user?.id || 'mock-user-id',
        stacksAddress: user?.stacksAddress || walletConnection.address || '',
        username: user?.username || null,
        email: user?.email || null,
        createdAt: user?.createdAt || new Date(),
        updatedAt: user?.updatedAt || new Date(),
        profile: {
          id: 'profile-id',
          userId: user?.id || 'mock-user-id',
          displayName: user?.username || 'Anonymous Player',
          bio: 'Learning blockchain development through StacksQuest!',
          avatarUrl: null,
          level: 3,
          experience: 750,
          totalQuestsCompleted: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        progress: [
          {
            id: 'progress-1',
            userId: user?.id || 'mock-user-id',
            questId: 'first-quest',
            status: 'COMPLETED' as const,
            currentStep: 5,
            completedSteps: [1, 2, 3, 4, 5],
            startedAt: new Date('2024-05-15'),
            completedAt: new Date('2024-05-16'),
            quest: {
              id: 'first-quest',
              title: 'First Steps in Stacks',
              description: 'Learn the basics of Stacks blockchain',
              category: 'BASICS' as const,
              difficulty: 'BEGINNER' as const,
              estimatedTime: 30,
              prerequisites: [],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              steps: [],
              rewards: [],
              userProgress: [],
            },
          },
          {
            id: 'progress-2',
            userId: user?.id || 'mock-user-id',
            questId: 'wallet-quest',
            status: 'IN_PROGRESS' as const,
            currentStep: 2,
            completedSteps: [1],
            startedAt: new Date('2024-05-20'),
            completedAt: null,
            quest: {
              id: 'wallet-quest',
              title: 'Wallet Mastery',
              description: 'Master Stacks wallet operations',
              category: 'WALLET' as const,
              difficulty: 'INTERMEDIATE' as const,
              estimatedTime: 45,
              prerequisites: ['first-quest'],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              steps: [],
              rewards: [],
              userProgress: [],
            },
          },
        ],
        nftBadges: [
          {
            id: 'badge-1',
            userId: user?.id || 'mock-user-id',
            nftBadgeId: 'first-quest-badge',
            earnedAt: new Date('2024-05-16'),
            transactionId: 'tx123456789',
            nftBadge: {
              id: 'first-quest-badge',
              name: 'First Quest Champion',
              description: 'Completed your first StacksQuest adventure!',
              imageUrl: 'https://stacksquest.com/badges/first-quest.png',
              category: 'ACHIEVEMENT' as const,
              rarity: 'COMMON' as const,
              requirements: ['Complete the First Steps in Stacks quest'],
              contractTokenId: 1,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              userBadges: [],
              questRewards: [],
            },
          },
        ],
      };

      const mockStats: ProfileStats = {
        totalQuests: 10,
        completedQuests: mockProfileData.profile?.totalQuestsCompleted || 0,
        totalBadges: mockProfileData.nftBadges?.length || 0,
        currentLevel: mockProfileData.profile?.level || 1,
        experience: mockProfileData.profile?.experience || 0,
        experienceToNext: 1000 - (mockProfileData.profile?.experience || 0),
      };

      setProfileData(mockProfileData);
      setStats(mockStats);
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getProgressPercentage = (experience: number, level: number) => {
    const baseExp = (level - 1) * 500;
    const nextLevelExp = level * 500;
    const currentLevelExp = experience - baseExp;
    const expNeeded = nextLevelExp - baseExp;
    return Math.min((currentLevelExp / expNeeded) * 100, 100);
  };

  if (!isAuthenticated) {
    return (
      <Layout title="Profile - StacksQuest">
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 mb-8">
            Please connect your Stacks wallet to view your profile.
          </p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="Profile - StacksQuest">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Profile - StacksQuest">
        <div className="text-center py-20">
          <div className="text-red-600 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={fetchProfileData}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile - StacksQuest">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {profileData?.profile?.displayName?.[0]?.toUpperCase() || 'P'}
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">
                {profileData?.profile?.displayName || 'Anonymous Player'}
              </h1>
              <p className="text-white/80 mb-4">
                {profileData?.profile?.bio || 'No bio available'}
              </p>
              
              {/* Wallet Address */}
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <span className="text-white/60">Wallet:</span>
                <code className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                  {formatAddress(profileData?.stacksAddress || '')}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(profileData?.stacksAddress || '')}
                  className="text-white/80 hover:text-white transition-colors"
                  title="Copy address"
                >
                  📋
                </button>
              </div>
              
              {/* Level and Experience */}
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">Level {stats?.currentLevel}</div>
                  <div className="text-white/80 text-sm">Current Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.experience}</div>
                  <div className="text-white/80 text-sm">Experience</div>
                </div>
              </div>
              
              {/* Experience Progress Bar */}
              <div className="mt-4 max-w-md mx-auto md:mx-0">
                <div className="flex justify-between text-sm text-white/80 mb-1">
                  <span>Progress to Level {(stats?.currentLevel || 1) + 1}</span>
                  <span>{stats?.experienceToNext} XP needed</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{
                      width: `${getProgressPercentage(stats?.experience || 0, stats?.currentLevel || 1)}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {stats?.completedQuests}
            </div>
            <div className="text-gray-600">Quests Completed</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              {stats?.totalBadges}
            </div>
            <div className="text-gray-600">Badges Earned</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-accent-600 mb-2">
              {stats?.currentLevel}
            </div>
            <div className="text-gray-600">Current Level</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success-600 mb-2">
              {Math.round(((stats?.completedQuests || 0) / (stats?.totalQuests || 1)) * 100)}%
            </div>
            <div className="text-gray-600">Completion Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Progress */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quest Progress</h2>
            <div className="space-y-4">
              {profileData?.progress?.map((progress) => (
                <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {progress.quest?.title}
                    </h3>
                    <span className={`badge ${
                      progress.status === 'COMPLETED' ? 'badge-success' :
                      progress.status === 'IN_PROGRESS' ? 'badge-primary' :
                      'badge-secondary'
                    }`}>
                      {progress.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {progress.quest?.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Step {progress.currentStep} • {progress.quest?.difficulty}
                    </span>
                    <span className="text-sm text-gray-500">
                      {progress.completedAt ? 
                        `Completed ${progress.completedAt.toLocaleDateString()}` :
                        `Started ${progress.startedAt.toLocaleDateString()}`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NFT Badges */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">NFT Badges</h2>
            <div className="grid grid-cols-2 gap-4">
              {profileData?.nftBadges?.map((userBadge) => (
                <div key={userBadge.id} className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                    🏆
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {userBadge.nftBadge?.name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {userBadge.nftBadge?.description}
                  </p>
                  <div className="flex justify-between items-center text-xs">
                    <span className={`badge ${
                      userBadge.nftBadge?.rarity === 'LEGENDARY' ? 'badge-warning' :
                      userBadge.nftBadge?.rarity === 'EPIC' ? 'badge-error' :
                      userBadge.nftBadge?.rarity === 'RARE' ? 'badge-primary' :
                      'badge-success'
                    }`}>
                      {userBadge.nftBadge?.rarity}
                    </span>
                    <span className="text-gray-500">
                      #{userBadge.nftBadge?.contractTokenId}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Earned {userBadge.earnedAt.toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {/* Empty state */}
              {(!profileData?.nftBadges || profileData.nftBadges.length === 0) && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>No badges earned yet</p>
                  <p className="text-sm">Complete quests to earn your first badge!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
