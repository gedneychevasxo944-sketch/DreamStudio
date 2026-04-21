package com.dream.studio.service;

import com.dream.studio.constant.ComponentType;
import com.dream.studio.dto.NodeSimulationData;
import com.dream.studio.sim.MockDataCenter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Consumer;

/**
 * Adeptify AI 服务
 * 使用 MockDataCenter 统一管理模拟数据
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdeptifyService {

    private final MockDataCenter mockDataCenter;

    // Character ID 映射
    private static final Map<String, ComponentType> CHARACTER_MAP = Map.of(
        "char_script_001", ComponentType.CONTENT,
        "char_director_001", ComponentType.DIRECTOR,
        "char_visual_001", ComponentType.VISUAL,
        "char_technical_001", ComponentType.TECHNICAL,
        "char_videogen_001", ComponentType.VIDEO_GEN
    );

    /**
     * 对话补全 - 使用 Consumer 实时处理 SSE 事件
     */
    public void chatCompletionsStream(String sessionId, String messageContent, Map<String, Object> metadata, Consumer<SSEEvent> consumer) {
        log.info("Chat completions stream started - sessionId: {}, content length: {}", sessionId, messageContent.length());

        String messageId = UUID.randomUUID().toString();

        // message_start
        consumer.accept(SSEEvent.builder()
            .eventType("message_start")
            .data(Map.of("messageId", messageId, "sessionId", sessionId))
            .delayMs(0)
            .build());

        // thinking 事件
        List<String> thinkingSteps = generateThinkingSteps(messageContent);
        for (String step : thinkingSteps) {
            consumer.accept(SSEEvent.builder()
                .eventType("thinking")
                .data(Map.of("messageId", messageId, "delta", step))
                .delayMs(mockDataCenter.getThinkingDelay())
                .build());
        }

        // content 事件
        String responseContent = generateResponseContent(messageContent);
        List<String> tokens = tokenizeContent(responseContent);
        for (String token : tokens) {
            consumer.accept(SSEEvent.builder()
                .eventType("content")
                .data(Map.of("messageId", messageId, "type", "text", "delta", token))
                .delayMs(mockDataCenter.getContentDelay())
                .build());
        }

        // batch_action 事件
        Map<String, Object> responseData = generateResponseData(messageContent);
        if (responseData != null && !responseData.isEmpty()) {
            consumer.accept(SSEEvent.builder()
                .eventType("content")
                .data(Map.of("messageId", messageId, "type", "batch_action", "delta", responseData))
                .delayMs(0)
                .build());
        }

        // metadata 事件
        consumer.accept(SSEEvent.builder()
            .eventType("metadata")
            .data(Map.of("messageId", messageId, "tokens", responseContent.length() / 4))
            .delayMs(0)
            .build());

        // message_end
        consumer.accept(SSEEvent.builder()
            .eventType("message_end")
            .data(Map.of("messageId", messageId, "finishReason", "stop"))
            .delayMs(0)
            .build());

        log.info("Chat completions stream completed - messageId: {}", messageId);
    }

    /**
     * 工作流执行 - 使用 Consumer 实时处理 SSE 事件
     */
    public void workflowExecutionStream(List<Map<String, Object>> edges, List<Map<String, Object>> nodes, Consumer<SSEEvent> consumer) {
        log.info("Workflow execution stream started - edges: {}, nodes: {}", edges.size(), nodes.size());

        String executionId = UUID.randomUUID().toString();
        List<Map<String, Object>> executionOrder = topologicalSort(edges, nodes);

        // execution_start
        consumer.accept(SSEEvent.builder()
            .eventType("execution_start")
            .data(Map.of("executionId", executionId))
            .delayMs(0)
            .build());

        // 逐个节点执行
        for (Map<String, Object> node : executionOrder) {
            executeNodeStream(executionId, node, consumer);
        }

        // execution_end
        consumer.accept(SSEEvent.builder()
            .eventType("execution_end")
            .data(Map.of(
                "executionId", executionId,
                "status", "completed",
                "summary", Map.of("totalNodes", nodes.size(), "completedNodes", nodes.size())
            ))
            .delayMs(0)
            .build());

        log.info("Workflow execution stream completed - executionId: {}", executionId);
    }

    private void executeNodeStream(String executionId, Map<String, Object> node, Consumer<SSEEvent> consumer) {
        String nodeId = (String) node.get("nodeId");
        String characterId = (String) node.getOrDefault("characterId", "char_script_001");

        ComponentType componentType = CHARACTER_MAP.getOrDefault(characterId, ComponentType.ASSISTANT);
        NodeSimulationData simData = mockDataCenter.getCharacterDataByType(componentType);

        // node_start
        consumer.accept(SSEEvent.builder()
            .eventType("node_start")
            .data(Map.of("nodeId", nodeId, "characterId", characterId, "status", "running"))
            .delayMs(0)
            .build());

        // thinking
        for (String step : simData.getThinkingSteps()) {
            consumer.accept(SSEEvent.builder()
                .eventType("thinking")
                .data(Map.of("nodeId", nodeId, "characterId", characterId, "delta", step))
                .delayMs(mockDataCenter.getThinkingDelay())
                .build());
        }

        // content - text
        for (String token : tokenizeContent(simData.getTextResult())) {
            consumer.accept(SSEEvent.builder()
                .eventType("content")
                .data(Map.of("nodeId", nodeId, "characterId", characterId, "type", "text", "delta", token))
                .delayMs(mockDataCenter.getContentDelay())
                .build());
        }

        // content - component (dataJson)
        String dataJson = simData.getDataJson();
        if (dataJson != null && !dataJson.isEmpty()) {
            consumer.accept(SSEEvent.builder()
                .eventType("content")
                .data(Map.of("nodeId", nodeId, "characterId", characterId, "type", "component", "delta", parseDataJson(dataJson)))
                .delayMs(0)
                .build());
        }

        // node_complete
        consumer.accept(SSEEvent.builder()
            .eventType("node_complete")
            .data(Map.of("nodeId", nodeId, "characterId", characterId, "status", "completed"))
            .delayMs(0)
            .build());
    }

    private List<String> generateThinkingSteps(String content) {
        if (content.contains("剧本") || content.contains("脚本")) {
            return List.of("正在分析剧本结构...", "提取关键场景和人物...", "生成剧本大纲...");
        } else if (content.contains("分镜") || content.contains("镜头")) {
            return List.of("分析剧本节奏...", "设计镜头语言...", "规划运镜方案...");
        } else if (content.contains("视觉") || content.contains("风格")) {
            return List.of("分析视觉风格...", "生成概念草图...", "优化色彩构图...");
        } else {
            return List.of("正在理解您的问题...", "分析问题意图...", "生成回答...");
        }
    }

    private String generateResponseContent(String content) {
        if (content.contains("剧本") || content.contains("脚本")) {
            return "剧本解析完成。\n\n共识别出3个主要场景，5个角色。\n\n场景1：城市街道 - 清晨阳光\n场景2：写字楼大堂 - 现代简约\n场景3：咖啡馆 - 暖黄色调";
        } else if (content.contains("分镜") || content.contains("镜头")) {
            return "分镜脚本生成完成。\n\n共设计12个镜头，包含远景、中景、特写等多种景别。\n\n建议使用电影感的稳定器拍摄手法。";
        } else if (content.contains("视觉") || content.contains("风格")) {
            return "视觉风格分析完成。\n\n整体风格：都市现代感 + 暖色调\n\n关键视觉元素：\n- 城市天际线作为背景\n- 温暖的室内光线\n- 时尚的人物造型";
        } else {
            return "好的，我已经理解您的需求。请问还有什么需要补充的吗？\n\n您可以：\n1. 提供更多剧本细节\n2. 指定特定的视觉风格\n3. 调整分镜数量和节奏";
        }
    }

    private Map<String, Object> generateResponseData(String content) {
        if (content.contains("剧本") || content.contains("脚本")) {
            Map<String, Object> batchAction = new HashMap<>();
            batchAction.put("actionType", "generate_assets");
            batchAction.put("items", List.of(
                Map.of("id", "char-1", "name", "角色1", "type", "character", "thumbnail", "https://picsum.photos/200"),
                Map.of("id", "scene-1", "name", "场景1", "type", "scene", "thumbnail", "https://picsum.photos/400/300")
            ));
            return batchAction;
        } else if (content.contains("分镜") || content.contains("镜头")) {
            Map<String, Object> batchAction = new HashMap<>();
            batchAction.put("actionType", "create_shots");
            batchAction.put("items", List.of(
                Map.of("shotId", "shot-1", "name", "镜头1", "thumbnail", "https://picsum.photos/400/225"),
                Map.of("shotId", "shot-2", "name", "镜头2", "thumbnail", "https://picsum.photos/400/225")
            ));
            return batchAction;
        }
        return null;
    }

    private List<String> tokenizeContent(String content) {
        List<String> tokens = new ArrayList<>();
        if (content == null || content.isEmpty()) {
            return tokens;
        }

        String[] lines = content.split("\n");
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            if (!line.trim().isEmpty()) {
                tokens.add(line + (i < lines.length - 1 ? "\n" : ""));
            }
        }

        if (tokens.isEmpty()) {
            String[] words = content.split(" ");
            for (String word : words) {
                if (!word.trim().isEmpty()) {
                    tokens.add(word + " ");
                }
            }
        }

        return tokens.isEmpty() ? List.of(content) : tokens;
    }

    private Map<String, Object> parseDataJson(String dataJson) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(dataJson, Map.class);
        } catch (Exception e) {
            log.warn("Failed to parse dataJson: {}", e.getMessage());
            return Map.of();
        }
    }

    private List<Map<String, Object>> topologicalSort(List<Map<String, Object>> edges, List<Map<String, Object>> nodes) {
        Map<String, Integer> inDegree = new HashMap<>();
        Map<String, Map<String, Object>> nodeMap = new HashMap<>();

        for (Map<String, Object> node : nodes) {
            String nodeId = (String) node.get("nodeId");
            nodeMap.put(nodeId, node);
            inDegree.put(nodeId, 0);
        }

        for (Map<String, Object> edge : edges) {
            String to = (String) edge.get("to");
            inDegree.merge(to, 1, Integer::sum);
        }

        List<Map<String, Object>> sorted = new ArrayList<>();
        Queue<String> queue = new LinkedList<>();

        for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.offer(entry.getKey());
            }
        }

        while (!queue.isEmpty()) {
            String nodeId = queue.poll();
            sorted.add(nodeMap.get(nodeId));

            for (Map<String, Object> edge : edges) {
                String from = (String) edge.get("from");
                String to = (String) edge.get("to");
                if (from.equals(nodeId)) {
                    int newDegree = inDegree.merge(to, -1, Integer::sum);
                    if (newDegree == 0) {
                        queue.offer(to);
                    }
                }
            }
        }

        for (Map<String, Object> node : nodes) {
            String nodeId = (String) node.get("nodeId");
            if (!sorted.contains(node)) {
                sorted.add(node);
            }
        }

        return sorted;
    }
}