package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_version")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

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

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;
}
