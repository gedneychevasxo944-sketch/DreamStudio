package com.dream.studio.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 消息
 * 对话会话中的单条消息（包含用户问题+AI回复）
 */
@Entity
@Table(name = "message", indexes = {
    @Index(name = "idx_message_session", columnList = "session_id"),
    @Index(name = "idx_message_created", columnList = "created_time")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Column(name = "message_id", nullable = false, length = 64)
    private String messageId;

    @Column(name = "user_content", columnDefinition = "LONGTEXT")
    private String userContent;

    @Column(name = "user_attachments", columnDefinition = "LONGTEXT")
    private String userAttachments;  // JSON，用户引用/上传的资产或数据

    @Column(name = "thinking", columnDefinition = "LONGTEXT")
    private String thinking;         // AI 思考过程

    @Column(name = "assistant_content", columnDefinition = "LONGTEXT")
    private String assistantContent; // AI 回复内容

    @Column(name = "assistant_assets", columnDefinition = "LONGTEXT")
    private String assistantAssets;  // JSON，AI 回复的资产/数据

    @Column(name = "metadata", columnDefinition = "LONGTEXT")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_time", updatable = false)
    private LocalDateTime createdTime;
}