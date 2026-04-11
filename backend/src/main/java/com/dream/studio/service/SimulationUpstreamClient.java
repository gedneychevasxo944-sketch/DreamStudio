package com.dream.studio.service;

import com.dream.studio.constant.ComponentType;
import com.dream.studio.dto.AgentDTO;
import com.dream.studio.dto.ChatDTO;
import com.dream.studio.dto.DAGDTO;
import com.dream.studio.dto.NodeSimulationData;
import com.dream.studio.dto.TeamDTO;
import com.dream.studio.entity.AgentChatRecord;
import com.dream.studio.entity.NodeProposal;
import com.dream.studio.entity.NodeVersion;
import com.dream.studio.repository.AgentChatRecordRepository;
import com.dream.studio.repository.NodeProposalRepository;
import com.dream.studio.repository.NodeVersionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 模拟数据实现的 UpstreamClient
 * 数据内容完全不变，只适配字段名称（入参出参按文档格式）
 */
@Slf4j
@Service
public class SimulationUpstreamClient implements UpstreamClient {

    private final NodeVersionRepository nodeVersionRepository;
    private final NodeProposalRepository nodeProposalRepository;
    private final AgentChatRecordRepository agentChatRecordRepository;
    private final TransactionTemplate transactionTemplate;

    public SimulationUpstreamClient(NodeVersionRepository nodeVersionRepository,
                                   NodeProposalRepository nodeProposalRepository,
                                   AgentChatRecordRepository agentChatRecordRepository,
                                   TransactionTemplate transactionTemplate) {
        this.nodeVersionRepository = nodeVersionRepository;
        this.nodeProposalRepository = nodeProposalRepository;
        this.agentChatRecordRepository = agentChatRecordRepository;
        this.transactionTemplate = transactionTemplate;
    }

    // 会话状态存储（模拟）
    private final Map<Long, ChatDTO.MessageResponse> chatSessions = new ConcurrentHashMap<>();

    // ========== 6.1 搜索智能体列表 ==========
    @Override
    public List<AgentDTO.Response> searchAgents(List<String> tags, int pageNo, int pageSize) {
        log.info("SimulationUpstreamClient: searchAgents tags={}, pageNo={}, pageSize={}", tags, pageNo, pageSize);

        List<AgentDTO.Response> allAgents = getDefaultAgents();

        // 按标签过滤
        if (tags != null && !tags.isEmpty()) {
            allAgents = allAgents.stream()
                    .filter(a -> a.getAgentTags() != null &&
                            a.getAgentTags().stream().anyMatch(tags::contains))
                    .collect(Collectors.toList());
        }

        // 分页
        int start = (pageNo - 1) * pageSize;
        int end = Math.min(start + pageSize, allAgents.size());
        if (start >= allAgents.size()) {
            return Collections.emptyList();
        }

        return new ArrayList<>(allAgents.subList(start, end));
    }

    // ========== 6.2 获取智能体详情 ==========
    @Override
    public AgentDTO.Response getAgent(Long agentId) {
        log.info("SimulationUpstreamClient: getAgent agentId={}", agentId);
        // ASSISTANT 固定 ID 为 0
        if (agentId == 0) {
            return createAgent(0L, "assistant", "智能助理", List.of("assistant"), "智能对话助手");
        }
        return getDefaultAgents().stream()
                .filter(a -> a.getAgentId().equals(agentId))
                .findFirst()
                .orElse(null);
    }

    // ========== 6.3 更新智能体 ==========
    @Override
    public void updateAgent(Long agentId, AgentDTO.UpdateRequest request) {
        log.info("SimulationUpstreamClient: updateAgent agentId={}, request={}", agentId, request);
        // 模拟更新成功
    }

