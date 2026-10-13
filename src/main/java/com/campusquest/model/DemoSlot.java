package com.campusquest.model;

public class DemoSlot {
    private final String id;
    private final String teamName;
    private final int startMinute;
    private final int endMinute;
    private final int priority;

    public DemoSlot(String id, String teamName, int startMinute, int endMinute, int priority) {
        this.id = id;
        this.teamName = teamName;
        this.startMinute = startMinute;
        this.endMinute = endMinute;
        this.priority = priority;
    }

    public String getId() {
        return id;
    }

    public String getTeamName() {
        return teamName;
    }

    public int getStartMinute() {
        return startMinute;
    }

    public int getEndMinute() {
        return endMinute;
    }

    public int getPriority() {
        return priority;
    }
}
