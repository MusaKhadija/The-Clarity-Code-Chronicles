# StacksQuest Smart Contracts Documentation

## Overview

StacksQuest uses Clarity smart contracts on the Stacks blockchain to manage NFT badges and ensure transparent, verifiable achievement tracking.

## Contracts

### NFT Badges Contract (`nft-badges.clar`)

A SIP-009 compliant NFT contract that manages educational achievement badges.

#### Features

- **SIP-009 Compliance**: Full compatibility with Stacks NFT standards
- **Badge Definitions**: Predefined badge types with metadata
- **Unique Minting**: Prevents duplicate badges per user
- **Access Control**: Owner-only administrative functions
- **Authorized Minters**: Delegate minting permissions to backend services

#### Constants

```clarity
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-METADATA-FROZEN (err u103))
(define-constant ERR-MINT-LIMIT (err u104))
(define-constant ERR-INVALID-USER (err u105))
```

#### Data Structures

**Badge Definition:**
```clarity
{
  name: (string-utf8 64),
  description: (string-utf8 256),
  image: (string-utf8 256),
  category: (string-ascii 32),
  rarity: (string-ascii 16),
  max-supply: (optional uint),
  is-active: bool
}
```

**Token Metadata:**
```clarity
{
  name: (string-utf8 64),
  description: (string-utf8 256),
  image: (string-utf8 256),
  category: (string-ascii 32),
  rarity: (string-ascii 16),
  quest-id: (optional (string-ascii 64))
}
```

#### Public Functions

##### Administrative Functions

**`create-badge-definition`**
Creates a new badge type that can be minted.

```clarity
(define-public (create-badge-definition 
  (badge-type (string-ascii 32))
  (name (string-utf8 64))
  (description (string-utf8 256))
  (image (string-utf8 256))
  (category (string-ascii 32))
  (rarity (string-ascii 16))
  (max-supply (optional uint))
))
```

**Parameters:**
- `badge-type`: Unique identifier for the badge type
- `name`: Display name of the badge
- `description`: Detailed description
- `image`: URL to badge image
- `category`: Badge category (achievement, milestone, skill, special)
- `rarity`: Badge rarity (common, uncommon, rare, epic, legendary)
- `max-supply`: Optional maximum number that can be minted

**`set-minter-authorization`**
Authorize or deauthorize addresses to mint badges.

```clarity
(define-public (set-minter-authorization (minter principal) (authorized bool))
```

**`set-contract-uri`**
Set the contract metadata URI.

```clarity
(define-public (set-contract-uri (uri (string-utf8 256)))
```

##### Core Functions

**`mint-badge`**
Mint a badge to a user (requires authorization).

```clarity
(define-public (mint-badge (recipient principal) (badge-type (string-ascii 32)))
```

**Security Features:**
- Checks if badge definition exists and is active
- Prevents duplicate badges per user
- Respects max supply limits
- Requires proper authorization

**`transfer`**
Transfer an NFT badge between users (SIP-009 required).

```clarity
(define-public (transfer (token-id uint) (sender principal) (recipient principal)))
```

#### Read-Only Functions

**`get-badge-definition`**
Get badge definition by type.

```clarity
(define-read-only (get-badge-definition (badge-type (string-ascii 32))))
```

**`get-token-metadata`**
Get metadata for a specific token.

```clarity
(define-read-only (get-token-metadata (token-id uint)))
```

**`has-user-earned-badge`**
Check if a user has earned a specific badge type.

```clarity
(define-read-only (has-user-earned-badge (user principal) (badge-type (string-ascii 32))))
```

**`get-badge-mint-count`**
Get the number of badges minted for a specific type.

```clarity
(define-read-only (get-badge-mint-count (badge-type (string-ascii 32))))
```

#### Usage Examples

##### Deploy and Setup

1. Deploy the contract to Stacks blockchain
2. Create badge definitions for your quests
3. Authorize your backend service as a minter

```clarity
;; Create a badge definition
(contract-call? .nft-badges create-badge-definition
  "first-quest"
  u"First Quest Badge"
  u"Congratulations on completing your first quest!"
  u"https://stacksquest.com/badges/first-quest.png"
  "achievement"
  "common"
  (some u1000))

;; Authorize backend service
(contract-call? .nft-badges set-minter-authorization
  'ST1BACKEND-SERVICE-ADDRESS
  true)
```

##### Mint Badges

```clarity
;; Mint badge to user (called by authorized minter)
(contract-call? .nft-badges mint-badge
  'ST1USER-WALLET-ADDRESS
  "first-quest")
```

##### Query Functions

```clarity
;; Check if user has earned a badge
(contract-call? .nft-badges has-user-earned-badge
  'ST1USER-WALLET-ADDRESS
  "first-quest")

;; Get badge metadata
(contract-call? .nft-badges get-token-metadata u1)
```

## Security Considerations

### Access Control
- Only contract owner can create badge definitions
- Only authorized minters can mint badges
- Users can only transfer their own tokens

### Duplicate Prevention
- Each user can only earn one badge of each type
- Badge tracking prevents re-minting

### Supply Management
- Optional max supply limits prevent over-minting
- Mint count tracking for analytics

### Input Validation
- All string inputs are length-limited
- Badge types must exist before minting
- Recipients must be valid principals

## Testing

The contract includes comprehensive tests covering:

- Badge definition creation
- Minting authorization
- Duplicate prevention
- Metadata retrieval
- Transfer functionality
- Error conditions

Run tests with:
```bash
cd stacks-contracts
npm test
```

## Deployment

### Testnet Deployment

1. Configure Clarinet for testnet
2. Deploy using Clarinet
3. Verify contract functions
4. Set up badge definitions

### Mainnet Deployment

1. Audit contract code
2. Test thoroughly on testnet
3. Deploy to mainnet
4. Configure production badge definitions

## Integration

### Backend Integration

The backend service should:

1. Be authorized as a minter
2. Call `mint-badge` when users complete quests
3. Query badge status for user profiles
4. Handle minting errors gracefully

### Frontend Integration

The frontend should:

1. Display user's earned badges
2. Show badge metadata and images
3. Allow badge transfers (if desired)
4. Query available badge types

## Future Enhancements

Potential contract improvements:

- Badge burning/revocation
- Badge evolution/upgrades
- Batch minting operations
- Royalty mechanisms
- Marketplace integration
