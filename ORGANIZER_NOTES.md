# CampusQuest — Organizer Notes & Challenge Reference

> **Confidential — Organizer & Evaluator Guide Only**  
> Do not distribute this document to challenge candidates.

---

## 1. Branch Strategy & State Switching

CampusQuest maintains two local branches:
- `challenge-baseline-campuquest`: Seeded baseline state with all 8 intentional defects. All 8 tests fail (`Passed: 0, Failed: 8`). Active branch for participant delivery.
- `challenge-solved-campuquest`: Fully solved reference implementation. All 8 tests pass (`Passed: 8, Failed: 0`). Kept local to organizers.

To switch between states safely:
```bash
# Switch to baseline challenge state (candidate workspace)
./switch_branch.sh baseline

# Switch to solved reference state (organizer verification)
./switch_branch.sh solved
```

---

## 2. Defect Catalog & Grading Matrix

### Defect 1: Leaderboard Tie-Breaker
- **File & Function**: `src/main/java/com/campusquest/service/LeaderboardService.java` → `getRankings()`
- **Covering Test**: `test_tied_scores_follow_submission_time`
- **Difficulty**: Easy | **Point Value**: 100 pts
- **Incorrect Behavior**: When two teams tie on total points (e.g. 95.0 pts), the comparator sorts submission timestamps in descending order (`b.compareTo(a)`), erroneously awarding the higher rank to the later submission.
- **Correct Behavior**: Use ascending order comparison (`a.getSubmissionTime().compareTo(b.getSubmissionTime())`) so the team that submitted earlier receives the higher rank (#1).
- **UI Before / After**:
  - *Baseline*: `AlgoTitans` (submitted 10:30Z) is ranked #1 ahead of `CyberKnights` (submitted 10:00Z) with status `✗ Seeded Defect: Tie-break inverted`.
  - *Solved*: `CyberKnights` (10:00Z) is ranked #1 with status `✓ Solved: Tied scores break by submission time`.

---

### Defect 2: Event Deadline Timezone Evaluation
- **File & Function**: `src/main/java/com/campusquest/service/SubmissionService.java` → `isSubmissionAllowed()`
- **Covering Test**: `test_deadline_uses_configured_event_zone`
- **Difficulty**: Medium | **Point Value**: 125 pts
- **Incorrect Behavior**: The local deadline string (e.g. `18:00`) is parsed directly in UTC (`ZoneOffset.UTC`). For an event configured in `America/New_York` (EDT, UTC-4), 18:00 local is 22:00 UTC. Parsing in UTC treats the deadline as 18:00 UTC, causing on-time submissions (e.g. 21:30 UTC = 17:30 local) to be falsely rejected.
- **Correct Behavior**: Convert the local deadline using `ZoneId.of(event.getTimeZone())` before converting to an `Instant`.
- **UI Before / After**:
  - *Baseline*: Validation box displays `✗ STATUS: REJECTED (DEADLINE_EXPIRED)` in red.
  - *Solved*: Validation box displays `✓ STATUS: ACCEPTED (ON TIME)` in green.

---

### Defect 3: Equivalent TeamId Map Key Lookup
- **File & Function**: `src/main/java/com/campusquest/model/TeamId.java` → `hashCode()`
- **Covering Test**: `test_equivalent_team_ids_work_as_map_keys`
- **Difficulty**: Easy | **Point Value**: 75 pts
- **Incorrect Behavior**: `TeamId` overrides `equals` based on string value equality, but delegates `hashCode()` to `super.hashCode()` (`System.identityHashCode`). As a result, distinct `TeamId` instances with equivalent values produce different hash codes, failing lookups in `Map<TeamId, TeamRecord>`.
- **Correct Behavior**: Implement `hashCode()` returning `Objects.hash(value)`.
- **UI Before / After**:
  - *Baseline*: Querying `team-cyber` displays `✗ Lookup Failed for team-cyber (TeamId key lookup returned null)`.
  - *Solved*: Querying `team-cyber` displays `✓ Team Found: CyberKnights` with full profile.

---

### Defect 4: Judging Callback Retry Idempotency
- **File & Function**: `src/main/java/com/campusquest/service/JudgingService.java` → `recordScore()`
- **Covering Test**: `test_judging_callback_retry_does_not_duplicate_score`
- **Difficulty**: Medium | **Point Value**: 125 pts
- **Incorrect Behavior**: Webhook scoring callbacks are appended directly to an unindexed `List<ScoreRecord>`. Network retries re-delivering the same `evaluationId` insert duplicate records, doubling or inflating total score and count.
- **Correct Behavior**: Store scores in a map keyed by `evaluationId` (`scoresMap.put(record.getEvaluationId(), record)`), guaranteeing idempotency.
- **UI Before / After**:
  - *Baseline*: Clicking "Simulate 2x Callback Retry" sets Total Score to `50.0 pts` (2 evaluations recorded, marked as duplicated).
  - *Solved*: Total Score remains `25.0 pts` (1 evaluation recorded, marked idempotent).

---

### Defect 5: Judge Cross-Event Access Control Isolation
- **File & Function**: `src/main/java/com/campusquest/service/SubmissionService.java` → `getSubmissionForJudge()`
- **Covering Test**: `test_judge_cannot_read_submission_from_another_event`
- **Difficulty**: Medium | **Point Value**: 150 pts
- **Incorrect Behavior**: `getSubmissionForJudge` fetches submissions without checking whether `judge.getAssignedEventId()` equals `submission.getEventId()`, creating a cross-event IDOR vulnerability.
- **Correct Behavior**: Enforce event assignment authorization; throw `SecurityException` if `!submission.getEventId().equals(judge.getAssignedEventId())`.
- **UI Before / After**:
  - *Baseline*: Judge Alan Turing from `event-hackathon` successfully reads submission `SolarGrid UI` belonging to `event-designquest`.
  - *Solved*: Access is blocked with `✓ 403 Forbidden: Access Denied` and status `ACCESS_DENIED`.

---

### Defect 6: Booth Reservation Concurrency Control
- **File & Function**: `src/main/java/com/campusquest/service/ReservationService.java` → `reserveSlot()`
- **Covering Test**: `test_simultaneous_reservations_never_exceed_capacity`
- **Difficulty**: Hard | **Point Value**: 175 pts
- **Incorrect Behavior**: Check-then-act capacity validation (`if (size < capacity)`) is unsynchronized. Simultaneous concurrent bursts pass the check concurrently, allowing bookings to exceed maximum slot capacity (e.g. 7–10 / 5).
- **Correct Behavior**: Synchronize on `slot` (`synchronized (slot) { ... }`) to serialize check and reservation insertion.
- **UI Before / After**:
  - *Baseline*: Triggering 10-thread burst overbooks the booth (`6–10 / 5`, red alert).
  - *Solved*: Triggering 10-thread burst strictly caps bookings at `5 / 5` (green status).

---

### Defect 7: Maximum Bipartite Matching for Judge Assignment
- **File & Function**: `src/main/java/com/campusquest/service/JudgeMatchingService.java` → `assignJudges()`
- **Covering Test**: `test_judge_assignment_finds_maximum_matching`
- **Difficulty**: Hard | **Point Value**: 200 pts
- **Incorrect Behavior**: Naive greedy assignment matches the first available qualified submission. When a flexible judge claims a submission needed by a judge with only one qualification, greedy stalls prematurely at 2 or 3 matches.
- **Correct Behavior**: Implement Maximum Bipartite Matching using augmenting paths (Ford-Fulkerson / DFS augmenting path search) to achieve the maximum matching size of 4.
- **UI Before / After**:
  - *Baseline*: Shows `3 / 4` matched with tag `✗ Seeded Defect: Greedy stalled`.
  - *Solved*: Shows `4 / 4` matched with tag `✓ Solved: Maximum bipartite matching (4/4)`.

---

### Defect 8: Demo Day Schedule Optimization (Weighted Interval Scheduling)
- **File & Function**: `src/main/java/com/campusquest/service/DemoScheduleService.java` → `scheduleDemos()`
- **Covering Test**: `test_demo_schedule_maximizes_total_priority`
- **Difficulty**: Hard | **Point Value**: 175 pts
- **Incorrect Behavior**: Greedy heuristic chooses intervals by highest individual priority score. A single long demo (priority 50) blocks two compatible shorter demos (priorities 30 + 35 = 65), achieving only 50 points instead of 65.
- **Correct Behavior**: Implement Dynamic Programming for Weighted Interval Scheduling (`opt[i] = max(opt[i-1], priority + opt[p(i)])`) with backtracking.
- **UI Before / After**:
  - *Baseline*: Shows 1 scheduled demo with Total Priority Score `50 / 65 pts` (`Suboptimal Greedy Schedule`).
  - *Solved*: Shows 2 scheduled demos (`DataForge` + `CyberGuard`) with Total Priority Score `65 / 65 pts` (`Optimal Weighted Schedule (DP)`).
