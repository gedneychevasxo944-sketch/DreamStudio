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
     * 字段名与前端对齐
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
        private String type;           // 前端期望: type (对应 assetType)
        private String assetRole;
        private String name;          // 前端期望: name (对应 title)
        private String uri;
        private String thumbnail;     // 前端期望: thumbnail (对应 coverUri)
        private String mimeType;
        private Long fileSize;
        private String metadataJson;
        private Boolean isCurrent;
        private String status;
        private String createTime;    // 前端期望: createTime (对应 createdAt)
        private String content;        // 前端期望: content (资产内容/描述)
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
