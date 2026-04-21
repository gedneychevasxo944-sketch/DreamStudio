package com.dream.studio.controller;

import com.dream.studio.dto.ApiResponse;
import com.dream.studio.dto.ChatSessionDTO;
import com.dream.studio.exception.UserNotFoundException;
import com.dream.studio.filter.JwtAuthenticationFilter.UserPrincipal;
import com.dream.studio.service.ChatSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 对话会话控制器
 */
@Slf4j
@RestController
@RequestMapping("/v1/chat/sessions")
@RequiredArgsConstructor
@Tag(name = "对话会话", description = "对话会话管理")
@CrossOrigin(origins = "*")
public class ChatSessionController {

    private final ChatSessionService chatSessionService;

    /**
     * 获取当前登录用户账号
     */
    private String getCurrentAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) authentication.getPrincipal()).account();
        }
        throw new UserNotFoundException("用户未登录");
    }

    /**
     * 获取或创建会话
     */
    @GetMapping
    @Operation(summary = "获取或创建会话", description = "按 projectId 和 userId 获取会话，存在则返回，不存在则创建")
    public ApiResponse<ChatSessionDTO.SessionResponse> getOrCreateSession(
            @RequestParam Long projectId) {
        log.info("Getting or creating session for project: {}", projectId);
        String account = getCurrentAccount();

        ChatSessionDTO.SessionDetail session = chatSessionService.getOrCreateSession(projectId, account);
        return ApiResponse.success(ChatSessionDTO.SessionResponse.builder()
                .session(ChatSessionDTO.SessionItem.builder()
                        .id(session.getId())
                        .projectId(session.getProjectId())
                        .account(session.getAccount())
                        .messageCount(session.getMessageCount())
                        .lastMessageTime(session.getLastMessageTime())
                        .createdTime(session.getCreatedTime())
                        .build())
                .build());
    }

    /**
     * 创建会话
     */
    @PostMapping
    @Operation(summary = "创建会话", description = "创建一个新的对话会话")
    public ApiResponse<ChatSessionDTO.SessionResponse> createSession(
            @RequestBody ChatSessionDTO.CreateRequest request) {
        log.info("Creating session for project: {}", request.getProjectId());
        String account = getCurrentAccount();

        ChatSessionDTO.SessionDetail session = chatSessionService.createSession(request, account);
        return ApiResponse.success(ChatSessionDTO.SessionResponse.builder()
                .session(ChatSessionDTO.SessionItem.builder()
                        .id(session.getId())
                        .projectId(session.getProjectId())
                        .account(session.getAccount())
                        .messageCount(session.getMessageCount())
                        .lastMessageTime(session.getLastMessageTime())
                        .createdTime(session.getCreatedTime())
                        .build())
                .build());
    }

    /**
     * 获取项目会话列表
     */
    @GetMapping("/list")
    @Operation(summary = "获取项目会话列表", description = "获取指定项目的所有会话")
    public ApiResponse<ChatSessionDTO.SessionListResponse> getProjectSessions(
            @RequestParam Long projectId) {
        log.info("Getting sessions for project: {}", projectId);
        // 不验证所有权，会话列表可以公开访问
        ChatSessionDTO.SessionListResponse response = chatSessionService.getProjectSessions(projectId);
        return ApiResponse.success(response);
    }

    /**
     * 获取会话详情
     */
    @GetMapping("/{sessionId}")
    @Operation(summary = "获取会话详情", description = "获取指定会话的详细信息")
    public ApiResponse<ChatSessionDTO.SessionDetail> getSession(
            @PathVariable String sessionId) {
        log.info("Getting session: {}", sessionId);
        ChatSessionDTO.SessionDetail session = chatSessionService.getSession(sessionId);
        return ApiResponse.success(session);
    }

    /**
     * 获取会话消息历史
     */
    @GetMapping("/{sessionId}/messages")
    @Operation(summary = "获取会话消息历史", description = "获取指定会话的消息列表")
    public ApiResponse<ChatSessionDTO.MessageListResponse> getSessionMessages(
            @PathVariable String sessionId,
            @RequestParam(required = false, defaultValue = "50") Integer limit) {
        log.info("Getting messages for session: {}, limit: {}", sessionId, limit);
        ChatSessionDTO.MessageListResponse response = chatSessionService.getSessionMessages(sessionId, limit);
        return ApiResponse.success(response);
    }

    /**
     * 删除会话
     */
    @DeleteMapping("/{sessionId}")
    @Operation(summary = "删除会话", description = "删除指定的会话及其所有消息")
    public ApiResponse<Void> deleteSession(@PathVariable String sessionId) {
        log.info("Deleting session: {}", sessionId);
        chatSessionService.deleteSession(sessionId);
        return ApiResponse.success(null);
    }
}
