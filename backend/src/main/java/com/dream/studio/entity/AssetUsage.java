package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 资产使用记录
 * 记录资产被哪些节点引用，用于影响分析
 */
@Entity
@Table(name = "asset_usage", indexes = {
    @Index(name = "idx_asset_usage_asset", columnList = "asset_id"),
    @Index(name = "idx_asset_usage_project", columnList = "project_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "asset_id", nullable = false, length = 64)
    private String assetId;

    @Column(name = "used_by_node_id", length = 64)
    private String usedByNodeId;

    @Column(name = "used_by_stage", length = 32)
    private String usedByStage;

    @Column(name = "context", columnDefinition = "TEXT")
    private String context;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;
}
