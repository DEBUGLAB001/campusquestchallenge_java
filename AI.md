# CampusQuest

## Description
CampusQuest is a Java 17 and Spring Boot hackathon and event management application for collegiate teams, organizers, and judges. It runs as a lightweight HTTP service on port 3000 with a browser interface, seeded hackathon teams, submissions, judges, booth slots, an in-memory data store, live standings, deadline validation, team registry lookups, idempotent judging callbacks, tenant-isolated judge access, thread-safe booth reservations, bipartite judge allocation, and dynamic-programming demo scheduling.

## Repository Structure
```
campusquestchallenge_java/
├── challenge.json                    Isolated runtime, preview port, and test configuration
├── pom.xml                           Maven project configuration and Spring Boot dependencies
├── start.sh                          Persistent file watcher and background application runner
├── .mvn/                             Maven wrapper binary and configuration directory
├── mvnw                              Executable Maven wrapper shell script
├── src/
│   └── main/
│       ├── java/com/campusquest/
│       │   ├── CampusQuestApplication.java
│       │   │                         Spring Boot main entry point
│       │   ├── TestRunner.java       CLI JSON test suite harness evaluating all 8 defects
│       │   ├── controller/
│       │   │   ├── ApiController.java
│       │   │   │                     REST API endpoints for standings, submissions, teams, and operations
│       │   │   ├── HealthController.java
│       │   │   │                     Liveness and system health endpoint (/health)
│       │   │   └── PreviewController.java
│       │   │                         Subpath asset streaming supporting prefix routes
│       │   ├── model/
│       │   │   ├── DemoSlot.java      Demo presentation time window and priority model
│       │   │   ├── Event.java         Event metadata, local timezone, and deadline model
│       │   │   ├── Judge.java         Judge profile and category qualifications model
│       │   │   ├── LeaderboardEntry.java
│       │   │   │                     Team tournament score and submission timestamp model
│       │   │   ├── ReservationSlot.java
│       │   │   │                     Booth presentation slot and capacity model
│       │   │   ├── ScoreRecord.java   Judge evaluation score and evaluationId model
│       │   │   ├── Submission.java    Project submission and event link model
│       │   │   ├── TeamId.java        Strongly-typed value object key for team lookup
│       │   │   └── TeamRecord.java    Registered team profile and members model
│       │   └── service/
│       │       ├── DataStore.java     Thread-safe in-memory data storage and demo seeding
│       │       ├── DemoScheduleService.java
│       │       │                     Demo Day presentation interval scheduling service
│       │       ├── JudgeMatchingService.java
│       │       │                     Judge-to-submission category matching service
│       │       ├── JudgingService.java
│       │       │                     Evaluation scoring and callback idempotency service
│       │       ├── LeaderboardService.java
│       │       │                     Standings sorting and tie-breaker service
│       │       ├── ReservationService.java
│       │       │                     Concurrent presentation booth reservation service
│       │       ├── SubmissionService.java
│       │       │                     Timezone deadline validation and judge access service
│       │       └── TeamService.java   Team registry and dictionary lookup service
│       └── resources/
│           ├── application.properties
│           │                         Server port (3000) and bind address (0.0.0.0) configuration
│           └── static/
│               ├── app.js            Client-side API requests, polling, and interactive UI logic
│               ├── index.html         CampusQuest event operations dashboard
│               └── style.css         Modern light SaaS design tokens and animations
├── tests/
│   └── run_tests.sh                  Deterministic native test runner outputting pure JSON
├── AI.md                             Architecture blueprint, repository map, and defect reference
└── README.md                         Candidate-facing application overview and debugging guide
```

## Bugs and Bug Locations
These are the eight failing behaviors covered by the challenge. The named locations identify the owning implementation areas for debugging and review.

### 1. Tied leaderboard scores invert submission order
- **Bug location**: `src/main/java/com/campusquest/service/LeaderboardService.java`, `getRankings`
- **How to observe it**: Compare leaderboard rankings for two teams with identical total scores submitted at different times.
- **Failure**: The sort comparator orders tied scores in descending order of submission timestamp, ranking later submissions ahead of earlier ones.
- **Expected**: Sort tied scores in ascending order (`earlier.compareTo(later)`) so earlier submitters receive higher ranks.

