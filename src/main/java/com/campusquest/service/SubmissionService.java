package com.campusquest.service;

import com.campusquest.model.Event;
import com.campusquest.model.Judge;
import com.campusquest.model.Submission;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class SubmissionService {

    private final DataStore dataStore;

    public SubmissionService(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Check if a submission is on time according to the event's deadline and configured timezone.
     */
    public boolean isSubmissionAllowed(Event event, Instant submissionTime) {
        if (event == null || submissionTime == null) {
            return false;
        }

        LocalDateTime localDeadline = LocalDateTime.parse(event.getDeadline());

        // DEFECT 2 (BASELINE):
        // Interprets the local deadline as UTC instead of using event.getTimeZone().
        // For America/New_York (UTC-4), 18:00 local is 22:00 UTC.
        // Parsing as UTC makes the deadline 18:00 UTC, causing legitimate on-time
        // submissions (e.g. 21:30 UTC = 17:30 local) to be falsely rejected as expired.
        Instant deadlineInstant = localDeadline.atZone(ZoneOffset.UTC).toInstant();

        return !submissionTime.isAfter(deadlineInstant);
    }

    /**
     * Retrieve a submission on behalf of a judge.
     * Judges must not be able to read submissions belonging to a different event.
     */
    public Submission getSubmissionForJudge(String judgeId, String submissionId) {
        Judge judge = dataStore.getJudges().get(judgeId);
        Submission submission = dataStore.getSubmissions().get(submissionId);

        // DEFECT 5 (BASELINE):
        // Omits access control check validating that judge.getAssignedEventId()
        // equals submission.getEventId(). Allows cross-event information disclosure.
        return submission;
    }

    public Submission getSubmission(String submissionId) {
        return dataStore.getSubmissions().get(submissionId);
    }
}
