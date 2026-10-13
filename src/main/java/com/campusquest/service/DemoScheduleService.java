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
        // DEFECT 8 (BASELINE):
        // Greedy selection by highest individual priority.
        // A single long demo (priority 50) blocks two compatible demos (priorities 30 + 35 = 65),
        // resulting in suboptimal schedule score 50 instead of optimal 65.
        List<DemoSlot> sorted = new ArrayList<>(requests);
        sorted.sort((a, b) -> Integer.compare(b.getPriority(), a.getPriority()));

        List<DemoSlot> selected = new ArrayList<>();
        for (DemoSlot slot : sorted) {
            boolean overlaps = false;
            for (DemoSlot chosen : selected) {
                // Overlap condition: max(start1, start2) < min(end1, end2)
                if (Math.max(slot.getStartMinute(), chosen.getStartMinute()) <
                        Math.min(slot.getEndMinute(), chosen.getEndMinute())) {
                    overlaps = true;
                    break;
                }
            }
            if (!overlaps) {
                selected.add(slot);
            }
        }
        return selected;
    }

    public int calculateTotalPriority(List<DemoSlot> slots) {
        return slots.stream().mapToInt(DemoSlot::getPriority).sum();
    }

    public List<DemoSlot> getScheduledDemos() {
        return scheduleDemos(dataStore.getDemoRequests());
    }
}
