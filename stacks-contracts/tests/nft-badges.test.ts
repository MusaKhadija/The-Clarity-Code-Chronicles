
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("StacksQuest NFT Badges Contract", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("can create badge definition as contract owner", () => {
    const { result } = simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("first-quest"),
        Cl.stringUtf8("First Quest Badge"),
        Cl.stringUtf8("Congratulations on completing your first quest!"),
        Cl.stringUtf8("https://stacksquest.com/badges/first-quest.png"),
        Cl.stringAscii("achievement"),
        Cl.stringAscii("common"),
        Cl.some(Cl.uint(1000))
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("cannot create badge definition as non-owner", () => {
    const { result } = simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("unauthorized"),
        Cl.stringUtf8("Unauthorized Badge"),
        Cl.stringUtf8("This should fail"),
        Cl.stringUtf8("https://example.com/badge.png"),
        Cl.stringAscii("achievement"),
        Cl.stringAscii("common"),
        Cl.none()
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100)); // ERR-OWNER-ONLY
  });

  it("can mint badge to user after creating definition", () => {
    // First create badge definition
    simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("test-badge"),
        Cl.stringUtf8("Test Badge"),
        Cl.stringUtf8("A test badge for testing"),
        Cl.stringUtf8("https://stacksquest.com/badges/test.png"),
        Cl.stringAscii("test"),
        Cl.stringAscii("common"),
        Cl.none()
      ],
      deployer
    );

    // Then mint badge to user
    const { result } = simnet.callPublicFn(
      "nft-badges",
      "mint-badge",
      [
        Cl.principal(wallet1),
        Cl.stringAscii("test-badge")
      ],
      deployer
    );
    expect(result).toBeOk(Cl.uint(1)); // First token ID
  });

  it("cannot mint same badge twice to same user", () => {
    // Create badge definition
    simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("unique-badge"),
        Cl.stringUtf8("Unique Badge"),
        Cl.stringUtf8("This badge can only be earned once"),
        Cl.stringUtf8("https://stacksquest.com/badges/unique.png"),
        Cl.stringAscii("achievement"),
        Cl.stringAscii("rare"),
        Cl.none()
      ],
      deployer
    );

    // First mint - should succeed
    const firstMint = simnet.callPublicFn(
      "nft-badges",
      "mint-badge",
      [
        Cl.principal(wallet1),
        Cl.stringAscii("unique-badge")
      ],
      deployer
    );
    expect(firstMint.result).toBeOk(Cl.uint(1));

    // Second mint to same user - should fail
    const secondMint = simnet.callPublicFn(
      "nft-badges",
      "mint-badge",
      [
        Cl.principal(wallet1),
        Cl.stringAscii("unique-badge")
      ],
      deployer
    );
    expect(secondMint.result).toBeErr(Cl.uint(104)); // ERR-MINT-LIMIT
  });

  it("can read badge metadata correctly", () => {
    // Create and mint badge
    simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("metadata-test"),
        Cl.stringUtf8("Metadata Test Badge"),
        Cl.stringUtf8("Testing metadata functionality"),
        Cl.stringUtf8("https://stacksquest.com/badges/metadata.png"),
        Cl.stringAscii("test"),
        Cl.stringAscii("epic"),
        Cl.some(Cl.uint(50))
      ],
      deployer
    );

    simnet.callPublicFn(
      "nft-badges",
      "mint-badge",
      [
        Cl.principal(wallet1),
        Cl.stringAscii("metadata-test")
      ],
      deployer
    );

    // Check token metadata
    const { result } = simnet.callReadOnlyFn(
      "nft-badges",
      "get-token-metadata",
      [Cl.uint(1)],
      deployer
    );

    // Check that metadata is returned correctly
    expect(result).toBeSome(
      Cl.tuple({
        name: Cl.stringUtf8("Metadata Test Badge"),
        description: Cl.stringUtf8("Testing metadata functionality"),
        image: Cl.stringUtf8("https://stacksquest.com/badges/metadata.png"),
        category: Cl.stringAscii("test"),
        rarity: Cl.stringAscii("epic"),
        "quest-id": Cl.none()
      })
    );
  });

  it("can check if user has earned specific badge", () => {
    // First create and mint a badge for this test
    simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("tracking-test"),
        Cl.stringUtf8("Tracking Test Badge"),
        Cl.stringUtf8("Badge for testing tracking"),
        Cl.stringUtf8("https://stacksquest.com/badges/tracking.png"),
        Cl.stringAscii("test"),
        Cl.stringAscii("common"),
        Cl.none()
      ],
      deployer
    );

    simnet.callPublicFn(
      "nft-badges",
      "mint-badge",
      [
        Cl.principal(wallet1),
        Cl.stringAscii("tracking-test")
      ],
      deployer
    );

    // Check that user has earned the badge
    const { result } = simnet.callReadOnlyFn(
      "nft-badges",
      "has-user-earned-badge",
      [
        Cl.principal(wallet1),
        Cl.stringAscii("tracking-test")
      ],
      deployer
    );
    expect(result).toBeBool(true);

    // Check that user hasn't earned a non-existent badge
    const { result: result2 } = simnet.callReadOnlyFn(
      "nft-badges",
      "has-user-earned-badge",
      [
        Cl.principal(wallet1),
        Cl.stringAscii("non-existent")
      ],
      deployer
    );
    expect(result2).toBeBool(false);
  });

  it("can update token metadata URI as owner", () => {
    // Create and mint a badge
    simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("update-test"),
        Cl.stringUtf8("Update Test Badge"),
        Cl.stringUtf8("Badge for testing metadata updates"),
        Cl.stringUtf8("https://stacksquest.com/badges/original.png"),
        Cl.stringAscii("test"),
        Cl.stringAscii("common"),
        Cl.none()
      ],
      deployer
    );

    simnet.callPublicFn(
      "nft-badges",
      "mint-badge",
      [Cl.principal(wallet1), Cl.stringAscii("update-test")],
      deployer
    );

    // Update the metadata URI
    const { result } = simnet.callPublicFn(
      "nft-badges",
      "update-token-metadata-uri",
      [
        Cl.uint(1),
        Cl.stringUtf8("https://stacksquest.com/badges/updated.png")
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("cannot update token metadata URI as non-owner", () => {
    // First create and mint a badge to ensure token exists
    simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("update-uri-test"),
        Cl.stringUtf8("Update URI Test"),
        Cl.stringUtf8("Badge for testing URI updates"),
        Cl.stringUtf8("https://stacksquest.com/badges/original.png"),
        Cl.stringAscii("test"),
        Cl.stringAscii("common"),
        Cl.none()
      ],
      deployer
    );

    simnet.callPublicFn(
      "nft-badges",
      "mint-badge",
      [Cl.principal(wallet1), Cl.stringAscii("update-uri-test")],
      deployer
    );

    // Try to update metadata as non-owner
    const { result } = simnet.callPublicFn(
      "nft-badges",
      "update-token-metadata-uri",
      [
        Cl.uint(1),
        Cl.stringUtf8("https://stacksquest.com/badges/hacked.png")
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100)); // ERR-OWNER-ONLY
  });

  it("can update badge definition as owner", () => {
    // Create a badge definition
    simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("update-def-test"),
        Cl.stringUtf8("Original Name"),
        Cl.stringUtf8("Original description"),
        Cl.stringUtf8("https://stacksquest.com/badges/original.png"),
        Cl.stringAscii("test"),
        Cl.stringAscii("common"),
        Cl.none()
      ],
      deployer
    );

    // Update the badge definition
    const { result } = simnet.callPublicFn(
      "nft-badges",
      "update-badge-definition",
      [
        Cl.stringAscii("update-def-test"),
        Cl.stringUtf8("Updated Name"),
        Cl.stringUtf8("Updated description"),
        Cl.stringUtf8("https://stacksquest.com/badges/updated.png"),
        Cl.bool(true)
      ],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("can deactivate badge definition as owner", () => {
    // Create a badge definition
    simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("deactivate-test"),
        Cl.stringUtf8("Deactivate Test"),
        Cl.stringUtf8("Badge for testing deactivation"),
        Cl.stringUtf8("https://stacksquest.com/badges/deactivate.png"),
        Cl.stringAscii("test"),
        Cl.stringAscii("common"),
        Cl.none()
      ],
      deployer
    );

    // Deactivate the badge definition
    const { result } = simnet.callPublicFn(
      "nft-badges",
      "deactivate-badge-definition",
      [Cl.stringAscii("deactivate-test")],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("can check if badge type exists", () => {
    // Create a badge definition
    simnet.callPublicFn(
      "nft-badges",
      "create-badge-definition",
      [
        Cl.stringAscii("exists-test"),
        Cl.stringUtf8("Exists Test"),
        Cl.stringUtf8("Badge for testing existence check"),
        Cl.stringUtf8("https://stacksquest.com/badges/exists.png"),
        Cl.stringAscii("test"),
        Cl.stringAscii("common"),
        Cl.none()
      ],
      deployer
    );

    // Check that badge type exists
    const { result } = simnet.callReadOnlyFn(
      "nft-badges",
      "badge-type-exists",
      [Cl.stringAscii("exists-test")],
      deployer
    );
    expect(result).toBeBool(true);

    // Check that non-existent badge type doesn't exist
    const { result: result2 } = simnet.callReadOnlyFn(
      "nft-badges",
      "badge-type-exists",
      [Cl.stringAscii("non-existent")],
      deployer
    );
    expect(result2).toBeBool(false);
  });
});
