package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 节点版本相关 DTO
 */
public class NodeVersionDTO {

    /**
     * 版本列表项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VersionItem {
        private Long id;
        private Long projectId;
        private String nodeId;
        private Long agentId;
        private String agentCode;
        private String nodeType;
        private Integer versionNo;
        private String versionKind;
        private Boolean isCurrent;
        private String status;
        private String revisionReason;
        private String diffSummary;
        private String createdAt;
    }

    /**
     * 版本详情
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VersionDetail {
        private Long id;
        private Long projectId;
        private String nodeId;
        private Long agentId;
        private String agentCode;
        private String nodeType;
        private Integer versionNo;
        private String versionKind;
        private Long sourceVersionId;
        private Long sourceExecutionId;
        private Long sourceProposalId;
        private Boolean isCurrent;
        private String status;
        private String inputSnapshotJson;
        private String paramSnapshotJson;
        private String resultText;
        private String resultJson;
        private String thinkingText;
        private String revisionReason;
        private String diffSummary;
        private String createdAt;
    }

    /**
     * 版本列表响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VersionListResponse {
        private List<VersionItem> versions;
        private Integer total;
    }

    /**
     * 激活版本请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivateRequest {
        private Long versionId;
    }

    /**
     * 激活版本响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivateResponse {
        private Long activatedVersionId;
        private List<String> affectedNodeIds;
        private String message;
    }
}
