# CampusQuest

## Description

CampusQuest is a hackathon event operations platform built with Java 17 and Spring Boot that manages team registrations, project submissions, judging workflows, booth reservations, and presentation scheduling.

## Repository Structure

```text
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

### 1. Tied leaderboard scores invert submission order

- **Bug location:** `src/main/java/com/campusquest/service/LeaderboardService.java`
- **How to observe it:** Compare leaderboard rankings for two teams with identical total scores submitted at different times.
- **Failure:** The sort comparator orders tied scores in descending order of submission timestamp, ranking later submissions ahead of earlier ones.
- **Expected:** Sort tied scores in ascending order so earlier submitters receive higher ranks.

### 2. Event submissions near deadlines are wrongfully rejected

- **Bug location:** `src/main/java/com/campusquest/service/SubmissionService.java`
- **How to observe it:** Validate a submission at 17:30 local time for an event in `America/New_York` (UTC-4) with an 18:00 deadline.
- **Failure:** The deadline string is parsed directly into UTC rather than the event's configured timezone, falsely rejecting valid submissions.
- **Expected:** Parse the deadline using the event's configured timezone so on-time local submissions are accepted.

### 3. Team lookup fails with equivalent TeamId keys

- **Bug location:** `src/main/java/com/campusquest/model/TeamId.java`
- **How to observe it:** Query `teamService.getTeamById("team-cyber")` or look up a team from `dataStore.getTeams()` using a new `TeamId` instance.
- **Failure:** Returns `null` because `TeamId` overrides `equals` but inherits identity-based `super.hashCode()`, breaking HashMap contracts.
- **Expected:** Implement `hashCode()` using the identifier value so equivalent `TeamId` instances map to identical hash buckets.

### 4. Duplicate webhook retries inflate judging scores

- **Bug location:** `src/main/java/com/campusquest/service/JudgingService.java`
- **How to observe it:** Deliver an identical judging evaluation callback payload twice.
- **Failure:** The service appends duplicate evaluation records without checking identifier uniqueness, inflating total scores.
- **Expected:** Deduplicate scores by evaluation ID so repeated callbacks are idempotent.

### 5. Judges can access submissions from other events

- **Bug location:** `src/main/java/com/campusquest/service/SubmissionService.java`
- **How to observe it:** Request a submission assigned to one event using credentials of a judge assigned to a different event.
- **Failure:** The submission record is returned without validating that the judge's assigned event matches the submission's event.
- **Expected:** Verify event ownership between judge and submission, rejecting mismatched access with a security exception.

### 6. Simultaneous reservations exceed booth capacity

- **Bug location:** `src/main/java/com/campusquest/service/ReservationService.java`
- **How to observe it:** Dispatch 10 concurrent reservation requests against a presentation booth slot with a capacity of 5.
- **Failure:** Unsynchronized check-then-act logic allows concurrent threads to pass the capacity check simultaneously, overbooking the slot.
- **Expected:** Synchronize the capacity check and slot reservation update to prevent oversubscription.

### 7. Greedy judge assignment leaves submissions unmatched

- **Bug location:** `src/main/java/com/campusquest/service/JudgeMatchingService.java`
- **How to observe it:** Run judge assignment across qualified judges and category submissions with overlapping qualifications.
- **Failure:** A greedy assignment loop pairs early judges without backtracking, stranding valid pairs and failing to achieve maximum matching.
- **Expected:** Use maximum bipartite matching with augmenting paths to maximize total assigned judge-submission pairs.

### 8. Demo Day scheduler fails to maximize priority

- **Bug location:** `src/main/java/com/campusquest/service/DemoScheduleService.java`
- **How to observe it:** Schedule overlapping presentation slots with varying individual priority values.
- **Failure:** Greedy selection by highest individual priority selects a suboptimal slot that blocks compatible slots with higher combined priority.
- **Expected:** Use weighted interval scheduling dynamic programming to select the non-overlapping combination that maximizes total priority.

## Expected Behaviour After Fixing All Bugs

- Tied leaderboard scores break ties by ranking earlier submissions first.
- Event submission deadlines are validated against the event's configured local timezone.
- Team registry lookups succeed consistently when querying with equivalent `TeamId` keys.
- Judging score callbacks are idempotent and prevent duplicate score inflation on retries.
- Tenant isolation prevents judges from viewing submissions outside their assigned event.
- Concurrent booth reservations are thread-safe and never exceed designated slot capacity.
- Judge assignment finds the global maximum bipartite matching between judges and submissions.
- Demo Day scheduling chooses the optimal non-overlapping interval combination with maximum total priority.
- All 8 automated tests in `tests/run_tests.sh` pass with exit code 0.
