# CampusQuest — Collegiate Hackathon & Event Management Platform

CampusQuest is an interactive collegiate hackathon, competition, and event operations dashboard. It coordinates project submissions, event deadlines across regional timezones, team registration lookups, automated judging callback evaluations, cross-event access control, booth reservations, judge bipartite matching, and demo day weighted scheduling.

---

## 1. Quick Start

### Build & Package
```bash
mvn package -DskipTests -B
```

### Start Live Server & Persistent Watcher
```bash
./start.sh
```
The server binds to `0.0.0.0:3000`. The persistent watcher monitors all candidate-edited files under `src/` and `pom.xml`, automatically recompiles, and hot-reloads the running JVM without manual restarts.

### Run Challenge Test Suite
```bash
./tests/run_tests.sh
```
Executes the native CLI test harness, recompiling latest source code and emitting strict JSON telemetry.

---

## 2. Challenge Overview

CampusQuest contains eight distinct challenge defects across algorithmic, concurrency, security, and state management domains:

| # | Challenge Task | Area | Description |
|---|---|---|---|
| 1 | **Leaderboard Tie-Breaker** | Domain Logic | When teams tie on total points, rank must be broken by submission time (earlier submission ranks higher). |
| 2 | **Event Deadline Timezone** | Datetime Logic | Event submission deadlines must be evaluated in the event's configured timezone rather than defaulting to UTC. |
| 3 | **TeamId Map Key Lookup** | Value Object Contract | Team identity lookup in registry map fails when querying with equivalent `TeamId` instances. |
| 4 | **Judging Callback Idempotency** | State Management | Retried webhook scoring callbacks must not duplicate or artificially inflate submission scores. |
| 5 | **Judge Event Access Control** | Security Isolation | Judges assigned to one event must not be allowed to inspect submissions from another event. |
| 6 | **Booth Reservation Concurrency** | Concurrency Control | Simultaneous burst reservation requests must be thread-safe and never exceed booth capacity. |
| 7 | **Judge Assignment Matching** | Graph Algorithms | Bipartite matching must assign the maximum number of judges to qualified submissions. |
| 8 | **Demo Day Schedule Optimization** | Dynamic Programming | Auditorium demo slots must be scheduled to maximize total cumulative priority score. |

---

## 3. Switching Challenge States

A safe state-switching utility is included for organizers and evaluators:
```bash
# Switch to baseline challenge state (all 8 defects present)
./switch_branch.sh baseline

# Switch to solved reference state (all 8 defects fixed)
./switch_branch.sh solved
```
