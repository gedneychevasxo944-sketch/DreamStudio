package com.dream.studio.dto;

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
        private Long agentId;          // 新增：智能体唯一标识
        private String agentCode;      // 新增：智能体代码标识
        private String agentName;       // 新增：智能体名称
        private List<String> agentTags; // 新增：标签列表
        private String describe;        // 新增：描述

        // 兼容字段（前端可能还在用）
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
        private List<Response> list;
        private Integer pageNo;
        private Integer pageSize;
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String agentName;
        private List<String> agentTags;
        private ModelConfig modelConfig;
        private List<Skill> skills;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ModelConfig {
        private String selectedModelCode;
        private Double temperature;
        private Integer maxTokens;
        private String apiKeyCipherText;
        private String encryptType;
        private String encryptKeyVersion;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Skill {
        private Long skillId;
        private String skillVersion;
        private String skillName;
        private String skillDescribe;
    }
}
