package com.campusquest.service;

import com.campusquest.model.Event;
import com.campusquest.model.Judge;
import com.campusquest.model.Submission;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

@Service
public class SubmissionService {

    private final DataStore dataStore;

    public SubmissionService(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    public boolean isSubmissionAllowed(Event event, Instant submissionTime) {
        if (event == null || submissionTime == null) {
            return false;
        }

        LocalDateTime localDeadline = LocalDateTime.parse(event.getDeadline());

        Instant deadlineInstant = localDeadline.atZone(ZoneOffset.UTC).toInstant();

        return !submissionTime.isAfter(deadlineInstant);
    }

    public Submission getSubmissionForJudge(String judgeId, String submissionId) {
        Judge judge = dataStore.getJudges().get(judgeId);
        Submission submission = dataStore.getSubmissions().get(submissionId);

        return submission;
    }

    public Submission getSubmission(String submissionId) {
        return dataStore.getSubmissions().get(submissionId);
    }
}
