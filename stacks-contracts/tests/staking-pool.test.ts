import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("StacksQuest Staking Pool Contract", () => {
  beforeEach(() => {
    // Reset the simnet state for each test
    simnet.setEpoch("3.0");
  });

  it("ensures simnet is well initialized", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("has correct staking info", () => {
    const { result } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-staking-info",
      [],
      deployer
    );
    
    expect(result).toBeTuple({
      "staking-enabled": Cl.bool(true),
      "reward-rate-per-block": Cl.uint(69),
      "minimum-stake-amount": Cl.uint(1000000),
      "total-staked": Cl.uint(0),
      "min-staking-period": Cl.uint(1440)
    });
  });

  it("can calculate estimated APY", () => {
    const { result } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-estimated-apy",
      [],
      deployer
    );
    
    // APY should be approximately 36% (69 * 144 * 365 / 100)
    expect(result).toBeUint(36234);
  });

  it("allows owner to set staking parameters", () => {
    // Test setting reward rate
    const { result: setRate } = simnet.callPublicFn(
      "staking-pool",
      "set-reward-rate",
      [Cl.uint(100)], // New rate
      deployer
    );
    expect(setRate).toBeOk(Cl.bool(true));

    // Test setting minimum stake
    const { result: setMinStake } = simnet.callPublicFn(
      "staking-pool",
      "set-minimum-stake",
      [Cl.uint(2000000)], // 2 QUEST tokens
      deployer
    );
    expect(setMinStake).toBeOk(Cl.bool(true));

    // Test disabling staking
    const { result: disable } = simnet.callPublicFn(
      "staking-pool",
      "set-staking-enabled",
      [Cl.bool(false)],
      deployer
    );
    expect(disable).toBeOk(Cl.bool(true));
  });

  it("prevents non-owner from setting parameters", () => {
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "set-reward-rate",
      [Cl.uint(100)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(200)); // ERR-OWNER-ONLY
  });

  it("can stake tokens successfully", () => {
    const stakeAmount = 5000000; // 5 QUEST tokens
    
    // First, mint tokens to wallet1
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    // Stake the tokens
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check staking position
    const { result: position } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-staking-position",
      [Cl.principal(wallet1)],
      deployer
    );
    
    expect(position).toBeSome(Cl.tuple({
      amount: Cl.uint(stakeAmount),
      "block-height": Cl.uint(simnet.blockHeight),
      "last-claim-height": Cl.uint(simnet.blockHeight),
      "total-rewards-earned": Cl.uint(0)
    }));

    // Check total staked
    const { result: totalStaked } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-total-staked",
      [],
      deployer
    );
    expect(totalStaked).toBeUint(stakeAmount);
  });

  it("prevents staking below minimum amount", () => {
    const stakeAmount = 500000; // 0.5 QUEST tokens (below minimum)
    
    // First, mint tokens to wallet1
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    // Try to stake below minimum
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(201)); // ERR-INVALID-AMOUNT
  });

  it("prevents staking when disabled", () => {
    const stakeAmount = 5000000;
    
    // Disable staking
    simnet.callPublicFn(
      "staking-pool",
      "set-staking-enabled",
      [Cl.bool(false)],
      deployer
    );

    // Try to stake
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(204)); // ERR-STAKING-PAUSED
  });

  it("can add to existing stake", () => {
    const initialStake = 3000000;
    const additionalStake = 2000000;
    
    // Setup: mint tokens and initial stake
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(initialStake + additionalStake)],
      deployer
    );

    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(initialStake)],
      wallet1
    );

    // Mine some blocks to generate rewards
    simnet.mineEmptyBlocks(10);

    // Add to existing stake
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(additionalStake)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check updated position
    const { result: position } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-staking-position",
      [Cl.principal(wallet1)],
      deployer
    );
    
    expect(position).toBeSome(Cl.tuple({
      amount: Cl.uint(initialStake + additionalStake),
      "block-height": Cl.uint(simnet.blockHeight - 10), // Original stake height
      "last-claim-height": Cl.uint(simnet.blockHeight),
      "total-rewards-earned": Cl.uint(207000) // Calculated rewards from 10 blocks
    }));
  });

  it("calculates rewards correctly", () => {
    const stakeAmount = 10000000; // 10 QUEST tokens
    
    // Setup staking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Mine 144 blocks (approximately 1 day)
    simnet.mineEmptyBlocks(144);

    // Check pending rewards
    const { result: rewards } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-pending-rewards",
      [Cl.principal(wallet1)],
      deployer
    );
    
    // Expected rewards: 10 tokens * 144 blocks * 69 basis points / 10000 = ~99,360
    expect(rewards).toBeUint(99360);
  });

  it("can claim rewards", () => {
    const stakeAmount = 5000000; // 5 QUEST tokens
    
    // Setup staking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    // Authorize staking pool contract to mint rewards
    simnet.callPublicFn(
      "quest-tokens",
      "set-minter-authorization",
      [Cl.contractPrincipal(simnet.deployer, "staking-pool"), Cl.bool(true)],
      deployer
    );

    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Mine some blocks
    simnet.mineEmptyBlocks(100);

    // Claim rewards
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "claim-rewards",
      [],
      wallet1
    );
    
    // Should return the amount of rewards claimed
    expect(result).toBeOk(Cl.uint(34500)); // 5 * 100 * 69 / 10000

    // Check user balance increased
    const { result: balance } = simnet.callReadOnlyFn(
      "quest-tokens",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(balance).toBeOk(Cl.uint(34500)); // Only rewards (original stake is in contract)
  });

  it("can compound rewards", () => {
    const stakeAmount = 10000000; // 10 QUEST tokens
    
    // Setup staking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    // Authorize staking pool contract to mint rewards
    simnet.callPublicFn(
      "quest-tokens",
      "set-minter-authorization",
      [Cl.contractPrincipal(simnet.deployer, "staking-pool"), Cl.bool(true)],
      deployer
    );

    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Mine some blocks
    simnet.mineEmptyBlocks(50);

    // Compound rewards
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "compound-rewards",
      [],
      wallet1
    );
    
    const expectedRewards = 34500; // 10 * 50 * 69 / 10000
    expect(result).toBeOk(Cl.uint(expectedRewards));

    // Check staking position updated
    const { result: position } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-staking-position",
      [Cl.principal(wallet1)],
      deployer
    );
    
    expect(position).toBeSome(Cl.tuple({
      amount: Cl.uint(stakeAmount + expectedRewards),
      "block-height": Cl.uint(simnet.blockHeight - 50),
      "last-claim-height": Cl.uint(simnet.blockHeight),
      "total-rewards-earned": Cl.uint(expectedRewards)
    }));
  });

  it("prevents early withdrawal", () => {
    const stakeAmount = 5000000;
    
    // Setup staking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Try to withdraw before minimum period (only mine 100 blocks, need 1440)
    simnet.mineEmptyBlocks(100);

    const { result } = simnet.callPublicFn(
      "staking-pool",
      "unstake",
      [Cl.uint(stakeAmount)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(206)); // ERR-EARLY-WITHDRAWAL
  });

  it("allows withdrawal after minimum period", () => {
    const stakeAmount = 5000000;
    
    // Setup staking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Mine enough blocks for minimum period
    simnet.mineEmptyBlocks(1500);

    // Withdraw
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "unstake",
      [Cl.uint(stakeAmount)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check position removed
    const { result: position } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-staking-position",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(position).toBeNone();

    // Check user balance restored
    const { result: balance } = simnet.callReadOnlyFn(
      "quest-tokens",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(balance).toBeOk(Cl.uint(stakeAmount));
  });

  it("allows partial withdrawal", () => {
    const stakeAmount = 10000000;
    const withdrawAmount = 3000000;
    
    // Setup staking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Mine enough blocks for minimum period
    simnet.mineEmptyBlocks(1500);

    // Partial withdrawal
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "unstake",
      [Cl.uint(withdrawAmount)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check remaining position
    const { result: position } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-staking-position",
      [Cl.principal(wallet1)],
      deployer
    );
    
    expect(position).toBeSome(Cl.tuple({
      amount: Cl.uint(stakeAmount - withdrawAmount),
      "block-height": Cl.uint(simnet.blockHeight - 1500),
      "last-claim-height": Cl.uint(simnet.blockHeight),
      "total-rewards-earned": Cl.uint(1035000) // Rewards from 1500 blocks
    }));
  });

  it("tracks user statistics correctly", () => {
    const stakeAmount = 5000000;
    
    // Setup staking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount * 2)],
      deployer
    );

    // Authorize staking pool contract to mint rewards
    simnet.callPublicFn(
      "quest-tokens",
      "set-minter-authorization",
      [Cl.contractPrincipal(simnet.deployer, "staking-pool"), Cl.bool(true)],
      deployer
    );

    // First stake
    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Mine blocks and claim rewards
    simnet.mineEmptyBlocks(100);
    simnet.callPublicFn(
      "staking-pool",
      "claim-rewards",
      [],
      wallet1
    );

    // Second stake
    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Check user stats
    const { result: stats } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-user-stats",
      [Cl.principal(wallet1)],
      deployer
    );
    
    expect(stats).toBeTuple({
      "total-staked": Cl.uint(stakeAmount * 2),
      "total-rewards-claimed": Cl.uint(34500), // Rewards from first period
      "total-stakes": Cl.uint(2)
    });
  });

  it("allows emergency withdrawal by owner", () => {
    const stakeAmount = 5000000;
    
    // Setup staking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Emergency withdrawal by owner
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "emergency-withdraw",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.uint(stakeAmount));

    // Check position removed
    const { result: position } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-staking-position",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(position).toBeNone();
  });

  it("prevents emergency withdrawal by non-owner", () => {
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "emergency-withdraw",
      [Cl.principal(wallet2)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(200)); // ERR-OWNER-ONLY
  });

  it("prevents claiming zero rewards", () => {
    const stakeAmount = 5000000;
    
    // Setup staking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );

    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );

    // Try to claim immediately (no blocks mined)
    const { result } = simnet.callPublicFn(
      "staking-pool",
      "claim-rewards",
      [],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(207)); // ERR-ZERO-REWARDS
  });

  it("handles multiple users staking", () => {
    const stakeAmount = 3000000;
    
    // Setup for both users
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(stakeAmount)],
      deployer
    );
    
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet2), Cl.uint(stakeAmount)],
      deployer
    );

    // Both users stake
    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet1
    );
    
    simnet.callPublicFn(
      "staking-pool",
      "stake",
      [Cl.uint(stakeAmount)],
      wallet2
    );

    // Check total staked
    const { result: totalStaked } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-total-staked",
      [],
      deployer
    );
    expect(totalStaked).toBeUint(stakeAmount * 2);

    // Check individual positions
    const { result: position1 } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-staking-position",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(position1).toBeSome(Cl.tuple({
      amount: Cl.uint(stakeAmount),
      "block-height": Cl.uint(simnet.blockHeight - 1), // wallet1 staked 1 block earlier
      "last-claim-height": Cl.uint(simnet.blockHeight - 1),
      "total-rewards-earned": Cl.uint(0)
    }));

    const { result: position2 } = simnet.callReadOnlyFn(
      "staking-pool",
      "get-staking-position",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(position2).toBeSome(Cl.tuple({
      amount: Cl.uint(stakeAmount),
      "block-height": Cl.uint(simnet.blockHeight),
      "last-claim-height": Cl.uint(simnet.blockHeight),
      "total-rewards-earned": Cl.uint(0)
    }));
  });
});
