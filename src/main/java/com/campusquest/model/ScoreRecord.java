package com.campusquest.model;

public class ScoreRecord {
    private final String evaluationId;
    private final String submissionId;
    private final String judgeId;
    private final double score;
    private final String feedback;

    public ScoreRecord(String evaluationId, String submissionId, String judgeId, double score, String feedback) {
        this.evaluationId = evaluationId;
        this.submissionId = submissionId;
        this.judgeId = judgeId;
        this.score = score;
        this.feedback = feedback;
    }

    public String getEvaluationId() {
        return evaluationId;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public String getJudgeId() {
        return judgeId;
    }

    public double getScore() {
        return score;
    }

    public String getFeedback() {
        return feedback;
    }
}
