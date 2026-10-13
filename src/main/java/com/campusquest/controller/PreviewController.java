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

@Controller
public class PreviewController {

    @GetMapping(value = {"/runtime/{runtimeId}/preview", "/runtime/{runtimeId}/preview/"}, produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public byte[] getPreviewIndex() throws IOException {
        try (InputStream in = getClass().getResourceAsStream("/static/index.html")) {
            if (in == null) return "<!DOCTYPE html><html><body><h1>CampusQuest</h1></body></html>".getBytes(StandardCharsets.UTF_8);
            return in.readAllBytes();
        }
    }

    @GetMapping("/runtime/{runtimeId}/preview/{file:[^\\.]+\\.[^\\.]+}")
    @ResponseBody
    public ResponseEntity<byte[]> getPreviewResource(@PathVariable String file) throws IOException {
        try (InputStream in = getClass().getResourceAsStream("/static/" + file)) {
            if (in == null) return ResponseEntity.notFound().build();
            byte[] bytes = in.readAllBytes();
            String contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            if (file.endsWith(".css")) contentType = "text/css";
            else if (file.endsWith(".js")) contentType = "application/javascript";
            else if (file.endsWith(".html")) contentType = "text/html";
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .body(bytes);
        }
    }
}