    // ========== 6.4 智能体对话 (SSE) ==========
    @Override
    public SseEmitter chatStream(String agentId, ChatDTO.SendRequest request) {
        log.info("SimulationUpstreamClient: chatStream agentId={}", agentId);
        SseEmitter emitter = new SseEmitter(0L);

        new Thread(() -> {
            try {
                // 创建会话
                Long sessionId = System.currentTimeMillis();
                chatSessions.put(sessionId, ChatDTO.MessageResponse.builder()
                        .id(sessionId)
                        .agentId(agentId.toString())
                        .build());

                // 发送 init 事件
                emitter.send(SseEmitter.event().name("init").data(String.format(
                        "{\"agentId\":\"%s\",\"sessionId\":%d,\"messageId\":\"msg-%d\",\"eventTime\":\"%s\"}",
                        agentId, sessionId, sessionId, getCurrentTime())));

                // 模拟对话逻辑
                String message = request.getMessage();
                String nodeId = request.getNodeId() != null ? request.getNodeId() : agentId.toString();

                // 保存用户消息到数据库
                AgentChatRecord userRecord = AgentChatRecord.builder()
                        .projectId(request.getProjectId())
                        .agentId(agentId)
                        .agentName(request.getAgentName())
                        .agentCode(agentId.toString())
                        .nodeId(nodeId)
                        .messageRole("user")
                        .content(message)
                        .messageType("text")
                        .build();
                agentChatRecordRepository.save(userRecord);

                // 根据 agentId 映射到对应的 ComponentType
                ComponentType componentType = ComponentType.fromCode(agentId.toString());
                if (componentType == null) {
                    componentType = ComponentType.ASSISTANT;
                }

                // 根据用户消息选择响应类型（用于 ASSISTANT 类型）
                String simDataKey;
                String lowerMsg = message != null ? message.toLowerCase() : "";
                if (lowerMsg.contains("图片") && lowerMsg.contains("视频")) {
                    simDataKey = "text_image_video";
                } else if (lowerMsg.contains("图片")) {
                    simDataKey = "text_image";
                } else if (lowerMsg.contains("视频")) {
                    simDataKey = "text_video";
                } else if (lowerMsg.contains("markdown") || lowerMsg.contains("格式")) {
                    simDataKey = "markdown";
                } else {
                    simDataKey = "text";
                }

                NodeSimulationData simData = SimulationDataProvider.getSimulationDataByType(
                        componentType, simDataKey);

                List<String> thoughts = simData.getThinkingSteps();
                for (int i = 0; i < thoughts.size(); i++) {
                    emitter.send(SseEmitter.event().name("thinking").data(String.format(
                            "{\"messageId\":\"msg-%d\",\"delta\":\"%s\",\"seq\":%d,\"eventTime\":\"%s\"}",
                            sessionId, escapeJson(thoughts.get(i)), i + 1, getCurrentTime())));
                    sleep(400);
                }

                String resultType = simData.getResultType() != null ? simData.getResultType() : "text";
                String resultContent = simData.getTextResult();
                int seq = thoughts.size() + 1;

                // 发送文字结果
                emitter.send(SseEmitter.event().name("result").data(String.format(
                        "{\"messageId\":\"msg-%d\",\"contentType\":\"text\",\"delta\":\"%s\",\"seq\":%d,\"eventTime\":\"%s\"}",
                        sessionId, escapeJson(resultContent), seq, getCurrentTime())));

                // 保存助手回复到数据库
                AgentChatRecord assistantRecord = AgentChatRecord.builder()
                        .projectId(request.getProjectId())
                        .agentId(agentId)
                        .agentName(request.getAgentName())
                        .agentCode(agentId.toString())
                        .nodeId(nodeId)
                        .messageRole("assistant")
                        .content(resultContent)
                        .messageType("text")
                        .build();
                agentChatRecordRepository.save(assistantRecord);
                seq++;

                // 如果有图片，发送图片数据
                if (simData.getImageResults() != null && !simData.getImageResults().isEmpty()) {
                    String imagesJson = toJsonArray(simData.getImageResults());
                    emitter.send(SseEmitter.event().name("data").data(String.format(
                            "{\"messageId\":\"msg-%d\",\"type\":\"image\",\"items\":%s,\"seq\":%d,\"eventTime\":\"%s\"}",
                            sessionId, imagesJson, seq, getCurrentTime())));
                    seq++;
                }

                // 如果有视频，发送视频数据
                if (simData.getVideoResults() != null && !simData.getVideoResults().isEmpty()) {
                    String videosJson = toVideoJsonArray(simData.getVideoResults());
                    emitter.send(SseEmitter.event().name("data").data(String.format(
                            "{\"messageId\":\"msg-%d\",\"type\":\"video\",\"items\":%s,\"seq\":%d,\"eventTime\":\"%s\"}",
                            sessionId, videosJson, seq, getCurrentTime())));
                    seq++;
                }

                // 发送提案数据
                String proposalJson = buildProposalJson(request.getProjectId(), componentType, resultContent, agentId.toString());
                if (proposalJson != null) {
                    emitter.send(SseEmitter.event().name("data").data(String.format(
                            "{\"messageId\":\"msg-%d\",\"type\":\"proposal\",\"proposal\":%s,\"seq\":%d,\"eventTime\":\"%s\"}",
                            sessionId, proposalJson, seq, getCurrentTime())));
                    seq++;
                }

                // 发送 complete，携带 plan 数据让前端自动创建工作流
                // 检查是否需要返回工作流数据（首次对话时返回推荐方案）
                String planData = "";
                // 只有 ASSISTANT 智能体才返回 plan
                log.info("Checking plan data - agentId: {}, sessionId: {}, chatSessions size: {}, componentType: {}",
                        agentId, sessionId, chatSessions.size(), componentType);
                if (componentType == ComponentType.ASSISTANT) {
                    // 构建默认的精品短剧方案 plan
                    String planJson = buildPlanJson(sessionId);
                    planData = String.format(",\"workflowCreated\":true,\"plan\":%s", planJson);
                    log.info("Plan data added: {}", planData);
                }

                emitter.send(SseEmitter.event().name("complete").data(String.format(
                        "{\"messageId\":\"msg-%d\",\"finishReason\":\"stop\",\"eventTime\":\"%s\"%s}",
                        sessionId, getCurrentTime(), planData)));

                emitter.complete();

            } catch (Exception e) {
                log.error("Chat stream error: {}", e.getMessage(), e);
                try {
                    emitter.send(SseEmitter.event().name("error").data(String.format(
                            "{\"code\":\"CHAT_ERROR\",\"message\":\"%s\",\"eventTime\":\"%s\"}",
                            e.getMessage(), getCurrentTime())));
                } catch (Exception ex) {
                    log.error("Failed to send error event", ex);
                }
                emitter.completeWithError(e);
            }
        }).start();

        return emitter;
    }

