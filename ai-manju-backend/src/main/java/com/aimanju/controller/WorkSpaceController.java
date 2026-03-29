package com.aimanju.controller;

import com.aimanju.dto.AgentDTO;
import com.aimanju.dto.ApiResponse;
import com.aimanju.dto.ChatDTO;
import com.aimanju.dto.ExecutionRequest;
import com.aimanju.service.ChatService;
import com.aimanju.service.ExecutionService;
import com.aimanju.service.UpstreamAiClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

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
        log.info("Starting execution for project: {}, executionId: {}", id, request.getExecutionId());
        return executionService.startExecution(id, request);
    }

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "发送消息", description = "向智能体发送消息，SSE流式返回")
    public SseEmitter sendMessage(@RequestBody ChatDTO.SendRequest request) {
        log.info("Sending chat message, project: {}, agent: {}", request.getProjectId(), request.getAgentId());
        return chatService.sendMessageStream(request);
    }

    @GetMapping("/chat")
    @Operation(summary = "获取对话历史", description = "获取项目的对话历史记录")
    public ApiResponse<ChatDTO.HistoryResponse> getChatHistory(
            @RequestParam Long project_id,
            @RequestParam(required = false) Integer version,
            @RequestParam(required = false) String agent_id) {
        log.info("Getting chat history for project: {}, version: {}, agent: {}", project_id, version, agent_id);
        ChatDTO.HistoryResponse response = chatService.getChatHistory(project_id, version, agent_id);
        return ApiResponse.success(response);
    }
}
