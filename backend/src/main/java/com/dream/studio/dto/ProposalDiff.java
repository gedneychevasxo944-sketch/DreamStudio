package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 提案差异结构
 * 用于前端渲染 diff
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalDiff {

    private String diffType;        // TEXT_DIFF | CONFIG_DIFF | STRUCTURE_DIFF | PARAM_DIFF
    private String title;           // 差异标题
    private String summary;          // 摘要

    // 具体差异内容（根据 diffType 不同，使用不同字段）
    private TextDiff textDiff;
    private ConfigDiff configDiff;
    private StructureDiff structureDiff;
    private ParamDiff paramDiff;

    /**
     * 文本差异
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TextDiff {
        private String beforeText;
        private String afterText;
        private List<DiffSegment> segments;
    }

    /**
     * diff 片段
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DiffSegment {
        private String type;           // EQUAL | ADD | REMOVE
        private String content;
        private Integer beforePosition;
        private Integer afterPosition;
    }

    /**
     * 配置差异
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfigDiff {
        private List<ConfigChange> changes;
    }

    /**
     * 配置变更项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConfigChange {
        private String key;
        private Object beforeValue;
        private Object afterValue;
        private String changeType;     // MODIFY | ADD | REMOVE
    }

    /**
     * 结构差异
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StructureDiff {
        private List<NodeChange> nodeChanges;
        private List<EdgeChange> edgeChanges;
    }

    /**
     * 节点变更
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeChange {
        private String action;         // ADD | REMOVE | MODIFY
        private String nodeId;
        private Object before;
        private Object after;
    }

    /**
     * 边变更
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EdgeChange {
        private String action;         // ADD | REMOVE
        private String edgeId;
        private String fromNodeId;
        private String toNodeId;
    }

    /**
     * 参数差异
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParamDiff {
        private List<ParamChange> changes;
    }

    /**
     * 参数变更项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParamChange {
        private String paramName;
        private String beforePrompt;
        private String afterPrompt;
        private String changeReason;
    }
}
