package com.campusquest.service;

import com.campusquest.model.ScoreRecord;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class JudgingService {

    private final DataStore dataStore;

    public JudgingService(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Record a judging score callback.
     * Retries with identical evaluationId must be idempotent.
     */
    public void recordScore(ScoreRecord record) {
        // DEFECT 4 (BASELINE):
        // Blindly appends every callback payload to a list without deduplicating
        // by evaluationId. When network retries re-deliver the evaluation, duplicate
        // score records are appended.
        dataStore.getScoresList().add(record);
    }

    public double getTotalScore(String submissionId) {
        return dataStore.getScoresList().stream()
                .filter(s -> s.getSubmissionId().equals(submissionId))
                .mapToDouble(ScoreRecord::getScore)
                .sum();
    }

    public int getEvaluationCount(String submissionId) {
        return (int) dataStore.getScoresList().stream()
                .filter(s -> s.getSubmissionId().equals(submissionId))
                .count();
    }

    public List<ScoreRecord> getScoresForSubmission(String submissionId) {
        return dataStore.getScoresList().stream()
                .filter(s -> s.getSubmissionId().equals(submissionId))
                .collect(Collectors.toList());
    }
}
