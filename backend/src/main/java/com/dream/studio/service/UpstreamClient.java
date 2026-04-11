package com.dream.studio.service;

import com.dream.studio.dto.AgentDTO;
import com.dream.studio.dto.ChatDTO;
import com.dream.studio.dto.DAGDTO;
import com.dream.studio.dto.TeamDTO;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

/**
 * 上游服务客户端接口
 * 定义与上游智能体服务交互的所有方法
 */
public interface UpstreamClient {

    // ========== 智能体 (6.1, 6.2, 6.3, 6.4) ==========

    /**
     * 6.1 搜索智能体列表
     * POST /v1/agents/search
     */
    List<AgentDTO.Response> searchAgents(List<String> tags, int pageNo, int pageSize);

    /**
     * 6.2 获取智能体详情
     * GET /v1/agents/{agentId}
     */
    AgentDTO.Response getAgent(Long agentId);

    /**
     * 6.3 更新智能体
     * PATCH /v1/agents/{agentId}
     */
    void updateAgent(Long agentId, AgentDTO.UpdateRequest request);

    /**
     * 6.4 智能体对话 (SSE)
     * POST /v1/agents/{agentId}/chat/stream
     */
    SseEmitter chatStream(String agentId, ChatDTO.SendRequest request);

    // ========== 工作流执行 (6.6, 6.7) ==========

    /**
     * 6.6 工作流执行 (SSE)
     * POST /v1/workflows/executions/stream
     */
    SseEmitter executeWorkflow(DAGDTO dag, List<ChatDTO.WorkflowEdge> edges, Long projectId);

    /**
     * 6.7 获取执行详情
     * GET /v1/workflows/executions/{executionId}
     */
    Object getExecutionDetail(String executionId);

    // ========== 团队 (6.8, 6.9, 6.10) ==========

    /**
     * 6.8 保存团队
     * POST /v1/teams
     */
    Long saveTeam(TeamDTO.SaveRequest request);

    /**
     * 6.9 获取团队详情
     * GET /v1/teams/{teamId}
     */
    TeamDTO.Response getTeam(Long teamId);

    /**
     * 6.10 搜索团队
     * POST /v1/teams/search
     */
    TeamDTO.ListResponse searchTeams(List<String> tags, int pageNo, int pageSize);
}
