'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useConnect } from '@stacks/connect-react';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { 
  stringAscii, 
  uintCV, 
  principalCV,
  PostConditionMode,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  createAssetInfo
} from '@stacks/transactions';

interface StakingPosition {
  amount: number;
  blockHeight: number;
  lastClaimHeight: number;
  totalRewardsEarned: number;
}

interface StakingInfo {
  stakingEnabled: boolean;
  rewardRatePerBlock: number;
  minimumStakeAmount: number;
  totalStaked: number;
  minStakingPeriod: number;
}

export default function StakingPage() {
  const { user, isAuthenticated, walletConnection } = useAuthStore();
  const { doContractCall } = useConnect();
  
  const [stakingPosition, setStakingPosition] = useState<StakingPosition | null>(null);
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [pendingRewards, setPendingRewards] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const network = walletConnection.network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchStakingData();
    }
  }, [isAuthenticated, user]);

  const fetchStakingData = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, these would be actual contract calls
      // For now, using mock data for demonstration
      
      setStakingInfo({
        stakingEnabled: true,
        rewardRatePerBlock: 69,
        minimumStakeAmount: 1000000, // 1 QUEST token
        totalStaked: 50000000000, // 50k tokens staked total
        minStakingPeriod: 1440 // 10 days in blocks
      });

      // Mock user staking position
      setStakingPosition({
        amount: 5000000, // 5 tokens staked
        blockHeight: 100000,
        lastClaimHeight: 100500,
        totalRewardsEarned: 250000 // 0.25 tokens earned
      });

      setPendingRewards(125000); // 0.125 tokens pending
      setTokenBalance(10000000); // 10 tokens available
    } catch (error) {
      console.error('Failed to fetch staking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || !isAuthenticated) return;

    const amountMicroTokens = Math.floor(parseFloat(stakeAmount) * 1000000);
    
    try {
      setIsLoading(true);
      
      await doContractCall({
        network,
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Replace with actual deployed address
        contractName: 'staking-pool',
        functionName: 'stake',
        functionArgs: [uintCV(amountMicroTokens)],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [
          // Add appropriate post conditions for token transfer
        ],
        onFinish: (data) => {
          console.log('Stake transaction submitted:', data.txId);
          setStakeAmount('');
          fetchStakingData();
        },
        onCancel: () => {
          console.log('Transaction cancelled');
        },
      });
    } catch (error) {
      console.error('Staking failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || !isAuthenticated) return;

    const amountMicroTokens = Math.floor(parseFloat(unstakeAmount) * 1000000);
    
    try {
      setIsLoading(true);
      
      await doContractCall({
        network,
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Replace with actual deployed address
        contractName: 'staking-pool',
        functionName: 'unstake',
        functionArgs: [uintCV(amountMicroTokens)],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        onFinish: (data) => {
          console.log('Unstake transaction submitted:', data.txId);
          setUnstakeAmount('');
          fetchStakingData();
        },
        onCancel: () => {
          console.log('Transaction cancelled');
        },
      });
    } catch (error) {
      console.error('Unstaking failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      
      await doContractCall({
        network,
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Replace with actual deployed address
        contractName: 'staking-pool',
        functionName: 'claim-rewards',
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
          console.log('Claim rewards transaction submitted:', data.txId);
          fetchStakingData();
        },
        onCancel: () => {
          console.log('Transaction cancelled');
        },
      });
    } catch (error) {
      console.error('Claim rewards failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompoundRewards = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      
      await doContractCall({
        network,
        contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Replace with actual deployed address
        contractName: 'staking-pool',
        functionName: 'compound-rewards',
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
          console.log('Compound rewards transaction submitted:', data.txId);
          fetchStakingData();
        },
        onCancel: () => {
          console.log('Transaction cancelled');
        },
      });
    } catch (error) {
      console.error('Compound rewards failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">QUEST Token Staking</h1>
          <p className="text-gray-300 mb-8">Connect your wallet to start earning rewards by staking QUEST tokens</p>
          <div className="bg-purple-800/20 border border-purple-500 rounded-lg p-8">
            <h2 className="text-xl font-semibold text-white mb-4">🔐 Authentication Required</h2>
            <p className="text-gray-300">Please connect your Stacks wallet to access the staking pool.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">QUEST Token Staking Pool</h1>
        <p className="text-gray-300">Stake your QUEST tokens to earn additional rewards</p>
      </div>

      {/* Staking Pool Overview */}
      {stakingInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-purple-800/20 border border-purple-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Total Value Locked</h3>
            <p className="text-2xl font-bold text-purple-400">
              {(stakingInfo.totalStaked / 1000000).toLocaleString()} QUEST
            </p>
          </div>
          
          <div className="bg-green-800/20 border border-green-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Estimated APY</h3>
            <p className="text-2xl font-bold text-green-400">
              {((stakingInfo.rewardRatePerBlock * 144 * 365) / 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="bg-blue-800/20 border border-blue-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Minimum Stake</h3>
            <p className="text-2xl font-bold text-blue-400">
              {stakingInfo.minimumStakeAmount / 1000000} QUEST
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staking Actions */}
        <div className="space-y-6">
          {/* Your Balance */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Your Wallet</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">QUEST Balance:</span>
                <span className="text-white font-semibold">{(tokenBalance / 1000000).toFixed(2)} QUEST</span>
              </div>
              {stakingPosition && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Staked Amount:</span>
                    <span className="text-purple-400 font-semibold">{(stakingPosition.amount / 1000000).toFixed(2)} QUEST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Pending Rewards:</span>
                    <span className="text-green-400 font-semibold">{(pendingRewards / 1000000).toFixed(4)} QUEST</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stake Tokens */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Stake QUEST Tokens</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount to Stake
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount in QUEST"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-400 mt-1">
                  Minimum: {stakingInfo?.minimumStakeAmount ? stakingInfo.minimumStakeAmount / 1000000 : 1} QUEST
                </p>
              </div>
              <button
                onClick={handleStake}
                disabled={isLoading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Stake Tokens'}
              </button>
            </div>
          </div>

          {/* Unstake Tokens */}
          {stakingPosition && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Unstake Tokens</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount to Unstake
                  </label>
                  <input
                    type="number"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    placeholder="Enter amount in QUEST"
                    max={stakingPosition.amount / 1000000}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Max: {(stakingPosition.amount / 1000000).toFixed(2)} QUEST
                  </p>
                </div>
                <button
                  onClick={handleUnstake}
                  disabled={isLoading || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                  className="w-full btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Unstake Tokens'}
                </button>
                <p className="text-xs text-yellow-400">
                  ⚠️ Minimum staking period: {stakingInfo?.minStakingPeriod ? (stakingInfo.minStakingPeriod / 144).toFixed(1) : 10} days
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rewards Section */}
        <div className="space-y-6">
          {stakingPosition && (
            <>
              {/* Claim Rewards */}
              <div className="bg-green-800/20 border border-green-500 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">💰 Claim Rewards</h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-300 mb-1">Pending Rewards</p>
                    <p className="text-3xl font-bold text-green-400">
                      {(pendingRewards / 1000000).toFixed(4)} QUEST
                    </p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleClaimRewards}
                      disabled={isLoading || pendingRewards === 0}
                      className="w-full btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : 'Claim Rewards'}
                    </button>
                    <button
                      onClick={handleCompoundRewards}
                      disabled={isLoading || pendingRewards === 0}
                      className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Processing...' : 'Compound Rewards'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Compound to automatically restake your rewards
                  </p>
                </div>
              </div>

              {/* Staking Statistics */}
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">📊 Your Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Staked:</span>
                    <span className="text-white">{(stakingPosition.amount / 1000000).toFixed(2)} QUEST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Rewards Earned:</span>
                    <span className="text-green-400">{(stakingPosition.totalRewardsEarned / 1000000).toFixed(4)} QUEST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Staking Since Block:</span>
                    <span className="text-white">#{stakingPosition.blockHeight.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Last Claim:</span>
                    <span className="text-white">#{stakingPosition.lastClaimHeight.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Staking Info */}
          <div className="bg-blue-800/20 border border-blue-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">ℹ️ How It Works</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <p>• Stake QUEST tokens to earn rewards over time</p>
              <p>• Rewards are calculated per block (~10 minutes)</p>
              <p>• Minimum staking period prevents early withdrawal</p>
              <p>• Compound rewards to maximize your earnings</p>
              <p>• Claim rewards anytime after earning them</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
