package com.campusquest.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@RestController
public class HealthController {

    private final String bootId = UUID.randomUUID().toString();
    private final String startedAt = DateTimeFormatter.ofPattern("HH:mm:ss")
            .withZone(ZoneId.systemDefault())
            .format(Instant.now());

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> getHealth() {
        return ResponseEntity.ok(Map.of(
                "boot_id", bootId,
                "started_at", startedAt,
                "status", "UP",
                "service", "CampusQuest"
        ));
    }
}
