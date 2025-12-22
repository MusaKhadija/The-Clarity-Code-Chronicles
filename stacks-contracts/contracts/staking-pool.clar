;; StacksQuest Staking Pool Contract
;; Allows users to stake QUEST tokens to earn additional rewards
;; Implements time-based reward calculation and secure staking mechanics

;; ===== CONSTANTS =====
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u200))
(define-constant ERR-INVALID-AMOUNT (err u201))
(define-constant ERR-INSUFFICIENT-BALANCE (err u202))
(define-constant ERR-NO-STAKING-POSITION (err u203))
(define-constant ERR-STAKING-PAUSED (err u204))
(define-constant ERR-INVALID-DURATION (err u205))
(define-constant ERR-EARLY-WITHDRAWAL (err u206))
(define-constant ERR-ZERO-REWARDS (err u207))

;; Staking parameters
(define-constant BLOCKS-PER-DAY u144) ;; Approximately 144 blocks per day (10 min blocks)
(define-constant MIN-STAKING-PERIOD u1440) ;; 10 days minimum staking period
(define-constant BASE-REWARD-RATE u100) ;; 1% per day (100 basis points)
(define-constant QUEST-TOKEN-CONTRACT 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.quest-tokens)

;; ===== DATA VARIABLES =====
(define-data-var staking-enabled bool true)
(define-data-var total-staked uint u0)
(define-data-var reward-rate-per-block uint u69) ;; ~1% per day = 100/144 basis points per block
(define-data-var minimum-stake-amount uint u1000000) ;; 1 QUEST token (6 decimals)

;; ===== DATA MAPS =====
;; User staking positions
(define-map staking-positions 
  principal 
  {
    amount: uint,
    block-height: uint,
    last-claim-height: uint,
    total-rewards-earned: uint
  }
)

;; Staking statistics
(define-map user-stats 
  principal 
  {
    total-staked: uint,
    total-rewards-claimed: uint,
    total-stakes: uint
  }
)

;; ===== PRIVATE FUNCTIONS =====

;; Calculate rewards for a staking position
(define-private (calculate-rewards (staker principal) (current-height uint))
  (match (map-get? staking-positions staker)
    position
    (let (
      (blocks-staked (- current-height (get last-claim-height position)))
      (staked-amount (get amount position))
      (rewards (* (* staked-amount blocks-staked) (var-get reward-rate-per-block)))
    )
      (/ rewards u10000) ;; Convert from basis points
    )
    u0
  )
)

;; Update user statistics
(define-private (update-user-stats (user principal) (staked-amount uint) (rewards-claimed uint))
  (let (
    (current-stats (default-to {total-staked: u0, total-rewards-claimed: u0, total-stakes: u0} 
                               (map-get? user-stats user)))
  )
    (map-set user-stats user {
      total-staked: (+ (get total-staked current-stats) staked-amount),
      total-rewards-claimed: (+ (get total-rewards-claimed current-stats) rewards-claimed),
      total-stakes: (+ (get total-stakes current-stats) u1)
    })
  )
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get staking position for a user
(define-read-only (get-staking-position (staker principal))
  (map-get? staking-positions staker)
)

;; Get user statistics
(define-read-only (get-user-stats (user principal))
  (default-to {total-staked: u0, total-rewards-claimed: u0, total-stakes: u0} 
              (map-get? user-stats user))
)

;; Calculate current pending rewards
(define-read-only (get-pending-rewards (staker principal))
  (calculate-rewards staker burn-block-height)
)

;; Get total staked in the pool
(define-read-only (get-total-staked)
  (var-get total-staked)
)

;; Get staking parameters
(define-read-only (get-staking-info)
  {
    staking-enabled: (var-get staking-enabled),
    reward-rate-per-block: (var-get reward-rate-per-block),
    minimum-stake-amount: (var-get minimum-stake-amount),
    total-staked: (var-get total-staked),
    min-staking-period: MIN-STAKING-PERIOD
  }
)

;; Check if staking is currently enabled
(define-read-only (is-staking-enabled)
  (var-get staking-enabled)
)

;; Get Annual Percentage Yield (APY) estimate
(define-read-only (get-estimated-apy)
  ;; Simple APY calculation: (rate per block * blocks per day * 365) / 100
  (/ (* (* (var-get reward-rate-per-block) BLOCKS-PER-DAY) u365) u100)
)

;; ===== ADMIN FUNCTIONS =====

;; Toggle staking enabled/disabled
(define-public (set-staking-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set staking-enabled enabled)
    (ok true)
  )
)

;; Update reward rate (in basis points per block)
(define-public (set-reward-rate (new-rate uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set reward-rate-per-block new-rate)
    (ok true)
  )
)

