package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 工作流执行记录
 */
@Entity
@Table(name = "workflow_execution", uniqueConstraints = {
    @UniqueConstraint(name = "uk_execution_id", columnNames = "execution_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowExecution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "execution_id", nullable = false)
    private String executionId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "status", length = 32)
    @Builder.Default
    private String status = "RUNNING";

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "finish_time")
    private LocalDateTime finishTime;

    @Column(name = "dag_config", columnDefinition = "TEXT")
    private String dagConfig;

    @Column(name = "trigger_source", length = 32)
    private String triggerSource;

    @Column(name = "run_strategy", length = 32)
    private String runStrategy;

    @Column(name = "start_node_id", length = 64)
    private String startNodeId;

    @Column(name = "affected_node_ids_json", columnDefinition = "LONGTEXT")
    private String affectedNodeIdsJson;

    @Column(name = "reason_text", length = 500)
    private String reasonText;
}
