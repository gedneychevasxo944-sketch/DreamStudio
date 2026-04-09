package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 节点提案
 * 承接节点级修改提案
 */
@Entity
@Table(name = "node_proposal", indexes = {
    @Index(name = "idx_np_project_node", columnList = "project_id, node_id"),
    @Index(name = "idx_np_project_node_status", columnList = "project_id, node_id, status"),
    @Index(name = "idx_np_proposal_type", columnList = "project_id, proposal_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NodeProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "node_id", nullable = false, length = 64)
    private String nodeId;

    @Column(name = "agent_id")
    private Long agentId;

    @Column(name = "proposal_type", length = 32)
    private String proposalType;

    @Column(name = "title", length = 256)
    private String title;

    @Column(name = "summary", columnDefinition = "LONGTEXT")
    private String summary;

    @Column(name = "change_instruction", columnDefinition = "LONGTEXT")
    private String changeInstruction;

    @Column(name = "before_snapshot_json", columnDefinition = "LONGTEXT")
    private String beforeSnapshotJson;

    @Column(name = "after_snapshot_json", columnDefinition = "LONGTEXT")
    private String afterSnapshotJson;

    @Column(name = "diff_json", columnDefinition = "LONGTEXT")
    private String diffJson;

    @Column(name = "impact_nodes_json", columnDefinition = "LONGTEXT")
    private String impactNodesJson;

    @Column(name = "apply_strategy", length = 32)
    private String applyStrategy;

    @Column(name = "status", length = 32)
    @Builder.Default
    private String status = "PENDING";

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;

    @Column(name = "applied_time")
    private LocalDateTime appliedTime;
}
