package com.campusquest.model;

import java.time.Instant;

public class LeaderboardEntry {
    private int rank;
    private final String teamId;
    private final String teamName;
    private final double score;
    private final Instant submissionTime;

    public LeaderboardEntry(int rank, String teamId, String teamName, double score, Instant submissionTime) {
        this.rank = rank;
        this.teamId = teamId;
        this.teamName = teamName;
        this.score = score;
        this.submissionTime = submissionTime;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public String getTeamId() {
        return teamId;
    }

    public String getTeamName() {
        return teamName;
    }

    public double getScore() {
        return score;
    }

    public Instant getSubmissionTime() {
        return submissionTime;
    }
}
