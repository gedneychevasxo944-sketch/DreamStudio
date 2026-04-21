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
@Table(name = "project")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title")
    private String title;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "account", nullable = false)
    private String account;

    @Column(name = "cover_image")
    private String coverImage;

    @Column(name = "tags")
    private String tags;

    @Column(name = "config", columnDefinition = "LONGTEXT")
    private String config;

    @Column(name = "last_result", columnDefinition = "LONGTEXT")
    private String lastResult;

    @Column(name = "current_version")
    private Integer currentVersion;

    @Column(name = "mode", length = 32)
    private String mode;

    @Column(name = "entry_type", length = 32)
    private String entryType;

    @Column(name = "raw_input", columnDefinition = "LONGTEXT")
    private String rawInput;

    @Column(name = "brief_json", columnDefinition = "LONGTEXT")
    private String briefJson;

    @Column(name = "plan_summary", columnDefinition = "LONGTEXT")
    private String planSummary;

    @Column(name = "dag_config", columnDefinition = "LONGTEXT")
    private String dagConfig;

    @Column(name = "current_execution_id", length = 64)
    private String currentExecutionId;

    @Column(name = "last_active_node_id", length = 64)
    private String lastActiveNodeId;

    @Column(name = "global_settings_json", columnDefinition = "LONGTEXT")
    private String globalSettingsJson;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;

    @UpdateTimestamp
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;
}
