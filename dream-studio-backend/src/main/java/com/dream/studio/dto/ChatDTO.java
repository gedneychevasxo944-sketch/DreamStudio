package com.dream.studio.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

public class ChatDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendRequest {
        private Long projectId;
        private Integer projectVersion;
        private String agentId;
        private String agentName;
        private String message;
        private String chatType;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageResponse {
        private Long id;
        private Long projectId;
        private Integer projectVersion;
        private String agentId;
        private String agentName;
        private String question;
        private List<String> thinkingSteps;
        private String resultType;
        private String result;
        private String createTime;
        private Boolean workflowCreated;
        private List<WorkflowNode> workflowNodes;
        private List<WorkflowEdge> workflowEdges;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkflowNode {
        private String id;
        private String type;
        private String label;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkflowEdge {
        private String id;
        private String source;
        private String target;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HistoryResponse {
        private List<MessageResponse> messages;
        private Integer total;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SSEEvent {
        private String type;
        private String content;
        private Long timestamp;
    }
}
