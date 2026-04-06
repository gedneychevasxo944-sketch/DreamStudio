package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 工作流执行节点结果
 */
@Entity
@Table(name = "workflow_execution_node")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowExecutionNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "execution_id", nullable = false)
    private Long executionId;

    @Column(name = "node_id", nullable = false)
    private String nodeId;

    @Column(name = "agent_id")
    private Long agentId;

    @Column(name = "agent_code", length = 64)
    private String agentCode;

    @Column(name = "status", length = 32)
    @Builder.Default
    private String status = "RUNNING";

    @Column(name = "thinking", columnDefinition = "TEXT")
    private String thinking;

    @Column(name = "result_type", length = 32)
    private String resultType;

    @Column(name = "result_content", columnDefinition = "TEXT")
    private String resultContent;

    @Column(name = "extra_data", columnDefinition = "TEXT")
    private String extraData;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "finish_time")
    private LocalDateTime finishTime;
}
