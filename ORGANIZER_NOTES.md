# CampusQuest — Organizer Notes & Challenge Reference

> **Confidential — Organizer & Evaluator Guide Only**  
> Do not distribute this document to challenge candidates.

---

## 1. Branch Strategy & State Switching

CampusQuest maintains two local branches:
- `challenge-baseline-campuquest`: Seeded baseline state with all 6 intentional defects. All 6 tests fail (`Passed: 0, Failed: 6`). Active branch for participant delivery.
- `challenge-solved-campuquest`: Fully solved reference implementation. All 6 tests pass (`Passed: 6, Failed: 0`). Kept local to organizers.

To switch between states safely:
```bash
./switch_branch.sh baseline
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

---

### Defect 2: Event Deadline Timezone Evaluation
- **File & Function**: `src/main/java/com/campusquest/service/SubmissionService.java` → `isSubmissionAllowed()`
- **Covering Test**: `test_deadline_uses_configured_event_zone`
- **Difficulty**: Medium | **Point Value**: 125 pts
- **Incorrect Behavior**: The local deadline string (e.g. `18:00`) is parsed directly in UTC (`ZoneOffset.UTC`). For an event configured in `America/New_York` (EDT, UTC-4), 18:00 local is 22:00 UTC. Parsing in UTC treats the deadline as 18:00 UTC, causing on-time submissions (e.g. 21:30 UTC = 17:30 local) to be falsely rejected.
- **Correct Behavior**: Convert the local deadline using `ZoneId.of(event.getTimeZone())` before converting to an `Instant`.

---

### Defect 3: Team Lookup via Value Object Keys
- **File & Function**: `src/main/java/com/campusquest/model/TeamId.java` → `hashCode()`
- **Covering Test**: `test_equivalent_team_ids_work_as_map_keys`
- **Difficulty**: Easy | **Point Value**: 100 pts
- **Incorrect Behavior**: `TeamId` overrides `equals(Object)` but fails to override `hashCode()`, inheriting `Object.hashCode()`. When looking up a team in `Map<TeamId, TeamRecord>`, newly constructed `TeamId` instances with identical string values hash to different buckets, returning `null`.
- **Correct Behavior**: Implement `hashCode()` returning `Objects.hash(id)` or `id.hashCode()`.

---

### Defect 4: Evaluation Score Callback Idempotency
- **File & Function**: `src/main/java/com/campusquest/service/JudgingService.java` → `recordScore()`
- **Covering Test**: `test_judging_callback_retry_does_not_duplicate_score`
- **Difficulty**: Medium | **Point Value**: 125 pts
- **Incorrect Behavior**: When a judge submits a score and network retries deliver the callback multiple times, each callback appends the score again, doubling or inflating the team's total points.
- **Correct Behavior**: Track processed `evaluationId` values in an idempotency set / map and ignore duplicate score callbacks.

---

### Defect 5: Cross-Event Multi-Tenant Judge Access Boundary
- **File & Function**: `src/main/java/com/campusquest/service/SubmissionService.java` → `getSubmissionForJudge()`
- **Covering Test**: `test_judge_cannot_read_submission_from_another_event`
- **Difficulty**: Medium | **Point Value**: 125 pts
- **Incorrect Behavior**: Judges assigned to one event can fetch and inspect submissions belonging to another competition event.
- **Correct Behavior**: Verify that the judge's assigned event matches the target submission's event, throwing a `SecurityException` on mismatch.

---

### Defect 6: Concurrent Booth Reservation Oversubscription
- **File & Function**: `src/main/java/com/campusquest/service/ReservationService.java` → `reserveSlot()`
- **Covering Test**: `test_simultaneous_reservations_never_exceed_capacity`
- **Difficulty**: Hard | **Point Value**: 150 pts
- **Incorrect Behavior**: Multiple concurrent booking requests read `reservedTeams.size() < capacity` concurrently, and all proceed to add themselves, resulting in overbooking past slot capacity.
- **Correct Behavior**: Synchronize slot reservation or use atomic checks to ensure bookings never exceed slot capacity.
