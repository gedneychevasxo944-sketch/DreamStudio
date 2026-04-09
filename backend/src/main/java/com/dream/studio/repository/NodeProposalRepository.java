package com.dream.studio.repository;

import com.dream.studio.entity.NodeProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NodeProposalRepository extends JpaRepository<NodeProposal, Long> {

    List<NodeProposal> findByProjectIdAndNodeIdOrderByCreatedTimeDesc(Long projectId, String nodeId);

    Optional<NodeProposal> findByIdAndProjectIdAndNodeId(Long id, Long projectId, String nodeId);

    List<NodeProposal> findByProjectIdAndNodeIdAndStatus(Long projectId, String nodeId, String status);

    List<NodeProposal> findByProjectIdAndStatus(Long projectId, String status);
}
