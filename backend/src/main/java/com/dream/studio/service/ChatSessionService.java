package com.dream.studio.service;

import com.dream.studio.dto.ChatSessionDTO;
import com.dream.studio.entity.ChatSession;
import com.dream.studio.entity.Message;
import com.dream.studio.repository.ChatSessionRepository;
import com.dream.studio.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 对话会话服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatSessionService {

    private final ChatSessionRepository chatSessionRepository;
    private final MessageRepository messageRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 获取或创建会话
     */
    @Transactional
    public ChatSessionDTO.SessionDetail getOrCreateSession(Long projectId, String account) {
        log.info("Getting or creating session for project: {}, account: {}", projectId, account);

        ChatSession session = chatSessionRepository.findByProjectIdAndAccount(projectId, account)
                .orElseGet(() -> {
                    log.info("Session not found, creating new one");
                    ChatSession newSession = ChatSession.builder()
                            .id(UUID.randomUUID().toString())
                            .projectId(projectId)
                            .account(account)
                            .messageCount(0)
                            .build();
                    return chatSessionRepository.save(newSession);
                });

        return toSessionDetail(session);
    }

    /**
     * 创建会话
     */
    @Transactional
    public ChatSessionDTO.SessionDetail createSession(ChatSessionDTO.CreateRequest request, String account) {
        log.info("Creating session for project: {}, account: {}", request.getProjectId(), account);

        ChatSession session = ChatSession.builder()
                .id(UUID.randomUUID().toString())
                .projectId(request.getProjectId())
                .account(account)
                .messageCount(0)
                .build();

        ChatSession savedSession = chatSessionRepository.save(session);
        return toSessionDetail(savedSession);
    }

    /**
     * 获取项目会话列表
     */
    @Transactional(readOnly = true)
    public ChatSessionDTO.SessionListResponse getProjectSessions(Long projectId) {
        log.info("Getting sessions for project: {}", projectId);

        List<ChatSession> sessions = chatSessionRepository.findByProjectIdOrderByUpdatedTimeDesc(projectId);

        List<ChatSessionDTO.SessionItem> items = sessions.stream()
                .map(this::toSessionItem)
                .collect(Collectors.toList());

        return ChatSessionDTO.SessionListResponse.builder()
                .sessions(items)
                .total(items.size())
                .build();
    }

    /**
     * 获取会话详情
     */
    @Transactional(readOnly = true)
    public ChatSessionDTO.SessionDetail getSession(String sessionId) {
        log.info("Getting session: {}", sessionId);

        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        return toSessionDetail(session);
    }

    /**
     * 获取会话消息历史
     */
    @Transactional(readOnly = true)
    public ChatSessionDTO.MessageListResponse getSessionMessages(String sessionId, Integer limit) {
        log.info("Getting messages for session: {}, limit: {}", sessionId, limit);

        List<Message> messages = messageRepository.findBySessionIdOrderByCreatedTimeAsc(sessionId);

        int size = limit != null && limit > 0 ? Math.min(limit, messages.size()) : messages.size();
        List<Message> limitedMessages = messages.subList(0, size);

        List<ChatSessionDTO.MessageItem> items = limitedMessages.stream()
                .map(this::toMessageItem)
                .collect(Collectors.toList());

        return ChatSessionDTO.MessageListResponse.builder()
                .messages(items)
                .total(messages.size())
                .hasMore(messages.size() > size)
                .build();
    }

    /**
     * 删除会话
     */
    @Transactional
    public void deleteSession(String sessionId) {
        log.info("Deleting session: {}", sessionId);
        chatSessionRepository.deleteById(sessionId);
    }

    private ChatSessionDTO.SessionItem toSessionItem(ChatSession session) {
        return ChatSessionDTO.SessionItem.builder()
                .id(session.getId())
                .projectId(session.getProjectId())
                .account(session.getAccount())
                .messageCount(session.getMessageCount())
                .lastMessageTime(session.getLastMessageTime() != null ? session.getLastMessageTime().format(DATE_FORMATTER) : null)
                .createdTime(session.getCreatedTime() != null ? session.getCreatedTime().format(DATE_FORMATTER) : null)
                .build();
    }

    private ChatSessionDTO.SessionDetail toSessionDetail(ChatSession session) {
        return ChatSessionDTO.SessionDetail.builder()
                .id(session.getId())
                .projectId(session.getProjectId())
                .account(session.getAccount())
                .messageCount(session.getMessageCount())
                .lastMessageTime(session.getLastMessageTime() != null ? session.getLastMessageTime().format(DATE_FORMATTER) : null)
                .createdTime(session.getCreatedTime() != null ? session.getCreatedTime().format(DATE_FORMATTER) : null)
                .updatedTime(session.getUpdatedTime() != null ? session.getUpdatedTime().format(DATE_FORMATTER) : null)
                .build();
    }

    private ChatSessionDTO.MessageItem toMessageItem(Message message) {
        return ChatSessionDTO.MessageItem.builder()
                .messageId(message.getMessageId())
                .sessionId(message.getSessionId())
                .role(message.getUserContent() != null ? "user" : "assistant")
                .content(message.getUserContent() != null ? message.getUserContent() : message.getAssistantContent())
                .thinking(message.getThinking())
                .attachments(message.getUserAttachments())
                .assets(message.getAssistantAssets())
                .metadata(message.getMetadata())
                .createdTime(message.getCreatedTime() != null ? message.getCreatedTime().format(DATE_FORMATTER) : null)
                .build();
    }
}
