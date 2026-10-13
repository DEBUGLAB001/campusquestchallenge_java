package com.campusquest.controller;

import com.campusquest.model.*;
import com.campusquest.service.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping({"/api", "/runtime/{runtimeId}/preview/api"})
public class ApiController {

    private final LeaderboardService leaderboardService;
    private final SubmissionService submissionService;
    private final TeamService teamService;
    private final JudgingService judgingService;
    private final ReservationService reservationService;
    private final JudgeMatchingService judgeMatchingService;
    private final DemoScheduleService demoScheduleService;
    private final DataStore dataStore;

    public ApiController(LeaderboardService leaderboardService,
                         SubmissionService submissionService,
                         TeamService teamService,
                         JudgingService judgingService,
                         ReservationService reservationService,
                         JudgeMatchingService judgeMatchingService,
                         DemoScheduleService demoScheduleService,
                         DataStore dataStore) {
        this.leaderboardService = leaderboardService;
        this.submissionService = submissionService;
        this.teamService = teamService;
        this.judgingService = judgingService;
        this.reservationService = reservationService;
        this.judgeMatchingService = judgeMatchingService;
        this.demoScheduleService = demoScheduleService;
        this.dataStore = dataStore;
    }

    // 1. Leaderboard (Defect 1)
    @GetMapping("/leaderboard")
    public ResponseEntity<Map<String, Object>> getLeaderboard() {
        List<LeaderboardEntry> entries = leaderboardService.getEventLeaderboard("event-hackathon");
        // Check if tied entries follow submission time
        boolean tiedOrderedCorrectly = true;
        for (int i = 0; i < entries.size() - 1; i++) {
            LeaderboardEntry a = entries.get(i);
            LeaderboardEntry b = entries.get(i + 1);
            if (Double.compare(a.getScore(), b.getScore()) == 0) {
                if (a.getSubmissionTime().isAfter(b.getSubmissionTime())) {
                    tiedOrderedCorrectly = false;
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "entries", entries,
                "tiedOrderedCorrectly", tiedOrderedCorrectly,
                "defectPresent", !tiedOrderedCorrectly
        ));
    }

    // 2. Deadline check (Defect 2)
    @GetMapping("/events/deadline-check")
    public ResponseEntity<Map<String, Object>> checkDeadline(
            @RequestParam(defaultValue = "event-hackathon") String eventId,
            @RequestParam(defaultValue = "2026-10-14T21:30:00Z") String timestamp) {
        Event event = dataStore.getEvents().get(eventId);
        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Event not found"));
        }
        Instant subTime = Instant.parse(timestamp);
        boolean allowed = submissionService.isSubmissionAllowed(event, subTime);

        return ResponseEntity.ok(Map.of(
                "eventId", event.getEventId(),
                "eventTitle", event.getTitle(),
                "configuredDeadline", event.getDeadline(),
                "configuredTimeZone", event.getTimeZone(),
                "submissionTimeUtc", timestamp,
                "allowed", allowed,
                "status", allowed ? "ACCEPTED" : "REJECTED (DEADLINE_EXPIRED)"
        ));
    }

    // 3. Team lookup by TeamId (Defect 3)
    @GetMapping("/teams/lookup")
    public ResponseEntity<Map<String, Object>> lookupTeam(@RequestParam(defaultValue = "team-cyber") String id) {
        TeamRecord record = teamService.getTeamById(id);
        if (record == null) {
            return ResponseEntity.ok(Map.of(
                    "searchedId", id,
                    "found", false,
                    "error", "Team not found in registry (TeamId key lookup returned null)"
            ));
        }
        return ResponseEntity.ok(Map.of(
                "searchedId", id,
                "found", true,
                "team", record
        ));
    }

    // 4. Judging score callback & retry (Defect 4)
    @PostMapping("/judging/record-score")
    public ResponseEntity<Map<String, Object>> recordScore(
            @RequestParam(defaultValue = "eval-101") String evalId,
            @RequestParam(defaultValue = "sub-101") String subId,
            @RequestParam(defaultValue = "judge-alpha") String judgeId,
            @RequestParam(defaultValue = "25.0") double score) {

        ScoreRecord record = new ScoreRecord(evalId, subId, judgeId, score, "Great architecture");
        judgingService.recordScore(record);

        double total = judgingService.getTotalScore(subId);
        int count = judgingService.getEvaluationCount(subId);

        return ResponseEntity.ok(Map.of(
                "submissionId", subId,
                "evaluationId", evalId,
                "recordedScore", score,
                "totalScore", total,
                "evaluationCount", count,
                "isDuplicated", total > 25.0
        ));
    }

