package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 对话会话 DTO
 */
public class ChatSessionDTO {

    /**
     * 会话项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionItem {
        private String id;
        private Long projectId;
        private String account;
        private Integer messageCount;
        private String lastMessageTime;
        private String createdTime;
    }

    /**
     * 会话详情
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionDetail {
        private String id;
        private Long projectId;
        private String account;
        private Integer messageCount;
        private String lastMessageTime;
        private String createdTime;
        private String updatedTime;
    }

    /**
     * 创建会话请求
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private Long projectId;
    }

    /**
     * 会话响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionResponse {
        private SessionItem session;
    }

    /**
     * 会话列表响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionListResponse {
        private List<SessionItem> sessions;
        private Integer total;
    }

    /**
     * 消息项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageItem {
        private String messageId;
        private String sessionId;
        private String role;         // user | assistant
        private String content;
        private String thinking;
        private String attachments;   // JSON，用户引用/上传的资产
        private String assets;       // JSON，AI 回复的资产
        private String metadata;      // JSON，元数据
        private String createdTime;
    }

    /**
     * 消息列表响应
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageListResponse {
        private List<MessageItem> messages;
        private Integer total;
        private Boolean hasMore;
    }
}
