package com.campusquest;

import com.campusquest.model.*;
import com.campusquest.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

public class CampusQuestTest {

    private DataStore dataStore;
    private LeaderboardService leaderboardService;
    private SubmissionService submissionService;
    private TeamService teamService;
    private JudgingService judgingService;
    private ReservationService reservationService;
    private JudgeMatchingService judgeMatchingService;
    private DemoScheduleService demoScheduleService;

    @BeforeEach
    public void setUp() {
        dataStore = new DataStore();
        leaderboardService = new LeaderboardService(dataStore);
        submissionService = new SubmissionService(dataStore);
        teamService = new TeamService(dataStore);
        judgingService = new JudgingService(dataStore);
        reservationService = new ReservationService(dataStore);
        judgeMatchingService = new JudgeMatchingService(dataStore);
        demoScheduleService = new DemoScheduleService(dataStore);
    }

    @Test
    public void test_tied_scores_follow_submission_time() {
        LeaderboardEntry a = new LeaderboardEntry(0, "team-a", "Team Alpha", 90.0, Instant.parse("2026-10-14T10:00:00Z"));
        LeaderboardEntry b = new LeaderboardEntry(0, "team-b", "Team Beta", 90.0, Instant.parse("2026-10-14T10:30:00Z"));
        List<LeaderboardEntry> ranked = leaderboardService.getRankings(List.of(a, b));
        assertEquals("team-a", ranked.get(0).getTeamId(), "Earlier submission should rank higher on tie");
    }

    @Test
    public void test_deadline_uses_configured_event_zone() {
        Event event = new Event("e-test", "Hack", "2026-10-14T18:00:00", "America/New_York");
        Instant subTime = Instant.parse("2026-10-14T21:30:00Z");
        assertTrue(submissionService.isSubmissionAllowed(event, subTime), "Submission at 17:30 local should be allowed");
    }

    @Test
    public void test_equivalent_team_ids_work_as_map_keys() {
        TeamRecord record = teamService.getTeam(new TeamId(new String("team-cyber")));
        assertNotNull(record, "Equivalent TeamId key should find registered team");
    }

    @Test
    public void test_judging_callback_retry_does_not_duplicate_score() {
        ScoreRecord r1 = new ScoreRecord("eval-1", "sub-101", "judge-1", 25.0, "Great work");
        ScoreRecord r2 = new ScoreRecord("eval-1", "sub-101", "judge-1", 25.0, "Great work");
        judgingService.recordScore(r1);
        judgingService.recordScore(r2);
        assertEquals(25.0, judgingService.getTotalScore("sub-101"), 0.001, "Callback retry should be idempotent");
    }

    @Test
    public void test_judge_cannot_read_submission_from_another_event() {
        assertThrows(SecurityException.class, () -> {
            submissionService.getSubmissionForJudge("judge-alpha", "sub-201");
        }, "Judge should not access submissions from another event");
    }

    @Test
    public void test_simultaneous_reservations_never_exceed_capacity() throws Exception {
        String slotId = "slot-lab-a";
        int threads = 10;
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threads);
        ExecutorService executor = Executors.newFixedThreadPool(threads);

        for (int i = 0; i < threads; i++) {
            final String team = "team-" + i;
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    reservationService.reserveSlot(slotId, team);
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

        assertTrue(reservationService.getSlot(slotId).getReservedTeams().size() <= 5,
                "Concurrent reservations must not exceed capacity 5");
    }

    @Test
    public void test_judge_assignment_finds_maximum_matching() {
        Judge j1 = new Judge("j1", "J1", "e1", List.of("s2", "s1"));
        Judge j2 = new Judge("j2", "J2", "e1", List.of("s2"));
        Judge j3 = new Judge("j3", "J3", "e1", List.of("s4", "s3"));
        Judge j4 = new Judge("j4", "J4", "e1", List.of("s4"));
        Map<String, String> matching = judgeMatchingService.assignJudges(List.of(j1, j2, j3, j4));
        assertEquals(4, matching.size(), "Should find maximum bipartite matching of size 4");
    }

    @Test
    public void test_demo_schedule_maximizes_total_priority() {
        List<DemoSlot> requests = List.of(
                new DemoSlot("d1", "Team 1", 540, 780, 50),
                new DemoSlot("d2", "Team 2", 540, 660, 30),
                new DemoSlot("d3", "Team 3", 660, 780, 35)
        );
        List<DemoSlot> scheduled = demoScheduleService.scheduleDemos(requests);
        assertEquals(65, demoScheduleService.calculateTotalPriority(scheduled), "Optimal schedule priority should be 65");
    }
}
