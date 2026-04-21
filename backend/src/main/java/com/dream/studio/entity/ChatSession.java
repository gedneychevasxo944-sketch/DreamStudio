package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 对话会话
 */
@Entity
@Table(name = "chat_session", indexes = {
    @Index(name = "idx_chat_session_project", columnList = "project_id"),
    @Index(name = "idx_chat_session_updated", columnList = "updated_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSession {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "account", length = 64)
    private String account;

    @Column(name = "message_count")
    @Builder.Default
    private Integer messageCount = 0;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;

    @UpdateTimestamp
    @Column(name = "updated_time")
    private LocalDateTime updatedTime;

    @Column(name = "last_message_time")
    private LocalDateTime lastMessageTime;
}
