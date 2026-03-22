# 1v1 Match System — Implementation Plan

## Overview

This document outlines the full implementation plan for adding a 1v1 competitive match system to League of Coders. The system covers matchmaking via MMR-based queuing, real-time match events over WebSocket, sandboxed code execution via Judge0, win condition evaluation, and ELO-based scoring.

---

## Phase 1 — Data model changes

### 1.1 Extend the `User` model

Add the following fields to `userModel.go`:

```go
MMR           int     `gorm:"not null;default:1000"`
WinRate       float64 `gorm:"not null;default:0"`
MatchesPlayed int     `gorm:"not null;default:0"`
```

Run a migration after this change. Default MMR of 1000 is standard for new ELO systems.

### 1.2 Add `Problem` model

Create `problemModel.go`:

```go
type Problem struct {
    ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
    Title       string    `gorm:"not null"`
    Description string    `gorm:"type:text;not null"`
    Difficulty  string    `gorm:"type:varchar(10);check:difficulty IN ('easy','medium','hard')"`
    PointValue  int       `gorm:"not null;default:100"`
    SuccessRate float64   `gorm:"not null;default:0"`
}
```

### 1.3 Add `TestCase` model

Create `testCaseModel.go`:

```go
type TestCase struct {
    ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
    ProblemID uuid.UUID `gorm:"type:uuid;not null"`
    Input     string    `gorm:"type:text"`
    Expected  string    `gorm:"type:text;not null"`
    IsHidden  bool      `gorm:"not null;default:false"`
}
```

Hidden test cases are not shown to the player but are used for judging.

### 1.4 Add `Match` model

Create `matchModel.go`:

```go
type Match struct {
    ID        uuid.UUID      `gorm:"type:uuid;primaryKey"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`

    Player1ID uuid.UUID  `gorm:"type:uuid;not null"`
    Player2ID uuid.UUID  `gorm:"type:uuid;not null"`
    ProblemID uuid.UUID  `gorm:"type:uuid;not null"`
    WinnerID  *uuid.UUID `gorm:"type:uuid"`

    Status    string    `gorm:"type:varchar(20);default:'waiting';check:status IN ('waiting','in_progress','finished','cancelled')"`
    StartedAt *time.Time
    EndedAt   *time.Time
}
```

### 1.5 Add `Submission` model

Create `submissionModel.go`:

```go
type Submission struct {
    ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
    CreatedAt   time.Time

    MatchID     uuid.UUID `gorm:"type:uuid;not null"`
    UserID      uuid.UUID `gorm:"type:uuid;not null"`
    Code        string    `gorm:"type:text;not null"`
    Language    string    `gorm:"type:varchar(30);not null"`
    TestsPassed int       `gorm:"not null;default:0"`
    TestsTotal  int       `gorm:"not null;default:0"`
    Status      string    `gorm:"type:varchar(20);check:status IN ('pending','accepted','wrong_answer','error','timeout')"`
    SubmittedAt time.Time
}
```

---

## Phase 2 — Infrastructure setup

### 2.1 Redis

Add Redis to your stack. Use `go-redis/redis/v9`.

```go
rdb := redis.NewClient(&redis.Options{
    Addr: os.Getenv("REDIS_ADDR"), // e.g. localhost:6379
})
```

Redis is used for two things: the matchmaking queue (sorted set by MMR) and ephemeral match state (current test pass counts, timer start).

### 2.2 Judge0

Self-host via Docker Compose. Add to your `docker-compose.yml`:

```yaml
judge0:
  image: judge0/judge0:latest
  ports:
    - "2358:2358"
  environment:
    REDIS_URL: redis://redis:6379
```

Judge0 exposes a REST API. Your submission service will `POST /submissions` with the code, language ID, stdin, and expected output, then poll `GET /submissions/:token` for the result.

---

## Phase 3 — Queue service

### New file: `queueService.go`

Responsibilities: add/remove players from the Redis sorted set, run the matchmaker goroutine.

**Key functions:**

`JoinQueue(userID, mmr)` — calls `ZADD queue:waiting <mmr> <userID>` and stores a reverse lookup key `queue:user:<userID> = "waiting"` with a TTL of 10 minutes (auto-cancel stale entries).

`LeaveQueue(userID)` — calls `ZREM queue:waiting <userID>` and deletes the reverse lookup key.

`StartMatchmaker()` — launches a goroutine with `time.NewTicker(2 * time.Second)`. On each tick it calls `TryMatch()`.

`TryMatch()` — iterates the sorted set in MMR order. For each unmatched player, does `ZRANGEBYSCORE queue:waiting <mmr-150> <mmr+150>` to find a candidate. If found, atomically removes both with a Lua script (to avoid race conditions) and hands off to the match service.

