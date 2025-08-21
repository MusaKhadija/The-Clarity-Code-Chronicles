;; StacksQuest Progression System Contract
;; Manages quest chains, player progression, and reward distribution
;; Integrates with NFT badges and quest tokens for comprehensive game mechanics

;; ===== IMPORTS =====
;; Note: In production, would use proper trait implementations

;; ===== CONSTANTS =====
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u200))
(define-constant ERR-NOT-FOUND (err u201))
(define-constant ERR-ALREADY-COMPLETED (err u202))
(define-constant ERR-PREREQUISITES-NOT-MET (err u203))
(define-constant ERR-QUEST-INACTIVE (err u204))
(define-constant ERR-INVALID-DIFFICULTY (err u205))
(define-constant ERR-INSUFFICIENT-LEVEL (err u206))
(define-constant ERR-UNAUTHORIZED (err u207))
(define-constant ERR-INVALID-PARAMETERS (err u208))

;; Quest difficulties and their requirements
(define-constant DIFFICULTY-BEGINNER u1)
(define-constant DIFFICULTY-INTERMEDIATE u2)
(define-constant DIFFICULTY-ADVANCED u3)
(define-constant DIFFICULTY-EXPERT u4)

;; Base rewards by difficulty
(define-constant BASE-XP-BEGINNER u100)
(define-constant BASE-XP-INTERMEDIATE u250)
(define-constant BASE-XP-ADVANCED u500)
(define-constant BASE-XP-EXPERT u1000)

;; Level thresholds (cumulative XP required)
(define-constant LEVEL-2-THRESHOLD u300)
(define-constant LEVEL-3-THRESHOLD u800)
(define-constant LEVEL-4-THRESHOLD u1500)
(define-constant LEVEL-5-THRESHOLD u2500)

;; ===== DATA VARIABLES =====
(define-data-var next-quest-id uint u1)
(define-data-var total-active-quests uint u0)

;; ===== DATA MAPS =====

;; Quest definitions
(define-map quests uint {
  name: (string-utf8 64),
  description: (string-utf8 256),
  difficulty: uint,
  xp-reward: uint,
  token-reward: uint,
  badge-type: (optional (string-ascii 32)),
  prerequisites: (list 5 uint), ;; List of required quest IDs
  is-active: bool,
  created-at: uint,
  completion-count: uint
})

;; Player progression data
(define-map player-progress principal {
  level: uint,
  total-xp: uint,
  quests-completed: uint,
  last-activity: uint,
  achievement-points: uint
})

;; Quest completion tracking
(define-map quest-completions {player: principal, quest-id: uint} {
  completed-at: uint,
  xp-earned: uint,
  token-earned: uint,
  bonus-multiplier: uint
})

;; Player quest completion lists (for efficient queries)
(define-map player-completed-quests principal (list 50 uint))

;; Quest chains - sequential quest relationships
(define-map quest-chains uint {
  chain-name: (string-utf8 64),
  quest-ids: (list 10 uint),
  total-xp: uint,
  chain-badge: (optional (string-ascii 32)),
  is-active: bool
})

;; Daily/weekly challenges
(define-map active-challenges uint {
  name: (string-utf8 64),
  description: (string-utf8 256),
  quest-ids: (list 5 uint),
  bonus-xp: uint,
  bonus-tokens: uint,
  deadline: uint,
  participants: uint,
  is-active: bool
})

;; Challenge participation tracking
(define-map challenge-participants {player: principal, challenge-id: uint} {
  joined-at: uint,
  progress: uint,
  completed: bool
})

;; Leaderboard data (top performers)
(define-map weekly-leaderboard uint {
  player: principal,
  xp-gained: uint,
  quests-completed: uint,
  week: uint
})

;; ===== PRIVATE FUNCTIONS =====

;; Calculate level from total XP
(define-private (calculate-level (total-xp uint))
  (if (>= total-xp LEVEL-5-THRESHOLD) u5
    (if (>= total-xp LEVEL-4-THRESHOLD) u4
      (if (>= total-xp LEVEL-3-THRESHOLD) u3
        (if (>= total-xp LEVEL-2-THRESHOLD) u2 u1))))
)

