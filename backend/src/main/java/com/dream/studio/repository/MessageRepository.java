package com.dream.studio.repository;

import com.dream.studio.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findBySessionIdOrderByCreatedTimeAsc(String sessionId);

    Optional<Message> findBySessionIdAndMessageId(String sessionId, String messageId);

    long countBySessionId(String sessionId);
}