**MMR window expansion:** if a player has been in queue for more than 60 seconds (check the TTL delta), expand the window to ±300. After 120 seconds, expand to ±500.

### New file: `queueHandler.go`

```
POST /api/queue/join    → JoinQueue, returns { status: "queued", queuePosition: n }
DELETE /api/queue/leave → LeaveQueue, returns { status: "left" }
GET /api/queue/status   → returns current queue status for the calling user
```

All three endpoints require `AuthMiddleware`.

---

## Phase 4 — WebSocket hub

### New file: `wsHub.go`

The hub maintains an in-memory map of `matchID → [conn1, conn2]`. It is a singleton started at server boot.

```go
type Hub struct {
    rooms map[uuid.UUID][2]*websocket.Conn
    mu    sync.RWMutex
}

func (h *Hub) Register(matchID uuid.UUID, playerIndex int, conn *websocket.Conn)
func (h *Hub) Broadcast(matchID uuid.UUID, event WSEvent)
func (h *Hub) Close(matchID uuid.UUID)
```

`WSEvent` is a typed struct:

```go
type WSEvent struct {
    Type    string      `json:"type"`   // match_found | tick | opponent_submitted | match_result
    Payload interface{} `json:"payload"`
}
```

### WebSocket endpoint

```
GET /api/ws/match/:matchID
```

Upgrades to WebSocket using `gorilla/websocket`. The handler registers the connection with the hub and starts a read loop (to handle client pings and disconnection cleanup).

---

## Phase 5 — Match service

### New file: `matchService.go`

Responsibilities: create matches, manage the 30-minute timer, evaluate win conditions, calculate scores and MMR deltas.

**`CreateMatch(p1ID, p2ID uuid.UUID)`**

1. Selects a problem: queries problems filtered by the average MMR bracket of the two players (`easy` for < 1100, `medium` for 1100–1400, `hard` for > 1400). Picks one at random from that tier.
2. Inserts a `Match` record with `status = in_progress` and `started_at = now()`.
3. Stores match state in Redis: `match:<matchID>:p1_passed = 0`, `match:<matchID>:p2_passed = 0` with a 35-minute TTL.
4. Broadcasts `match_found` to both players via the hub with the problem (description, constraints, examples — no hidden test cases).
5. Starts a goroutine: `time.AfterFunc(30 * time.Minute, func() { s.ForceFinish(matchID) })`.

**`EvaluateWin(matchID, submitterID uuid.UUID, testsPassed, testsTotal int)`**

Called after each Judge0 result comes back.

1. Updates Redis: `SET match:<matchID>:pN_passed = testsPassed`.
2. If `testsPassed == testsTotal` (all pass): immediate win for submitter. Call `FinishMatch`.
3. Otherwise: broadcast `opponent_submitted` event with `{ testsPassed, testsTotal }` (so both players see progress).

**`ForceFinish(matchID uuid.UUID)`**

Called when the 30-minute timer fires.

1. Reads both players' pass counts from Redis.
2. Higher count wins. If equal, it's a draw — no MMR change, no points awarded.
3. Calls `FinishMatch`.

**`FinishMatch(matchID, winnerID uuid.UUID)`**

1. Updates `Match` record: `winner_id`, `status = finished`, `ended_at = now()`.
2. Calculates points: `points = problem.PointValue × (0.5 + 0.5 × winnerPassRate)`.
3. Calculates MMR delta using standard ELO: `Δ = K × (1 − Eₐ)` where `Eₐ = 1 / (1 + 10^((opponentMMR − playerMMR) / 400))` and `K = 32`.
4. Updates both users: winner gets `+Δ MMR`, loser gets `-Δ MMR`. Update `matches_played` and recalculate `win_rate` for both.
5. Broadcasts `match_result` to both players via the hub: `{ winnerID, pointsAwarded, mmrDelta, newMMR }`.
6. Closes the hub room.

### New file: `matchHandler.go`

```
POST /api/match/submit          → submit code for judging
GET  /api/match/:id             → fetch match details (problem, status, submissions)
GET  /api/match/:id/submissions → list submissions for the calling user in this match
```

---

## Phase 6 — Submission service

### New file: `submissionService.go`

**`Submit(matchID, userID uuid.UUID, code, language string)`**

1. Validates the match is `in_progress` and the user is a participant.
2. Validates time: `time.Since(match.StartedAt) < 30 * time.Minute`. Reject if over.
3. Fetches all test cases for the problem (both visible and hidden).
4. For each test case, calls Judge0:

