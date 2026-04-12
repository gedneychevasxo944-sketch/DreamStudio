package com.dream.studio.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;
import java.util.Map;

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
        private String nodeId;
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
        // 关联的提案信息
        private Map<String, Object> proposal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkflowNode {
        private String nodeId;         // 新增：节点ID（原 id）
        private Long agentId;           // 新增：智能体ID
        private String agentCode;      // 新增：智能体代码
        private Object inputParam;      // 新增：输入参数（原 config）
        private String id;              // 保留兼容
        private String type;
        private String label;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkflowEdge {
        private String id;
        private String fromNodeId;      // 新增：源节点ID（原 from）
        private String toNodeId;        // 新增：目标节点ID（原 to）
        private String from;            // 保留兼容
        private String to;              // 保留兼容
        private String source;          // 保留兼容
        private String target;          // 保留兼容
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

    /**
     * 上游上下文，用于构建版本关系
     * 当仅运行单个节点时，主 dag 只包含该节点，但 upstreamContext 包含完整 DAG
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpstreamContext {
        private List<com.dream.studio.dto.DAGDTO.DAGNode> nodes;
        private List<ChatDTO.WorkflowEdge> edges;
    }
}