### 2. Event submissions near deadlines are wrongfully rejected
- **Bug location**: `src/main/java/com/campusquest/service/SubmissionService.java`, `isSubmissionAllowed`
- **How to observe it**: Validate a submission at 17:30 local time for an event in `America/New_York` (UTC-4) with an 18:00 deadline.
- **Failure**: The deadline string is parsed directly into UTC rather than the event's configured timezone, making the deadline 18:00 UTC and falsely rejecting 21:30 UTC.
- **Expected**: Parse the deadline using `ZoneId.of(event.getTimeZone())` so on-time submissions in the event's local timezone are accepted.

### 3. Team lookup fails with equivalent TeamId keys
- **Bug location**: `src/main/java/com/campusquest/model/TeamId.java`, `hashCode`
- **How to observe it**: Query `teamService.getTeamById("team-cyber")` or retrieve a team from `dataStore.getTeams()` using a new `TeamId` instance.
- **Failure**: Returns `null` because `TeamId` overrides `equals` but uses identity-based `super.hashCode()`, breaking `HashMap` lookup contracts.
- **Expected**: Implement `hashCode()` using `Objects.hash(value)` so equivalent `TeamId` instances map to identical hash buckets.

### 4. Duplicate webhook retries inflate judging scores
- **Bug location**: `src/main/java/com/campusquest/service/JudgingService.java`, `recordScore`
- **How to observe it**: Deliver an identical judging evaluation callback payload (`eval-101`) twice.
- **Failure**: The service blindly appends duplicate evaluation records, inflating the total score from 25.0 to 50.0.
- **Expected**: Deduplicate scores by `evaluationId` to make the scoring webhook idempotent against network retries.

### 5. Judges can access submissions from other events
- **Bug location**: `src/main/java/com/campusquest/service/SubmissionService.java`, `getSubmissionForJudge`
- **How to observe it**: Call `getSubmissionForJudge("judge-alpha", "sub-201")` where `judge-alpha` is assigned to `event-hackathon` and `sub-201` belongs to `event-designquest`.
- **Failure**: The submission record is returned without validating event ownership.
- **Expected**: Verify that `judge.getAssignedEventId()` equals `submission.getEventId()`, throwing `SecurityException` on mismatch.

### 6. Simultaneous reservations exceed booth capacity
- **Bug location**: `src/main/java/com/campusquest/service/ReservationService.java`, `reserveSlot`
- **How to observe it**: Fire 10 concurrent reservation requests against a presentation booth with a capacity of 5.
- **Failure**: An unsynchronized check-then-act allows multiple concurrent threads to pass the capacity check simultaneously, overbooking the slot.
- **Expected**: Synchronize the capacity check and reservation update on the slot (`synchronized (slot)`) to prevent oversubscription.

### 7. Greedy judge assignment leaves submissions unmatched
- **Bug location**: `src/main/java/com/campusquest/service/JudgeMatchingService.java`, `assignJudges`
- **How to observe it**: Run judge assignment across qualified judges and category submissions.
- **Failure**: A greedy loop matches early judges without backtracking, matching only 2 pairs when an optimal matching of 4 is possible.
- **Expected**: Implement Maximum Bipartite Matching using augmenting paths (DFS/BFS) to maximize total assigned judge-submission pairs.

### 8. Demo Day scheduler fails to maximize priority
- **Bug location**: `src/main/java/com/campusquest/service/DemoScheduleService.java`, `scheduleDemos`
- **How to observe it**: Schedule overlapping demo presentation requests with varying priority scores.
- **Failure**: Greedy selection by highest individual priority selects a single slot of priority 50 and blocks compatible slots summing to 65.
- **Expected**: Implement Weighted Interval Scheduling using dynamic programming to find the subset of non-overlapping slots with maximum aggregate priority.

## Expected Behaviour After Fixing All Bugs
- Tied scores rank earlier submissions first.
- Deadline validation respects the event's configured local timezone.
- Team lookups work reliably with equivalent `TeamId` instances.
- Judging callbacks are idempotent and deduplicate score retries.
- Judges cannot access submissions outside their assigned event.
- Simultaneous booth reservations never exceed designated capacity.
- Judge allocation achieves the global maximum bipartite matching.
- Demo scheduling selects the optimal non-overlapping interval combination with maximum total priority.
- All automated tests in `./tests/run_tests.sh` pass with exit code 0.
