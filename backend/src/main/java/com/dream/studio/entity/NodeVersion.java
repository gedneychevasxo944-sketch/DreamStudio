package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 节点版本
 * 表达节点某一时刻的生效结果版本
 */
@Entity
@Table(name = "node_version", indexes = {
    @Index(name = "idx_nv_project_node", columnList = "project_id, node_id"),
    @Index(name = "idx_nv_project_node_current", columnList = "project_id, node_id, is_current"),
    @Index(name = "idx_nv_source_execution", columnList = "source_execution_id"),
    @Index(name = "idx_nv_source_proposal", columnList = "source_proposal_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NodeVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "node_id", nullable = false, length = 64)
    private String nodeId;

    @Column(name = "agent_id")
    private Long agentId;

    @Column(name = "agent_code", length = 64)
    private String agentCode;

    @Column(name = "node_type", length = 64)
    private String nodeType;

    @Column(name = "version_no")
    private Integer versionNo;

    @Column(name = "version_kind", length = 32)
    private String versionKind;

    @Column(name = "source_version_id")
    private Long sourceVersionId;

    @Column(name = "source_execution_id", length = 64)
    private Long sourceExecutionId;

    @Column(name = "source_proposal_id")
    private Long sourceProposalId;

    @Column(name = "is_current")
    @Builder.Default
    private Boolean isCurrent = false;

    @Column(name = "status", length = 32)
    @Builder.Default
    private String status = "READY";

    @Column(name = "input_snapshot_json", columnDefinition = "LONGTEXT")
    private String inputSnapshotJson;

    @Column(name = "param_snapshot_json", columnDefinition = "LONGTEXT")
    private String paramSnapshotJson;

    @Column(name = "result_text", columnDefinition = "LONGTEXT")
    private String resultText;

    @Column(name = "result_json", columnDefinition = "LONGTEXT")
    private String resultJson;

    @Column(name = "thinking_text", columnDefinition = "LONGTEXT")
    private String thinkingText;

    @Column(name = "revision_reason", columnDefinition = "LONGTEXT")
    private String revisionReason;

    @Column(name = "diff_summary", columnDefinition = "LONGTEXT")
    private String diffSummary;

    /**
     * 上游节点及版本信息
     * 格式: [{"nodeId": "B", "versionId": 123}, {"nodeId": "A", "versionId": 456}]
     * 记录当前版本使用了哪些上游节点的哪些版本
     */
    @Column(name = "upstream_node_ids", columnDefinition = "TEXT")
    private String upstreamNodeIds;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;
}
