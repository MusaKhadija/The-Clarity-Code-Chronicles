
;; StacksQuest Token Contract
;; SIP-010 compliant fungible token for in-game rewards
;; Implements secure minting, burning, and transfer functionality

;; ===== IMPORTS =====
;; Note: In production, use the official SIP-010 trait
;; (impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; ===== CONSTANTS =====
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-INSUFFICIENT-BALANCE (err u102))
(define-constant ERR-INVALID-AMOUNT (err u103))
(define-constant ERR-UNAUTHORIZED (err u104))
(define-constant ERR-INVALID-RECIPIENT (err u105))

;; Token constants
(define-constant TOKEN-NAME "StacksQuest Token")
(define-constant TOKEN-SYMBOL "QUEST")
(define-constant TOKEN-DECIMALS u6)
(define-constant TOKEN-URI u"https://stacksquest.com/token-metadata.json")

;; Supply constants
(define-constant MAX-SUPPLY u1000000000000) ;; 1 million tokens with 6 decimals
(define-constant INITIAL-SUPPLY u100000000000) ;; 100k tokens initial supply

;; ===== DATA VARIABLES =====
(define-data-var total-supply uint u0)
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://stacksquest.com/token-metadata.json"))

;; ===== DATA MAPS =====
;; Token balances
(define-map balances principal uint)

;; Allowances for approved transfers
(define-map allowances {owner: principal, spender: principal} uint)

;; Authorized minters (for quest rewards)
(define-map authorized-minters principal bool)

;; Quest reward rates (tokens per quest completion)
(define-map quest-rewards (string-ascii 32) uint)

;; ===== FUNGIBLE TOKEN DEFINITION =====
(define-fungible-token stacksquest-token MAX-SUPPLY)

;; ===== PRIVATE FUNCTIONS =====

;; Check if sender is authorized minter
(define-private (is-authorized-minter (sender principal))
  (or
    (is-eq sender CONTRACT-OWNER)
    (default-to false (map-get? authorized-minters sender))
  )
)

;; ===== READ-ONLY FUNCTIONS =====

;; SIP-010 required functions
(define-read-only (get-name)
  (ok TOKEN-NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance stacksquest-token who))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply stacksquest-token))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Additional read-only functions
(define-read-only (get-allowance (owner principal) (spender principal))
  (default-to u0 (map-get? allowances {owner: owner, spender: spender}))
)

(define-read-only (get-quest-reward (quest-type (string-ascii 32)))
  (default-to u0 (map-get? quest-rewards quest-type))
)

(define-read-only (is-minter-authorized (minter principal))
  (is-authorized-minter minter)
)

;; ===== ADMIN FUNCTIONS =====

;; Set token URI
(define-public (set-token-uri (uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set token-uri (some uri))
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

;; Set quest reward amount
(define-public (set-quest-reward (quest-type (string-ascii 32)) (reward-amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (map-set quest-rewards quest-type reward-amount)
    (ok true)
  )
)

;; ===== PUBLIC FUNCTIONS =====

;; SIP-010 transfer function
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (not (is-eq sender recipient)) ERR-INVALID-RECIPIENT)

    (try! (ft-transfer? stacksquest-token amount sender recipient))

    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

;; Mint tokens (for quest rewards)
(define-public (mint (recipient principal) (amount uint))
  (begin
    ;; Check authorization
    (asserts! (is-authorized-minter tx-sender) ERR-UNAUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    ;; Check supply limit
    (asserts! (<= (+ (ft-get-supply stacksquest-token) amount) MAX-SUPPLY) ERR-INVALID-AMOUNT)

    ;; Mint tokens
    (try! (ft-mint? stacksquest-token amount recipient))
    (ok true)
  )
)

;; Mint quest reward
(define-public (mint-quest-reward (recipient principal) (quest-type (string-ascii 32)))
  (let (
    (reward-amount (get-quest-reward quest-type))
  )
    (asserts! (> reward-amount u0) ERR-INVALID-AMOUNT)
    (mint recipient reward-amount)
  )
)

;; Burn tokens
(define-public (burn (amount uint) (sender principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-TOKEN-OWNER)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)

    (try! (ft-burn? stacksquest-token amount sender))
    (ok true)
  )
)

