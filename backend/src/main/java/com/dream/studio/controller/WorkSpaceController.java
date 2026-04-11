package com.dream.studio.controller;

import com.dream.studio.dto.AgentDTO;
import com.dream.studio.dto.ApiResponse;
import com.dream.studio.dto.ChatDTO;
import com.dream.studio.dto.DAGDTO;
import com.dream.studio.entity.AgentChatRecord;
import com.dream.studio.entity.NodeProposal;
import com.dream.studio.entity.User;
import com.dream.studio.exception.ProjectNotFoundException;
import com.dream.studio.exception.UserNotFoundException;
import com.dream.studio.filter.JwtAuthenticationFilter.UserPrincipal;
import com.dream.studio.repository.AgentChatRecordRepository;
import com.dream.studio.repository.NodeProposalRepository;
import com.dream.studio.repository.ProjectRepository;
import com.dream.studio.repository.UserRepository;
import com.dream.studio.service.ChatService;
import com.dream.studio.service.ExecutionService;
import com.dream.studio.service.UpstreamClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Tag(name = "工作台模块", description = "智能体、执行、对话")
@CrossOrigin(origins = "*")
public class WorkSpaceController {

    private final UpstreamClient upstreamClient;
    private final ExecutionService executionService;
    private final ChatService chatService;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AgentChatRecordRepository agentChatRecordRepository;
    private final NodeProposalRepository nodeProposalRepository;
    private final ObjectMapper objectMapper;

