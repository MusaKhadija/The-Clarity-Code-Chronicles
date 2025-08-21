import { describe, it, expect, beforeEach } from 'vitest';
import { Cl } from '@stacks/transactions';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;

describe('Quest Progression System', () => {
  
  describe('Initialization and Setup', () => {
    it('initializes player progression correctly', () => {
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'initialize-player',
        [],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify player progress was created
      const progress = simnet.callReadOnlyFn(
        'quest-progression',
        'get-player-progress',
        [Cl.principal(wallet1)],
        deployer
      );
      expect(progress.result).toBeSome(
        Cl.tuple({
          level: Cl.uint(1),
          'total-xp': Cl.uint(0),
          'quests-completed': Cl.uint(0),
          'last-activity': Cl.uint(simnet.blockHeight),
          'achievement-points': Cl.uint(0)
        })
      );
    });

    it('prevents duplicate player initialization', () => {
      // Initialize player first time
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet1);
      
      // Try to initialize again
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'initialize-player',
        [],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(202)); // ERR-ALREADY-COMPLETED
    });
  });

  describe('Quest Management', () => {
    beforeEach(() => {
      // Initialize players for each test
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet1);
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet2);
    });

    it('allows owner to create quests with different difficulties', () => {
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'create-quest',
        [
          Cl.stringUtf8('Beginner Quest'),
          Cl.stringUtf8('Learn the basics of Stacks blockchain'),
          Cl.uint(1), // DIFFICULTY_BEGINNER
          Cl.uint(50), // token reward
          Cl.some(Cl.stringAscii('first-steps')), // badge type
          Cl.list([]) // no prerequisites
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1)); // quest ID

      // Verify quest was created correctly
      const quest = simnet.callReadOnlyFn(
        'quest-progression',
        'get-quest',
        [Cl.uint(1)],
        deployer
      );
      expect(quest.result).toBeSome(
        Cl.tuple({
          name: Cl.stringUtf8('Beginner Quest'),
          description: Cl.stringUtf8('Learn the basics of Stacks blockchain'),
          difficulty: Cl.uint(1),
          'xp-reward': Cl.uint(100), // BASE_XP_BEGINNER
          'token-reward': Cl.uint(50),
          'badge-type': Cl.some(Cl.stringAscii('first-steps')),
          prerequisites: Cl.list([]),
          'is-active': Cl.bool(true),
          'created-at': Cl.uint(simnet.blockHeight),
          'completion-count': Cl.uint(0)
        })
      );
    });

    it('prevents non-owners from creating quests', () => {
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'create-quest',
        [
          Cl.stringUtf8('Unauthorized Quest'),
          Cl.stringUtf8('This should fail'),
          Cl.uint(1),
          Cl.uint(50),
          Cl.none(),
          Cl.list([])
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(200)); // ERR-OWNER-ONLY
    });

    it('validates difficulty levels', () => {
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'create-quest',
        [
          Cl.stringUtf8('Invalid Quest'),
          Cl.stringUtf8('Invalid difficulty'),
          Cl.uint(999), // Invalid difficulty
          Cl.uint(50),
          Cl.none(),
          Cl.list([])
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(205)); // ERR-INVALID-DIFFICULTY
    });
  });

  describe('Quest Completion', () => {
    beforeEach(() => {
      // Setup players and basic quest
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet1);
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet2);
      
      simnet.callPublicFn(
        'quest-progression',
        'create-quest',
        [
          Cl.stringUtf8('First Quest'),
          Cl.stringUtf8('Complete your first blockchain transaction'),
          Cl.uint(1), // Beginner
          Cl.uint(100),
          Cl.some(Cl.stringAscii('first-tx')),
          Cl.list([])
        ],
        deployer
      );
    });

    it('allows eligible players to complete quests', () => {
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'complete-quest',
        [Cl.uint(1)],
        wallet1
      );
      
      expect(result).toBeOk(
        Cl.tuple({
          'xp-earned': Cl.uint(110), // Base 100 + 10% level 1 bonus
          'tokens-earned': Cl.uint(100),
          'new-level': Cl.uint(1),
          'level-up': Cl.bool(false)
        })
      );

      // Verify player progress was updated
      const progress = simnet.callReadOnlyFn(
        'quest-progression',
        'get-player-progress',
        [Cl.principal(wallet1)],
        deployer
      );
      expect(progress.result).toBeSome(
        Cl.tuple({
          level: Cl.uint(1),
          'total-xp': Cl.uint(110),
          'quests-completed': Cl.uint(1),
          'last-activity': Cl.uint(simnet.blockHeight),
          'achievement-points': Cl.uint(1) // Difficulty 1
        })
      );
    });

    it('prevents duplicate quest completion', () => {
      // Complete quest first time
      simnet.callPublicFn('quest-progression', 'complete-quest', [Cl.uint(1)], wallet1);
      
      // Try to complete again
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'complete-quest',
        [Cl.uint(1)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(203)); // ERR-PREREQUISITES-NOT-MET
    });

    it('tracks quest completion in player completed quests list', () => {
      simnet.callPublicFn('quest-progression', 'complete-quest', [Cl.uint(1)], wallet1);
      
      const completedQuests = simnet.callReadOnlyFn(
        'quest-progression',
        'get-completed-quests',
        [Cl.principal(wallet1)],
        deployer
      );
      expect(completedQuests.result).toBeList([Cl.uint(1)]);
    });
  });

  describe('Progressive Difficulty and Prerequisites', () => {
    beforeEach(() => {
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet1);
      
      // Create beginner quest
      simnet.callPublicFn(
        'quest-progression',
        'create-quest',
        [
          Cl.stringUtf8('Quest 1'),
          Cl.stringUtf8('First quest'),
          Cl.uint(1),
          Cl.uint(50),
          Cl.none(),
          Cl.list([])
        ],
        deployer
      );
      
      // Create intermediate quest requiring quest 1
      simnet.callPublicFn(
        'quest-progression',
        'create-quest',
        [
          Cl.stringUtf8('Quest 2'),
          Cl.stringUtf8('Second quest requiring first'),
          Cl.uint(2),
          Cl.uint(150),
          Cl.none(),
          Cl.list([Cl.uint(1)]) // Requires quest 1
        ],
        deployer
      );
    });

    it('prevents completing quests without prerequisites', () => {
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'complete-quest',
        [Cl.uint(2)], // Try quest 2 without completing quest 1
        wallet1
      );
      expect(result).toBeErr(Cl.uint(203)); // ERR-PREREQUISITES-NOT-MET
    });

    it('allows completing quests after prerequisites are met', () => {
      // Complete prerequisite quest first
      simnet.callPublicFn('quest-progression', 'complete-quest', [Cl.uint(1)], wallet1);
      
      // Now complete the dependent quest
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'complete-quest',
        [Cl.uint(2)],
        wallet1
      );
      expect(result).toBeOk(
        Cl.tuple({
          'xp-earned': Cl.uint(275), // Base 250 + 10% level 1 bonus
          'tokens-earned': Cl.uint(150),
          'new-level': Cl.uint(2), // Should level up
          'level-up': Cl.bool(true)
        })
      );
    });

    it('correctly calculates level progression', () => {
      // Complete multiple quests to gain XP
      simnet.callPublicFn('quest-progression', 'complete-quest', [Cl.uint(1)], wallet1); // 110 XP
      simnet.callPublicFn('quest-progression', 'complete-quest', [Cl.uint(2)], wallet1); // 275 XP
      
      const progress = simnet.callReadOnlyFn(
        'quest-progression',
        'get-player-progress',
        [Cl.principal(wallet1)],
        deployer
      );
      expect(progress.result).toBeSome(
        Cl.tuple({
          level: Cl.uint(2), // 385 total XP should be level 2
          'total-xp': Cl.uint(385),
          'quests-completed': Cl.uint(2),
          'last-activity': Cl.uint(simnet.blockHeight),
          'achievement-points': Cl.uint(3) // 1 + 2 difficulty points
        })
      );
    });
  });

  describe('Quest Eligibility and Level Gating', () => {
    beforeEach(() => {
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet1);
      
      // Create expert level quest
      simnet.callPublicFn(
        'quest-progression',
        'create-quest',
        [
          Cl.stringUtf8('Expert Quest'),
          Cl.stringUtf8('Very difficult quest'),
          Cl.uint(4), // DIFFICULTY_EXPERT
          Cl.uint(500),
          Cl.none(),
          Cl.list([])
        ],
        deployer
      );
    });

    it('checks quest eligibility correctly', () => {
      const eligibility = simnet.callReadOnlyFn(
        'quest-progression',
        'is-quest-eligible',
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(eligibility.result).toBe(Cl.bool(false)); // Level 1 player can't do level 4 quest
    });

    it('provides comprehensive player statistics', () => {
      const stats = simnet.callReadOnlyFn(
        'quest-progression',
        'get-player-stats',
        [Cl.principal(wallet1)],
        deployer
      );
      expect(stats.result).toBeTuple({
        progress: Cl.some(Cl.tuple({
          level: Cl.uint(1),
          'total-xp': Cl.uint(0),
          'quests-completed': Cl.uint(0),
          'last-activity': Cl.uint(simnet.blockHeight),
          'achievement-points': Cl.uint(0)
        })),
        'completed-count': Cl.uint(0),
        'available-quests': Cl.uint(1)
      });
    });
  });

  describe('Quest Chains', () => {
    it('allows owner to create quest chains', () => {
      // First create some quests
      simnet.callPublicFn(
        'quest-progression',
        'create-quest',
        [Cl.stringUtf8('Chain Quest 1'), Cl.stringUtf8('First in chain'), Cl.uint(1), Cl.uint(50), Cl.none(), Cl.list([])],
        deployer
      );
      simnet.callPublicFn(
        'quest-progression',
        'create-quest',
        [Cl.stringUtf8('Chain Quest 2'), Cl.stringUtf8('Second in chain'), Cl.uint(1), Cl.uint(50), Cl.none(), Cl.list([])],
        deployer
      );
      
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'create-quest-chain',
        [
          Cl.uint(1),
          Cl.stringUtf8('Learning Path'),
          Cl.list([Cl.uint(1), Cl.uint(2)]),
          Cl.some(Cl.stringAscii('chain-master'))
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
      
      const chain = simnet.callReadOnlyFn(
        'quest-progression',
        'get-quest-chain',
        [Cl.uint(1)],
        deployer
      );
      expect(chain.result).toBeSome(
        Cl.tuple({
          'chain-name': Cl.stringUtf8('Learning Path'),
          'quest-ids': Cl.list([Cl.uint(1), Cl.uint(2)]),
          'total-xp': Cl.uint(200), // 100 + 100 base XP
          'chain-badge': Cl.some(Cl.stringAscii('chain-master')),
          'is-active': Cl.bool(true)
        })
      );
    });
  });

  describe('Challenges System', () => {
    it('allows creating and joining time-limited challenges', () => {
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet1);
      
      // Create a challenge
      const createResult = simnet.callPublicFn(
        'quest-progression',
        'create-challenge',
        [
          Cl.uint(1),
          Cl.stringUtf8('Weekly Challenge'),
          Cl.stringUtf8('Complete quests faster'),
          Cl.list([Cl.uint(1), Cl.uint(2)]),
          Cl.uint(500), // bonus XP
          Cl.uint(100), // bonus tokens
          Cl.uint(1000) // duration in blocks
        ],
        deployer
      );
      expect(createResult.result).toBeOk(Cl.bool(true));
      
      // Join the challenge
      const joinResult = simnet.callPublicFn(
        'quest-progression',
        'join-challenge',
        [Cl.uint(1)],
        wallet1
      );
      expect(joinResult.result).toBeOk(Cl.bool(true));
      
      // Verify challenge data was updated
      const challenge = simnet.callReadOnlyFn(
        'quest-progression',
        'get-active-challenge',
        [Cl.uint(1)],
        deployer
      );
      expect(challenge.result).toBeSome(
        Cl.tuple({
          name: Cl.stringUtf8('Weekly Challenge'),
          description: Cl.stringUtf8('Complete quests faster'),
          'quest-ids': Cl.list([Cl.uint(1), Cl.uint(2)]),
          'bonus-xp': Cl.uint(500),
          'bonus-tokens': Cl.uint(100),
          deadline: Cl.uint(simnet.blockHeight + 1000),
          participants: Cl.uint(1),
          'is-active': Cl.bool(true)
        })
      );
    });

    it('prevents duplicate challenge participation', () => {
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet1);
      
      simnet.callPublicFn(
        'quest-progression',
        'create-challenge',
        [Cl.uint(1), Cl.stringUtf8('Test'), Cl.stringUtf8('Test'), Cl.list([]), Cl.uint(100), Cl.uint(50), Cl.uint(1000)],
        deployer
      );
      
      // Join first time
      simnet.callPublicFn('quest-progression', 'join-challenge', [Cl.uint(1)], wallet1);
      
      // Try to join again
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'join-challenge',
        [Cl.uint(1)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(202)); // ERR-ALREADY-COMPLETED
    });
  });

  describe('Error Handling', () => {
    it('handles non-existent quest completion attempts', () => {
      simnet.callPublicFn('quest-progression', 'initialize-player', [], wallet1);
      
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'complete-quest',
        [Cl.uint(999)], // Non-existent quest
        wallet1
      );
      expect(result).toBeErr(Cl.uint(201)); // ERR-NOT-FOUND
    });

    it('handles uninitialized player operations gracefully', () => {
      // Try to complete quest without initializing player
      const { result } = simnet.callPublicFn(
        'quest-progression',
        'complete-quest',
        [Cl.uint(1)],
        wallet3 // Uninitialized player
      );
      expect(result).toBeErr(Cl.uint(203)); // ERR-PREREQUISITES-NOT-MET
    });
  });
});
