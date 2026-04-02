package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_exec_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowExecRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "project_version")
    private Integer projectVersion;

    @Column(name = "execution_id")
    private String executionId;

    @Column(name = "agents_log", columnDefinition = "LONGTEXT")
    private String agentsLog;

    @Column(name = "status", length = 20)
    private String status;

    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    @Column(name = "update_time")
    private LocalDateTime updateTime;
}
