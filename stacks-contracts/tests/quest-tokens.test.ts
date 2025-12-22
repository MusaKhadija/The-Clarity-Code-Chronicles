
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("StacksQuest Token Contract", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("has correct token metadata", () => {
    const { result: name } = simnet.callReadOnlyFn("quest-tokens", "get-name", [], deployer);
    expect(name).toBeOk(Cl.stringAscii("StacksQuest Token"));

    const { result: symbol } = simnet.callReadOnlyFn("quest-tokens", "get-symbol", [], deployer);
    expect(symbol).toBeOk(Cl.stringAscii("QUEST"));

    const { result: decimals } = simnet.callReadOnlyFn("quest-tokens", "get-decimals", [], deployer);
    expect(decimals).toBeOk(Cl.uint(6));
  });

  it("can set quest reward as owner", () => {
    const { result } = simnet.callPublicFn(
      "quest-tokens",
      "set-quest-reward",
      [
        Cl.stringAscii("first-quest"),
        Cl.uint(1000000) // 1 token with 6 decimals
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify the reward was set
    const { result: reward } = simnet.callReadOnlyFn(
      "quest-tokens",
      "get-quest-reward",
      [Cl.stringAscii("first-quest")],
      deployer
    );
    expect(reward).toBeUint(1000000);
  });

  it("cannot set quest reward as non-owner", () => {
    const { result } = simnet.callPublicFn(
      "quest-tokens",
      "set-quest-reward",
      [
        Cl.stringAscii("unauthorized"),
        Cl.uint(1000000)
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100)); // ERR-OWNER-ONLY
  });

  it("can authorize minter as owner", () => {
    const { result } = simnet.callPublicFn(
      "quest-tokens",
      "set-minter-authorization",
      [
        Cl.principal(wallet1),
        Cl.bool(true)
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify authorization
    const { result: isAuthorized } = simnet.callReadOnlyFn(
      "quest-tokens",
      "is-minter-authorized",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(isAuthorized).toBeBool(true);
  });

  it("can mint tokens as authorized minter", () => {
    // First authorize wallet1 as minter
    simnet.callPublicFn(
      "quest-tokens",
      "set-minter-authorization",
      [Cl.principal(wallet1), Cl.bool(true)],
      deployer
    );

    // Mint tokens to wallet2
    const { result } = simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [
        Cl.principal(wallet2),
        Cl.uint(5000000) // 5 tokens
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balance
    const { result: balance } = simnet.callReadOnlyFn(
      "quest-tokens",
      "get-balance",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(balance).toBeOk(Cl.uint(5000000));
  });

  it("cannot mint tokens as unauthorized user", () => {
    const { result } = simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [
        Cl.principal(wallet2),
        Cl.uint(1000000)
      ],
      wallet2 // unauthorized
    );
    expect(result).toBeErr(Cl.uint(104)); // ERR-UNAUTHORIZED
  });

  it("can mint quest reward", () => {
    // Set up quest reward
    simnet.callPublicFn(
      "quest-tokens",
      "set-quest-reward",
      [Cl.stringAscii("test-quest"), Cl.uint(2000000)],
      deployer
    );

    // Authorize deployer as minter (owner is automatically authorized)
    const { result } = simnet.callPublicFn(
      "quest-tokens",
      "mint-quest-reward",
      [
        Cl.principal(wallet1),
        Cl.stringAscii("test-quest")
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balance
    const { result: balance } = simnet.callReadOnlyFn(
      "quest-tokens",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(balance).toBeOk(Cl.uint(2000000));
  });

  it("can transfer tokens between users", () => {
    // First mint some tokens to wallet1
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(10000000)],
      deployer
    );

    // Transfer tokens from wallet1 to wallet2
    const { result } = simnet.callPublicFn(
      "quest-tokens",
      "transfer",
      [
        Cl.uint(3000000), // 3 tokens
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.none()
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check balances
    const { result: balance1 } = simnet.callReadOnlyFn(
      "quest-tokens",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(balance1).toBeOk(Cl.uint(7000000)); // 10 - 3 = 7

    const { result: balance2 } = simnet.callReadOnlyFn(
      "quest-tokens",
      "get-balance",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(balance2).toBeOk(Cl.uint(3000000)); // 3 tokens transferred
  });

  it("cannot transfer more tokens than balance", () => {
    // Try to transfer more than wallet1's balance
    const { result } = simnet.callPublicFn(
      "quest-tokens",
      "transfer",
      [
        Cl.uint(100000000), // 100 tokens (more than balance)
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.none()
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(1)); // Insufficient balance error from ft-transfer
  });

  it("can burn tokens", () => {
    // First mint some tokens to wallet1
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(5000000)],
      deployer
    );

    // Burn some tokens
    const burnAmount = 1000000; // 1 token
    const { result } = simnet.callPublicFn(
      "quest-tokens",
      "burn",
      [
        Cl.uint(burnAmount),
        Cl.principal(wallet1)
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Check new balance
    const { result: newBalance } = simnet.callReadOnlyFn(
      "quest-tokens",
      "get-balance",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(newBalance).toBeOk(Cl.uint(4000000)); // 5 - 1 = 4
  });

  it("tracks total supply correctly", () => {
    // Mint some tokens to test supply tracking
    simnet.callPublicFn(
      "quest-tokens",
      "mint",
      [Cl.principal(wallet1), Cl.uint(1000000)],
      deployer
    );

    const { result } = simnet.callReadOnlyFn(
      "quest-tokens",
      "get-total-supply",
      [],
      deployer
    );

    // Should have the minted amount
    expect(result).toBeOk(Cl.uint(1000000));
  });
});
