package com.dream.studio.controller;

import com.dream.studio.dto.AgentDTO;
import com.dream.studio.dto.ApiResponse;
import com.dream.studio.dto.ChatDTO;
import com.dream.studio.dto.ExecutionRequest;
import com.dream.studio.entity.User;
import com.dream.studio.exception.ProjectNotFoundException;
import com.dream.studio.exception.UserNotFoundException;
import com.dream.studio.filter.JwtAuthenticationFilter.UserPrincipal;
import com.dream.studio.repository.ProjectRepository;
import com.dream.studio.repository.UserRepository;
import com.dream.studio.service.ChatService;
import com.dream.studio.service.ExecutionService;
import com.dream.studio.service.UpstreamAiClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@RestController
@RequestMapping("/workspace")
@RequiredArgsConstructor
@Tag(name = "工作台模块", description = "智能体、执行、对话")
@CrossOrigin(origins = "*")
public class WorkSpaceController {

    private final UpstreamAiClient upstreamAiClient;
    private final ExecutionService executionService;
    private final ChatService chatService;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

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

    @GetMapping("/agents")
    @Operation(summary = "获取智能体列表", description = "获取所有可用的AI智能体")
    public ApiResponse<AgentDTO.ListResponse> getAgents() {
        log.info("Getting agents list");
        AgentDTO.ListResponse response = AgentDTO.ListResponse.builder()
                .agents(upstreamAiClient.getAgents())
                .total(upstreamAiClient.getAgents().size())
                .build();
        return ApiResponse.success(response);
    }

    @PostMapping(value = "/projects/{id}/execute", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "启动执行", description = "启动工作流执行，同时建立SSE连接")
    public SseEmitter startExecution(
            @PathVariable Long id,
            @RequestBody ExecutionRequest request) {
        validateProjectOwnership(id);
        log.info("Starting execution for project: {}, executionId: {}", id, request.getExecutionId());
        return executionService.startExecution(id, request);
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "发送消息", description = "向智能体发送消息，SSE流式返回")
    public SseEmitter sendMessage(@RequestBody ChatDTO.SendRequest request) {
        validateProjectOwnership(request.getProjectId());
        log.info("Sending chat message, project: {}, agent: {}", request.getProjectId(), request.getAgentId());
        return chatService.sendMessageStream(request);
    }

    @GetMapping("/chat")
    @Operation(summary = "获取对话历史", description = "获取项目的对话历史记录")
    public ApiResponse<ChatDTO.HistoryResponse> getChatHistory(
            @RequestParam Long project_id,
            @RequestParam(required = false) Integer version,
            @RequestParam(required = false) String agent_id) {
        validateProjectOwnership(project_id);
        log.info("Getting chat history for project: {}, version: {}, agent: {}", project_id, version, agent_id);
        ChatDTO.HistoryResponse response = chatService.getChatHistory(project_id, version, agent_id);
        return ApiResponse.success(response);
    }
}
