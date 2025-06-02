// User and Authentication Types
export interface User {
  id: string;
  stacksAddress: string;
  username?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
  progress?: UserProgress[];
  nftBadges?: UserNFTBadge[];
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  level: number;
  experience: number;
  totalQuestsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

// Quest System Types
export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  estimatedTime: number; // in minutes
  prerequisites: string[]; // Quest IDs
  rewards: QuestReward[];
  steps: QuestStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestStep {
  id: string;
  questId: string;
  stepNumber: number;
  title: string;
  description: string;
  type: QuestStepType;
  requirements: QuestStepRequirement[];
  hints?: string[];
  isCompleted?: boolean;
}

export interface QuestStepRequirement {
  type: 'transaction' | 'contract_call' | 'wallet_connect' | 'read_content';
  description: string;
  parameters?: Record<string, any>;
}

export interface QuestReward {
  type: 'nft_badge' | 'tokens' | 'experience';
  amount?: number;
  nftBadgeId?: string;
  description: string;
}

// User Progress Types
export interface UserProgress {
  id: string;
  userId: string;
  questId: string;
  status: QuestStatus;
  currentStep: number;
  completedSteps: number[];
  startedAt: Date;
  completedAt?: Date;
  quest?: Quest;
}

// NFT Badge Types
export interface NFTBadge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirements: string[];
  contractTokenId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNFTBadge {
  id: string;
  userId: string;
  nftBadgeId: string;
  earnedAt: Date;
  transactionId?: string;
  nftBadge?: NFTBadge;
}

// Stacks Blockchain Types
export interface StacksTransaction {
  txId: string;
  txType: string;
  senderAddress: string;
  recipientAddress?: string;
  amount?: number;
  fee: number;
  nonce: number;
  blockHeight?: number;
  blockHash?: string;
  txStatus: 'pending' | 'success' | 'failed';
  timestamp: Date;
}

export interface WalletConnection {
  isConnected: boolean;
  address?: string;
  network: 'testnet' | 'mainnet';
  balance?: number;
}

// Enums
export enum QuestCategory {
  BASICS = 'basics',
  WALLET = 'wallet',
  TRANSACTIONS = 'transactions',
  SMART_CONTRACTS = 'smart_contracts',
  NFTS = 'nfts',
  DEFI = 'defi',
  ADVANCED = 'advanced'
}

export enum QuestDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum QuestStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum QuestStepType {
  TUTORIAL = 'tutorial',
  TRANSACTION = 'transaction',
  CONTRACT_INTERACTION = 'contract_interaction',
  QUIZ = 'quiz',
  PRACTICAL = 'practical'
}

export enum BadgeCategory {
  ACHIEVEMENT = 'achievement',
  MILESTONE = 'milestone',
  SKILL = 'skill',
  SPECIAL = 'special'
}

export enum BadgeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Store Types (for Zustand)
export interface AuthStore {
  user: User | null;
  walletConnection: WalletConnection;
  isAuthenticated: boolean;
  login: (address: string) => Promise<void>;
  logout: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateUser: (user: Partial<User>) => void;
}

export interface QuestStore {
  quests: Quest[];
  userProgress: UserProgress[];
  currentQuest: Quest | null;
  isLoading: boolean;
  error: string | null;
  fetchQuests: () => Promise<void>;
  fetchUserProgress: () => Promise<void>;
  startQuest: (questId: string) => Promise<void>;
  completeQuestStep: (questId: string, stepNumber: number) => Promise<void>;
  setCurrentQuest: (quest: Quest | null) => void;
}
