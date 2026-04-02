package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionState {
    private Long executionId;
    private String status;
    private List<CompletedNode> completedNodes;
    private Map<String, Object> dag;
    private List<String> pendingNodeIds;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompletedNode {
        private String nodeId;
        private String nodeType;
        private String status;
        private List<String> thinking;
        private String result;
        private Map<String, Object> data;
    }
}
