package com.campusquest.service;

import com.campusquest.model.DemoSlot;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DemoScheduleService {

    private final DataStore dataStore;

    public DemoScheduleService(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Schedules non-overlapping demo presentations to maximize total priority score.
     */
    public List<DemoSlot> scheduleDemos(List<DemoSlot> requests) {
        // Fix: Weighted Interval Scheduling via Dynamic Programming
        if (requests == null || requests.isEmpty()) {
            return new ArrayList<>();
        }
        List<DemoSlot> slots = new ArrayList<>(requests);
        slots.sort(java.util.Comparator.comparingInt(DemoSlot::getEndMinute));

        int n = slots.size();
        int[] opt = new int[n];
        int[] prev = new int[n];

        // Find latest non-conflicting interval p[i]
        for (int i = 0; i < n; i++) {
            prev[i] = -1;
            for (int j = i - 1; j >= 0; j--) {
                if (slots.get(j).getEndMinute() <= slots.get(i).getStartMinute()) {
                    prev[i] = j;
                    break;
                }
            }
        }

        opt[0] = slots.get(0).getPriority();
        for (int i = 1; i < n; i++) {
            int incl = slots.get(i).getPriority() + (prev[i] != -1 ? opt[prev[i]] : 0);
            int excl = opt[i - 1];
            opt[i] = Math.max(incl, excl);
        }

        // Reconstruct selected slots
        List<DemoSlot> selected = new ArrayList<>();
        int curr = n - 1;
        while (curr >= 0) {
            int incl = slots.get(curr).getPriority() + (prev[curr] != -1 ? opt[prev[curr]] : 0);
            int excl = curr > 0 ? opt[curr - 1] : 0;
            if (incl >= excl) {
                selected.add(slots.get(curr));
                curr = prev[curr];
            } else {
                curr--;
            }
        }
        java.util.Collections.reverse(selected);
        return selected;
    }

    public int calculateTotalPriority(List<DemoSlot> slots) {
        return slots.stream().mapToInt(DemoSlot::getPriority).sum();
    }

    public List<DemoSlot> getScheduledDemos() {
        return scheduleDemos(dataStore.getDemoRequests());
    }
}
