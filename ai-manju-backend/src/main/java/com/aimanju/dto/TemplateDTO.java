package com.aimanju.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class TemplateDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long projectId;
        private String name;
        private String description;
        private String coverImage;
        private String tags;
        private Integer useCount;
        private String createdTime;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListResponse {
        private List<Response> templates;
        private Long total;
    }
}
