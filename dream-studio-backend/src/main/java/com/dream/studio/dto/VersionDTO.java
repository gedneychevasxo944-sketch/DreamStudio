package com.dream.studio.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class VersionDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Long versionNumber;
        private String description;
        private List<Map<String, Object>> nodes;
        private List<Map<String, Object>> connections;
        private Boolean isDefault;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long projectId;
        private Integer versionNumber;
        private String description;
        private Boolean isDefault;
        private String createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DetailResponse {
        private Long id;
        private Long projectId;
        private Integer versionNumber;
        private String description;
        private List<Map<String, Object>> nodes;
        private List<Map<String, Object>> connections;
        private Boolean isDefault;
        private String createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListResponse {
        private List<Response> versions;
        private Integer total;
    }
}