    // ========== 6.6 工作流执行 (SSE) ==========
    @Override
    public SseEmitter executeWorkflow(DAGDTO dag, List<ChatDTO.WorkflowEdge> edges, Long projectId) {
        log.info("SimulationUpstreamClient: executeWorkflow projectId={}", projectId);
        SseEmitter emitter = new SseEmitter(0L);

        new Thread(() -> {
            try {
                String executionId = "wf-" + System.currentTimeMillis();

                // 发送 init 事件
                emitter.send(SseEmitter.event().name("init").data(String.format(
                        "{\"workflowExecutionId\":\"%s\",\"eventTime\":\"%s\"}",
                        executionId, getCurrentTime())));

                // 解析 DAG
                List<DAGDTO.DAGNode> dagNodes = dag.getNodes();
                if (dagNodes == null || dagNodes.isEmpty()) {
                    emitter.send(SseEmitter.event().name("complete").data(String.format(
                            "{\"workflowExecutionId\":\"%s\",\"status\":\"SUCCESS\",\"eventTime\":\"%s\"}",
                            executionId, getCurrentTime())));
                    emitter.complete();
                    return;
                }

                Map<String, DAGDTO.DAGNode> nodeMap = dagNodes.stream()
                        .collect(Collectors.toMap(n -> n.getNodeId() != null ? n.getNodeId() : n.getId(), n -> n));

                // 构建拓扑顺序
                Map<String, List<String>> outgoingEdges = new HashMap<>();
                for (ChatDTO.WorkflowEdge edge : edges) {
                    String from = edge.getFromNodeId() != null ? edge.getFromNodeId() : edge.getFrom();
                    String to = edge.getToNodeId() != null ? edge.getToNodeId() : edge.getTo();
                    outgoingEdges.computeIfAbsent(from, k -> new ArrayList<>()).add(to);
                }

                Map<String, Integer> inDegree = new HashMap<>();
                for (DAGDTO.DAGNode node : dagNodes) {
                    inDegree.put(node.getNodeId() != null ? node.getNodeId() : node.getId(), 0);
                }
                for (ChatDTO.WorkflowEdge edge : edges) {
                    String to = edge.getToNodeId() != null ? edge.getToNodeId() : edge.getTo();
                    inDegree.merge(to, 1, Integer::sum);
                }

                Queue<String> readyNodes = new LinkedList<>(inDegree.entrySet().stream()
                        .filter(e -> e.getValue() == 0)
                        .map(Map.Entry::getKey)
                        .collect(Collectors.toList()));

                List<String> completedNodes = new ArrayList<>();

                // 用于存储每个节点的执行结果，执行完成后保存到数据库
                Map<String, NodeVersionResult> nodeResults = new HashMap<>();
                int[] versionCounter = {0};

                while (!readyNodes.isEmpty() || completedNodes.size() < dagNodes.size()) {
                    if (readyNodes.isEmpty() && completedNodes.size() < dagNodes.size()) {
                        log.warn("DAG has cycle or unready nodes");
                        break;
                    }

                    String nodeId = readyNodes.poll();
                    if (nodeId == null) break;

                    DAGDTO.DAGNode dagNode = nodeMap.get(nodeId);
                    String nodeTypeCode = dagNode.getAgentCode() != null ? dagNode.getAgentCode() : dagNode.getType();
                    ComponentType componentType = ComponentType.fromCode(nodeTypeCode);
                    String nodeName = componentType != null ? componentType.getName() : nodeTypeCode;
                    NodeSimulationData simData = componentType != null ? SimulationDataProvider.getSimulationData(componentType) : null;

                    log.info("Executing node: {} (type: {})", nodeId, nodeTypeCode);

                    // 发送 node_status 事件
                    emitter.send(SseEmitter.event().name("node_status").data(String.format(
                            "{\"workflowExecutionId\":\"%s\",\"nodeId\":\"%s\",\"status\":\"RUNNING\",\"eventTime\":\"%s\"}",
                            executionId, nodeId, getCurrentTime())));
                    sleep(300);

                    // 准备存储结果
                    String resultText = "";
                    String resultJson = null;
                    String thinkingText = "[]";

                    // 发送 thinking 事件
                    if (simData != null) {
                        List<String> thoughts = simData.getThinkingSteps();
                        thinkingText = toJsonArray(thoughts);
                        for (int i = 0; i < thoughts.size(); i++) {
                            emitter.send(SseEmitter.event().name("thinking").data(String.format(
                                    "{\"workflowExecutionId\":\"%s\",\"nodeId\":\"%s\",\"delta\":\"[%s] %s\",\"seq\":%d,\"eventTime\":\"%s\"}",
                                    executionId, nodeId, nodeName, thoughts.get(i), i + 1, getCurrentTime())));
                            sleep(400);
                        }

                        // 发送图片结果
                        if (SimulationDataProvider.hasImageResults(componentType)) {
                            String imagesJson = SimulationDataProvider.extractFromDataJson(simData.getDataJson(), "images");
                            emitter.send(SseEmitter.event().name("result").data(String.format(
                                    "{\"workflowExecutionId\":\"%s\",\"nodeId\":\"%s\",\"contentType\":\"image\",\"items\":%s,\"seq\":%d,\"eventTime\":\"%s\"}",
                                    executionId, nodeId, imagesJson, thoughts.size() + 1, getCurrentTime())));
                        }

                        // 发送视频结果
                        if (SimulationDataProvider.hasVideoResults(componentType)) {
                            String videosJson = SimulationDataProvider.extractFromDataJson(simData.getDataJson(), "videos");
                            emitter.send(SseEmitter.event().name("result").data(String.format(
                                    "{\"workflowExecutionId\":\"%s\",\"nodeId\":\"%s\",\"contentType\":\"video\",\"items\":%s,\"seq\":%d,\"eventTime\":\"%s\"}",
                                    executionId, nodeId, videosJson, thoughts.size() + 2, getCurrentTime())));
                        }

                        // 发送 data 结果
                        if (SimulationDataProvider.hasDataJson(componentType)) {
                            resultJson = simData.getDataJson();
                            emitter.send(SseEmitter.event().name("data").data(String.format(
                                    "{\"workflowExecutionId\":\"%s\",\"nodeId\":\"%s\",\"data\":%s,\"eventTime\":\"%s\"}",
                                    executionId, nodeId, simData.getDataJson(), getCurrentTime())));
                        }

                        // 发送 result 事件
                        resultText = simData.getTextResult();
                        String resultContent = resultText.replace("\n", "\\n");
                        emitter.send(SseEmitter.event().name("result").data(String.format(
                                "{\"workflowExecutionId\":\"%s\",\"nodeId\":\"%s\",\"contentType\":\"text\",\"delta\":\"[%s] %s\",\"seq\":%d,\"eventTime\":\"%s\"}",
                                executionId, nodeId, nodeName, resultContent, thoughts.size() + 3, getCurrentTime())));
                    }

                    // 发送完成状态
                    emitter.send(SseEmitter.event().name("node_status").data(String.format(
                            "{\"workflowExecutionId\":\"%s\",\"nodeId\":\"%s\",\"status\":\"completed\",\"eventTime\":\"%s\"}",
                            executionId, nodeId, getCurrentTime())));

                    // 保存节点结果用于后续入库
                    nodeResults.put(nodeId, new NodeVersionResult(
                            dagNode.getAgentId(),
                            nodeTypeCode,
                            nodeTypeCode,
                            resultText,
                            resultJson,
                            thinkingText
                    ));

                    completedNodes.add(nodeId);

                    // 更新后继节点的入度
                    List<String> successors = outgoingEdges.getOrDefault(nodeId, Collections.emptyList());
                    for (String successor : successors) {
                        inDegree.merge(successor, -1, Integer::sum);
                        if (inDegree.get(successor) == 0) {
                            readyNodes.offer(successor);
                        }
                    }

                    sleep(200);
                }

                // 工作流执行完成后，保存所有节点的版本到数据库
                if (projectId != null) {
                    for (Map.Entry<String, NodeVersionResult> entry : nodeResults.entrySet()) {
                        String nodeId = entry.getKey();
                        NodeVersionResult result = entry.getValue();

                        try {
                            // 查询该节点的最大版本号
                            Integer maxVersionNo = nodeVersionRepository.findMaxVersionNo(projectId, nodeId).orElse(0);
                            int newVersionNo = maxVersionNo + 1;

                            NodeVersion version = NodeVersion.builder()
                                    .projectId(projectId)
                                    .nodeId(nodeId)
                                    .agentId(result.agentId)
                                    .agentCode(result.agentCode)
                                    .nodeType(result.nodeType)
                                    .versionNo(newVersionNo)
                                    .versionKind("RUN_OUTPUT")
                                    .isCurrent(true)
                                    .status("READY")
                                    .resultText(result.resultText)
                                    .resultJson(result.resultJson)
                                    .thinkingText(result.thinkingText)
                                    .sourceExecutionId(Long.parseLong(executionId.replace("wf-", "")))
                                    .build();

                            // 使用事务模板执行数据库操作
                            transactionTemplate.executeWithoutResult(status -> {
                                // 清除该节点之前的当前版本
                                nodeVersionRepository.clearCurrentByProjectAndNode(projectId, nodeId);
                                // 保存新版本
                                nodeVersionRepository.save(version);
                            });
                            log.info("Saved NodeVersion for node: {}, versionNo: {}", nodeId, newVersionNo);
                        } catch (Exception e) {
                            log.error("Failed to save NodeVersion for node: {}", nodeId, e);
                        }
                    }
                }

                // 发送 complete
                emitter.send(SseEmitter.event().name("complete").data(String.format(
                        "{\"workflowExecutionId\":\"%s\",\"status\":\"SUCCESS\",\"eventTime\":\"%s\"}",
                        executionId, getCurrentTime())));
                emitter.complete();

            } catch (Exception e) {
                log.error("Workflow execution error: {}", e.getMessage(), e);
                try {
                    emitter.send(SseEmitter.event().name("error").data(String.format(
                            "{\"code\":\"EXECUTION_ERROR\",\"message\":\"%s\",\"eventTime\":\"%s\"}",
                            e.getMessage(), getCurrentTime())));
                } catch (Exception ex) {
                    log.error("Failed to send error event", ex);
                }
                emitter.completeWithError(e);
            }
        }).start();

        return emitter;
    }

