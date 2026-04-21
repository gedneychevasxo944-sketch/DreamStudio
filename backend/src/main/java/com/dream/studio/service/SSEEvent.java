package com.dream.studio.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * SSE 事件
 */
@Data
@AllArgsConstructor
@Builder
public class SSEEvent {
    private String eventType;
    private Map<String, Object> data;
    private int delayMs;  // 延迟毫秒数，Controller 处理
}