package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 节点提案相关 DTO
 */
public class NodeProposalDTO {

    /**
     * 提案列表项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProposalItem {
        private Long id;
        private Long projectId;
        private String nodeId;
        private Long agentId;
        private String proposalType;
        private String title;
        private String summary;
        private String changeInstruction;
        private String applyStrategy;
        private String status;
        private String createdAt;
    }

    /**
     * 提案详情
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProposalDetail {
        private Long id;
        private Long projectId;
        private String nodeId;
        private Long agentId;
        private String proposalType;
        private String title;
        private String summary;
        private String changeInstruction;
        private String beforeSnapshotJson;
        private String afterSnapshotJson;
        private ProposalDiff diffJson;
        private List<String> impactNodes;
        private String applyStrategy;
        private String status;
        private String createdAt;
        private String appliedAt;
    }

    /**
     * 提案列表响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProposalListResponse {
        private List<ProposalItem> proposals;
        private Integer total;
    }

    /**
     * 提案状态更新请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProposalStatusRequest {
        private String status;  // APPLIED | REJECTED
    }
}
