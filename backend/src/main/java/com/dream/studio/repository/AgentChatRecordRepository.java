package com.dream.studio.repository;

import com.dream.studio.entity.AgentChatRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentChatRecordRepository extends JpaRepository<AgentChatRecord, Long> {

    List<AgentChatRecord> findByProjectIdAndProjectVersionOrderByCreateTimeAsc(Long projectId, Integer projectVersion);

    List<AgentChatRecord> findByProjectIdAndAgentIdOrderByCreateTimeAsc(Long projectId, String agentId);

    List<AgentChatRecord> findByProjectIdAndNodeIdOrderByCreateTimeAsc(Long projectId, String nodeId);

    Optional<AgentChatRecord> findByMessageId(Long messageId);
}
