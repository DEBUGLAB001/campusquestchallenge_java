package com.campusquest;

import com.campusquest.model.*;
import com.campusquest.service.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * CLI TestRunner for CampusQuest.
 * Runs the 8 challenge test cases, prints pure JSON telemetry to stdout,
 * and exits with code 0 on all-pass, non-zero on failure.
 */
public class TestRunner {

    record TestResult(String name, boolean passed, long ms, String error) {}

    @FunctionalInterface
    interface TestCase {
        void run() throws Throwable;
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        LinkedHashMap<String, TestCase> tests = new LinkedHashMap<>();

        // Test 1: Leaderboard tie-breaker
        tests.put("test_tied_scores_follow_submission_time", () -> {
            DataStore ds = new DataStore();
            LeaderboardService service = new LeaderboardService(ds);
            LeaderboardEntry teamA = new LeaderboardEntry(0, "team-a", "Team Alpha", 90.0, Instant.parse("2026-10-14T10:00:00Z"));
            LeaderboardEntry teamB = new LeaderboardEntry(0, "team-b", "Team Beta", 90.0, Instant.parse("2026-10-14T10:30:00Z"));
            List<LeaderboardEntry> ranked = service.getRankings(List.of(teamA, teamB));
            if (!"team-a".equals(ranked.get(0).getTeamId())) {
                throw new AssertionError("Expected earlier submission team-a to be ranked #1, got " + ranked.get(0).getTeamId());
            }
        });

        // Test 2: Event deadline timezone calculation
        tests.put("test_deadline_uses_configured_event_zone", () -> {
            DataStore ds = new DataStore();
            SubmissionService service = new SubmissionService(ds);
            Event event = new Event("e-test", "Hack", "2026-10-14T18:00:00", "America/New_York");
            // 21:30 UTC is 17:30 New York (EDT is UTC-4). It is before the 18:00 deadline!
            Instant subTime = Instant.parse("2026-10-14T21:30:00Z");
            boolean allowed = service.isSubmissionAllowed(event, subTime);
            if (!allowed) {
                throw new AssertionError("Expected submission at 17:30 local time to be accepted for 18:00 deadline");
            }
        });

        // Test 3: Equivalent TeamId map key lookup
        tests.put("test_equivalent_team_ids_work_as_map_keys", () -> {
            DataStore ds = new DataStore();
            TeamService service = new TeamService(ds);
            TeamId lookupKey = new TeamId(new String("team-cyber"));
            TeamRecord record = service.getTeam(lookupKey);
            if (record == null) {
                throw new AssertionError("Expected to find team record using equivalent TeamId key");
            }
        });

        // Test 4: Idempotent judging callbacks
        tests.put("test_judging_callback_retry_does_not_duplicate_score", () -> {
            DataStore ds = new DataStore();
            JudgingService service = new JudgingService(ds);
            ScoreRecord r1 = new ScoreRecord("eval-1", "sub-101", "judge-1", 25.0, "Great work");
            ScoreRecord r2 = new ScoreRecord("eval-1", "sub-101", "judge-1", 25.0, "Great work");
            service.recordScore(r1);
            service.recordScore(r2);
            double total = service.getTotalScore("sub-101");
            if (Double.compare(total, 25.0) != 0) {
                throw new AssertionError("Expected idempotent total score 25.0 after retry, got " + total);
            }
        });

        // Test 5: Cross-event judge submission access control
        tests.put("test_judge_cannot_read_submission_from_another_event", () -> {
            DataStore ds = new DataStore();
            SubmissionService service = new SubmissionService(ds);
            // judge-alpha is assigned to event-hackathon; sub-201 belongs to event-designquest
            boolean rejected = false;
            try {
                Submission sub = service.getSubmissionForJudge("judge-alpha", "sub-201");
                if (sub != null && !"event-hackathon".equals(sub.getEventId())) {
                    rejected = false;
                }
            } catch (SecurityException se) {
                rejected = true;
            }
            if (!rejected) {
                throw new AssertionError("Expected SecurityException when judge attempts to read submission from another event");
            }
        });

