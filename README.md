# CampusQuest — Collegiate Hackathon Operations Platform

## 1. Your Mission: Investigate & Fix the Bugs
You are a developer working on CampusQuest, a platform used by universities and student clubs to run hackathons, manage project submissions, and organize presentation spaces. The operations team has discovered six issues across the platform that are causing problems during ongoing competitions.

Your goal is to inspect the application, reproduce each issue, understand what is going wrong, and fix each bug so all features work properly.

---

### BUG-01: Leaderboard Ranks Later Submissions Ahead of Earlier Submissions
**Problem:**
When two or more teams have the exact same total score, the leaderboard incorrectly places the team that submitted later ahead of the team that submitted earlier.

**Steps to Reproduce:**
1. Open the **Tournament standings** tab in the application.
2. Look at the top teams on the leaderboard:
   - **AlgoTitans** (`team-algo`): Score = 95.0 pts, Submitted = 10:30:00 UTC.
   - **CyberKnights** (`team-cyber`): Score = 95.0 pts, Submitted = 10:00:00 UTC.
3. Notice that AlgoTitans is displayed at Rank #1 even though CyberKnights submitted their project 30 minutes earlier.

**Expected Result:**
When two teams have the same score, the team that submitted earlier should be placed at the higher rank (CyberKnights at Rank #1, AlgoTitans at Rank #2).

![BUG-01: Tied Leaderboard Scores Invert Submission Order](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-01.png)

---

### BUG-02: On-Time Submissions Are Wrongfully Rejected as Expired
**Problem:**
Participants submitting projects before the deadline have their submissions marked as rejected when the competition takes place in a non-UTC timezone.

**Steps to Reproduce:**
1. Open the **Deadlines** tab.
2. Select the **Campus Hackathon 2026** event (configured with a cutoff of 18:00:00 in `America/New_York` timezone, which is UTC-4).
3. Test a submission timestamp sent at 17:30 local time (for example, `2026-10-14T21:30:00Z`, which equals 17:30:00 in New York).
4. Click **Check deadline**.
5. Notice that the system flags the submission as "REJECTED (DEADLINE_EXPIRED)" even though 17:30 is 30 minutes before the 18:00 deadline.

**Expected Result:**
Submissions made on or before the event cutoff time in the event's local timezone should be accepted.

![BUG-02: Event Submissions Near Deadlines Are Wrongfully Rejected](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-02.png)

---

### BUG-03: Team Directory Search Fails for Valid Team IDs
**Problem:**
When searching for registered teams in the team directory, the system reports that the team does not exist, even when using a valid, registered Team ID.

**Steps to Reproduce:**
1. Open the **Teams** tab.
2. In the team search input, enter `team-cyber` (or click the `team-cyber` button) and click **Find team**.
3. Notice that the screen displays "Record not found for team-cyber" and indicates that no details are available.

**Expected Result:**
Searching for any registered team identifier should display the team's details, including team name, competition track, member count, and project link.

![BUG-03: Team Directory Search Fails for Valid Team IDs](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-03.png)

---

### BUG-04: Duplicate Score Callbacks Inflate Total Points
**Problem:**
When an evaluation score notification is sent more than once (such as during automated retries), the system counts the score multiple times, unfairly inflating the team's total points.

**Steps to Reproduce:**
1. Open the **Evaluation scores** tab.
2. In the Callback dispatcher form, use evaluation ID `eval-101`, submission ID `sub-101`, and score `25.0`.
3. Click **Send score callback** once. The total score becomes 25.0 pts.
4. Click **Send score callback** a second time with the same evaluation details.
5. Notice that the score increases to 50.0 pts and evaluation count increases to 2.

**Expected Result:**
Delivering the same evaluation score more than once should not add duplicate points. The team's score should remain at 25.0 pts.

![BUG-04: Duplicate Webhook Retries Inflate Judging Scores](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-04.png)

---

### BUG-05: Judges Can View Submissions from Other Events
**Problem:**
Judges assigned to evaluate one event can inspect project submissions that belong to a completely separate competition event, creating a privacy issue.

**Steps to Reproduce:**
1. Open the **Judge access** tab.
2. Select judge `judge-alpha` (assigned to `event-hackathon`).
3. Select submission `sub-201` (which belongs to `event-designquest`).
4. Click **Check access**.
5. Notice that the request succeeds and the system displays "Cross-event access granted", allowing the judge to see foreign submission details.

**Expected Result:**
Judges should only be able to view submissions belonging to their assigned event. Accessing submissions from other events must be blocked.

![BUG-05: Judges Can View Submissions from Other Events](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-05.png)

---

### BUG-06: Simultaneous Bookings Overbook Booth Capacity
**Problem:**
When several teams reserve presentation booths at the exact same moment, booths accept more reservations than their maximum capacity allows.

**Steps to Reproduce:**
1. Open the **Booth reservations** tab.
2. Look at **Innovation Lab A Booth** (`slot-lab-a`), which has a maximum capacity of 5 teams.
3. Click **Simulate 10 concurrent bookings**.
4. Notice that all 10 teams succeed in booking the booth, showing 10 / 5 teams (200% capacity) and an overflow notice.

**Expected Result:**
Booths must never exceed their capacity limit. For a booth with a capacity of 5, only 5 bookings should succeed when 10 teams book simultaneously, and the rest should be rejected.

![BUG-06: Simultaneous Reservations Exceed Booth Capacity](https://cdn.debuglab.online/Lab/campusquestjava/uploads/bug-06.png)

---

## 2. Get Familiar With the Application
CampusQuest organizes hackathon workflows into six modules:
- **Tournament Standings:** Displays real-time team rankings, total points, submission timestamps, and tie-breaking order.
- **Deadlines:** Evaluates whether project submissions meet the event cutoff based on the event's local timezone.
- **Teams:** Maintains the directory of registered teams, project repositories, tracks, and members.
- **Evaluation Scores:** Receives scoring notifications from judges and updates submission totals.
- **Judge Access:** Controls which submissions each judge is authorized to review.
- **Booth Reservations:** Manages demo space bookings and tracks booth capacity limits.

---

## 3. Expected Behaviour After Fixing the Bugs
After all fixes are in place, the application must behave as follows:
- **Leaderboard Tie-Breaks:** When teams are tied on points, earlier submissions always appear above later submissions.
- **Deadline Accuracy:** Submissions made before the cutoff in the event's local timezone are accepted, while late submissions are rejected.
- **Team Registry Search:** Searching for any valid Team ID immediately displays the team's profile.
- **Score Consistency:** Repeated score submissions for the same evaluation do not increase the total score or create duplicate entries.
- **Event Isolation:** Judges cannot access submissions from other events; foreign requests are blocked.
- **Booth Capacity Enforcement:** Presentation booths never exceed their maximum allowed capacity, even under simultaneous booking attempts.

---

## 4. Verification & Testing
You can verify the state of your application at any time using the automated test suite:

```bash
bash tests/run_tests.sh
```

To run the application with live reload during development:

```bash
bash start.sh
```
