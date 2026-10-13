package com.campusquest.model;

import java.time.Instant;

public class Submission {
    private final String submissionId;
    private final String eventId;
    private final String teamId;
    private final String projectTitle;
    private final String summary;
    private final Instant submissionTime;
    private final String status;

    public Submission(String submissionId, String eventId, String teamId, String projectTitle, String summary, Instant submissionTime, String status) {
        this.submissionId = submissionId;
        this.eventId = eventId;
        this.teamId = teamId;
        this.projectTitle = projectTitle;
        this.summary = summary;
        this.submissionTime = submissionTime;
        this.status = status;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public String getEventId() {
        return eventId;
    }

    public String getTeamId() {
        return teamId;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public String getSummary() {
        return summary;
    }

    public Instant getSubmissionTime() {
        return submissionTime;
    }

    public String getStatus() {
        return status;
    }
}