        // Test 6: Thread-safe booth reservations
        tests.put("test_simultaneous_reservations_never_exceed_capacity", () -> {
            DataStore ds = new DataStore();
            ReservationService service = new ReservationService(ds);
            String slotId = "slot-lab-a"; // Capacity = 5
            int threads = 10;
            CountDownLatch readyLatch = new CountDownLatch(threads);
            CountDownLatch startLatch = new CountDownLatch(1);
            CountDownLatch doneLatch = new CountDownLatch(threads);
            ExecutorService executor = Executors.newFixedThreadPool(threads);

            for (int i = 0; i < threads; i++) {
                final String teamName = "team-burst-" + i;
                executor.submit(() -> {
                    readyLatch.countDown();
                    try {
                        startLatch.await();
                        service.reserveSlot(slotId, teamName);
                    } catch (Exception ignored) {
                    } finally {
                        doneLatch.countDown();
                    }
                });
            }
            readyLatch.await();
            startLatch.countDown();
            doneLatch.await();
            executor.shutdown();

            int count = service.getSlot(slotId).getReservedTeams().size();
            if (count > 5) {
                throw new AssertionError("Expected reservations to not exceed capacity 5, got " + count);
            }
        });

        // Test 7: Maximum bipartite matching for judge assignment
        tests.put("test_judge_assignment_finds_maximum_matching", () -> {
            DataStore ds = new DataStore();
            JudgeMatchingService service = new JudgeMatchingService(ds);
            Judge j1 = new Judge("j1", "J1", "e1", List.of("s2", "s1"));
            Judge j2 = new Judge("j2", "J2", "e1", List.of("s2"));
            Judge j3 = new Judge("j3", "J3", "e1", List.of("s4", "s3"));
            Judge j4 = new Judge("j4", "J4", "e1", List.of("s4"));
            Map<String, String> matching = service.assignJudges(List.of(j1, j2, j3, j4));
            if (matching.size() != 4) {
                throw new AssertionError("Expected maximum matching size 4, got " + matching.size());
            }
        });

        // Test 8: Weighted interval demo scheduling
        tests.put("test_demo_schedule_maximizes_total_priority", () -> {
            DataStore ds = new DataStore();
            DemoScheduleService service = new DemoScheduleService(ds);
            List<DemoSlot> requests = List.of(
                    new DemoSlot("d1", "Team 1", 540, 780, 50),
                    new DemoSlot("d2", "Team 2", 540, 660, 30),
                    new DemoSlot("d3", "Team 3", 660, 780, 35)
            );
            List<DemoSlot> scheduled = service.scheduleDemos(requests);
            int total = service.calculateTotalPriority(scheduled);
            if (total != 65) {
                throw new AssertionError("Expected total priority 65, got " + total);
            }
        });

        List<TestResult> results = new ArrayList<>();
        long totalExecutionMs = 0;
        int passed = 0;
        int failed = 0;

        for (Map.Entry<String, TestCase> entry : tests.entrySet()) {
            String name = entry.getKey();
            TestCase tc = entry.getValue();
            long start = System.currentTimeMillis();
            try {
                tc.run();
                long elapsed = System.currentTimeMillis() - start;
                totalExecutionMs += elapsed;
                passed++;
                results.add(new TestResult(name, true, elapsed, null));
            } catch (Throwable t) {
                long elapsed = System.currentTimeMillis() - start;
                totalExecutionMs += elapsed;
                failed++;
                String msg = t.getMessage();
                if (msg == null || msg.isBlank()) {
                    msg = t.getClass().getSimpleName();
                }
                results.add(new TestResult(name, false, elapsed, msg));
            }
        }

        StringBuilder json = new StringBuilder();
        json.append("{\n");
        for (TestResult r : results) {
            json.append("  \"").append(r.name()).append("\": {\n");
            json.append("    \"Status\": \"").append(r.passed() ? "passed" : "failed").append("\",\n");
            json.append("    \"Execution time\": \"").append(r.ms()).append("ms\"");
            if (!r.passed()) {
                json.append(",\n    \"Error\": \"").append(escapeJson(r.error())).append("\"");
            }
            json.append("\n  },\n");
        }
        json.append("  \"Passed\": ").append(passed).append(",\n");
        json.append("  \"Failed\": ").append(failed).append(",\n");
        json.append("  \"Total bugs\": ").append(tests.size()).append(",\n");
        json.append("  \"Total Execution time\": \"").append(totalExecutionMs).append("ms\"\n");
        json.append("}");

        System.out.println(json.toString());
        System.exit(failed == 0 ? 0 : 1);
    }
}
