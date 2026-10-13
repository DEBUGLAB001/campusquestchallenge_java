package com.campusquest.service;

import com.campusquest.model.ReservationSlot;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ReservationService {

    private final DataStore dataStore;

    public ReservationService(DataStore dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Reserve a presentation slot for a team.
     * Simultaneous concurrent requests must never exceed capacity.
     */
    public boolean reserveSlot(String slotId, String teamId) {
        ReservationSlot slot = dataStore.getReservationSlots().get(slotId);
        if (slot == null) {
            return false;
        }

        // DEFECT 6 (BASELINE):
        // Non-thread-safe check-then-act.
        // Race window allows multiple concurrent threads to pass the capacity
        // check simultaneously, exceeding maximum capacity.
        if (slot.getReservedTeams().size() < slot.getCapacity()) {
            try {
                // Deliberate race window exposing unsynchronized check-then-act
                Thread.sleep(15);
            } catch (InterruptedException ignored) {}

            slot.getReservedTeams().add(teamId);
            return true;
        }
        return false;
    }

    public ReservationSlot getSlot(String slotId) {
        return dataStore.getReservationSlots().get(slotId);
    }

    public List<ReservationSlot> getAllSlots() {
        return new ArrayList<>(dataStore.getReservationSlots().values());
    }
}
