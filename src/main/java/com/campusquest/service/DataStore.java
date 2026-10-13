package com.campusquest.service;

import com.campusquest.model.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class DataStore {

    private final Map<String, Event> events = new ConcurrentHashMap<>();
    private final Map<TeamId, TeamRecord> teams = new HashMap<>(); // Uses TeamId as key!
    private final Map<String, Submission> submissions = new ConcurrentHashMap<>();
    private final Map<String, Judge> judges = new ConcurrentHashMap<>();
    private final Map<String, ReservationSlot> reservationSlots = new ConcurrentHashMap<>();
    private final List<ScoreRecord> scoresList = new ArrayList<>();
    private final Map<String, ScoreRecord> scoresMap = new ConcurrentHashMap<>();
    private final List<DemoSlot> demoRequests = new ArrayList<>();

    public DataStore() {
        reset();
    }

    public synchronized void reset() {
        events.clear();
        teams.clear();
        submissions.clear();
        judges.clear();
        reservationSlots.clear();
        scoresList.clear();
        scoresMap.clear();
        demoRequests.clear();

        // 1. Seed Events
        Event hackathon = new Event("event-hackathon", "Campus Hackathon 2026", "2026-10-14T18:00:00", "America/New_York");
        Event designQuest = new Event("event-designquest", "Design Quest 2026", "2026-10-14T16:00:00", "Asia/Kolkata");
        events.put(hackathon.getEventId(), hackathon);
        events.put(designQuest.getEventId(), designQuest);

        // 2. Seed Teams
        TeamRecord t1 = new TeamRecord(new TeamId("team-cyber"), "CyberKnights", "AI/ML", 4, "ACTIVE");
        TeamRecord t2 = new TeamRecord(new TeamId("team-algo"), "AlgoTitans", "Systems", 3, "ACTIVE");
        TeamRecord t3 = new TeamRecord(new TeamId("team-nexus"), "NexusSquad", "Web3", 4, "ACTIVE");
        TeamRecord t4 = new TeamRecord(new TeamId("team-byte"), "ByteCrafters", "Cloud", 3, "ACTIVE");
        teams.put(t1.getTeamId(), t1);
        teams.put(t2.getTeamId(), t2);
        teams.put(t3.getTeamId(), t3);
        teams.put(t4.getTeamId(), t4);

        // 3. Seed Submissions
        Submission s1 = new Submission("sub-101", "event-hackathon", "team-cyber", "SmartCampus IoT",
                "Campus automation via edge AI", Instant.parse("2026-10-14T15:30:00Z"), "SUBMITTED");
        Submission s2 = new Submission("sub-102", "event-hackathon", "team-algo", "NeuralFlow Engine",
                "High-throughput inference engine", Instant.parse("2026-10-14T16:00:00Z"), "SUBMITTED");
        Submission s3 = new Submission("sub-103", "event-hackathon", "team-byte", "CloudShield",
                "Zero trust microsegmentation", Instant.parse("2026-10-14T16:15:00Z"), "SUBMITTED");
        Submission s4 = new Submission("sub-104", "event-hackathon", "team-nexus", "ChainCert",
                "Verifiable academic credentials", Instant.parse("2026-10-14T16:30:00Z"), "SUBMITTED");
        Submission s201 = new Submission("sub-201", "event-designquest", "team-nexus", "SolarGrid UI",
                "Renewable power monitoring interface", Instant.parse("2026-10-14T08:00:00Z"), "SUBMITTED");

        submissions.put(s1.getSubmissionId(), s1);
        submissions.put(s2.getSubmissionId(), s2);
        submissions.put(s3.getSubmissionId(), s3);
        submissions.put(s4.getSubmissionId(), s4);
        submissions.put(s201.getSubmissionId(), s201);

        // 4. Seed Judges
        Judge j1 = new Judge("judge-alpha", "Dr. Alan Turing", "event-hackathon", List.of("sub-101", "sub-102"));
        Judge j2 = new Judge("judge-beta", "Prof. Grace Hopper", "event-hackathon", List.of("sub-102"));
        Judge j3 = new Judge("judge-gamma", "Dr. Claude Shannon", "event-hackathon", List.of("sub-103", "sub-104"));
        Judge j4 = new Judge("judge-delta", "Dr. Ada Lovelace", "event-hackathon", List.of("sub-104"));
        Judge jExternal = new Judge("judge-external", "Dr. Linus Torvalds", "event-designquest", List.of("sub-201"));

        judges.put(j1.getJudgeId(), j1);
        judges.put(j2.getJudgeId(), j2);
        judges.put(j3.getJudgeId(), j3);
        judges.put(j4.getJudgeId(), j4);
        judges.put(jExternal.getJudgeId(), jExternal);

        // 5. Seed Reservation Slots
        ReservationSlot slotLabA = new ReservationSlot("slot-lab-a", "Innovation Lab A Booth", 5);
        ReservationSlot slotAudit = new ReservationSlot("slot-auditorium", "Main Auditorium Pitch Deck", 3);
        reservationSlots.put(slotLabA.getSlotId(), slotLabA);
        reservationSlots.put(slotAudit.getSlotId(), slotAudit);

        // 6. Seed Demo Slots (Weighted Interval Scheduling)
        // Request 1: 09:00 - 13:00 (540 to 780 min), priority 50
        // Request 2: 09:00 - 11:00 (540 to 660 min), priority 30
        // Request 3: 11:00 - 13:00 (660 to 780 min), priority 35
        demoRequests.add(new DemoSlot("demo-1", "CloudPioneers", 540, 780, 50));
        demoRequests.add(new DemoSlot("demo-2", "DataForge", 540, 660, 30));
        demoRequests.add(new DemoSlot("demo-3", "CyberGuard", 660, 780, 35));
    }

    public Map<String, Event> getEvents() { return events; }
    public Map<TeamId, TeamRecord> getTeams() { return teams; }
    public Map<String, Submission> getSubmissions() { return submissions; }
    public Map<String, Judge> getJudges() { return judges; }
    public Map<String, ReservationSlot> getReservationSlots() { return reservationSlots; }
    public List<ScoreRecord> getScoresList() { return scoresList; }
    public Map<String, ScoreRecord> getScoresMap() { return scoresMap; }
    public List<DemoSlot> getDemoRequests() { return demoRequests; }
}