    @GetMapping("/judging/status")
    public ResponseEntity<Map<String, Object>> getJudgingStatus(@RequestParam(defaultValue = "sub-101") String subId) {
        double total = judgingService.getTotalScore(subId);
        int count = judgingService.getEvaluationCount(subId);
        return ResponseEntity.ok(Map.of(
                "submissionId", subId,
                "totalScore", total,
                "evaluationCount", count,
                "isDuplicated", total > 25.0
        ));
    }

    // 5. Judge cross-event authorization (Defect 5)
    @GetMapping("/submissions/judge-access")
    public ResponseEntity<Map<String, Object>> getSubmissionForJudge(
            @RequestParam(defaultValue = "judge-alpha") String judgeId,
            @RequestParam(defaultValue = "sub-201") String submissionId) {
        try {
            Submission submission = submissionService.getSubmissionForJudge(judgeId, submissionId);
            Judge judge = dataStore.getJudges().get(judgeId);
            return ResponseEntity.ok(Map.of(
                    "authorized", true,
                    "judgeId", judgeId,
                    "judgeEvent", judge != null ? judge.getAssignedEventId() : "unknown",
                    "submissionId", submissionId,
                    "submissionEvent", submission != null ? submission.getEventId() : "none",
                    "submission", submission != null ? submission : "not found",
                    "warning", "Security Defect: Cross-event submission was exposed!"
            ));
        } catch (SecurityException se) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "authorized", false,
                    "error", se.getMessage(),
                    "code", "ACCESS_DENIED"
            ));
        }
    }

    // 6. Slot Reservation & Burst concurrency (Defect 6)
    @GetMapping("/reservations")
    public ResponseEntity<List<ReservationSlot>> getReservationSlots() {
        return ResponseEntity.ok(reservationService.getAllSlots());
    }

    @PostMapping("/reservations/simulate-burst")
    public ResponseEntity<Map<String, Object>> simulateBurstReservation(@RequestParam(defaultValue = "slot-lab-a") String slotId) {
        ReservationSlot slot = reservationService.getSlot(slotId);
        if (slot == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Slot not found"));
        }
        slot.getReservedTeams().clear();

        int threadCount = 10;
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        for (int i = 0; i < threadCount; i++) {
            final String teamName = "team-burst-" + (i + 1);
            executor.submit(() -> {
                try {
                    startLatch.await();
                    reservationService.reserveSlot(slotId, teamName);
                } catch (InterruptedException ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        try {
            doneLatch.await();
        } catch (InterruptedException ignored) {}
        executor.shutdown();

        int finalCount = slot.getReservedTeams().size();
        boolean exceeded = finalCount > slot.getCapacity();

        return ResponseEntity.ok(Map.of(
                "slotId", slotId,
                "capacity", slot.getCapacity(),
                "reservedCount", finalCount,
                "reservedTeams", slot.getReservedTeams(),
                "exceededCapacity", exceeded
        ));
    }

    // 7. Judge Bipartite Matching (Defect 7)
    @GetMapping("/matching")
    public ResponseEntity<Map<String, Object>> getJudgeMatching() {
        Map<String, String> assignments = judgeMatchingService.assignAllJudges();
        int totalPossible = 4; // Submissions 101, 102, 103, 104 with 4 qualified judges
        boolean isMaximum = assignments.size() == totalPossible;

        return ResponseEntity.ok(Map.of(
                "assignments", assignments,
                "matchedCount", assignments.size(),
                "targetMaximum", totalPossible,
                "isMaximumMatching", isMaximum
        ));
    }

    // 8. Demo Scheduling (Defect 8)
    @GetMapping("/schedule")
    public ResponseEntity<Map<String, Object>> getDemoSchedule() {
        List<DemoSlot> scheduled = demoScheduleService.getScheduledDemos();
        int totalPriority = demoScheduleService.calculateTotalPriority(scheduled);
        boolean isOptimal = totalPriority == 65;

        return ResponseEntity.ok(Map.of(
                "scheduledSlots", scheduled,
                "totalPriority", totalPriority,
                "optimalTarget", 65,
                "isOptimal", isOptimal
        ));
    }

    // Reset Data Store
    @PostMapping("/admin/reset")
    public ResponseEntity<Map<String, Object>> resetDataStore() {
        dataStore.reset();
        return ResponseEntity.ok(Map.of("message", "Data store reset to initial state"));
    }
}
