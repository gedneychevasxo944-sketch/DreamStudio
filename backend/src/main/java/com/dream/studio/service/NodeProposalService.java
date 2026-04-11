package com.dream.studio.service;

import com.dream.studio.dto.NodeProposalDTO;
import com.dream.studio.dto.ProposalDiff;
import com.dream.studio.entity.NodeProposal;
import com.dream.studio.entity.NodeVersion;
import com.dream.studio.entity.Project;
import com.dream.studio.exception.InvalidOperationException;
import com.dream.studio.exception.ProjectNotFoundException;
import com.dream.studio.repository.NodeProposalRepository;
import com.dream.studio.repository.NodeVersionRepository;
import com.dream.studio.repository.ProjectRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NodeProposalService {

    private final NodeProposalRepository nodeProposalRepository;
    private final NodeVersionRepository nodeVersionRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 获取节点提案列表
     */
    @Transactional(readOnly = true)
    public NodeProposalDTO.ProposalListResponse getProposals(Long projectId, String nodeId) {
        log.info("Getting proposals for project: {}, node: {}", projectId, nodeId);

        List<NodeProposal> proposals = nodeProposalRepository.findByProjectIdAndNodeIdOrderByCreatedTimeDesc(projectId, nodeId);

        List<NodeProposalDTO.ProposalItem> items = proposals.stream()
                .map(this::toProposalItem)
                .collect(Collectors.toList());

        return NodeProposalDTO.ProposalListResponse.builder()
                .proposals(items)
                .total(items.size())
                .build();
    }

    /**
     * 获取提案详情
     */
    @Transactional(readOnly = true)
    public NodeProposalDTO.ProposalDetail getProposalDetail(Long projectId, String nodeId, Long proposalId) {
        log.info("Getting proposal detail for project: {}, node: {}, proposal: {}", projectId, nodeId, proposalId);

        NodeProposal proposal = nodeProposalRepository.findByIdAndProjectIdAndNodeId(proposalId, projectId, nodeId)
                .orElseThrow(() -> new InvalidOperationException("Proposal not found: " + proposalId));

        return toProposalDetail(proposal);
    }

    /**
     * 获取节点已应用的提案（用于前端临时展示）
     */
    @Transactional(readOnly = true)
    public NodeProposalDTO.ProposalDetail getAppliedProposal(Long projectId, String nodeId) {
        log.info("getAppliedProposal called: projectId={}, nodeId={}", projectId, nodeId);
        List<NodeProposal> proposals = nodeProposalRepository.findByProjectIdAndNodeIdOrderByCreatedTimeDesc(projectId, nodeId);
        log.info("Found proposals count: {}", proposals.size());
        // 找到最新一个 APPLIED 状态的提案
        return proposals.stream()
                .filter(p -> "APPLIED".equals(p.getStatus()))
                .findFirst()
                .map(this::toProposalDetail)
                .orElse(null);
    }

    /**
     * 应用提案
     */
    @Transactional
    public void applyProposal(Long projectId, String nodeId, Long proposalId) {
        log.info("Applying proposal: {} for project: {}, node: {}", proposalId, projectId, nodeId);

        // 先查找所有该项目的提案，看看nodeId是什么
        List<NodeProposal> allProposals = nodeProposalRepository.findByProjectIdAndStatus(projectId, "PENDING");
        log.info("PENDING proposals for project {}: {}", projectId, allProposals.size());
        for (NodeProposal p : allProposals) {
            log.info("  Proposal: id={}, nodeId={}, status={}", p.getId(), p.getNodeId(), p.getStatus());
        }

        NodeProposal proposal = nodeProposalRepository.findByIdAndProjectIdAndNodeId(proposalId, projectId, nodeId)
                .orElseThrow(() -> new InvalidOperationException("Proposal not found: " + proposalId));

        if (!"PENDING".equals(proposal.getStatus())) {
            throw new InvalidOperationException("Proposal is not pending: " + proposal.getStatus());
        }

        // 只更新提案状态，不修改 nodeVersion.resultText（等运行时再保存）
        proposal.setStatus("APPLIED");
        proposal.setAppliedTime(LocalDateTime.now());
        nodeProposalRepository.save(proposal);
    }

    /**
     * 拒绝提案
     */
    @Transactional
    public void rejectProposal(Long projectId, String nodeId, Long proposalId) {
        log.info("Rejecting proposal: {} for project: {}, node: {}", proposalId, projectId, nodeId);

        NodeProposal proposal = nodeProposalRepository.findByIdAndProjectIdAndNodeId(proposalId, projectId, nodeId)
                .orElseThrow(() -> new InvalidOperationException("Proposal not found: " + proposalId));

        if (!"PENDING".equals(proposal.getStatus())) {
            throw new InvalidOperationException("Proposal is not pending: " + proposal.getStatus());
        }

        proposal.setStatus("REJECTED");
        nodeProposalRepository.save(proposal);
    }

    /**
     * 创建提案
     */
    @Transactional
    public NodeProposal createProposal(NodeProposal proposal) {
        proposal.setStatus("PENDING");
        return nodeProposalRepository.save(proposal);
    }

    private NodeProposalDTO.ProposalItem toProposalItem(NodeProposal proposal) {
        return NodeProposalDTO.ProposalItem.builder()
                .id(proposal.getId())
                .projectId(proposal.getProjectId())
                .nodeId(proposal.getNodeId())
                .agentId(proposal.getAgentId())
                .proposalType(proposal.getProposalType())
                .title(proposal.getTitle())
                .summary(proposal.getSummary())
                .changeInstruction(proposal.getChangeInstruction())
                .applyStrategy(proposal.getApplyStrategy())
                .status(proposal.getStatus())
                .createdAt(proposal.getCreatedTime() != null ? proposal.getCreatedTime().format(DATE_FORMATTER) : null)
                .build();
    }

    private NodeProposalDTO.ProposalDetail toProposalDetail(NodeProposal proposal) {
        ProposalDiff diff = null;
        if (proposal.getDiffJson() != null) {
            try {
                diff = objectMapper.readValue(proposal.getDiffJson(), ProposalDiff.class);
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse diffJson for proposal: {}", proposal.getId(), e);
            }
        }

        return NodeProposalDTO.ProposalDetail.builder()
                .id(proposal.getId())
                .projectId(proposal.getProjectId())
                .nodeId(proposal.getNodeId())
                .agentId(proposal.getAgentId())
                .proposalType(proposal.getProposalType())
                .title(proposal.getTitle())
                .summary(proposal.getSummary())
                .changeInstruction(proposal.getChangeInstruction())
                .beforeSnapshotJson(proposal.getBeforeSnapshotJson())
                .afterSnapshotJson(proposal.getAfterSnapshotJson())
                .diffJson(diff)
                .applyStrategy(proposal.getApplyStrategy())
                .status(proposal.getStatus())
                .createdAt(proposal.getCreatedTime() != null ? proposal.getCreatedTime().format(DATE_FORMATTER) : null)
                .appliedAt(proposal.getAppliedTime() != null ? proposal.getAppliedTime().format(DATE_FORMATTER) : null)
                .build();
    }
}
