package com.campusquest.model;

public class Event {
    private final String eventId;
    private final String title;
    private final String deadline; // e.g. "2026-10-14T18:00:00"
    private final String timeZone; // e.g. "America/New_York"

    public Event(String eventId, String title, String deadline, String timeZone) {
        this.eventId = eventId;
        this.title = title;
        this.deadline = deadline;
        this.timeZone = timeZone;
    }

    public String getEventId() {
        return eventId;
    }

    public String getTitle() {
        return title;
    }

    public String getDeadline() {
        return deadline;
    }

    public String getTimeZone() {
        return timeZone;
    }
}