    // 内部类用于存储节点执行结果
    private static class NodeVersionResult {
        Long agentId;
        String agentCode;
        String nodeType;
        String resultText;
        String resultJson;
        String thinkingText;

        NodeVersionResult(Long agentId, String agentCode, String nodeType, String resultText, String resultJson, String thinkingText) {
            this.agentId = agentId;
            this.agentCode = agentCode;
            this.nodeType = nodeType;
            this.resultText = resultText;
            this.resultJson = resultJson;
            this.thinkingText = thinkingText;
        }
    }

    // ========== 6.7 获取执行详情 ==========
    @Override
    public Object getExecutionDetail(String executionId) {
        log.info("SimulationUpstreamClient: getExecutionDetail executionId={}", executionId);
        // 模拟返回执行详情
        return Collections.singletonMap("executionId", executionId);
    }

    // ========== 6.8 保存团队 ==========
    @Override
    public Long saveTeam(TeamDTO.SaveRequest request) {
        log.info("SimulationUpstreamClient: saveTeam teamName={}", request.getTeamName());
        // 模拟返回 teamId
        return System.currentTimeMillis() % 10000 + 1000;
    }

    // ========== 6.9 获取团队详情 ==========
    @Override
    public TeamDTO.Response getTeam(Long teamId) {
        log.info("SimulationUpstreamClient: getTeam teamId={}", teamId);
        // 模拟返回团队详情
        return TeamDTO.Response.builder()
                .teamId(teamId)
                .teamName("团队 " + teamId)
                .teamDescribe("这是团队 " + teamId + " 的描述")
                .tags(List.of("movie", "basic"))
                .dag(DAGDTO.builder().nodes(List.of()).edges(List.of()).build())
                .createTime(getCurrentTime())
                .updateTime(getCurrentTime())
                .build();
    }

