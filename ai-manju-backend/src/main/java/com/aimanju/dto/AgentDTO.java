package com.aimanju.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class AgentDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private String type;
        private String name;
        private String category;
        private String icon;
        private String color;
        private List<Map<String, Object>> inputs;
        private List<Map<String, Object>> outputs;
        private String description;
        private String createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListResponse {
        private List<Response> agents;
        private Integer total;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatRequest {
        private Long projectId;
        private Integer projectVersion;
        private String agentId;
        private String question;
        private String chatType;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatResponse {
        private Long id;
        private String agentId;
        private String agentName;
        private String question;
        private String result;
        private String createTime;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatListRequest {
        private Long projectId;
        private Integer projectVersion;
        private String agentId;
    }
}
