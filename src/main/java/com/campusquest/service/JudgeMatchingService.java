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
        // DEFECT 7 (BASELINE):
        // Naive greedy assignment that fails to find maximum matching.
        // If Judge 1 greedily claims a submission needed by Judge 2 (who has no other choices),
        // greedy leaves Judge 2 unassigned instead of finding an augmenting path.
        Map<String, String> judgeToSubmission = new HashMap<>();
        Set<String> assignedSubmissions = new HashSet<>();

        for (Judge judge : judges) {
            for (String subId : judge.getQualifiedSubmissionIds()) {
                if (!assignedSubmissions.contains(subId)) {
                    judgeToSubmission.put(judge.getJudgeId(), subId);
                    assignedSubmissions.add(subId);
                    break;
                }
            }
        }

        return judgeToSubmission;
    }

    public Map<String, String> assignAllJudges() {
        return assignJudges(new ArrayList<>(dataStore.getJudges().values()));
    }
}