```go
POST https://judge0/submissions?base64_encoded=false&wait=true
{
  "source_code": code,
  "language_id": languageIDMap[language],
  "stdin": testCase.Input,
  "expected_output": testCase.Expected,
  "cpu_time_limit": 2,
  "memory_limit": 128000
}
```

5. Counts passing test cases from responses where `status.id == 3` (Accepted).
6. Persists a `Submission` record.
7. Calls `matchService.EvaluateWin(matchID, userID, passed, total)`.

**Language ID map** (Judge0 IDs):

```go
var languageIDMap = map[string]int{
    "go":     95,
    "python": 71,
    "java":   62,
    "cpp":    54,
    "js":     63,
}
```

---

## Phase 7 — Route registration

Update `authRoutes.go` (or add new route files) to register all new endpoints:

```go
// Queue
api.POST("/queue/join",   authMiddleware, queueHandler.Join)
api.DELETE("/queue/leave", authMiddleware, queueHandler.Leave)
api.GET("/queue/status",  authMiddleware, queueHandler.Status)

// Match
api.POST("/match/submit",              authMiddleware, matchHandler.Submit)
api.GET("/match/:id",                  authMiddleware, matchHandler.Get)
api.GET("/match/:id/submissions",      authMiddleware, matchHandler.Submissions)

// WebSocket
api.GET("/ws/match/:id", authMiddleware, wsHandler.Connect)
```

---

## Phase 8 — Frontend changes

### 8.1 New store: `matchStore.ts`

```ts
type MatchState = {
  match: Match | null
  opponent: User | null
  problem: Problem | null
  timeRemaining: number
  mySubmissions: Submission[]
  opponentTestsPassed: number | null
  socket: WebSocket | null

  joinQueue: () => Promise<void>
  leaveQueue: () => Promise<void>
  submitCode: (code: string, language: string) => Promise<void>
  connectSocket: (matchID: string) => void
  disconnectSocket: () => void
}
```

### 8.2 WebSocket event handling in the store

On `connectSocket`, open `wss://<host>/api/ws/match/<matchID>` and handle incoming events:

| Event type | Action |
|---|---|
| `match_found` | set `match`, `problem`, `opponent`, start countdown |
| `tick` | update `timeRemaining` |
| `opponent_submitted` | update `opponentTestsPassed` |
| `match_result` | show result modal, update user MMR in `authStore` |

### 8.3 New pages / components

`/queue` — queue lobby page. Shows a "Find Match" button, animated queue timer, and current queue position. Connects to the WS after joining.

`/match/[id]` — match arena page. Split-pane layout: problem statement on the left, code editor (Monaco or CodeMirror) on the right. Shows countdown timer, opponent progress bar, and a submit button. Locks the editor and shows result overlay when the match ends.

---

## Phase 9 — Environment variables to add

```env
REDIS_ADDR=localhost:6379
JUDGE0_URL=http://localhost:2358
JUDGE0_AUTH_TOKEN=          # if using Judge0 CE with auth enabled
```

---

## Implementation order

1. Data models + migrations (Phase 1)
2. Redis + Judge0 infra (Phase 2)
3. Queue service + handler (Phase 3)
4. WebSocket hub (Phase 4)
5. Match service core — create, timer, finish (Phase 5)
6. Submission service + Judge0 integration (Phase 6)
7. Route registration (Phase 7)
8. Frontend store + queue page (Phase 8)
9. Frontend match arena page (Phase 8)
10. End-to-end test: two browser tabs, full match flow

---

## Key edge cases to handle

**Player disconnects mid-match** — on WebSocket close, do not immediately forfeit. Set a `disconnected_at` timestamp in Redis with a 60-second grace period. If the player reconnects within the grace window, re-attach their connection to the hub room. If they don't, forfeit the match and award the win to the opponent.

**Both players submit simultaneously** — the EvaluateWin check must be atomic. Use a Redis lock (`SET match:<id>:lock 1 NX EX 5`) before writing pass counts and checking the win condition.

**Judge0 timeout / error** — if Judge0 returns status `Time Limit Exceeded` (id 5) or `Runtime Error` (id 6), count that test case as failed, not as an error in your service. Always return a result to the player.

**Queue race condition** — the matchmaker's ZRANGEBYSCORE + ZREM pair must be wrapped in a Lua script executed atomically via `EVAL` to prevent two matchmaker ticks from pairing the same player twice.

**Stale queue entries** — use Redis key TTL on `queue:user:<id>` entries. If a player closes the tab without calling `/queue/leave`, their entry expires automatically after 10 minutes.
