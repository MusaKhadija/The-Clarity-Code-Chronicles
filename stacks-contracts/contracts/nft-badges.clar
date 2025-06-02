
;; StacksQuest NFT Badges Contract
;; SIP-009 compliant NFT contract for educational achievement badges
;; Implements secure minting, transfer, and metadata management

;; ===== IMPORTS =====
;; Note: In production, use the official SIP-009 trait
;; (impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; ===== CONSTANTS =====
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-METADATA-FROZEN (err u103))
(define-constant ERR-MINT-LIMIT (err u104))
(define-constant ERR-INVALID-USER (err u105))

;; ===== DATA VARIABLES =====
(define-data-var last-token-id uint u0)
(define-data-var contract-uri (optional (string-utf8 256)) none)

;; ===== DATA MAPS =====
;; NFT definition
(define-non-fungible-token stacksquest-badge uint)

;; Token metadata
(define-map token-metadata uint {
  name: (string-utf8 64),
  description: (string-utf8 256),
  image: (string-utf8 256),
  category: (string-ascii 32),
  rarity: (string-ascii 16),
  quest-id: (optional (string-ascii 64))
})

;; Badge definitions - predefined badge types
(define-map badge-definitions (string-ascii 32) {
  name: (string-utf8 64),
  description: (string-utf8 256),
  image: (string-utf8 256),
  category: (string-ascii 32),
  rarity: (string-ascii 16),
  max-supply: (optional uint),
  is-active: bool
})

;; Track minted count per badge type
(define-map badge-mint-count (string-ascii 32) uint)

;; Track user badges to prevent duplicates
(define-map user-badges {user: principal, badge-type: (string-ascii 32)} bool)

;; Authorized minters (for quest completion automation)
(define-map authorized-minters principal bool)

;; ===== PRIVATE FUNCTIONS =====

;; Get next token ID
(define-private (get-next-token-id)
  (begin
    (var-set last-token-id (+ (var-get last-token-id) u1))
    (var-get last-token-id)
  )
)

;; Check if user already has a specific badge type
(define-private (user-has-badge (user principal) (badge-type (string-ascii 32)))
  (default-to false (map-get? user-badges {user: user, badge-type: badge-type}))
)

;; ===== READ-ONLY FUNCTIONS =====

;; SIP-009 required functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (match (map-get? token-metadata token-id)
    metadata (ok (some (get image metadata)))
    (err ERR-NOT-FOUND)
  )
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? stacksquest-badge token-id))
)

;; Additional metadata functions
(define-read-only (get-token-metadata (token-id uint))
  (map-get? token-metadata token-id)
)

(define-read-only (get-badge-definition (badge-type (string-ascii 32)))
  (map-get? badge-definitions badge-type)
)

(define-read-only (get-badge-mint-count (badge-type (string-ascii 32)))
  (default-to u0 (map-get? badge-mint-count badge-type))
)

(define-read-only (has-user-earned-badge (user principal) (badge-type (string-ascii 32)))
  (user-has-badge user badge-type)
)

(define-read-only (get-contract-uri)
  (var-get contract-uri)
)

;; Get all tokens owned by a user (helper for frontend)
(define-read-only (get-user-token-count (user principal))
  (let ((balance (len (get-tokens-owned user))))
    balance
  )
)

;; Helper function to get tokens owned by user
(define-read-only (get-tokens-owned (user principal))
  (filter is-owner-of-token (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20))
)

;; Check if user owns a specific token (helper for get-tokens-owned)
(define-private (is-owner-of-token (token-id uint))
  (is-eq (some tx-sender) (nft-get-owner? stacksquest-badge token-id))
)

;; ===== ADMIN FUNCTIONS =====

;; Set contract metadata URI
(define-public (set-contract-uri (uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set contract-uri (some uri))
    (ok true)
  )
)

;; Create a new badge definition
(define-public (create-badge-definition
  (badge-type (string-ascii 32))
  (name (string-utf8 64))
  (description (string-utf8 256))
  (image (string-utf8 256))
  (category (string-ascii 32))
  (rarity (string-ascii 16))
  (max-supply (optional uint))
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (map-set badge-definitions badge-type {
      name: name,
      description: description,
      image: image,
      category: category,
      rarity: rarity,
      max-supply: max-supply,
      is-active: true
    })
    (ok true)
  )
)

;; Authorize/deauthorize minters
(define-public (set-minter-authorization (minter principal) (authorized bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (map-set authorized-minters minter authorized)
    (ok true)
  )
)

;; ===== PUBLIC FUNCTIONS =====

;; SIP-009 transfer function
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)
    (asserts! (is-some (nft-get-owner? stacksquest-badge token-id)) ERR-NOT-FOUND)
    (nft-transfer? stacksquest-badge token-id sender recipient)
  )
)

;; Mint badge to user (for quest completion)
(define-public (mint-badge (recipient principal) (badge-type (string-ascii 32)))
  (let (
    (token-id (get-next-token-id))
    (badge-def (unwrap! (map-get? badge-definitions badge-type) ERR-NOT-FOUND))
    (current-count (get-badge-mint-count badge-type))
  )
    ;; Check authorization
    (asserts! (or
      (is-eq tx-sender CONTRACT-OWNER)
      (default-to false (map-get? authorized-minters tx-sender))
    ) ERR-OWNER-ONLY)

    ;; Check if badge definition is active
    (asserts! (get is-active badge-def) ERR-NOT-FOUND)

    ;; Check if user already has this badge
    (asserts! (not (user-has-badge recipient badge-type)) ERR-MINT-LIMIT)

    ;; Check max supply if set
    (match (get max-supply badge-def)
      max-supply (asserts! (< current-count max-supply) ERR-MINT-LIMIT)
      true
    )

    ;; Mint the NFT
    (try! (nft-mint? stacksquest-badge token-id recipient))

    ;; Set token metadata
    (map-set token-metadata token-id {
      name: (get name badge-def),
      description: (get description badge-def),
      image: (get image badge-def),
      category: (get category badge-def),
      rarity: (get rarity badge-def),
      quest-id: none
    })

    ;; Update tracking maps
    (map-set badge-mint-count badge-type (+ current-count u1))
    (map-set user-badges {user: recipient, badge-type: badge-type} true)

    (ok token-id)
  )
)

;; Batch mint multiple badges (for special events)
(define-public (batch-mint-badges (recipients (list 10 principal)) (badge-type (string-ascii 32)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (ok (map mint-single-badge recipients))
  )
)

;; Helper for batch minting
(define-private (mint-single-badge (recipient principal))
  (mint-badge recipient "batch-mint")
)
