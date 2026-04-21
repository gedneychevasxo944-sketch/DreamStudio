package com.dream.studio.controller;

import com.dream.studio.entity.ChatSession;
import com.dream.studio.entity.Message;
import com.dream.studio.repository.ChatSessionRepository;
import com.dream.studio.repository.MessageRepository;
import com.dream.studio.service.AdeptifyService;
import com.dream.studio.service.MessageAccumulator;
import com.dream.studio.service.SSEEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Adeptify AI 服务接口
 * 提供对话补全和工作流执行的 SSE 流式接口
 */
@Slf4j
@RestController
@RequestMapping("/adeptify/v1")
@RequiredArgsConstructor
@Tag(name = "Adeptify AI", description = "Adeptify AI 服务接口")
@CrossOrigin(origins = "*")
public class AdeptifyController {

    private final AdeptifyService adeptifyService;
    private final ObjectMapper objectMapper;
    private final MessageRepository messageRepository;
    private final ChatSessionRepository chatSessionRepository;

    // SSE 超时时间设为 5 分钟
    private static final long SSE_TIMEOUT = 5 * 60 * 1000L;

    // 线程池用于异步发送 SSE 事件
    private final ExecutorService sseExecutor = Executors.newCachedThreadPool();

    // 消息累加器 Map (sessionId -> accumulator)
    private final Map<String, MessageAccumulator> accumulators = new ConcurrentHashMap<>();

    /**
     * 对话补全
     * POST /adeptify/v1/chat/completions
     */
    @PostMapping(value = "/chat/completions", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "对话补全", description = "发送消息并接收 SSE 流式响应")
    public SseEmitter chatCompletions(@RequestBody ChatCompletionsRequest request) {
        log.info("Chat completions request - sessionId: {}, contextType: {}, contextId: {}, content length: {}",
            request.getSessionId(),
            request.getContextType(),
            request.getContextId(),
            request.getMessage() != null ? request.getMessage().getContent().length() : 0);

        // 生成或复用 sessionId
        String sessionId = resolveSessionId(request);
        String content = request.getMessage() != null ? request.getMessage().getContent() : "";
        @SuppressWarnings("unchecked")
        Map<String, Object> metadata = request.getMessage() != null && request.getMessage().getMetadata() != null
            ? request.getMessage().getMetadata() : Map.of();

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        AtomicBoolean cancelled = new AtomicBoolean(false);

        // 确保 session 存在
        ensureChatSession(sessionId, request.getProjectId(), request.getAccount(), request.getContextType(), request.getContextId());

        sseExecutor.execute(() -> {
            MessageAccumulator accumulator = new MessageAccumulator(sessionId, null);
            accumulators.put(sessionId, accumulator);

            try {
                // 设置 userContent
                accumulator.setUserContent(content);

                // 调用 Service，使用 Consumer 处理每个事件
                adeptifyService.chatCompletionsStream(sessionId, content, metadata, event -> {
                    if (cancelled.get()) {
                        return;
                    }

                    // 1. 处理 delay
                    if (event.getDelayMs() > 0) {
                        try {
                            Thread.sleep(event.getDelayMs());
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            return;
                        }
                    }

                    // 2. 发送 SSE 给前端
                    try {
                        String sseData = formatSSEData(event);
                        emitter.send(SseEmitter.event()
                            .name(event.getEventType())
                            .data(sseData));
                    } catch (IOException e) {
                        log.warn("SSE send failed, client disconnected");
                        cancelled.set(true);
                        return;
                    }

                    // 3. 累加数据
                    accumulate(event, accumulator);

                    // 4. message_end 时写库
                    if ("message_end".equals(event.getEventType())) {
                        saveMessage(accumulator);
                        accumulators.remove(sessionId);
                    }
                });

                emitter.complete();
            } catch (Exception e) {
                log.error("SSE execution failed: {}", e.getMessage(), e);
                emitter.completeWithError(e);
            } finally {
                accumulators.remove(sessionId);
            }
        });

        // 处理客户端断开
        emitter.onCompletion(() -> {
            log.info("SSE completed for sessionId: {}", sessionId);
            accumulators.remove(sessionId);
        });
        emitter.onTimeout(() -> {
            log.info("SSE timeout for sessionId: {}", sessionId);
            accumulators.remove(sessionId);
        });
        emitter.onError(e -> {
            log.warn("SSE error for sessionId: {}: {}", sessionId, e.getMessage());
            accumulators.remove(sessionId);
        });

        return emitter;
    }

