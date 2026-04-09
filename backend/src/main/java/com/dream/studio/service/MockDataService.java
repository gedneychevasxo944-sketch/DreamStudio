package com.dream.studio.service;

import com.dream.studio.dto.*;
import com.dream.studio.entity.Asset;
import com.dream.studio.entity.NodeProposal;
import com.dream.studio.entity.NodeVersion;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 模拟数据服务
 * 为版本、资产、提案接口提供模拟数据
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MockDataService {

    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 获取节点版本模拟数据
     */
    public NodeVersionDTO.VersionListResponse getMockVersions(Long projectId, String nodeId) {
        log.info("Providing mock versions for project: {}, node: {}", projectId, nodeId);

        List<NodeVersionDTO.VersionItem> versions = List.of(
            NodeVersionDTO.VersionItem.builder()
                .id(3L)
                .projectId(projectId)
                .nodeId(nodeId)
                .agentId(2L)
                .agentCode("content")
                .nodeType("content")
                .versionNo(3)
                .versionKind("RUN_OUTPUT")
                .isCurrent(true)
                .status("READY")
                .revisionReason(null)
                .diffSummary("第三次运行版本")
                .createdAt(formatTime(10))
                .build(),
            NodeVersionDTO.VersionItem.builder()
                .id(2L)
                .projectId(projectId)
                .nodeId(nodeId)
                .agentId(2L)
                .agentCode("content")
                .nodeType("content")
                .versionNo(2)
                .versionKind("RUN_OUTPUT")
                .isCurrent(false)
                .status("READY")
                .revisionReason(null)
                .diffSummary("第二次运行版本")
                .createdAt(formatTime(60))
                .build(),
            NodeVersionDTO.VersionItem.builder()
                .id(1L)
                .projectId(projectId)
                .nodeId(nodeId)
                .agentId(2L)
                .agentCode("content")
                .nodeType("content")
                .versionNo(1)
                .versionKind("RUN_OUTPUT")
                .isCurrent(false)
                .status("READY")
                .revisionReason(null)
                .diffSummary("首次运行版本")
                .createdAt(formatTime(120))
                .build()
        );

        return NodeVersionDTO.VersionListResponse.builder()
                .versions(versions)
                .total(versions.size())
                .build();
    }

    /**
     * 获取当前版本模拟数据
     */
    public NodeVersionDTO.VersionDetail getMockCurrentVersion(Long projectId, String nodeId) {
        log.info("Providing mock current version for project: {}, node: {}", projectId, nodeId);

        return NodeVersionDTO.VersionDetail.builder()
                .id(3L)
                .projectId(projectId)
                .nodeId(nodeId)
                .agentId(2L)
                .agentCode("content")
                .nodeType("content")
                .versionNo(3)
                .versionKind("RUN_OUTPUT")
                .sourceVersionId(null)
                .sourceExecutionId(1001L)
                .sourceProposalId(null)
                .isCurrent(true)
                .status("READY")
                .inputSnapshotJson("{}")
                .paramSnapshotJson("{}")
                .resultText("分场剧本完成\n\n第1集：清晨的邂逅\n\n场景1-1：城市街道 日 外\n林立（男，28岁）匆匆走在上班路上...")
                .resultJson("{ \"episodes\": 2, \"scenes\": 15, \"duration\": \"25分钟\" }")
                .thinkingText("[\"构建故事框架...\", \"设计角色弧线...\", \"编写分场剧本...\", \"优化对白和节奏...\"]")
                .revisionReason(null)
                .diffSummary(null)
                .createdAt(formatTime(10))
                .build();
    }

    /**
     * 获取资产模拟数据
     */
    public AssetDTO.AssetListResponse getMockAssets(Long projectId, String nodeId) {
        log.info("Providing mock assets for project: {}, node: {}", projectId, nodeId);

        List<AssetDTO.AssetItem> assets = List.of(
            AssetDTO.AssetItem.builder()
                .id(1L)
                .projectId(projectId)
                .nodeId(nodeId)
                .nodeVersionId(3L)
                .agentId(3L)
                .assetType("IMAGE")
                .assetRole("PRIMARY_RESULT")
                .title("场景概念图1")
                .uri("https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800")
                .coverUri("https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200")
                .mimeType("image/jpeg")
                .fileSize(245000L)
                .metadataJson("{\"width\":800,\"height\":600}")
                .isCurrent(true)
                .status("READY")
                .createdAt(formatTime(10))
                .build(),
            AssetDTO.AssetItem.builder()
                .id(2L)
                .projectId(projectId)
                .nodeId(nodeId)
                .nodeVersionId(3L)
                .agentId(3L)
                .assetType("IMAGE")
                .assetRole("PRIMARY_RESULT")
                .title("场景概念图2")
                .uri("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800")
                .coverUri("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200")
                .mimeType("image/jpeg")
                .fileSize(198000L)
                .metadataJson("{\"width\":800,\"height\":600}")
                .isCurrent(true)
                .status("READY")
                .createdAt(formatTime(10))
                .build(),
            AssetDTO.AssetItem.builder()
                .id(3L)
                .projectId(projectId)
                .nodeId(nodeId)
                .nodeVersionId(2L)
                .agentId(3L)
                .assetType("IMAGE")
                .assetRole("REFERENCE")
                .title("参考图（历史）")
                .uri("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800")
                .coverUri("https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200")
                .mimeType("image/jpeg")
                .fileSize(156000L)
                .metadataJson("{\"width\":800,\"height\":600}")
                .isCurrent(false)
                .status("ARCHIVED")
                .createdAt(formatTime(60))
                .build()
        );

        return AssetDTO.AssetListResponse.builder()
                .assets(assets)
                .total(assets.size())
                .build();
    }

    /**
     * 获取提案模拟数据
     */
    public NodeProposalDTO.ProposalListResponse getMockProposals(Long projectId, String nodeId) {
        log.info("Providing mock proposals for project: {}, node: {}", projectId, nodeId);

        List<NodeProposalDTO.ProposalItem> proposals = List.of(
            NodeProposalDTO.ProposalItem.builder()
                .id(2L)
                .projectId(projectId)
                .nodeId(nodeId)
                .agentId(2L)
                .proposalType("EDIT")
                .title("剧本优化建议")
                .summary("建议优化第二幕的对白，增强情感张力")
                .changeInstruction("将林浩与陈雨的对话修改为更冲突的版本")
                .applyStrategy("PATCH_ONLY")
                .status("PENDING")
                .createdAt(formatTime(5))
                .build(),
            NodeProposalDTO.ProposalItem.builder()
                .id(1L)
                .projectId(projectId)
                .nodeId(nodeId)
                .agentId(2L)
                .proposalType("REGENERATE")
                .title("重写第一集开头")
                .summary("建议重新生成第一集的开场场景，以更快地吸引观众")
                .changeInstruction("将开场从街道场景改为办公室场景，更快进入主题")
                .applyStrategy("RERUN_REQUIRED")
                .status("APPLIED")
                .createdAt(formatTime(30))
                .build()
        );

        return NodeProposalDTO.ProposalListResponse.builder()
                .proposals(proposals)
                .total(proposals.size())
                .build();
    }

    /**
     * 获取提案详情模拟数据
     */
    public NodeProposalDTO.ProposalDetail getMockProposalDetail(Long projectId, String nodeId, Long proposalId) {
        log.info("Providing mock proposal detail for project: {}, node: {}, proposal: {}", projectId, nodeId, proposalId);

        ProposalDiff diff = ProposalDiff.builder()
                .diffType("TEXT_DIFF")
                .title("剧本差异对比")
                .summary("修改了第2集第3场的对白内容")
                .textDiff(ProposalDiff.TextDiff.builder()
                        .beforeText("场景2-3：咖啡馆 日 内\n林浩：我觉得这个项目很有前景...\n陈雨：但是风险太大了。")
                        .afterText("场景2-3：咖啡馆 日 内\n林浩：相信我，这个创意一定会火的！\n陈雨：你确定？这可不是闹着玩的。")
                        .segments(List.of(
                            ProposalDiff.DiffSegment.builder().type("EQUAL").content("场景2-3：咖啡馆 日 内\n").build(),
                            ProposalDiff.DiffSegment.builder().type("REMOVE").content("林浩：我觉得这个项目很有前景...\n陈雨：但是风险太大了。").build(),
                            ProposalDiff.DiffSegment.builder().type("ADD").content("林浩：相信我，这个创意一定会火的！\n陈雨：你确定？这可不是闹着玩的。").build()
                        ))
                        .build())
                .build();

        return NodeProposalDTO.ProposalDetail.builder()
                .id(proposalId)
                .projectId(projectId)
                .nodeId(nodeId)
                .agentId(2L)
                .proposalType("EDIT")
                .title("剧本优化建议")
                .summary("建议优化第二幕的对白，增强情感张力")
                .changeInstruction("将林浩与陈雨的对话修改为更冲突的版本")
                .beforeSnapshotJson("{\"resultText\": \"场景2-3：咖啡馆 日 内\\n林浩：我觉得这个项目很有前景...\\n陈雨：但是风险太大了。\"}")
                .afterSnapshotJson("{\"resultText\": \"场景2-3：咖啡馆 日 内\\n林浩：相信我，这个创意一定会火的！\\n陈雨：你确定？这可不是闹着玩的。\"}")
                .diffJson(diff)
                .impactNodes(List.of("content-2", "visual-1"))
                .applyStrategy("PATCH_ONLY")
                .status("PENDING")
                .createdAt(formatTime(5))
                .appliedAt(null)
                .build();
    }

    private String formatTime(int minutesAgo) {
        return LocalDateTime.now().minusMinutes(minutesAgo).format(DATE_FORMATTER);
    }
}
