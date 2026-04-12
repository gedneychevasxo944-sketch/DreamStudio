package com.dream.studio.service;

import com.dream.studio.dto.NodeVersionDTO;
import com.dream.studio.entity.NodeVersion;
import com.dream.studio.entity.Project;
import com.dream.studio.exception.InvalidOperationException;
import com.dream.studio.exception.ProjectNotFoundException;
import com.dream.studio.repository.NodeVersionRepository;
import com.dream.studio.repository.ProjectRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NodeVersionService {

    private final NodeVersionRepository nodeVersionRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 获取节点版本列表
     */
    @Transactional(readOnly = true)
    public NodeVersionDTO.VersionListResponse getVersions(Long projectId, String nodeId) {
        log.info("Getting versions for project: {}, node: {}", projectId, nodeId);

        List<NodeVersion> versions = nodeVersionRepository.findByProjectIdAndNodeIdOrderByVersionNoDesc(projectId, nodeId);

        List<NodeVersionDTO.VersionItem> items = versions.stream()
                .map(this::toVersionItem)
                .collect(Collectors.toList());

        return NodeVersionDTO.VersionListResponse.builder()
                .versions(items)
                .total(items.size())
                .build();
    }

    /**
     * 获取当前版本
     */
    @Transactional(readOnly = true)
    public NodeVersionDTO.VersionDetail getCurrentVersion(Long projectId, String nodeId) {
        log.info("Getting current version for project: {}, node: {}", projectId, nodeId);

        NodeVersion version = nodeVersionRepository.findByProjectIdAndNodeIdAndIsCurrent(projectId, nodeId, true)
                .orElseThrow(() -> new InvalidOperationException("No current version found for node: " + nodeId));

        return toVersionDetail(version);
    }

    /**
     * 获取当前版本（返回 Optional）
     */
    @Transactional(readOnly = true)
    public Optional<NodeVersionDTO.VersionDetail> getCurrentVersionOptional(Long projectId, String nodeId) {
        log.info("Getting current version (optional) for project: {}, node: {}", projectId, nodeId);

        return nodeVersionRepository.findByProjectIdAndNodeIdAndIsCurrent(projectId, nodeId, true)
                .map(this::toVersionDetail);
    }

    /**
     * 获取版本详情
     */
    @Transactional(readOnly = true)
    public NodeVersionDTO.VersionDetail getVersionDetail(Long projectId, String nodeId, Long versionId) {
        log.info("Getting version detail for project: {}, node: {}, version: {}", projectId, nodeId, versionId);

        NodeVersion version = nodeVersionRepository.findByIdAndProjectId(versionId, projectId)
                .filter(v -> v.getNodeId().equals(nodeId))
                .orElseThrow(() -> new InvalidOperationException("Version not found: " + versionId));

        return toVersionDetail(version);
    }

    /**
     * 获取版本详情（包含上游节点信息）
     */
    @Transactional(readOnly = true)
    public NodeVersionDTO.VersionDetail getVersionDetailWithUpstream(Long projectId, String nodeId, Long versionId) {
        log.info("Getting version detail with upstream for project: {}, node: {}, version: {}", projectId, nodeId, versionId);

        NodeVersion version = nodeVersionRepository.findByIdAndProjectId(versionId, projectId)
                .filter(v -> v.getNodeId().equals(nodeId))
                .orElseThrow(() -> new InvalidOperationException("Version not found: " + versionId));

        NodeVersionDTO.VersionDetail detail = toVersionDetail(version);

        // 解析上游节点信息
        if (version.getUpstreamNodeIds() != null && !version.getUpstreamNodeIds().isEmpty()) {
            try {
                List<NodeVersionDTO.UpstreamNode> upstreamNodes = parseUpstreamNodes(version.getUpstreamNodeIds(), projectId);
                detail.setUpstreamNodes(upstreamNodes);
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse upstreamNodeIds: {}", version.getUpstreamNodeIds(), e);
            }
        }

        return detail;
    }

    /**
     * 解析上游节点信息
     * 支持新旧两种格式：
     * - 新格式: [{"nodeId": "B", "versionId": 123}]
     * - 旧格式: ["B", "A"]
     */
    private List<NodeVersionDTO.UpstreamNode> parseUpstreamNodes(String upstreamNodeIdsJson, Long projectId) throws JsonProcessingException {
        List<Object> parsed = objectMapper.readValue(upstreamNodeIdsJson, List.class);

        // 判断是新格式还是旧格式
        if (parsed.isEmpty() || !(parsed.get(0) instanceof Map)) {
            // 旧格式: 直接是节点ID列表，转为新格式后查询
            return parseLegacyFormat(parsed, projectId);
        }

        // 新格式: [{"nodeId": "B", "versionId": 123}]
        return parsed.stream()
                .map(item -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> map = (Map<String, Object>) item;
                    String upstreamNodeId = (String) map.get("nodeId");
                    Object versionIdObj = map.get("versionId");

                    NodeVersion upstreamVersion = null;
                    if (versionIdObj != null) {
                        // 直接用 versionId 查询对应版本
                        Long versionId = versionIdObj instanceof Integer
                                ? ((Integer) versionIdObj).longValue()
                                : (Long) versionIdObj;
                        upstreamVersion = nodeVersionRepository.findById(versionId).orElse(null);
                    }

                    return NodeVersionDTO.UpstreamNode.builder()
                            .nodeId(upstreamNodeId)
                            .nodeName(upstreamVersion != null ? getNodeDisplayName(upstreamVersion) : upstreamNodeId)
                            .output(upstreamVersion != null ? upstreamVersion.getResultText() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 解析旧格式的 upstreamNodeIds（仅包含节点ID列表）
     * 用于兼容旧数据
     */
    private List<NodeVersionDTO.UpstreamNode> parseLegacyFormat(List<Object> upstreamNodeIds, Long projectId) {
        return upstreamNodeIds.stream()
                .map(item -> {
                    String upstreamNodeId = (String) item;
                    // 获取该上游节点的当前版本
                    var latestVersion = nodeVersionRepository
                            .findByProjectIdAndNodeIdAndIsCurrent(projectId, upstreamNodeId, true)
                            .orElse(null);
                    return NodeVersionDTO.UpstreamNode.builder()
                            .nodeId(upstreamNodeId)
                            .nodeName(latestVersion != null ? getNodeDisplayName(latestVersion) : upstreamNodeId)
                            .output(latestVersion != null ? latestVersion.getResultText() : null)
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * 获取节点的显示名称
     */
    private String getNodeDisplayName(NodeVersion version) {
        if (version == null) return "未知节点";
        // 优先使用 agentCode，其次使用 nodeType
        String code = version.getAgentCode();
        if (code != null && !code.isEmpty()) {
            return code;
        }
        String type = version.getNodeType();
        if (type != null && !type.isEmpty()) {
            return type;
        }
        return version.getNodeId();
    }

    /**
     * 激活版本
     */
    @Transactional
    public NodeVersionDTO.ActivateResponse activateVersion(Long projectId, String nodeId, Long versionId) {
        log.info("Activating version: {} for project: {}, node: {}", versionId, projectId, nodeId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + projectId));

        NodeVersion version = nodeVersionRepository.findByIdAndProjectId(versionId, projectId)
                .filter(v -> v.getNodeId().equals(nodeId))
                .orElseThrow(() -> new InvalidOperationException("Version not found: " + versionId));

        // 取消当前版本
        nodeVersionRepository.clearCurrentByProjectAndNode(projectId, nodeId);

        // 激活选中的版本
        version.setIsCurrent(true);
        nodeVersionRepository.save(version);

        // TODO: 计算下游受影响的节点（需要根据 DAG 计算）

        return NodeVersionDTO.ActivateResponse.builder()
                .activatedVersionId(versionId)
                .affectedNodeIds(List.of())
                .message("Version activated successfully")
                .build();
    }

    /**
     * 创建节点版本
     */
    @Transactional
    public NodeVersion createVersion(NodeVersion version) {
        // 获取最大版本号
        Integer maxVersion = nodeVersionRepository.findMaxVersionNo(version.getProjectId(), version.getNodeId())
                .orElse(0);

        version.setVersionNo(maxVersion + 1);
        version.setIsCurrent(true);

        // 清除当前版本
        nodeVersionRepository.clearCurrentByProjectAndNode(version.getProjectId(), version.getNodeId());

        return nodeVersionRepository.save(version);
    }

    /**
     * 获取节点运行记录（基于 sourceExecutionId 分组）
     */
    @Transactional(readOnly = true)
    public List<NodeVersionDTO.VersionItem> getHistoryByNode(Long projectId, String nodeId) {
        List<NodeVersion> versions = nodeVersionRepository.findByProjectIdAndNodeIdOrderByVersionNoDesc(projectId, nodeId);

        return versions.stream()
                .map(this::toVersionItem)
                .collect(Collectors.toList());
    }

    private NodeVersionDTO.VersionItem toVersionItem(NodeVersion version) {
        return NodeVersionDTO.VersionItem.builder()
                .id(version.getId())
                .projectId(version.getProjectId())
                .nodeId(version.getNodeId())
                .agentId(version.getAgentId())
                .agentCode(version.getAgentCode())
                .nodeType(version.getNodeType())
                .versionNo(version.getVersionNo())
                .versionKind(version.getVersionKind())
                .isCurrent(version.getIsCurrent())
                .status(version.getStatus())
                .revisionReason(version.getRevisionReason())
                .diffSummary(version.getDiffSummary())
                .createdAt(version.getCreatedTime() != null ? version.getCreatedTime().format(DATE_FORMATTER) : null)
                .build();
    }

    private NodeVersionDTO.VersionDetail toVersionDetail(NodeVersion version) {
        return NodeVersionDTO.VersionDetail.builder()
                .id(version.getId())
                .projectId(version.getProjectId())
                .nodeId(version.getNodeId())
                .agentId(version.getAgentId())
                .agentCode(version.getAgentCode())
                .nodeType(version.getNodeType())
                .versionNo(version.getVersionNo())
                .versionKind(version.getVersionKind())
                .sourceVersionId(version.getSourceVersionId())
                .sourceExecutionId(version.getSourceExecutionId())
                .sourceProposalId(version.getSourceProposalId())
                .isCurrent(version.getIsCurrent())
                .status(version.getStatus())
                .inputSnapshotJson(version.getInputSnapshotJson())
                .paramSnapshotJson(version.getParamSnapshotJson())
                .resultText(version.getResultText())
                .resultJson(version.getResultJson())
                .thinkingText(version.getThinkingText())
                .revisionReason(version.getRevisionReason())
                .diffSummary(version.getDiffSummary())
                .upstreamNodeIds(version.getUpstreamNodeIds())
                .createdAt(version.getCreatedTime() != null ? version.getCreatedTime().format(DATE_FORMATTER) : null)
                .build();
    }
}
