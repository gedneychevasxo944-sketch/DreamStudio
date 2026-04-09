package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 资产相关 DTO
 */
public class AssetDTO {

    /**
     * 资产项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetItem {
        private Long id;
        private Long projectId;
        private String nodeId;
        private Long nodeVersionId;
        private Long agentId;
        private String assetType;
        private String assetRole;
        private String title;
        private String uri;
        private String coverUri;
        private String mimeType;
        private Long fileSize;
        private String metadataJson;
        private Boolean isCurrent;
        private String status;
        private String createdAt;
    }

    /**
     * 资产列表响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetListResponse {
        private List<AssetItem> assets;
        private Integer total;
    }

    /**
     * 激活资产请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivateRequest {
        private Long assetId;
    }

    /**
     * 激活资产响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivateResponse {
        private Long activatedAssetId;
        private String nodeId;
        private List<String> affectedNodeIds;
        private String message;
    }
}
