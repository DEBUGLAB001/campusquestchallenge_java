package com.campusquest.service;

import com.campusquest.model.LeaderboardEntry;
import com.campusquest.model.Submission;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class LeaderboardService {

    private final DataStore dataStore;

    public LeaderboardService(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Compute leaderboard rankings for an event.
     * Tied scores must follow submission time (earlier submission ranks higher).
     */
    public List<LeaderboardEntry> getRankings(List<LeaderboardEntry> initialEntries) {
        List<LeaderboardEntry> entries = new ArrayList<>(initialEntries);

        // DEFECT 1 (BASELINE):
        // When scores are tied, entries are sorted by submission time in descending order
        // (later submission first) instead of ascending (earlier submission first).
        entries.sort((a, b) -> {
            int scoreCmp = Double.compare(b.getScore(), a.getScore());
            if (scoreCmp != 0) {
                return scoreCmp;
            }
            // Bug: later submission gets higher rank
            return b.getSubmissionTime().compareTo(a.getSubmissionTime());
        });

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

    public List<LeaderboardEntry> getEventLeaderboard(String eventId) {
        // Seeded demo entries for event leaderboard
        List<LeaderboardEntry> entries = new ArrayList<>();
        entries.add(new LeaderboardEntry(0, "team-cyber", "CyberKnights", 95.0, Instant.parse("2026-10-14T10:00:00Z")));
        entries.add(new LeaderboardEntry(0, "team-algo", "AlgoTitans", 95.0, Instant.parse("2026-10-14T10:30:00Z")));
        entries.add(new LeaderboardEntry(0, "team-nexus", "NexusSquad", 88.0, Instant.parse("2026-10-14T11:00:00Z")));
        entries.add(new LeaderboardEntry(0, "team-byte", "ByteCrafters", 82.0, Instant.parse("2026-10-14T11:15:00Z")));

        return getRankings(entries);
    }
}
