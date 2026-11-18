package com.campusquest.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Controller
public class PreviewController {

    @GetMapping(value = {"/", "/index.html", "/runtime/{runtimeId}/preview", "/runtime/{runtimeId}/preview/"}, produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public byte[] getPreviewIndex() throws IOException {
        Path localPath = Path.of("src/main/resources/static/index.html");
        if (Files.exists(localPath)) {
            return Files.readAllBytes(localPath);
        }
        try (InputStream in = getClass().getResourceAsStream("/static/index.html")) {
            if (in != null) {
                return in.readAllBytes();
            }
        }
        return "<!DOCTYPE html><html><body><h1>CampusQuest</h1></body></html>".getBytes(StandardCharsets.UTF_8);
    }

    @GetMapping(value = {"/{file:[^\\.]+\\.[^\\.]+}", "/runtime/{runtimeId}/preview/{file:[^\\.]+\\.[^\\.]+}"})
    @ResponseBody
    public ResponseEntity<byte[]> getPreviewResource(@PathVariable(required = false) String file) throws IOException {
        if (file == null || file.isBlank()) {
            file = "index.html";
        }
        byte[] bytes = null;
        Path localPath = Path.of("src/main/resources/static/" + file);
        if (Files.exists(localPath)) {
            bytes = Files.readAllBytes(localPath);
        }
        if (bytes == null) {
            try (InputStream in = getClass().getResourceAsStream("/static/" + file)) {
                if (in != null) {
                    bytes = in.readAllBytes();
                }
            }
        }
        if (bytes == null) {
            return ResponseEntity.notFound().build();
        }
        String contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        if (file.endsWith(".css")) contentType = "text/css";
        else if (file.endsWith(".js")) contentType = "application/javascript";
        else if (file.endsWith(".html")) contentType = "text/html";
        return ResponseEntity.ok()
                .header("Content-Type", contentType)
                .body(bytes);
    }
}