;; Get base XP reward for difficulty
(define-private (get-base-xp-for-difficulty (difficulty uint))
  (if (is-eq difficulty DIFFICULTY-EXPERT) BASE-XP-EXPERT
    (if (is-eq difficulty DIFFICULTY-ADVANCED) BASE-XP-ADVANCED
      (if (is-eq difficulty DIFFICULTY-INTERMEDIATE) BASE-XP-INTERMEDIATE
        BASE-XP-BEGINNER)))
)

;; Check if player meets quest prerequisites
(define-private (meets-prerequisites (player principal) (quest-prerequisites (list 5 uint)))
  (let ((completed-count (len (filter (lambda (quest-id)
                                        (is-some (map-get? quest-completions {player: player, quest-id: quest-id})))
                                      quest-prerequisites)))
        (required-count (len quest-prerequisites)))
    (is-eq completed-count required-count))
)

;; Calculate completion bonus based on speed and player level
(define-private (calculate-completion-bonus (player principal) (base-xp uint))
  (let ((player-data (unwrap! (map-get? player-progress player) u100)))
    (+ u100 (* (get level player-data) u10))) ;; 10% bonus per player level
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get quest information
(define-read-only (get-quest (quest-id uint))
  (map-get? quests quest-id)
)

;; Get player progression data
(define-read-only (get-player-progress (player principal))
  (map-get? player-progress player)
)

;; Check if player completed a specific quest
(define-read-only (has-completed-quest (player principal) (quest-id uint))
  (is-some (map-get? quest-completions {player: player, quest-id: quest-id}))
)

;; Get player's completed quests list
(define-read-only (get-completed-quests (player principal))
  (default-to (list) (map-get? player-completed-quests player))
)

;; Get quest chain information
(define-read-only (get-quest-chain (chain-id uint))
  (map-get? quest-chains chain-id)
)

;; Get active challenges
(define-read-only (get-active-challenge (challenge-id uint))
  (map-get? active-challenges challenge-id)
)

;; Check quest eligibility for player
(define-read-only (is-quest-eligible (player principal) (quest-id uint))
  (match (map-get? quests quest-id)
    quest-data
    (let ((player-data (default-to {level: u1, total-xp: u0, quests-completed: u0, last-activity: u0, achievement-points: u0}
                                  (map-get? player-progress player))))
      (and
        (get is-active quest-data)
        (not (has-completed-quest player quest-id))
        (>= (get level player-data) (get difficulty quest-data))
        (meets-prerequisites player (get prerequisites quest-data))))
    false)
)

;; Get player statistics
(define-read-only (get-player-stats (player principal))
  (let ((progress (get-player-progress player))
        (completed-quests (get-completed-quests player)))
    {
      progress: progress,
      completed-count: (len completed-quests),
      available-quests: (var-get total-active-quests)
    })
)

;; ===== ADMIN FUNCTIONS =====

;; Create a new quest
(define-public (create-quest 
  (name (string-utf8 64))
  (description (string-utf8 256))
  (difficulty uint)
  (token-reward uint)
  (badge-type (optional (string-ascii 32)))
  (prerequisites (list 5 uint)))
  (let ((quest-id (var-get next-quest-id))
        (base-xp (get-base-xp-for-difficulty difficulty)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (and (>= difficulty DIFFICULTY-BEGINNER) (<= difficulty DIFFICULTY-EXPERT)) ERR-INVALID-DIFFICULTY)
    
    (map-set quests quest-id {
      name: name,
      description: description,
      difficulty: difficulty,
      xp-reward: base-xp,
      token-reward: token-reward,
      badge-type: badge-type,
      prerequisites: prerequisites,
      is-active: true,
      created-at: stacks-block-height,
      completion-count: u0
    })
    
    (var-set next-quest-id (+ quest-id u1))
    (var-set total-active-quests (+ (var-get total-active-quests) u1))
    (ok quest-id))
)

;; Create quest chain
(define-public (create-quest-chain
  (chain-id uint)
  (chain-name (string-utf8 64))
  (quest-ids (list 10 uint))
  (chain-badge (optional (string-ascii 32))))
  (let ((total-xp (fold + (map get-quest-xp quest-ids) u0)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (map-set quest-chains chain-id {
      chain-name: chain-name,
      quest-ids: quest-ids,
      total-xp: total-xp,
      chain-badge: chain-badge,
      is-active: true
    })
    (ok true))
)

;; Helper function to get quest XP (used in chain creation)
(define-private (get-quest-xp (quest-id uint))
  (match (map-get? quests quest-id)
    quest-data (get xp-reward quest-data)
    u0)
)

;; Create timed challenge
(define-public (create-challenge
  (challenge-id uint)
  (name (string-utf8 64))
  (description (string-utf8 256))
  (quest-ids (list 5 uint))
  (bonus-xp uint)
  (bonus-tokens uint)
  (duration-blocks uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (map-set active-challenges challenge-id {
      name: name,
      description: description,
      quest-ids: quest-ids,
      bonus-xp: bonus-xp,
      bonus-tokens: bonus-tokens,
      deadline: (+ stacks-block-height duration-blocks),
      participants: u0,
      is-active: true
    })
    (ok true))
)

;; ===== PUBLIC FUNCTIONS =====

;; Complete a quest
(define-public (complete-quest (quest-id uint))
  (let ((quest-data (unwrap! (map-get? quests quest-id) ERR-NOT-FOUND))
        (player tx-sender)
        (current-progress (default-to {level: u1, total-xp: u0, quests-completed: u0, last-activity: u0, achievement-points: u0}
                                     (map-get? player-progress player))))
    
    ;; Validate quest eligibility
    (asserts! (is-quest-eligible player quest-id) ERR-PREREQUISITES-NOT-MET)
    
    (let ((bonus-multiplier (calculate-completion-bonus player (get xp-reward quest-data)))
          (final-xp (/ (* (get xp-reward quest-data) bonus-multiplier) u100))
          (new-total-xp (+ (get total-xp current-progress) final-xp))
          (new-level (calculate-level new-total-xp))
          (completed-quests (get-completed-quests player)))
      
      ;; Record quest completion
      (map-set quest-completions {player: player, quest-id: quest-id} {
        completed-at: stacks-block-height,
        xp-earned: final-xp,
        token-earned: (get token-reward quest-data),
        bonus-multiplier: bonus-multiplier
      })
      
      ;; Update player progress
      (map-set player-progress player {
        level: new-level,
        total-xp: new-total-xp,
        quests-completed: (+ (get quests-completed current-progress) u1),
        last-activity: stacks-block-height,
        achievement-points: (+ (get achievement-points current-progress) (get difficulty quest-data))
      })
      
      ;; Update completed quests list
      (map-set player-completed-quests player (unwrap-panic (as-max-len? (append completed-quests quest-id) u50)))
      
      ;; Update quest completion count
      (map-set quests quest-id (merge quest-data {completion-count: (+ (get completion-count quest-data) u1)}))
      
      (ok {
        xp-earned: final-xp,
        tokens-earned: (get token-reward quest-data),
        new-level: new-level,
        level-up: (> new-level (get level current-progress))
      }))
  )
)

;; Join a challenge
(define-public (join-challenge (challenge-id uint))
  (let ((challenge-data (unwrap! (map-get? active-challenges challenge-id) ERR-NOT-FOUND))
        (player tx-sender))
    
    (asserts! (get is-active challenge-data) ERR-QUEST-INACTIVE)
    (asserts! (< stacks-block-height (get deadline challenge-data)) ERR-QUEST_INACTIVE)
    (asserts! (is-none (map-get? challenge-participants {player: player, challenge-id: challenge-id})) ERR-ALREADY-COMPLETED)
    
    (map-set challenge-participants {player: player, challenge-id: challenge-id} {
      joined-at: stacks-block-height,
      progress: u0,
      completed: false
    })
    
    (map-set active-challenges challenge-id (merge challenge-data {participants: (+ (get participants challenge-data) u1)}))
    (ok true))
)

;; Initialize player (first-time setup)
(define-public (initialize-player)
  (let ((player tx-sender))
    (asserts! (is-none (map-get? player-progress player)) ERR-ALREADY-COMPLETED)
    
    (map-set player-progress player {
      level: u1,
      total-xp: u0,
      quests-completed: u0,
      last-activity: stacks-block-height,
      achievement-points: u0
    })
    
    (map-set player-completed-quests player (list))
    (ok true))
)
