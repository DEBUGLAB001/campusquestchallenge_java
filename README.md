# CampusQuest — Collegiate Hackathon Operations Platform

## 1. Your Mission: Investigate & Fix the Bugs
You are a Full-Stack Developer working on CampusQuest, a collegiate hackathon operations platform designed to help organizers, participants, and judges run hackathons, manage project submissions, and reserve presentation spaces. The QA team has identified six critical issues affecting everyday competition operations.

Your responsibility is to investigate the existing codebase, reproduce each issue, identify its root cause, and implement reliable fixes without disrupting existing functionality.

### BUG-01: Tied Leaderboard Scores Invert Submission Order
**Problem:** When two teams finish with tied overall scores, the leaderboard places the team that submitted their project later ahead of the team that submitted earlier.

**How to identify it:** Open the **Tournament standings** tab in the Live Preview and look at the leaderboard rows with equal points (e.g., 95.0 pts). Notice that the team submitting later in the day is displayed at Rank #1 while the earlier submission is pushed down to Rank #2.

**Your task:** Ensure tied leaderboard scores follow chronological submission order, placing the earlier submission ahead of the later submission as the tie-breaker.

![BUG-01: Tied Leaderboard Scores Invert Submission Order](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-01.png)

### BUG-02: Event Submissions Near Deadlines Are Wrongfully Rejected
**Problem:** On-time project submissions made close to an event cutoff are incorrectly rejected by the system.

**How to identify it:** Open the **Deadlines** tab. Select an event configured in a non-UTC timezone (e.g., `America/New_York`) and test a submission timestamp submitted before the deadline (e.g., 17:30 local time against an 18:00 cutoff). Notice that the system compares the timestamp against server UTC time rather than the event's local timezone, falsely marking valid submissions as expired.

**Your task:** Ensure submission deadline validation properly converts and evaluates timestamps against the event's configured local timezone.

![BUG-02: Event Submissions Near Deadlines Are Wrongfully Rejected](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-02.png)

### BUG-03: Team Directory Search Fails for Valid Team IDs
**Problem:** Searching for registered hackathon teams by their Team ID fails to retrieve team profiles, returning "Team Not Found" even when the team exists.

**How to identify it:** Open the **Teams** tab, select a registered team from the preset list (e.g., `team-cyber`), and click "Find team". The directory reports that the team was not found because key lookup comparisons fail to recognize equivalent team identifier instances.

**Your task:** Ensure team identifier objects implement proper equality and hash code logic so searching with any equivalent Team ID reliably returns the team's record.

![BUG-03: Team Directory Search Fails for Valid Team IDs](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-03.png)

### BUG-04: Duplicate Webhook Retries Inflate Judging Scores
**Problem:** When an evaluation score webhook callback is delivered multiple times due to network retries, the system adds duplicate score entries, artificially inflating the team's total score.

**How to identify it:** Open the **Evaluation scores** tab and click "Send score callback" more than once using the same evaluation ID (`eval-101`). Notice that the delivery log shows repeated point additions, doubling the recorded score from 25.0 to 50.0 points.

**Your task:** Make the scoring callback handler idempotent so repeated webhook deliveries for the same evaluation record the score only once.

![BUG-04: Duplicate Webhook Retries Inflate Judging Scores](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-04.png)

### BUG-05: Judges Can View Submissions from Other Events
**Problem:** Judges assigned to evaluate one event can access private project submissions belonging to a completely different competition event.

**How to identify it:** Open the **Judge access** tab and run a check pairing a judge assigned to `event-hackathon` (e.g., `judge-alpha`) with a submission from `event-designquest` (e.g., `sub-201`). Notice that the system allows access instead of enforcing event isolation boundaries.

**Your task:** Restrict judge evaluation access so judges are blocked from viewing submissions that belong to other events.

![BUG-05: Judges Can View Submissions from Other Events](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-05.png)

### BUG-06: Simultaneous Reservations Exceed Booth Capacity
**Problem:** When multiple teams attempt to book presentation booths at the exact same moment, booths become overbooked beyond their allowed capacity.

**How to identify it:** Open the **Booth reservations** tab and click "Simulate 10 concurrent bookings" on any venue booth with a capacity of 5. Notice that all 10 reservation requests succeed, pushing the booth to 10 / 5 teams (200% capacity) due to a concurrency race condition.

**Your task:** Synchronize booth reservations so simultaneous booking requests strictly respect slot capacity limits and reject bookings once the slot is full.

![BUG-06: Simultaneous Reservations Exceed Booth Capacity](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-06.png)

---

## 2. Get Familiar With the Application
CampusQuest is a collegiate hackathon operations platform that provides a unified interface for managing hackathon competitions, reviewing submissions, and coordinating presentation spaces.

### Core Features:
- **Tournament Standings:** View real-time team rankings, total points, submission timestamps, and tie-breaking status.
- **Deadline Verification:** Validate project submissions against event cutoff deadlines adjusted for local event timezones.
- **Team Registry:** Look up registered teams, member rosters, competition tracks, and project repositories.
- **Judging & Evaluation:** Ingest judge score callbacks with webhook retry protection.
- **Judge Access Boundaries:** Protect project confidentiality by ensuring judges only inspect submissions in their assigned event.
- **Booth Reservations:** Coordinate demo presentation booth bookings with thread-safe capacity controls.
- **Responsive Interface:** Modern, accessible interface designed for both desktop workstations and mobile screens.

---

## 3. Expected Behaviour After Fixing the Bugs
Once all reported issues have been resolved, the application should behave as follows:

- **Leaderboard Tie-Breaks:** When scores are tied, earlier project submissions are ranked ahead of later submissions.
- **Deadline Accuracy:** Submissions are validated against the event's local timezone, accepting on-time submissions and rejecting submissions made after the cutoff.
- **Team Registry Lookups:** Searching by any valid Team ID immediately displays the team's profile and member list.
- **Idempotent Scoring:** Repeated score callbacks for the same evaluation never inflate points or create duplicate score records.
- **Event Boundary Isolation:** Judges attempting to inspect submissions outside their assigned event are blocked with an access restriction.
- **Booth Capacity Enforcement:** Simultaneous reservation requests never exceed slot capacity, safely admitting teams up to capacity and rejecting further bookings.

All existing competition management functionality must continue working as expected.
