package com.dream.studio.service;

import com.dream.studio.dto.AssetDTO;
import com.dream.studio.entity.Asset;
import com.dream.studio.entity.Project;
import com.dream.studio.exception.InvalidOperationException;
import com.dream.studio.exception.ProjectNotFoundException;
import com.dream.studio.repository.AssetRepository;
import com.dream.studio.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final ProjectRepository projectRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 获取节点资产列表
     */
    @Transactional(readOnly = true)
    public AssetDTO.AssetListResponse getNodeAssets(Long projectId, String nodeId, Boolean currentOnly) {
        log.info("Getting assets for project: {}, node: {}, currentOnly: {}", projectId, nodeId, currentOnly);

        List<Asset> assets;
        if (Boolean.TRUE.equals(currentOnly)) {
            assets = assetRepository.findByProjectIdAndNodeIdAndIsCurrentOrderByCreatedTimeDesc(projectId, nodeId, true);
        } else {
            assets = assetRepository.findByProjectIdAndNodeIdOrderByCreatedTimeDesc(projectId, nodeId);
        }

        List<AssetDTO.AssetItem> items = assets.stream()
                .map(this::toAssetItem)
                .collect(Collectors.toList());

        return AssetDTO.AssetListResponse.builder()
                .assets(items)
                .total(items.size())
                .build();
    }

    /**
     * 获取项目全部资产
     */
    @Transactional(readOnly = true)
    public AssetDTO.AssetListResponse getProjectAssets(Long projectId, Boolean currentOnly) {
        log.info("Getting all assets for project: {}, currentOnly: {}", projectId, currentOnly);

        List<Asset> assets;
        if (Boolean.TRUE.equals(currentOnly)) {
            assets = assetRepository.findAll().stream()
                    .filter(a -> a.getProjectId().equals(projectId) && Boolean.TRUE.equals(a.getIsCurrent()))
                    .collect(Collectors.toList());
        } else {
            assets = assetRepository.findByProjectIdOrderByCreatedTimeDesc(projectId);
        }

        List<AssetDTO.AssetItem> items = assets.stream()
                .map(this::toAssetItem)
                .collect(Collectors.toList());

        return AssetDTO.AssetListResponse.builder()
                .assets(items)
                .total(items.size())
                .build();
    }

    /**
     * 获取资产详情
     */
    @Transactional(readOnly = true)
    public AssetDTO.AssetItem getAssetDetail(Long projectId, Long assetId) {
        log.info("Getting asset detail: project: {}, asset: {}", projectId, assetId);

        Asset asset = assetRepository.findByIdAndProjectId(assetId, projectId)
                .orElseThrow(() -> new InvalidOperationException("Asset not found: " + assetId));

        return toAssetItem(asset);
    }

    /**
     * 激活资产
     */
    @Transactional
    public AssetDTO.ActivateResponse activateAsset(Long projectId, Long assetId) {
        log.info("Activating asset: {} for project: {}", assetId, projectId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + projectId));

        Asset asset = assetRepository.findByIdAndProjectId(assetId, projectId)
                .orElseThrow(() -> new InvalidOperationException("Asset not found: " + assetId));

        // 清除该节点当前资产
        assetRepository.clearCurrentByProjectAndNode(projectId, asset.getNodeId());

        // 激活资产
        asset.setIsCurrent(true);
        assetRepository.save(asset);

        return AssetDTO.ActivateResponse.builder()
                .activatedAssetId(assetId)
                .nodeId(asset.getNodeId())
                .affectedNodeIds(List.of())
                .message("Asset activated successfully")
                .build();
    }

    /**
     * 创建资产
     */
    @Transactional
    public Asset createAsset(Asset asset) {
        asset.setIsCurrent(true);
        assetRepository.clearCurrentByProjectAndNode(asset.getProjectId(), asset.getNodeId());
        return assetRepository.save(asset);
    }

    /**
     * 更新资产
     */
    @Transactional
    public Asset updateAsset(Long projectId, Long assetId, AssetDTO.AssetUpdateRequest request) {
        log.info("Updating asset: {} for project: {}", assetId, projectId);

        Asset asset = assetRepository.findByIdAndProjectId(assetId, projectId)
                .orElseThrow(() -> new InvalidOperationException("Asset not found: " + assetId));

        // 更新字段
        if (request.getName() != null) {
            asset.setTitle(request.getName());
        }
        if (request.getDescription() != null || request.getPrompt() != null) {
            String metadata = buildMetadataJson(asset.getMetadataJson(), request.getDescription(), request.getPrompt());
            asset.setMetadataJson(metadata);
        }
        if (request.getThumbnail() != null) {
            asset.setCoverUri(request.getThumbnail());
        }
        if (request.getUri() != null) {
            asset.setUri(request.getUri());
        }
        if (request.getStatus() != null) {
            asset.setStatus(request.getStatus());
        }

        return assetRepository.save(asset);
    }

    /**
     * 删除资产
     */
    @Transactional
    public void deleteAsset(Long projectId, Long assetId) {
        log.info("Deleting asset: {} for project: {}", assetId, projectId);

        Asset asset = assetRepository.findByIdAndProjectId(assetId, projectId)
                .orElseThrow(() -> new InvalidOperationException("Asset not found: " + assetId));

        assetRepository.delete(asset);
    }

    /**
     * 构建 metadata JSON
     */
    private String buildMetadataJson(String existingMetadataJson, String description, String prompt) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        if (description != null) {
            sb.append("\"description\":\"").append(escapeJson(description)).append("\",");
        }
        if (prompt != null) {
            sb.append("\"prompt\":\"").append(escapeJson(prompt)).append("\",");
        }
        // 移除末尾逗号
        if (sb.length() > 1 && sb.charAt(sb.length() - 1) == ',') {
            sb.setLength(sb.length() - 1);
        }
        sb.append("}");
        return sb.toString();
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }

    private AssetDTO.AssetItem toAssetItem(Asset asset) {
        return AssetDTO.AssetItem.builder()
                .id(asset.getId())
                .projectId(asset.getProjectId())
                .nodeId(asset.getNodeId())
                .nodeVersionId(asset.getNodeVersionId())
                .agentId(asset.getAgentId())
                .type(asset.getAssetType())
                .assetRole(asset.getAssetRole())
                .name(asset.getTitle())
                .uri(asset.getUri())
                .thumbnail(asset.getCoverUri())
                .mimeType(asset.getMimeType())
                .fileSize(asset.getFileSize())
                .metadataJson(asset.getMetadataJson())
                .isCurrent(asset.getIsCurrent())
                .status(asset.getStatus())
                .createTime(asset.getCreatedTime() != null ? asset.getCreatedTime().format(DATE_FORMATTER) : null)
                .content(asset.getMetadataJson())  // metadataJson 作为 content 返回
                .build();
    }
}
