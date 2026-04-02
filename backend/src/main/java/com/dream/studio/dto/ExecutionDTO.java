package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class ExecutionDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkflowResponse {
        private Long executionId;
        private Long projectId;
        private Integer projectVersion;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SSEEvent {
        private String type;
        private String nodeId;
        private String content;
        private Integer progress;
        private Long timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NodeLog {
        private String agentId;
        private String agentName;
        private String status;
        private String thinking;
        private String result;
        private String startTime;
        private String endTime;
    }
}
