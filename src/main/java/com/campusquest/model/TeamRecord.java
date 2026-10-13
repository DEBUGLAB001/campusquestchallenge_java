package com.campusquest.model;

public class TeamRecord {
    private final TeamId teamId;
    private final String name;
    private final String track;
    private final int memberCount;
    private final String status;

    public TeamRecord(TeamId teamId, String name, String track, int memberCount, String status) {
        this.teamId = teamId;
        this.name = name;
        this.track = track;
        this.memberCount = memberCount;
        this.status = status;
    }

    public TeamId getTeamId() {
        return teamId;
    }

    public String getName() {
        return name;
    }

    public String getTrack() {
        return track;
    }

    public int getMemberCount() {
        return memberCount;
    }

    public String getStatus() {
        return status;
    }
}
