package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class ProjectDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String title;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveRequest {
        private String title;
        private String config;
        private String lastResult;
        private String description;
        private String tags;
        private String coverImage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private String status;
        private String account;
        private String coverImage;
        private String tags;
        private String config;
        private String lastResult;
        private Integer currentVersion;
        private String createdTime;
        private String updatedTime;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListResponse {
        private List<Response> projects;
        private Long total;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VersionResponse {
        private Long id;
        private Integer versionNumber;
        private String title;
        private String description;
        private String status;
        private String coverImage;
        private String tags;
        private String config;
        private String lastResult;
        private String createdTime;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VersionListResponse {
        private List<VersionResponse> versions;
        private Long total;
    }
}
