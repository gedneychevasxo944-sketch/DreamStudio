package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 资产
 * 只负责文件型资产（图片、视频等有 URI 的）
 * 文本结果直接存在 NodeVersion.resultText 中
 */
@Entity
@Table(name = "asset", indexes = {
    @Index(name = "idx_asset_project_node", columnList = "project_id, node_id"),
    @Index(name = "idx_asset_project_node_current", columnList = "project_id, node_id, is_current"),
    @Index(name = "idx_asset_node_version", columnList = "node_version_id"),
    @Index(name = "idx_asset_project_created", columnList = "project_id, created_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "node_id", length = 64)
    private String nodeId;

    @Column(name = "node_version_id")
    private Long nodeVersionId;

    @Column(name = "agent_id")
    private Long agentId;

    @Column(name = "asset_type", length = 32)
    private String assetType;

    @Column(name = "asset_role", length = 32)
    private String assetRole;

    @Column(name = "title", length = 256)
    private String title;

    @Column(name = "uri", length = 1024)
    private String uri;

    @Column(name = "cover_uri", length = 1024)
    private String coverUri;

    @Column(name = "mime_type", length = 128)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "metadata_json", columnDefinition = "LONGTEXT")
    private String metadataJson;

    @Column(name = "is_current")
    @Builder.Default
    private Boolean isCurrent = false;

    @Column(name = "status", length = 32)
    @Builder.Default
    private String status = "READY";

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;
}
