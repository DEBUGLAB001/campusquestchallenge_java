package com.campusquest.model;

import java.util.ArrayList;
import java.util.List;

public class Judge {
    private final String judgeId;
    private final String name;
    private final String assignedEventId;
    private final List<String> qualifiedSubmissionIds;

    public Judge(String judgeId, String name, String assignedEventId, List<String> qualifiedSubmissionIds) {
        this.judgeId = judgeId;
        this.name = name;
        this.assignedEventId = assignedEventId;
        this.qualifiedSubmissionIds = qualifiedSubmissionIds != null ? new ArrayList<>(qualifiedSubmissionIds) : new ArrayList<>();
    }

    public String getJudgeId() {
        return judgeId;
    }

    public String getName() {
        return name;
    }

    public String getAssignedEventId() {
        return assignedEventId;
    }

    public List<String> getQualifiedSubmissionIds() {
        return qualifiedSubmissionIds;
    }
}
