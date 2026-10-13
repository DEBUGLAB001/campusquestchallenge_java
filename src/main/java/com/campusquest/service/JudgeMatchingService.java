package com.campusquest.service;

import com.campusquest.model.Judge;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class JudgeMatchingService {

    private final DataStore dataStore;

    public JudgeMatchingService(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Finds matching between judges and submissions.
     * Each judge can evaluate at most 1 submission; each submission can have at most 1 judge.
     * Must find a MAXIMUM bipartite matching.
     *
     * @return Map of judgeId -> submissionId
     */
    public Map<String, String> assignJudges(List<Judge> judges) {
        // Fix: Maximum Bipartite Matching using augmenting paths (Ford-Fulkerson / DFS)
        Map<String, String> submissionToJudge = new HashMap<>();
        Map<String, Judge> judgeMap = new HashMap<>();
        for (Judge j : judges) {
            judgeMap.put(j.getJudgeId(), j);
        }

        for (Judge judge : judges) {
            Set<String> visited = new HashSet<>();
            bpm(judge.getJudgeId(), submissionToJudge, visited, judgeMap);
        }

        Map<String, String> judgeToSubmission = new HashMap<>();
        for (Map.Entry<String, String> entry : submissionToJudge.entrySet()) {
            judgeToSubmission.put(entry.getValue(), entry.getKey());
        }
        return judgeToSubmission;
    }

    private boolean bpm(String judgeId, Map<String, String> match, Set<String> visited, Map<String, Judge> judgeMap) {
        Judge judge = judgeMap.get(judgeId);
        if (judge == null) return false;

        for (String subId : judge.getQualifiedSubmissionIds()) {
            if (visited.add(subId)) {
                if (!match.containsKey(subId) || bpm(match.get(subId), match, visited, judgeMap)) {
                    match.put(subId, judgeId);
                    return true;
                }
            }
        }
        return false;
    }

    public Map<String, String> assignAllJudges() {
        return assignJudges(new ArrayList<>(dataStore.getJudges().values()));
    }
}
