package com.dream.studio.service;

import com.dream.studio.dto.AgentDTO;
import com.dream.studio.dto.ChatDTO;
import com.dream.studio.dto.DAGDTO;
import com.dream.studio.dto.TeamDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

/**
 * 真实上游服务实现的 UpstreamClient
 * 调用真实的上游 API
 */
@Slf4j
@Service
public class RealUpstreamClient implements UpstreamClient {

    @Value("${upstream.ai.base-url:http://localhost:8081}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ========== 6.1 搜索智能体列表 ==========
    @Override
    public List<AgentDTO.Response> searchAgents(List<String> tags, int pageNo, int pageSize) {
        log.info("RealUpstreamClient: searchAgents tags={}, pageNo={}, pageSize={}", tags, pageNo, pageSize);

        String url = baseUrl + "/v1/agents/search";
        // TODO: 调用真实 API
        // AgentSearchRequest request = new AgentSearchRequest(tags, pageNo, pageSize);
        // return restTemplate.postForObject(url, request, List.class);

        throw new UnsupportedOperationException("RealUpstreamClient not implemented yet");
    }

    // ========== 6.2 获取智能体详情 ==========
    @Override
    public AgentDTO.Response getAgent(Long agentId) {
        log.info("RealUpstreamClient: getAgent agentId={}", agentId);

        String url = baseUrl + "/v1/agents/" + agentId;
        // TODO: 调用真实 API
        // return restTemplate.getForObject(url, AgentDTO.class);

        throw new UnsupportedOperationException("RealUpstreamClient not implemented yet");
    }

    // ========== 6.3 更新智能体 ==========
    @Override
    public void updateAgent(Long agentId, AgentDTO.UpdateRequest request) {
        log.info("RealUpstreamClient: updateAgent agentId={}", agentId);

        String url = baseUrl + "/v1/agents/" + agentId;
        // TODO: 调用真实 API
        // restTemplate.patchForObject(url, request, Void.class);

        throw new UnsupportedOperationException("RealUpstreamClient not implemented yet");
    }

    // ========== 6.4 智能体对话 (SSE) ==========
    @Override
    public SseEmitter chatStream(String agentId, ChatDTO.SendRequest request) {
        log.info("RealUpstreamClient: chatStream agentId={}", agentId);

        String url = baseUrl + "/v1/agents/" + agentId + "/chat/stream";
        // TODO: 调用真实 SSE API
        // return restTemplate.postForObject(url, request, SseEmitter.class);

        throw new UnsupportedOperationException("RealUpstreamClient not implemented yet");
    }

    // ========== 6.6 工作流执行 (SSE) ==========
    @Override
    public SseEmitter executeWorkflow(DAGDTO dag, List<ChatDTO.WorkflowEdge> edges, Long projectId, ChatDTO.UpstreamContext upstreamContext) {
        log.info("RealUpstreamClient: executeWorkflow projectId={}", projectId);

        String url = baseUrl + "/v1/workflows/executions/stream";
        // TODO: 调用真实 SSE API
        // return restTemplate.postForObject(url, request, SseEmitter.class);

        throw new UnsupportedOperationException("RealUpstreamClient not implemented yet");
    }

    // ========== 6.7 获取执行详情 ==========
    @Override
    public Object getExecutionDetail(String executionId) {
        log.info("RealUpstreamClient: getExecutionDetail executionId={}", executionId);

        String url = baseUrl + "/v1/workflows/executions/" + executionId;
        // TODO: 调用真实 API
        // return restTemplate.getForObject(url, Object.class);

        throw new UnsupportedOperationException("RealUpstreamClient not implemented yet");
    }

    // ========== 6.8 保存团队 ==========
    @Override
    public Long saveTeam(TeamDTO.SaveRequest request) {
        log.info("RealUpstreamClient: saveTeam teamName={}", request.getTeamName());

        String url = baseUrl + "/v1/teams";
        // TODO: 调用真实 API
        // TeamSaveResponse response = restTemplate.postForObject(url, request, TeamSaveResponse.class);
        // return response.getTeamId();

        throw new UnsupportedOperationException("RealUpstreamClient not implemented yet");
    }

    // ========== 6.9 获取团队详情 ==========
    @Override
    public TeamDTO.Response getTeam(Long teamId) {
        log.info("RealUpstreamClient: getTeam teamId={}", teamId);

        String url = baseUrl + "/v1/teams/" + teamId;
        // TODO: 调用真实 API
        // return restTemplate.getForObject(url, TeamDTO.class);

        throw new UnsupportedOperationException("RealUpstreamClient not implemented yet");
    }

    // ========== 6.10 搜索团队 ==========
    @Override
    public TeamDTO.ListResponse searchTeams(List<String> tags, int pageNo, int pageSize) {
        log.info("RealUpstreamClient: searchTeams tags={}, pageNo={}, pageSize={}", tags, pageNo, pageSize);

        String url = baseUrl + "/v1/teams/search";
        // TODO: 调用真实 API
        // TeamSearchRequest request = new TeamSearchRequest(tags, pageNo, pageSize);
        // return restTemplate.postForObject(url, request, TeamDTO.ListResponse.class);

        throw new UnsupportedOperationException("RealUpstreamClient not implemented yet");
    }
}
