package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DAGDTO {
    private List<DAGNode> nodes;
    private List<DAGEdge> edges;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DAGNode {
        private String nodeId;           // 节点ID
        private Long agentId;            // 智能体ID
        private String agentCode;        // 智能体代码
        private Object inputParam;       // 输入参数
        private String id;               // 保留兼容
        private String type;
        private Object config;
        private String name;             // 节点名称（用于模板展示）
        private String icon;             // 节点图标（用于模板展示）
        private String color;            // 节点颜色（用于模板展示）
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DAGEdge {
        private String fromNodeId;      // 新增：源节点ID（原 from）
        private String toNodeId;         // 新增：目标节点ID（原 to）
        private String from;            // 保留兼容
        private String to;              // 保留兼容
    }
}