;; Update minimum stake amount
(define-public (set-minimum-stake (amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (var-set minimum-stake-amount amount)
    (ok true)
  )
)

;; ===== PUBLIC FUNCTIONS =====

;; Stake QUEST tokens
(define-public (stake (amount uint))
  (let (
    (staker tx-sender)
    (current-height burn-block-height)
    (existing-position (map-get? staking-positions staker))
  )
    ;; Validate conditions
    (asserts! (var-get staking-enabled) ERR-STAKING-PAUSED)
    (asserts! (>= amount (var-get minimum-stake-amount)) ERR-INVALID-AMOUNT)
    
    ;; Check if user already has a staking position
    (match existing-position
      position
      ;; User already has a position - add to existing stake
      (let (
        (pending-rewards (calculate-rewards staker current-height))
        (new-amount (+ (get amount position) amount))
        (new-total-rewards (+ (get total-rewards-earned position) pending-rewards))
      )
        ;; Transfer tokens from user to contract
        (try! (contract-call? QUEST-TOKEN-CONTRACT transfer amount staker (as-contract tx-sender) none))
        
        ;; Update staking position
        (map-set staking-positions staker {
          amount: new-amount,
          block-height: current-height,
          last-claim-height: current-height,
          total-rewards-earned: new-total-rewards
        })
        
        ;; Update total staked
        (var-set total-staked (+ (var-get total-staked) amount))
        
        ;; Update user stats
        (update-user-stats staker amount u0)
        
        (ok true)
      )
      ;; No existing position - create new one
      (begin
        ;; Transfer tokens from user to contract
        (try! (contract-call? QUEST-TOKEN-CONTRACT transfer amount staker (as-contract tx-sender) none))
        
        ;; Create new staking position
        (map-set staking-positions staker {
          amount: amount,
          block-height: current-height,
          last-claim-height: current-height,
          total-rewards-earned: u0
        })
        
        ;; Update total staked
        (var-set total-staked (+ (var-get total-staked) amount))
        
        ;; Update user stats
        (update-user-stats staker amount u0)
        
        (ok true)
      )
    )
  )
)

;; Unstake tokens (partial or full withdrawal)
(define-public (unstake (amount uint))
  (let (
    (staker tx-sender)
    (current-height burn-block-height)
  )
    (match (map-get? staking-positions staker)
      position
      (let (
        (staked-amount (get amount position))
        (stake-height (get block-height position))
        (blocks-staked (- current-height stake-height))
        (pending-rewards (calculate-rewards staker current-height))
        (remaining-amount (- staked-amount amount))
      )
        ;; Validate withdrawal
        (asserts! (> amount u0) ERR-INVALID-AMOUNT)
        (asserts! (<= amount staked-amount) ERR-INSUFFICIENT-BALANCE)
        (asserts! (>= blocks-staked MIN-STAKING-PERIOD) ERR-EARLY-WITHDRAWAL)
        
        ;; Transfer staked tokens back to user
        (try! (as-contract (contract-call? QUEST-TOKEN-CONTRACT transfer amount tx-sender staker none)))
        
        ;; If partial withdrawal, update position
        (if (> remaining-amount u0)
          (map-set staking-positions staker {
            amount: remaining-amount,
            block-height: (get block-height position),
            last-claim-height: current-height,
            total-rewards-earned: (+ (get total-rewards-earned position) pending-rewards)
          })
          ;; Full withdrawal - remove position
          (map-delete staking-positions staker)
        )
        
        ;; Update total staked
        (var-set total-staked (- (var-get total-staked) amount))
        
        (ok true)
      )
      ERR-NO-STAKING-POSITION
    )
  )
)

;; Claim accumulated rewards
(define-public (claim-rewards)
  (let (
    (staker tx-sender)
    (current-height burn-block-height)
  )
    (match (map-get? staking-positions staker)
      position
      (let (
        (pending-rewards (calculate-rewards staker current-height))
        (total-rewards (+ (get total-rewards-earned position) pending-rewards))
      )
        ;; Check if there are rewards to claim
        (asserts! (> pending-rewards u0) ERR-ZERO-REWARDS)
        
        ;; Mint reward tokens to user
        (try! (as-contract (contract-call? QUEST-TOKEN-CONTRACT mint staker pending-rewards)))
        
        ;; Update staking position
        (map-set staking-positions staker {
          amount: (get amount position),
          block-height: (get block-height position),
          last-claim-height: current-height,
          total-rewards-earned: total-rewards
        })
        
        ;; Update user stats
        (update-user-stats staker u0 pending-rewards)
        
        (ok pending-rewards)
      )
      ERR-NO-STAKING-POSITION
    )
  )
)

;; Compound rewards (claim and immediately stake them)
(define-public (compound-rewards)
  (let (
    (staker tx-sender)
    (current-height burn-block-height)
  )
    (match (map-get? staking-positions staker)
      position
      (let (
        (pending-rewards (calculate-rewards staker current-height))
        (new-staked-amount (+ (get amount position) pending-rewards))
        (total-rewards (+ (get total-rewards-earned position) pending-rewards))
      )
        ;; Check if there are rewards to compound
        (asserts! (> pending-rewards u0) ERR-ZERO-REWARDS)
        
        ;; Mint reward tokens to contract (for compounding)
        (try! (as-contract (contract-call? QUEST-TOKEN-CONTRACT mint (as-contract tx-sender) pending-rewards)))
        
        ;; Update staking position with compounded amount
        (map-set staking-positions staker {
          amount: new-staked-amount,
          block-height: (get block-height position),
          last-claim-height: current-height,
          total-rewards-earned: total-rewards
        })
        
        ;; Update total staked
        (var-set total-staked (+ (var-get total-staked) pending-rewards))
        
        ;; Update user stats
        (update-user-stats staker pending-rewards u0)
        
        (ok pending-rewards)
      )
      ERR-NO-STAKING-POSITION
    )
  )
)

;; Emergency withdraw (for contract owner only)
(define-public (emergency-withdraw (user principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (match (map-get? staking-positions user)
      position
      (let (
        (staked-amount (get amount position))
      )
        ;; Transfer tokens back to user
        (try! (as-contract (contract-call? QUEST-TOKEN-CONTRACT transfer staked-amount tx-sender user none)))
        
        ;; Remove position
        (map-delete staking-positions user)
        
        ;; Update total staked
        (var-set total-staked (- (var-get total-staked) staked-amount))
        
        (ok staked-amount)
      )
      ERR-NO-STAKING-POSITION
    )
  )
)