    // ========== 6.10 搜索团队 ==========
    @Override
    public TeamDTO.ListResponse searchTeams(List<String> tags, int pageNo, int pageSize) {
        log.info("SimulationUpstreamClient: searchTeams tags={}, pageNo={}, pageSize={}", tags, pageNo, pageSize);

        // 模拟返回团队列表 - 三个预设团队
        List<TeamDTO.Response> allTeams = List.of(
                createHollywoodTeam(),
                createRapidTeam(),
                createMinimalTeam()
        );

        // 按标签过滤
        List<TeamDTO.Response> filteredTeams = allTeams;
        if (tags != null && !tags.isEmpty()) {
            filteredTeams = allTeams.stream()
                    .filter(t -> t.getTags() != null &&
                            t.getTags().stream().anyMatch(tags::contains))
                    .collect(Collectors.toList());
        }

        // 分页
        int start = (pageNo - 1) * pageSize;
        int end = Math.min(start + pageSize, filteredTeams.size());
        if (start >= filteredTeams.size()) {
            return TeamDTO.ListResponse.builder()
                    .list(Collections.emptyList())
                    .pageNo(pageNo)
                    .pageSize(pageSize)
                    .total(filteredTeams.size())
                    .build();
        }

        return TeamDTO.ListResponse.builder()
                .list(new ArrayList<>(filteredTeams.subList(start, end)))
                .pageNo(pageNo)
                .pageSize(pageSize)
                .total(filteredTeams.size())
                .build();
    }

