package com.dream.studio.service;

import com.dream.studio.constant.ComponentType;
import com.dream.studio.dto.AgentDTO;
import com.dream.studio.dto.ChatDTO;
import com.dream.studio.dto.DAGDTO;
import com.dream.studio.dto.ExecutionState;
import com.dream.studio.dto.NodeSimulationData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UpstreamAiClient {

    @Value("${upstream.ai.base-url:http://localhost:8081}")
    private String baseUrl;

    public List<AgentDTO.Response> getAgents() {
        log.info("Fetching agents from upstream service: {}", baseUrl);
        return getDefaultAgents();
    }

    public AgentDTO.Response getAgent(Long id) {
        log.info("Fetching agent {} from upstream service", id);
        return getDefaultAgents().stream()
                .filter(a -> a.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Agent not found: " + id));
    }

    public ChatDTO.MessageResponse sendChatMessage(ChatDTO.SendRequest request) {
        log.info("Sending chat message to upstream service, project: {}, agent: {}",
                request.getProjectId(), request.getAgentId());

        if ("assistant".equals(request.getAgentId())) {
            String message = request.getMessage();
            NodeSimulationData simData;

            if (message.contains("创意")) {
                // 返回固定工作流创建响应
                return ChatDTO.MessageResponse.builder()
                        .id(System.currentTimeMillis())
                        .projectId(request.getProjectId())
                        .projectVersion(request.getProjectVersion())
                        .agentId(request.getAgentId())
                        .agentName("智能助理")
                        .question(message)
                        .thinkingSteps(List.of(
                                "检测到用户创意需求",
                                "自动匹配影视制作工作流",
                                "准备创建5个协作节点"
                        ))
                        .resultType("workflow")
                        .result("已为您创建影视制作工作流：资深影视制片人 → 金牌编剧 → 概念美术总监 → 分镜导演 → 视频提示词工程师。请检查工作流配置，确认无误后点击运行按钮开始执行。")
                        .workflowCreated(true)
                        .workflowNodes(List.of(
                                createWorkflowNode("producer-1", "producer", "资深影视制片人"),
                                createWorkflowNode("content-1", "content", "金牌编剧"),
                                createWorkflowNode("visual-1", "visual", "概念美术总监"),
                                createWorkflowNode("director-1", "director", "分镜导演"),
                                createWorkflowNode("technical-1", "technical", "视频提示词工程师")
                        ))
                        .workflowEdges(List.of(
                                createWorkflowEdge("e1", "producer-1", "content-1"),
                                createWorkflowEdge("e2", "content-1", "visual-1"),
                                createWorkflowEdge("e3", "visual-1", "director-1"),
                                createWorkflowEdge("e4", "director-1", "technical-1")
                        ))
                        .createTime(java.time.LocalDateTime.now().toString())
                        .build();
            } else if (message.contains("图片") || message.contains("image")) {
                simData = SimulationDataProvider.getSimulationDataByType(ComponentType.ASSISTANT, "image");
                String imageUrls = String.join(",", simData.getImageResults());
                return ChatDTO.MessageResponse.builder()
                        .id(System.currentTimeMillis())
                        .projectId(request.getProjectId())
                        .projectVersion(request.getProjectVersion())
                        .agentId(request.getAgentId())
                        .agentName("智能助理")
                        .question(message)
                        .thinkingSteps(simData.getThinkingSteps())
                        .resultType("image")
                        .result(imageUrls)
                        .createTime(java.time.LocalDateTime.now().toString())
                        .build();
            } else if (message.contains("视频") || message.contains("video")) {
                simData = SimulationDataProvider.getSimulationDataByType(ComponentType.ASSISTANT, "video");
                NodeSimulationData.VideoResult video = simData.getVideoResults().get(0);
                return ChatDTO.MessageResponse.builder()
                        .id(System.currentTimeMillis())
                        .projectId(request.getProjectId())
                        .projectVersion(request.getProjectVersion())
                        .agentId(request.getAgentId())
                        .agentName("智能助理")
                        .question(message)
                        .thinkingSteps(simData.getThinkingSteps())
                        .resultType("video")
                        .result(video.getUrl())
                        .createTime(java.time.LocalDateTime.now().toString())
                        .build();
            } else if (message.contains("markdown") || message.contains("格式")) {
                simData = SimulationDataProvider.getSimulationDataByType(ComponentType.ASSISTANT, "markdown");
                return ChatDTO.MessageResponse.builder()
                        .id(System.currentTimeMillis())
                        .projectId(request.getProjectId())
                        .projectVersion(request.getProjectVersion())
                        .agentId(request.getAgentId())
                        .agentName("智能助理")
                        .question(message)
                        .thinkingSteps(simData.getThinkingSteps())
                        .resultType("markdown")
                        .result(simData.getMarkdownResult())
                        .createTime(java.time.LocalDateTime.now().toString())
                        .build();
            } else {
                simData = SimulationDataProvider.getSimulationDataByType(ComponentType.ASSISTANT, "text");
                return ChatDTO.MessageResponse.builder()
                        .id(System.currentTimeMillis())
                        .projectId(request.getProjectId())
                        .projectVersion(request.getProjectVersion())
                        .agentId(request.getAgentId())
                        .agentName("智能助理")
                        .question(message)
                        .thinkingSteps(simData.getThinkingSteps())
                        .resultType("text")
                        .result(simData.getTextResult())
                        .createTime(java.time.LocalDateTime.now().toString())
                        .build();
            }
        }

        // 其他 agent 类型（producer, content, visual, director, technical 等）
        return buildNodeChatResponse(request);
    }

    private ChatDTO.MessageResponse buildNodeChatResponse(ChatDTO.SendRequest request) {
        String agentId = request.getAgentId();
        ComponentType componentType = ComponentType.fromCode(agentId);
        NodeSimulationData simData = SimulationDataProvider.getSimulationData(componentType);

        return ChatDTO.MessageResponse.builder()
                .id(System.currentTimeMillis())
                .projectId(request.getProjectId())
                .projectVersion(request.getProjectVersion())
                .agentId(agentId)
                .agentName(getAgentName(agentId))
                .question(request.getMessage())
                .thinkingSteps(simData.getThinkingSteps())
                .resultType(simData.getResultType() != null ? simData.getResultType() : "text")
                .result(simData.getTextResult())
                .createTime(java.time.LocalDateTime.now().toString())
                .build();
    }

    public ChatDTO.HistoryResponse getChatHistory(Long projectId, Integer version, String agentId) {
        log.info("Getting chat history from upstream, project: {}, version: {}, agent: {}", projectId, version, agentId);
        return ChatDTO.HistoryResponse.builder()
                .messages(List.of())
                .total(0)
                .build();
    }

    public SseEmitter startExecution(Long projectId, Integer projectVersion, DAGDTO dag,
                                    Map<Long, ExecutionState> stateMap) {
        SseEmitter emitter = new SseEmitter(0L);
        new Thread(() -> {
            try {
                executeWorkflow(emitter, projectId, dag, stateMap);
            } catch (Exception e) {
                log.error("Execution error: {}", e.getMessage(), e);
                emitter.completeWithError(e);
            }
        }).start();
        return emitter;
    }

    public SseEmitter executeAndStream(Long executionId, Long projectId, Integer projectVersion,
                                       DAGDTO dag, Map<Long, ExecutionState> stateMap) {
        SseEmitter emitter = new SseEmitter(0L);

        new Thread(() -> {
            try {
                ExecutionState state = stateMap.get(executionId);
                List<ExecutionState.CompletedNode> completedNodes = state != null ? state.getCompletedNodes() : new ArrayList<>();

                emitter.send(SseEmitter.event().name("message").data(
                    String.format("{\"type\":\"init\",\"executionId\":%d,\"completedNodes\":%s}",
                        executionId, buildCompletedNodesJson(completedNodes))));

                executeWorkflow(emitter, projectId, dag, stateMap);

            } catch (Exception e) {
                log.error("Execution error: {}", e.getMessage(), e);
                emitter.completeWithError(e);
            }
        }).start();

        return emitter;
    }

    private void executeWorkflow(SseEmitter emitter, Long projectId, DAGDTO dag,
                                Map<Long, ExecutionState> stateMap) {
        try {
            List<DAGDTO.DAGNode> nodes = dag.getNodes();
            List<DAGDTO.DAGEdge> edges = dag.getEdges();

            if (nodes == null || nodes.isEmpty()) {
                emitter.send(SseEmitter.event().name("message").data(
                    "{\"type\":\"complete\",\"content\":\"没有节点需要执行\"}"));
                emitter.complete();
                return;
            }

            Map<String, DAGDTO.DAGNode> nodeMap = nodes.stream()
                .collect(Collectors.toMap(DAGDTO.DAGNode::getId, n -> n));

            Map<String, List<String>> outgoingEdges = new HashMap<>();
            for (DAGDTO.DAGEdge edge : edges) {
                outgoingEdges.computeIfAbsent(edge.getFrom(), k -> new ArrayList<>()).add(edge.getTo());
            }

            Map<String, Integer> inDegree = new HashMap<>();
            for (DAGDTO.DAGNode node : nodes) {
                inDegree.put(node.getId(), 0);
            }
            for (DAGDTO.DAGEdge edge : edges) {
                inDegree.merge(edge.getTo(), 1, Integer::sum);
            }

            Queue<String> readyNodes = new LinkedList<>(inDegree.entrySet().stream()
                .filter(e -> e.getValue() == 0)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList()));

            List<String> completedNodes = new ArrayList<>();
            Map<String, NodeSimulationData> nodeResults = new HashMap<>();

            while (!readyNodes.isEmpty() || completedNodes.size() < nodes.size()) {
                if (readyNodes.isEmpty() && completedNodes.size() < nodes.size()) {
                    log.warn("DAG has cycle or unready nodes, breaking");
                    break;
                }

                String nodeId = readyNodes.poll();
                if (nodeId == null) break;

                DAGDTO.DAGNode dagNode = nodeMap.get(nodeId);
                String nodeTypeCode = dagNode.getType();
                ComponentType componentType = ComponentType.fromCode(nodeTypeCode);
                String nodeName = componentType != null ? componentType.getName() : (nodeTypeCode != null ? nodeTypeCode : "Unknown");
                NodeSimulationData simData = componentType != null ? SimulationDataProvider.getSimulationData(componentType) : null;
                nodeResults.put(nodeId, simData);

                log.info("Executing node: {} (type: {})", nodeId, nodeTypeCode);

                emitter.send(SseEmitter.event().name("message").data(String.format(
                    "{\"type\":\"status\",\"nodeId\":\"%s\",\"status\":\"running\",\"content\":\"[%s] 开始执行\"}",
                    nodeId, nodeName)));
                Thread.sleep(300);

                List<String> thoughts = simData.getThinkingSteps();
                for (int i = 0; i < thoughts.size(); i++) {
                    emitter.send(SseEmitter.event().name("message").data(String.format(
                        "{\"type\":\"thinking\",\"nodeId\":\"%s\",\"content\":\"[%s] %s\",\"index\":%d}",
                        nodeId, nodeName, thoughts.get(i), i)));
                    Thread.sleep(400);
                }

                if (SimulationDataProvider.hasImageResults(componentType)) {
                    String imagesJson = extractFromDataJson(simData.getDataJson(), "images");
                    emitter.send(SseEmitter.event().name("message").data(String.format(
                        "{\"type\":\"images\",\"nodeId\":\"%s\",\"images\":%s}", nodeId, imagesJson)));
                }

                if (SimulationDataProvider.hasVideoResults(componentType)) {
                    String videosJson = extractFromDataJson(simData.getDataJson(), "videos");
                    emitter.send(SseEmitter.event().name("message").data(String.format(
                        "{\"type\":\"videos\",\"nodeId\":\"%s\",\"videos\":%s}", nodeId, videosJson)));
                }

                if (SimulationDataProvider.hasDataJson(componentType)) {
                    emitter.send(SseEmitter.event().name("message").data(String.format(
                        "{\"type\":\"data\",\"nodeId\":\"%s\",\"data\":%s}", nodeId, simData.getDataJson())));
                }

                String resultContent = simData.getTextResult().replace("\n", "\\n");
                emitter.send(SseEmitter.event().name("message").data(String.format(
                    "{\"type\":\"result\",\"nodeId\":\"%s\",\"content\":\"[%s] %s\",\"progress\":100}",
                    nodeId, nodeName, resultContent)));
                Thread.sleep(200);

                emitter.send(SseEmitter.event().name("message").data(String.format(
                    "{\"type\":\"status\",\"nodeId\":\"%s\",\"status\":\"completed\",\"content\":\"[%s] 执行完成\"}",
                    nodeId, nodeName)));

                completedNodes.add(nodeId);

                List<String> successors = outgoingEdges.getOrDefault(nodeId, List.of());
                for (String successor : successors) {
                    inDegree.merge(successor, -1, Integer::sum);
                    if (inDegree.get(successor) == 0) {
                        readyNodes.offer(successor);
                    }
                }

                Thread.sleep(200);
            }

            emitter.send(SseEmitter.event().name("message").data(
                "{\"type\":\"complete\",\"content\":\"工作流执行完成\"}"));
            emitter.complete();
        } catch (Exception e) {
            log.error("SSE error: {}", e.getMessage(), e);
            emitter.completeWithError(e);
        }
    }

    private String buildCompletedNodesJson(List<ExecutionState.CompletedNode> completedNodes) {
        if (completedNodes == null || completedNodes.isEmpty()) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < completedNodes.size(); i++) {
            ExecutionState.CompletedNode node = completedNodes.get(i);
            sb.append("{");
            sb.append("\"nodeId\":\"").append(node.getNodeId()).append("\",");
            sb.append("\"nodeType\":\"").append(node.getNodeType() != null ? node.getNodeType() : "").append("\",");
            sb.append("\"status\":\"").append(node.getStatus() != null ? node.getStatus() : "completed").append("\",");
            sb.append("\"thinking\":").append(buildThinkingJson(node.getThinking())).append(",");
            sb.append("\"result\":\"").append(escapeJson(node.getResult())).append("\"");
            sb.append("}");
            if (i < completedNodes.size() - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    private String buildThinkingJson(List<String> thinking) {
        if (thinking == null || thinking.isEmpty()) {
            return "[]";
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < thinking.size(); i++) {
            sb.append("\"").append(escapeJson(thinking.get(i))).append("\"");
            if (i < thinking.size() - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                  .replace("\"", "\\\"")
                  .replace("\n", "\\n")
                  .replace("\r", "\\r")
                  .replace("\t", "\\t");
    }

    private String extractFromDataJson(String dataJson, String key) {
        if (dataJson == null || dataJson.isEmpty()) {
            return "[]";
        }
        int keyIndex = dataJson.indexOf("\"" + key + "\":");
        if (keyIndex < 0) {
            return "[]";
        }
        int start = dataJson.indexOf("[", keyIndex);
        int end = dataJson.lastIndexOf("]");
        if (start < 0 || end < 0 || start > end) {
            return "[]";
        }
        return dataJson.substring(start, end + 1);
    }

    private List<AgentDTO.Response> getDefaultAgents() {
        return List.of(
            createAgentResponse(1L, "producer", "资深影视制片人", "官方认证", "Target", "#3b82f6",
                List.of(Map.of("id", "idea", "label", "原始想法", "type", "text")),
                List.of(Map.of("id", "proposal", "label", "项目立项书", "type", "document"))),
            createAgentResponse(2L, "content", "金牌编剧", "官方认证", "PenTool", "#06b6d4",
                List.of(Map.of("id", "proposal", "label", "项目立项书", "type", "document")),
                List.of(Map.of("id", "script", "label", "分场剧本", "type", "document"))),
            createAgentResponse(3L, "visual", "概念美术总监", "官方认证", "Palette", "#8b5cf6",
                List.of(Map.of("id", "script", "label", "分场剧本", "type", "document")),
                List.of(Map.of("id", "assets", "label", "文生图指令", "type", "image-prompt"))),
            createAgentResponse(4L, "director", "分镜导演", "官方认证", "Video", "#f59e0b",
                List.of(Map.of("id", "input", "label", "输入", "type", "any")),
                List.of(Map.of("id", "output", "label", "输出", "type", "any"))),
            createAgentResponse(5L, "technical", "视频提示词工程师", "官方认证", "Code", "#10b981",
                List.of(Map.of("id", "input", "label", "输入", "type", "any")),
                List.of(Map.of("id", "output", "label", "输出", "type", "any"))),
            createAgentResponse(6L, "videoGen", "视频生成", "官方认证", "Play", "#6366f1",
                List.of(Map.of("id", "prompts", "label", "视频提示词", "type", "prompt-package")),
                List.of(Map.of("id", "video", "label", "生成视频", "type", "video"))),
            createAgentResponse(7L, "videoEditor", "视频剪辑", "官方认证", "Scissors", "#a855f7",
                List.of(Map.of("id", "videos", "label", "待剪辑视频", "type", "video")),
                List.of(Map.of("id", "edited", "label", "剪辑后视频", "type", "video")))
        );
    }

    private AgentDTO.Response createAgentResponse(Long id, String type, String name, String category,
            String icon, String color, List<Map<String, Object>> inputs, List<Map<String, Object>> outputs) {
        return AgentDTO.Response.builder()
                .id(id)
                .type(type)
                .name(name)
                .category(category)
                .icon(icon)
                .color(color)
                .inputs(inputs)
                .outputs(outputs)
                .build();
    }

    private String getAgentName(String agentId) {
        Map<String, String> agentNames = Map.of(
            "producer", "资深影视制片人",
            "content", "金牌编剧",
            "visual", "概念美术总监",
            "director", "分镜导演",
            "technical", "视频提示词工程师"
        );
        return agentNames.getOrDefault(agentId, "AI助手");
    }

    private ChatDTO.WorkflowNode createWorkflowNode(String id, String type, String label) {
        return ChatDTO.WorkflowNode.builder()
                .id(id)
                .type(type)
                .label(label)
                .build();
    }

    private ChatDTO.WorkflowEdge createWorkflowEdge(String id, String source, String target) {
        return ChatDTO.WorkflowEdge.builder()
                .id(id)
                .source(source)
                .target(target)
                .build();
    }
}