    /**
     * 从安全上下文获取当前登录用户
     */
    private String getCurrentAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) authentication.getPrincipal()).account();
        }
        throw new UserNotFoundException("用户未登录");
    }

    /**
     * 获取当前登录用户的 User 对象
     */
    private User getCurrentUser() {
        String account = getCurrentAccount();
        return userRepository.findByAccount(account)
                .orElseThrow(() -> new UserNotFoundException("用户不存在"));
    }

    /**
     * 验证项目所有权
     */
    private void validateProjectOwnership(Long projectId) {
        if (projectId == null) {
            throw new UserNotFoundException("请先打开一个项目");
        }
        String account = getCurrentAccount();
        projectRepository.findByIdAndAccount(projectId, account)
                .orElseThrow(() -> new ProjectNotFoundException("项目不存在或无权访问"));
    }

    // ========== 6.1 搜索智能体列表 ==========
    @PostMapping("/agents/search")
    @Operation(summary = "搜索智能体列表", description = "根据标签搜索智能体，支持分页")
    public ApiResponse<AgentDTO.ListResponse> searchAgents(
            @RequestBody AgentSearchRequest request) {
        log.info("Searching agents: tags={}, pageNo={}, pageSize={}",
                request.getTags(), request.getPageNo(), request.getPageSize());

        List<String> tags = request.getTags() != null ? request.getTags() : List.of();
        int pageNo = request.getPageNo() != null ? request.getPageNo() : 1;
        int pageSize = request.getPageSize() != null ? request.getPageSize() : 10;

        List<AgentDTO.Response> agents = upstreamClient.searchAgents(tags, pageNo, pageSize);

        AgentDTO.ListResponse response = AgentDTO.ListResponse.builder()
                .list(agents)
                .pageNo(pageNo)
                .pageSize(pageSize)
                .total(agents.size())
                .build();

        return ApiResponse.success(response);
    }

    // ========== 6.2 获取智能体详情 ==========
    @GetMapping("/agents/{agentId}")
    @Operation(summary = "获取智能体详情", description = "根据智能体ID获取详情")
    public ApiResponse<AgentDTO.Response> getAgent(@PathVariable Long agentId) {
        log.info("Getting agent detail: agentId={}", agentId);
        AgentDTO.Response agent = upstreamClient.getAgent(agentId);
        return ApiResponse.success(agent);
    }

    // ========== 6.3 更新智能体 ==========
    @PatchMapping("/agents/{agentId}")
    @Operation(summary = "更新智能体", description = "更新指定智能体的信息")
    public ApiResponse<Void> updateAgent(
            @PathVariable Long agentId,
            @RequestBody AgentDTO.UpdateRequest request) {
        log.info("Updating agent: agentId={}", agentId);
        upstreamClient.updateAgent(agentId, request);
        return ApiResponse.success(null);
    }

    // ========== 6.4 智能体对话 ==========
    @PostMapping(value = "/agents/{agentId}/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "智能体对话", description = "与指定智能体进行SSE流式对话")
    public SseEmitter chatStream(
            @PathVariable String agentId,
            @RequestBody ChatDTO.SendRequest request) {
        log.info("Chat with agent: agentId={}, projectId={}", agentId, request.getProjectId());
        validateProjectOwnership(request.getProjectId());
        return upstreamClient.chatStream(agentId, request);
    }

    /**
     * 获取节点的历史对话
     */
    @GetMapping("/projects/{projectId}/nodes/{nodeId}/chat-history")
    @Operation(summary = "获取节点历史对话", description = "获取指定节点的历史对话记录")
    public ApiResponse<List<ChatDTO.MessageResponse>> getNodeChatHistory(
            @PathVariable Long projectId,
            @PathVariable String nodeId) {
        validateProjectOwnership(projectId);

        List<AgentChatRecord> records = agentChatRecordRepository
                .findByProjectIdAndNodeIdOrderByCreateTimeAsc(projectId, nodeId);

        // 收集所有有提案的记录ID
        List<Long> proposalIds = records.stream()
                .map(AgentChatRecord::getRelatedProposalId)
                .filter(id -> id != null && id > 0)
                .collect(Collectors.toList());

        // 批量查询提案
        Map<Long, NodeProposal> proposalMap = proposalIds.isEmpty() ?
                Map.of() :
                nodeProposalRepository.findByIdIn(proposalIds).stream()
                        .collect(Collectors.toMap(NodeProposal::getId, p -> p));

        List<ChatDTO.MessageResponse> messages = records.stream()
                .map(record -> {
                    var builder = ChatDTO.MessageResponse.builder()
                            .id(record.getId())
                            .agentId(record.getAgentId())
                            .agentName(record.getAgentName())
                            .question(record.getQuestion())
                            .result(record.getResult())
                            .createTime(record.getCreateTime() != null ?
                                    record.getCreateTime().toString() : null);

                    // 如果有关联的提案，添加到返回结果
                    if (record.getRelatedProposalId() != null && record.getRelatedProposalId() > 0) {
                        NodeProposal proposal = proposalMap.get(record.getRelatedProposalId());
                        if (proposal != null) {
                            // 构建提案对象
                            Map<String, Object> proposalObj = new HashMap<>();
                            proposalObj.put("id", proposal.getId());
                            proposalObj.put("nodeId", proposal.getNodeId());
                            proposalObj.put("title", proposal.getTitle());
                            proposalObj.put("summary", proposal.getSummary());
                            proposalObj.put("status", proposal.getStatus());
                            // 解析 diffJson 字符串为对象
                            if (proposal.getDiffJson() != null) {
                                try {
                                    Map<String, Object> diffJsonObj = objectMapper.readValue(proposal.getDiffJson(), Map.class);
                                    proposalObj.put("diffJson", diffJsonObj);
                                } catch (JsonProcessingException e) {
                                    log.warn("Failed to parse diffJson for proposal: {}", proposal.getId(), e);
                                    proposalObj.put("diffJson", proposal.getDiffJson());
                                }
                            }
                            builder.proposal(proposalObj);
                        }
                    }

                    return builder.build();
                })
                .collect(Collectors.toList());

        return ApiResponse.success(messages);
    }

    // ========== 6.6 工作流执行 ==========
    @PostMapping(value = "/workflows/executions/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "工作流执行", description = "提交DAG工作流并以SSE增量返回执行过程")
    public SseEmitter executeWorkflow(
            @RequestBody WorkflowExecuteRequest request,
            @RequestParam(required = false) Long projectId) {
        log.info("Executing workflow: projectId={}", projectId);
        if (projectId != null) {
            validateProjectOwnership(projectId);
        }

        DAGDTO dag = request.getDag();
        List<ChatDTO.WorkflowEdge> edges = request.getEdges();

        return upstreamClient.executeWorkflow(dag, edges, projectId);
    }

    // ========== 6.7 获取执行详情 ==========
    @GetMapping("/workflows/executions/{executionId}")
    @Operation(summary = "获取执行详情", description = "根据执行ID查询执行详情")
    public ApiResponse<Object> getExecutionDetail(@PathVariable String executionId) {
        log.info("Getting execution detail: executionId={}", executionId);
        Object detail = upstreamClient.getExecutionDetail(executionId);
        return ApiResponse.success(detail);
    }

    // ========== 内部请求类 ==========

    @lombok.Data
    public static class AgentSearchRequest {
        private List<String> tags;
        private Integer pageNo;
        private Integer pageSize;
    }

    @lombok.Data
    public static class WorkflowExecuteRequest {
        private DAGDTO dag;
        private List<ChatDTO.WorkflowEdge> edges;
    }
}
