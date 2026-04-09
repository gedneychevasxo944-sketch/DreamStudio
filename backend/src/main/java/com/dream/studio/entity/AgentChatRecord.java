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
@Table(name = "agent_chat_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentChatRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "project_version")
    private Integer projectVersion;

    @Column(name = "agent_id")
    private String agentId;

    @Column(name = "agent_name")
    private String agentName;

    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "chat_type", length = 20)
    private String chatType;

    @Column(name = "question", columnDefinition = "TEXT")
    private String question;

    @Column(name = "result", columnDefinition = "TEXT")
    private String result;

    @Column(name = "scope_type", length = 32)
    private String scopeType;

    @Column(name = "phase_type", length = 32)
    private String phaseType;

    @Column(name = "node_id", length = 64)
    private String nodeId;

    @Column(name = "message_role", length = 16)
    private String messageRole;

    @Column(name = "message_type", length = 32)
    private String messageType;

    @Column(name = "agent_code", length = 64)
    private String agentCode;

    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "content_json", columnDefinition = "LONGTEXT")
    private String contentJson;

    @Column(name = "related_proposal_id")
    private Long relatedProposalId;

    @Column(name = "related_execution_id", length = 64)
    private String relatedExecutionId;

    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    @Column(name = "update_time")
    private LocalDateTime updateTime;
}
