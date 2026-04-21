package com.dream.studio.service;

import com.dream.studio.dto.*;
import com.dream.studio.sim.MockDataCenter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 模拟数据服务
 * 使用 MockDataCenter 统一提供模拟数据
 * @deprecated 使用 MockDataCenter 直接获取数据，此服务保留用于兼容旧接口
 */
@Slf4j
@Service
@Deprecated
@RequiredArgsConstructor
public class MockDataService {

    private final MockDataCenter mockDataCenter;

    public NodeVersionDTO.VersionListResponse getMockVersions(Long projectId, String nodeId) {
        log.info("Providing mock versions for project: {}, node: {}", projectId, nodeId);
        return mockDataCenter.getVersionListResponse(projectId, nodeId);
    }

    public NodeVersionDTO.VersionDetail getMockCurrentVersion(Long projectId, String nodeId) {
        log.info("Providing mock current version for project: {}, node: {}", projectId, nodeId);
        return mockDataCenter.getVersionDetail(projectId, nodeId, 3L);
    }

    public AssetDTO.AssetListResponse getMockAssets(Long projectId, String nodeId) {
        log.info("Providing mock assets for project: {}, node: {}", projectId, nodeId);
        return mockDataCenter.getAssetListResponse(projectId, nodeId);
    }

    public NodeProposalDTO.ProposalListResponse getMockProposals(Long projectId, String nodeId) {
        log.info("Providing mock proposals for project: {}, node: {}", projectId, nodeId);
        return mockDataCenter.getProposalListResponse(projectId, nodeId);
    }

    public NodeProposalDTO.ProposalDetail getMockProposalDetail(Long projectId, String nodeId, Long proposalId) {
        log.info("Providing mock proposal detail for project: {}, node: {}, proposal: {}", projectId, nodeId, proposalId);
        return mockDataCenter.getProposalDetail(projectId, nodeId, proposalId);
    }
}