    // ========== 私有方法 ==========

    private List<AgentDTO.Response> getDefaultAgents() {
        return List.of(
                createAgent(1L, "producer", "资深影视制片人", List.of("producer"), "负责项目策划和整体把控"),
                createAgent(2L, "content", "金牌编剧", List.of("content", "script"), "负责剧本创作和修改"),
                createAgent(3L, "visual", "概念美术总监", List.of("visual"), "负责视觉风格和概念设计"),
                createAgent(4L, "director", "分镜导演", List.of("director"), "负责分镜和镜头设计"),
                createAgent(5L, "technical", "视频提示词工程师", List.of("technical"), "负责视频提示词生成"),
                createAgent(6L, "videoGen", "视频生成", List.of("videoGen"), "负责最终视频生成"),
                createAgent(7L, "videoEditor", "视频剪辑", List.of("videoEditor"), "负责视频剪辑和合成")
        );
    }

    private AgentDTO.Response createAgent(Long agentId, String agentCode, String agentName, List<String> agentTags, String describe) {
        ComponentType componentType = ComponentType.fromCode(agentCode);
        return AgentDTO.Response.builder()
                .agentId(agentId)
                .agentCode(agentCode)
                .agentName(agentName)
                .agentTags(agentTags)
                .describe(describe)
                .id(agentId)
                .type(agentCode)
                .name(agentName)
                .category("官方认证")
                .icon(componentType != null ? componentType.name() : "Bot")
                .color(getColorForType(agentCode))
                .inputs(List.of(Map.of("id", "input", "label", "输入", "type", "any")))
                .outputs(List.of(Map.of("id", "output", "label", "输出", "type", "any")))
                .build();
    }

    private String getColorForType(String type) {
        return switch (type) {
            case "producer" -> "#3b82f6";
            case "content" -> "#06b6d4";
            case "visual" -> "#8b5cf6";
            case "director" -> "#f59e0b";
            case "technical" -> "#10b981";
            case "videoGen" -> "#6366f1";
            case "videoEditor" -> "#a855f7";
            default -> "#6b7280";
        };
    }