    /**
     * 工作流执行
     * POST /adeptify/v1/workflows/run
     */
    @PostMapping(value = "/workflows/run", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "工作流执行", description = "执行工作流并接收 SSE 流式响应")
    public SseEmitter workflowRun(@RequestBody WorkflowRunRequest request) {
        log.info("Workflow run request - edges: {}, nodes: {}",
            request.getEdges() != null ? request.getEdges().size() : 0,
            request.getNodes() != null ? request.getNodes().size() : 0);

        List<Map<String, Object>> edges = request.getEdges() != null ?
            request.getEdges().stream().map(e -> Map.<String, Object>of(
                "from", e.getFrom() != null ? e.getFrom() : "",
                "to", e.getTo() != null ? e.getTo() : ""
            )).toList() : List.of();

        List<Map<String, Object>> nodes = request.getNodes() != null ?
            request.getNodes().stream().map(n -> {
                Map<String, Object> nodeMap = new java.util.HashMap<>();
                nodeMap.put("nodeId", n.getNodeId() != null ? n.getNodeId() : "");
                nodeMap.put("characterId", n.getCharacterId() != null ? n.getCharacterId() : "");
                nodeMap.put("input", n.getInput() != null ? n.getInput() : Map.of());
                return nodeMap;
            }).toList() : List.of();

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        AtomicBoolean cancelled = new AtomicBoolean(false);

        sseExecutor.execute(() -> {
            try {
                adeptifyService.workflowExecutionStream(edges, nodes, event -> {
                    if (cancelled.get()) {
                        return;
                    }

                    // 1. 处理 delay
                    if (event.getDelayMs() > 0) {
                        try {
                            Thread.sleep(event.getDelayMs());
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            return;
                        }
                    }

                    // 2. 发送 SSE 给前端
                    try {
                        String sseData = formatSSEData(event);
                        emitter.send(SseEmitter.event()
                            .name(event.getEventType())
                            .data(sseData));
                    } catch (IOException e) {
                        log.warn("SSE send failed, client disconnected");
                        cancelled.set(true);
                    }
                });

                emitter.complete();
            } catch (Exception e) {
                log.error("SSE execution failed: {}", e.getMessage(), e);
                emitter.completeWithError(e);
            }
        });

        emitter.onCompletion(() -> log.info("Workflow SSE completed"));
        emitter.onTimeout(() -> log.info("Workflow SSE timeout"));
        emitter.onError(e -> log.warn("Workflow SSE error: {}", e.getMessage()));

        return emitter;
    }

    /**
     * 累加事件数据到 accumulator
     */
    private void accumulate(SSEEvent event, MessageAccumulator accumulator) {
        Map<String, Object> data = event.getData();
        String eventType = event.getEventType();

        if ("thinking".equals(eventType)) {
            Object delta = data.get("delta");
            if (delta != null) {
                accumulator.addThinking(delta.toString());
            }
        } else if ("content".equals(eventType)) {
            Object type = data.get("type");
            Object delta = data.get("delta");

            if ("text".equals(type)) {
                if (delta != null) {
                    accumulator.addAssistantContent(delta.toString());
                }
            } else if ("batch_action".equals(type) && delta instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> actionData = (Map<String, Object>) delta;
                Object items = actionData.get("items");
                if (items instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> itemList = (List<Map<String, Object>>) items;
                    for (Map<String, Object> item : itemList) {
                        accumulator.addAsset(item);
                    }
                }
            }
        }
    }

    /**
     * 消息结束，写库
     */
    @Transactional
    private void saveMessage(MessageAccumulator accumulator) {
        try {
            // 保存 Message
            Message message = Message.builder()
                .sessionId(accumulator.getSessionId())
                .messageId(accumulator.getMessageId())
                .userContent(accumulator.getUserContent())
                .thinking(accumulator.getThinkingStr())
                .assistantContent(accumulator.getAssistantContentStr())
                .assistantAssets(accumulator.getAssistantAssetsJson(objectMapper))
                .build();

            messageRepository.save(message);

            // 更新 ChatSession 的 messageCount
            chatSessionRepository.findById(accumulator.getSessionId()).ifPresent(session -> {
                session.setMessageCount(session.getMessageCount() + 1);
                chatSessionRepository.save(session);
            });

            log.info("Message saved for sessionId: {}", accumulator.getSessionId());
        } catch (Exception e) {
            log.error("Failed to save message: {}", e.getMessage(), e);
        }
    }

    /**
     * 根据请求信息解析 sessionId
     * - 如果传了 sessionId，直接复用
     * - 否则根据 projectId + contextType + contextId 生成
     */
    private String resolveSessionId(ChatCompletionsRequest request) {
        // 如果传了 sessionId，优先使用
        if (request.getSessionId() != null && !request.getSessionId().isEmpty()) {
            return request.getSessionId();
        }

        // 否则根据 context 生成 sessionId
        String contextType = request.getContextType() != null ? request.getContextType() : "global";
        String contextId = request.getContextId() != null ? request.getContextId() : "default";
        Long projectId = request.getProjectId();

        // sessionId = hash(projectId + contextType + contextId)
        String raw = projectId + ":" + contextType + ":" + contextId;
        return "sess_" + Integer.toHexString(raw.hashCode());
    }

    /**
     * 确保 ChatSession 存在
     */
    private void ensureChatSession(String sessionId, Long projectId, String account, String contextType, String contextId) {
        if (!chatSessionRepository.existsById(sessionId)) {
            ChatSession session = ChatSession.builder()
                .id(sessionId)
                .projectId(projectId != null ? projectId : 1L)
                .account(account != null ? account : "anonymous")
                .messageCount(0)
                .build();
            chatSessionRepository.save(session);
            log.info("Created new chat session: {}, contextType: {}, contextId: {}", sessionId, contextType, contextId);
        }
    }

    /**
     * 格式化 SSE 数据
     */
    private String formatSSEData(SSEEvent event) {
        try {
            return objectMapper.writeValueAsString(event.getData());
        } catch (Exception e) {
            log.warn("Failed to format SSE data: {}", e.getMessage());
            return "{}";
        }
    }

    // ========== Request DTOs ==========

    @lombok.Data
    public static class ChatCompletionsRequest {
        private String sessionId;       // 可选，传了则复用
        private Long projectId;
        private String account;
        private String contextType;      // node | global | asset
        private String contextId;        // 节点ID/资产ID等
        private Message message;

        @lombok.Data
        public static class Message {
            private String content;
            private Map<String, Object> metadata;
        }
    }

    @lombok.Data
    public static class WorkflowRunRequest {
        private List<Edge> edges;
        private List<Node> nodes;

        @lombok.Data
        public static class Edge {
            private String from;
            private String to;
        }

        @lombok.Data
        public static class Node {
            private String nodeId;
            private String characterId;
            private Map<String, Object> input;
        }
    }
}