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
        private String content;        // 前端期望: content (资产内容)
        private String description;     // 前端期望: description (从 metadataJson 提取)
        private String prompt;          // 前端期望: prompt (从 metadataJson 提取)
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

    /**
     * 创建资产请求 (测试计划格式)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetCreateRequest {
        private String name;        // 资产名称
        private String type;        // 资产类型: character, scene, prop, storyboard, video
        private String description; // 资产描述
        private String prompt;      // 生成 prompt
        private String thumbnail;  // 缩略图 URL
        private String uri;        // 资源 URL
        private String content;     // 资产内容（剧本内容等）
    }

    /**
     * 更新资产请求 (测试计划格式)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetUpdateRequest {
        private String name;        // 资产名称
        private String description; // 资产描述
        private String prompt;      // 生成 prompt
        private String thumbnail;   // 缩略图 URL
        private String uri;         // 资源 URL
        private String status;      // 状态
        private String content;     // 资产内容（剧本内容等）
    }

    /**
     * 资产响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetResponse {
        private Long id;
        private String name;
        private String type;
        private String description;
        private String prompt;
        private String thumbnail;
        private String status;
        private String createTime;
    }
}