    private String getCurrentTime() {
        return java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private String toJsonArray(List<String> items) {
        if (items == null || items.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escapeJson(items.get(i))).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }

    private String toVideoJsonArray(List<NodeSimulationData.VideoResult> videos) {
        if (videos == null || videos.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < videos.size(); i++) {
            if (i > 0) sb.append(",");
            NodeSimulationData.VideoResult v = videos.get(i);
            sb.append("{");
            sb.append("\"url\":\"").append(escapeJson(v.getUrl())).append("\",");
            sb.append("\"title\":\"").append(escapeJson(v.getTitle() != null ? v.getTitle() : "")).append("\",");
            sb.append("\"duration\":").append(v.getDuration() != null ? v.getDuration() : 0).append(",");
            sb.append("\"description\":\"").append(escapeJson(v.getDescription() != null ? v.getDescription() : "")).append("\"");
            sb.append("}");
        }
        sb.append("]");
        return sb.toString();
    }

    // ========== 创建预设团队 ==========
    private TeamDTO.Response createHollywoodTeam() {
        List<DAGDTO.DAGNode> nodes = List.of(
                DAGDTO.DAGNode.builder().nodeId("node-1").agentId(1L).agentCode("producer").type("producer").name("资深影视制片人").icon("Target").color("#3b82f6").build(),
                DAGDTO.DAGNode.builder().nodeId("node-2").agentId(2L).agentCode("content").type("content").name("金牌编剧").icon("PenTool").color("#06b6d4").build(),
                DAGDTO.DAGNode.builder().nodeId("node-3").agentId(3L).agentCode("visual").type("visual").name("概念美术总监").icon("Palette").color("#8b5cf6").build(),
                DAGDTO.DAGNode.builder().nodeId("node-4").agentId(4L).agentCode("director").type("director").name("分镜导演").icon("Video").color("#f59e0b").build(),
                DAGDTO.DAGNode.builder().nodeId("node-5").agentId(5L).agentCode("technical").type("technical").name("视频提示词工程师").icon("Code").color("#10b981").build()
        );
        List<DAGDTO.DAGEdge> edges = List.of(
                DAGDTO.DAGEdge.builder().fromNodeId("node-1").toNodeId("node-2").from("node-1").to("node-2").build(),
                DAGDTO.DAGEdge.builder().fromNodeId("node-2").toNodeId("node-3").from("node-2").to("node-3").build(),
                DAGDTO.DAGEdge.builder().fromNodeId("node-3").toNodeId("node-4").from("node-3").to("node-4").build(),
                DAGDTO.DAGEdge.builder().fromNodeId("node-4").toNodeId("node-5").from("node-4").to("node-5").build()
        );
        return TeamDTO.Response.builder()
                .teamId(3001L)
                .teamName("好莱坞工业流水线")
                .teamDescribe("标准五组双子星节点完整流程，适合专业影视制作")
                .tags(List.of("好莱坞", "工业流水线"))
                .dag(DAGDTO.builder().nodes(nodes).edges(edges).build())
                .createTime(getCurrentTime())
                .updateTime(getCurrentTime())
                .build();
    }

    private TeamDTO.Response createRapidTeam() {
        List<DAGDTO.DAGNode> nodes = List.of(
                DAGDTO.DAGNode.builder().nodeId("node-1").agentId(1L).agentCode("producer").type("producer").name("资深影视制片人").icon("Target").color("#3b82f6").build(),
                DAGDTO.DAGNode.builder().nodeId("node-2").agentId(2L).agentCode("content").type("content").name("金牌编剧").icon("PenTool").color("#06b6d4").build(),
                DAGDTO.DAGNode.builder().nodeId("node-3").agentId(5L).agentCode("technical").type("technical").name("视频提示词工程师").icon("Code").color("#10b981").build(),
                DAGDTO.DAGNode.builder().nodeId("node-4").agentId(6L).agentCode("videoGen").type("videoGen").name("视频生成").icon("Play").color("#6366f1").build()
        );
        List<DAGDTO.DAGEdge> edges = List.of(
                DAGDTO.DAGEdge.builder().fromNodeId("node-1").toNodeId("node-2").from("node-1").to("node-2").build(),
                DAGDTO.DAGEdge.builder().fromNodeId("node-2").toNodeId("node-3").from("node-2").to("node-3").build(),
                DAGDTO.DAGEdge.builder().fromNodeId("node-3").toNodeId("node-4").from("node-3").to("node-4").build()
        );
        return TeamDTO.Response.builder()
                .teamId(3002L)
                .teamName("极速概念片团队")
                .teamDescribe("AI原生工作流，文本直出视频，跳过传统美术")
                .tags(List.of("极速", "概念片"))
                .dag(DAGDTO.builder().nodes(nodes).edges(edges).build())
                .createTime(getCurrentTime())
                .updateTime(getCurrentTime())
                .build();
    }

    private TeamDTO.Response createMinimalTeam() {
        List<DAGDTO.DAGNode> nodes = List.of(
                DAGDTO.DAGNode.builder().nodeId("node-1").agentId(1L).agentCode("producer").type("producer").name("资深影视制片人").icon("Target").color("#3b82f6").build(),
                DAGDTO.DAGNode.builder().nodeId("node-2").agentId(6L).agentCode("videoGen").type("videoGen").name("视频生成").icon("Play").color("#6366f1").build()
        );
        List<DAGDTO.DAGEdge> edges = List.of(
                DAGDTO.DAGEdge.builder().fromNodeId("node-1").toNodeId("node-2").from("node-1").to("node-2").build()
        );
        return TeamDTO.Response.builder()
                .teamId(3003L)
                .teamName("极简单兵模式")
                .teamDescribe("一人成军，AI全栈独立完成")
                .tags(List.of("单兵", "简单"))
                .dag(DAGDTO.builder().nodes(nodes).edges(edges).build())
                .createTime(getCurrentTime())
                .updateTime(getCurrentTime())
                .build();
    }

    /**
     * 构建方案 JSON 数据
     * 返回推荐的精品短剧方案
     */
    private String buildPlanJson(Long sessionId) {
        // 精品短剧方案
        String planNodes = "["
                + "{\"id\":\"producer\",\"name\":\"资深制片人\",\"icon\":\"Target\",\"color\":\"#3b82f6\"},"
                + "{\"id\":\"content\",\"name\":\"金牌编剧\",\"icon\":\"PenTool\",\"color\":\"#06b6d4\"},"
                + "{\"id\":\"visual\",\"name\":\"概念美术\",\"icon\":\"Palette\",\"color\":\"#8b5cf6\"},"
                + "{\"id\":\"director\",\"name\":\"分镜导演\",\"icon\":\"Video\",\"color\":\"#f59e0b\"},"
                + "{\"id\":\"technical\",\"name\":\"提示词工程师\",\"icon\":\"Code\",\"color\":\"#10b981\"},"
                + "{\"id\":\"videoGen\",\"name\":\"视频生成\",\"icon\":\"Play\",\"color\":\"#6366f1\"}"
                + "]";

        String planEdges = "["
                + "{\"from\":\"producer\",\"to\":\"content\"},"
                + "{\"from\":\"content\",\"to\":\"visual\"},"
                + "{\"from\":\"visual\",\"to\":\"director\"},"
                + "{\"from\":\"director\",\"to\":\"technical\"},"
                + "{\"from\":\"technical\",\"to\":\"videoGen\"}"
                + "]";

        return "{"
                + "\"id\":" + sessionId + ","
                + "\"name\":\"推荐链路 - 精品短剧\","
                + "\"description\":\"完整链路，覆盖编剧、美术、分镜、视频生成，适合追求品质的精品项目\","
                + "\"mode\":\"director\","
                + "\"estimatedTime\":\"约2小时\","
                + "\"nodes\":" + planNodes + ","
                + "\"edges\":" + planEdges
                + "}";
    }

    /**
     * 构建提案 JSON 数据
     * 根据节点类型生成对应的提案内容，并保存到数据库
     */
    private String buildProposalJson(Long projectId, ComponentType componentType, String resultContent, String nodeId) {
        if (projectId == null || componentType == null || resultContent == null) {
            return null;
        }

        // 根据节点类型生成不同的提案（使用 ProposalDiff 的 configDiff 结构）
        String summary;
        String changesJson;

        switch (componentType) {
            case PRODUCER:
                summary = "优化项目立项方案";
                changesJson = "[{\"key\":\"budget\",\"beforeValue\":\"500万\",\"afterValue\":\"480万\"},{\"key\":\"duration\",\"beforeValue\":\"6个月\",\"afterValue\":\"5个月\"}]";
                break;
            case CONTENT:
                summary = "剧本优化建议";
                changesJson = "[{\"key\":\"scene3.description\",\"beforeValue\":\"林立（男，28岁）匆匆走在上班路上\",\"afterValue\":\"林立（男，28岁，精神抖擞）快步走在上班路上，手里拿着冰美式\"}]";
                break;
            case VISUAL:
                summary = "视觉风格调整";
                changesJson = "[{\"key\":\"style\",\"beforeValue\":\"都市现代感 + 暖色调\",\"afterValue\":\"赛博朋克 + 霓虹灯光\"}]";
                break;
            case DIRECTOR:
                summary = "分镜优化建议";
                changesJson = "[{\"key\":\"shot1.type\",\"beforeValue\":\"广角镜头俯拍\",\"afterValue\":\"航拍镜头俯拍\"},{\"key\":\"shot1.duration\",\"beforeValue\":\"5秒\",\"afterValue\":\"8秒\"}]";
                break;
            case TECHNICAL:
                summary = "提示词参数优化";
                changesJson = "[{\"key\":\"model\",\"beforeValue\":\"CogVideoX-5B\",\"afterValue\":\"CogVideoX-3B\"}]";
                break;
            case VIDEO_GEN:
                summary = "视频生成参数调整";
                changesJson = "[{\"key\":\"genParams.quality\",\"beforeValue\":\"720P\",\"afterValue\":\"1080P\"},{\"key\":\"genParams.duration\",\"beforeValue\":\"5-10秒\",\"afterValue\":\"10-15秒\"}]";
                break;
            default:
                // ASSISTANT 和其他类型不生成提案
                return null;
        }

        // 构建 diffJson 字符串（使用 ProposalDiff 的 configDiff 结构）
        String diffJson = "{\"diffType\":\"CONFIG_DIFF\",\"configDiff\":{\"changes\":" + changesJson + "}}";

        // 保存提案到数据库
        NodeProposal proposal = NodeProposal.builder()
                .projectId(projectId)
                .nodeId(nodeId)
                .title(summary)
                .summary(summary)
                .diffJson(diffJson)
                .status("PENDING")
                .build();
        NodeProposal savedProposal = transactionTemplate.execute(status -> nodeProposalRepository.save(proposal));
        Long proposalId = savedProposal.getId();

        log.info("Saved proposal: id={}, nodeId={}, projectId={}", proposalId, nodeId, projectId);

        return "{"
                + "\"id\":" + proposalId + ","
                + "\"nodeId\":\"" + nodeId + "\","
                + "\"title\":\"" + escapeJson(summary) + "\","
                + "\"summary\":\"" + escapeJson(summary) + "\","
                + "\"status\":\"PENDING\","
                + "\"diffJson\":" + diffJson
                + "}";
    }
}
