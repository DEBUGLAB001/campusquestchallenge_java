package com.campusquest.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ReservationSlot {
    private final String slotId;
    private final String name;
    private final int capacity;
    private final List<String> reservedTeams;

    public ReservationSlot(String slotId, String name, int capacity) {
        this.slotId = slotId;
        this.name = name;
        this.capacity = capacity;
        this.reservedTeams = Collections.synchronizedList(new ArrayList<>());
    }

    public String getSlotId() {
        return slotId;
    }

    public String getName() {
        return name;
    }

    public int getCapacity() {
        return capacity;
    }

    public List<String> getReservedTeams() {
        return reservedTeams;
    }
}
