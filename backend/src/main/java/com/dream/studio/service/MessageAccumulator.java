package com.dream.studio.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 消息累加器
 * 在 SSE 过程中累加数据，message_end 时写库
 */
@Getter
public class MessageAccumulator {
    private final String sessionId;
    private final String messageId;
    private final long startTime;

    private String userContent;
    private String userAttachments;   // JSON
    private StringBuilder thinking = new StringBuilder();
    private StringBuilder assistantContent = new StringBuilder();
    private String assistantAssets;  // JSON (list)
    private String metadata;

    private final List<Map<String, Object>> assetList = new ArrayList<>();

    public MessageAccumulator(String sessionId, String messageId) {
        this.sessionId = sessionId;
        this.messageId = messageId;
        this.startTime = System.currentTimeMillis();
    }

    public void setUserContent(String content) {
        this.userContent = content;
    }

    public void addThinking(String delta) {
        if (delta != null) {
            this.thinking.append(delta);
        }
    }

    public void addAssistantContent(String delta) {
        if (delta != null) {
            this.assistantContent.append(delta);
        }
    }

    public void addAsset(Map<String, Object> asset) {
        this.assetList.add(asset);
    }

    public String getThinkingStr() {
        return thinking.toString();
    }

    public String getAssistantContentStr() {
        return assistantContent.toString();
    }

    public String getAssistantAssetsJson(ObjectMapper objectMapper) {
        if (assetList.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(assetList);
        } catch (Exception e) {
            return null;
        }
    }
}