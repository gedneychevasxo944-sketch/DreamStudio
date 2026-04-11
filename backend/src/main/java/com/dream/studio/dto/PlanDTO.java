package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 规划方案 DTO
 */
public class PlanDTO {

    /**
     * 方案节点信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanNode {
        private String id;
        private String name;
        private String icon;
        private String color;
    }

    /**
     * 方案连接信息
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanEdge {
        private String from;
        private String to;
    }

    /**
     * 方案项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanItem {
        private Long id;
        private String name;
        private String description;
        private String mode;  // director | factory
        private String estimatedTime;
        private List<PlanNode> nodes;
        private List<PlanEdge> edges;
    }

    /**
     * 方案列表响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanListResponse {
        private List<PlanItem> plans;
        private Integer total;
    }
}
