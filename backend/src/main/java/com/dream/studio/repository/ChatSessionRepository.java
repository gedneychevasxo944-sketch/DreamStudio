package com.dream.studio.repository;

import com.dream.studio.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, String> {

    List<ChatSession> findByProjectIdOrderByUpdatedTimeDesc(Long projectId);

    Optional<ChatSession> findByProjectIdAndAccount(Long projectId, String account);

    @Modifying
    @Query("UPDATE ChatSession c SET c.messageCount = c.messageCount + 1, c.lastMessageTime = CURRENT_TIMESTAMP WHERE c.id = :sessionId")
    void incrementMessageCount(@Param("sessionId") String sessionId);
}