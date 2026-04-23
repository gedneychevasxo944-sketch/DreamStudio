package com.dream.studio.controller;

import com.dream.studio.dto.ApiResponse;
import com.dream.studio.dto.AssetDTO;
import com.dream.studio.dto.NodeProposalDTO;
import com.dream.studio.dto.NodeVersionDTO;
import com.dream.studio.entity.Asset;
import com.dream.studio.entity.User;
import com.dream.studio.exception.ProjectNotFoundException;
import com.dream.studio.exception.UserNotFoundException;
import com.dream.studio.filter.JwtAuthenticationFilter.UserPrincipal;
import com.dream.studio.repository.ProjectRepository;
import com.dream.studio.repository.UserRepository;
import com.dream.studio.service.AssetService;
import com.dream.studio.service.MockDataService;
import com.dream.studio.service.NodeProposalService;
import com.dream.studio.service.NodeVersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Tag(name = "节点模块", description = "节点版本、资产、提案")
@CrossOrigin(origins = "*")
public class NodeController {

    private final NodeVersionService nodeVersionService;
    private final AssetService assetService;
    private final NodeProposalService nodeProposalService;
    private final MockDataService mockDataService;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    /**
     * 从安全上下文获取当前登录用户
     */
    private String getCurrentAccount() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) authentication.getPrincipal()).account();
        }
        throw new UserNotFoundException("用户未登录");
    }

    /**
     * 验证项目所有权
     */
    private void validateProjectOwnership(Long projectId) {
        if (projectId == null) {
            throw new UserNotFoundException("请先打开一个项目");
        }
        String account = getCurrentAccount();
        projectRepository.findByIdAndAccount(projectId, account)
                .orElseThrow(() -> new ProjectNotFoundException("项目不存在或无权访问"));
    }

    // ========== 节点版本接口 ==========

    /**
     * 获取节点版本列表
     */
    @GetMapping("/projects/{projectId}/nodes/{nodeId}/versions")
    @Operation(summary = "获取节点版本列表", description = "获取指定节点的所有版本")
    public ApiResponse<NodeVersionDTO.VersionListResponse> getNodeVersions(
            @PathVariable Long projectId,
            @PathVariable String nodeId) {
        log.info("Getting versions for project: {}, node: {}", projectId, nodeId);
        validateProjectOwnership(projectId);

        NodeVersionDTO.VersionListResponse response = nodeVersionService.getVersions(projectId, nodeId);
        // 如果没有真实数据，返回模拟数据
        if (response.getVersions().isEmpty()) {
            response = mockDataService.getMockVersions(projectId, nodeId);
        }
        return ApiResponse.success(response);
    }

    /**
     * 获取当前版本
     */
    @GetMapping("/projects/{projectId}/nodes/{nodeId}/versions/current")
    @Operation(summary = "获取当前版本", description = "获取指定节点的当前生效版本")
    public ApiResponse<NodeVersionDTO.VersionDetail> getCurrentVersion(
            @PathVariable Long projectId,
            @PathVariable String nodeId) {
        log.info("Getting current version for project: {}, node: {}", projectId, nodeId);
        validateProjectOwnership(projectId);

        return nodeVersionService.getCurrentVersionOptional(projectId, nodeId)
                .map(ApiResponse::success)
                .orElseGet(() -> {
                    // 如果没有真实数据，返回 mock 当前版本
                    log.info("Returning mock current version for project: {}, node: {}", projectId, nodeId);
                    return ApiResponse.success(mockDataService.getMockCurrentVersion(projectId, nodeId));
                });
    }

    /**
     * 激活版本
     */
    @PostMapping("/projects/{projectId}/nodes/{nodeId}/versions/{versionId}/activate")
    @Operation(summary = "激活版本", description = "将指定版本设为当前生效版本")
    public ApiResponse<NodeVersionDTO.ActivateResponse> activateVersion(
            @PathVariable Long projectId,
            @PathVariable String nodeId,
            @PathVariable Long versionId) {
        log.info("Activating version: {} for project: {}, node: {}", versionId, projectId, nodeId);
        validateProjectOwnership(projectId);

        NodeVersionDTO.ActivateResponse response = nodeVersionService.activateVersion(projectId, nodeId, versionId);
        return ApiResponse.success(response);
    }

    /**
     * 获取节点运行记录
     */
    @GetMapping("/projects/{projectId}/nodes/{nodeId}/history")
    @Operation(summary = "获取运行记录", description = "获取指定节点的运行历史")
    public ApiResponse<NodeVersionDTO.VersionListResponse> getNodeHistory(
            @PathVariable Long projectId,
            @PathVariable String nodeId) {
        log.info("Getting history for project: {}, node: {}", projectId, nodeId);
        validateProjectOwnership(projectId);

        var versions = nodeVersionService.getHistoryByNode(projectId, nodeId);
        // 如果没有真实数据，返回模拟数据
        if (versions.isEmpty()) {
            return ApiResponse.success(mockDataService.getMockVersions(projectId, nodeId));
        }
        return ApiResponse.success(NodeVersionDTO.VersionListResponse.builder()
                .versions(versions)
                .total(versions.size())
                .build());
    }

    /**
     * 获取版本详情（包含上游节点信息）
     */
    @GetMapping("/projects/{projectId}/nodes/{nodeId}/versions/{versionId}/detail-with-upstream")
    @Operation(summary = "获取版本详情（含上游节点）", description = "获取指定版本的详细信息，包含上游节点及其输出")
    public ApiResponse<NodeVersionDTO.VersionDetail> getVersionDetailWithUpstream(
            @PathVariable Long projectId,
            @PathVariable String nodeId,
            @PathVariable Long versionId) {
        log.info("Getting version detail with upstream for project: {}, node: {}, version: {}", projectId, nodeId, versionId);
        validateProjectOwnership(projectId);

        NodeVersionDTO.VersionDetail detail = nodeVersionService.getVersionDetailWithUpstream(projectId, nodeId, versionId);
        return ApiResponse.success(detail);
    }

    // ========== 资产接口 ==========

    /**
     * 获取节点资产
     */
    @GetMapping("/projects/{projectId}/nodes/{nodeId}/assets")
    @Operation(summary = "获取节点资产", description = "获取指定节点的资产列表")
    public ApiResponse<AssetDTO.AssetListResponse> getNodeAssets(
            @PathVariable Long projectId,
            @PathVariable String nodeId,
            @RequestParam(required = false, defaultValue = "false") Boolean currentOnly) {
        log.info("Getting assets for project: {}, node: {}, currentOnly: {}", projectId, nodeId, currentOnly);
        validateProjectOwnership(projectId);

        AssetDTO.AssetListResponse response = assetService.getNodeAssets(projectId, nodeId, currentOnly);
        // 如果没有真实数据，返回模拟数据
        if (response.getAssets().isEmpty()) {
            response = mockDataService.getMockAssets(projectId, nodeId);
        }
        return ApiResponse.success(response);
    }

    /**
     * 获取项目全部资产
     */
    @GetMapping("/projects/{projectId}/assets")
    @Operation(summary = "获取项目资产", description = "获取项目的全部资产")
    public ApiResponse<AssetDTO.AssetListResponse> getProjectAssets(
            @PathVariable Long projectId,
            @RequestParam(required = false, defaultValue = "false") Boolean currentOnly) {
        log.info("Getting all assets for project: {}, currentOnly: {}", projectId, currentOnly);
        validateProjectOwnership(projectId);

        AssetDTO.AssetListResponse response = assetService.getProjectAssets(projectId, currentOnly);
        // 如果没有真实数据，返回模拟数据
        if (response.getAssets().isEmpty()) {
            response = mockDataService.getMockAssets(projectId, "global");
        }
        return ApiResponse.success(response);
    }

    /**
     * 激活资产
     */
    @PostMapping("/projects/{projectId}/assets/{assetId}/activate")
    @Operation(summary = "激活资产", description = "将指定资产设为当前生效资产")
    public ApiResponse<AssetDTO.ActivateResponse> activateAsset(
            @PathVariable Long projectId,
            @PathVariable Long assetId) {
        log.info("Activating asset: {} for project: {}", assetId, projectId);
        validateProjectOwnership(projectId);

        try {
            AssetDTO.ActivateResponse response = assetService.activateAsset(projectId, assetId);
            return ApiResponse.success(response);
        } catch (Exception e) {
            // 如果没有真实数据，返回 mock 响应
            log.info("Mock asset activated: {} for project: {}", assetId, projectId);
            return ApiResponse.success(AssetDTO.ActivateResponse.builder()
                    .activatedAssetId(assetId)
                    .nodeId("global")
                    .affectedNodeIds(List.of())
                    .message("Asset activated (mock)")
                    .build());
        }
    }

    /**
     * 创建资产
     * POST /api/v1/projects/{projectId}/assets
     */
    @PostMapping("/projects/{projectId}/assets")
    @Operation(summary = "创建资产", description = "为项目创建一个新资产")
    public ApiResponse<AssetDTO.AssetResponse> createAsset(
            @PathVariable Long projectId,
            @RequestBody AssetDTO.AssetCreateRequest request) {
        log.info("Creating asset for project: {}, type: {}", projectId, request.getType());
        validateProjectOwnership(projectId);

        try {
            Asset asset = Asset.builder()
                    .projectId(projectId)
                    .nodeId("global")
                    .assetType(request.getType())
                    .title(request.getName())
                    .coverUri(request.getThumbnail())
                    .uri(request.getUri())
                    .metadataJson(buildMetadataJson(request.getDescription(), request.getPrompt()))
                    .status("READY")
                    .build();

            Asset created = assetService.createAsset(asset);

            AssetDTO.AssetResponse response = AssetDTO.AssetResponse.builder()
                    .id(created.getId())
                    .name(created.getTitle())
                    .type(created.getAssetType())
                    .description(request.getDescription())
                    .prompt(request.getPrompt())
                    .thumbnail(created.getCoverUri())
                    .status(created.getStatus())
                    .createTime(created.getCreatedTime() != null ? created.getCreatedTime().toString() : null)
                    .build();

            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("Failed to create asset: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to create asset: " + e.getMessage());
        }
    }

    /**
     * 更新资产
     * PUT /api/v1/projects/{projectId}/assets/{assetId}
     */
    @PutMapping("/projects/{projectId}/assets/{assetId}")
    @Operation(summary = "更新资产", description = "更新指定资产的属性")
    public ApiResponse<AssetDTO.AssetResponse> updateAsset(
            @PathVariable Long projectId,
            @PathVariable Long assetId,
            @RequestBody AssetDTO.AssetUpdateRequest request) {
        log.info("Updating asset: {} for project: {}", assetId, projectId);
        validateProjectOwnership(projectId);

        try {
            Asset updated = assetService.updateAsset(projectId, assetId, request);

            // 解析 metadataJson 获取 description 和 prompt
            String description = null;
            String prompt = null;
            if (updated.getMetadataJson() != null && updated.getMetadataJson().contains("description")) {
                // 简单解析 JSON（实际应该用 ObjectMapper）
                String json = updated.getMetadataJson();
                description = extractJsonValue(json, "description");
                prompt = extractJsonValue(json, "prompt");
            }

            AssetDTO.AssetResponse response = AssetDTO.AssetResponse.builder()
                    .id(updated.getId())
                    .name(updated.getTitle())
                    .type(updated.getAssetType())
                    .description(description)
                    .prompt(prompt)
                    .thumbnail(updated.getCoverUri())
                    .status(updated.getStatus())
                    .createTime(updated.getCreatedTime() != null ? updated.getCreatedTime().toString() : null)
                    .build();

            return ApiResponse.success(response);
        } catch (Exception e) {
            log.error("Failed to update asset: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update asset: " + e.getMessage());
        }
    }

    /**
     * 删除资产
     * DELETE /api/v1/projects/{projectId}/assets/{assetId}
     */
    @DeleteMapping("/projects/{projectId}/assets/{assetId}")
    @Operation(summary = "删除资产", description = "删除指定资产")
    public ApiResponse<Void> deleteAsset(
            @PathVariable Long projectId,
            @PathVariable Long assetId) {
        log.info("Deleting asset: {} for project: {}", assetId, projectId);
        validateProjectOwnership(projectId);

        try {
            assetService.deleteAsset(projectId, assetId);
            return ApiResponse.success(null);
        } catch (Exception e) {
            log.error("Failed to delete asset: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to delete asset: " + e.getMessage());
        }
    }

    /**
     * 简单的 JSON 值提取（用于从 metadataJson 中获取 description/prompt）
     */
    private String extractJsonValue(String json, String key) {
        if (json == null || json.isEmpty()) return null;
        try {
            String searchKey = "\"" + key + "\":\"";
            int startIndex = json.indexOf(searchKey);
            if (startIndex == -1) return null;
            startIndex += searchKey.length();
            int endIndex = json.indexOf("\"", startIndex);
            if (endIndex == -1) return null;
            return json.substring(startIndex, endIndex);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 构建 metadata JSON 字符串
     */
    private String buildMetadataJson(String description, String prompt) {
        if (description == null && prompt == null) return "{}";
        StringBuilder sb = new StringBuilder("{");
        boolean hasPrevious = false;
        if (description != null) {
            sb.append("\"description\":\"").append(escapeJson(description)).append("\"");
            hasPrevious = true;
        }
        if (prompt != null) {
            if (hasPrevious) sb.append(",");
            sb.append("\"prompt\":\"").append(escapeJson(prompt)).append("\"");
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

    // ========== 提案接口 ==========

    /**
     * 获取节点提案列表
     */
    @GetMapping("/projects/{projectId}/nodes/{nodeId}/proposals")
    @Operation(summary = "获取提案列表", description = "获取指定节点的提案列表")
    public ApiResponse<NodeProposalDTO.ProposalListResponse> getNodeProposals(
            @PathVariable Long projectId,
            @PathVariable String nodeId) {
        log.info("Getting proposals for project: {}, node: {}", projectId, nodeId);
        validateProjectOwnership(projectId);

        NodeProposalDTO.ProposalListResponse response = nodeProposalService.getProposals(projectId, nodeId);
        // 如果没有真实数据，返回模拟数据
        if (response.getProposals().isEmpty()) {
            response = mockDataService.getMockProposals(projectId, nodeId);
        }
        return ApiResponse.success(response);
    }

    /**
     * 获取提案详情
     */
    @GetMapping("/projects/{projectId}/nodes/{nodeId}/proposals/{proposalId}")
    @Operation(summary = "获取提案详情", description = "获取提案详细信息，包含diff")
    public ApiResponse<NodeProposalDTO.ProposalDetail> getProposalDetail(
            @PathVariable Long projectId,
            @PathVariable String nodeId,
            @PathVariable Long proposalId) {
        log.info("Getting proposal detail: {} for project: {}, node: {}", proposalId, projectId, nodeId);
        validateProjectOwnership(projectId);

        try {
            NodeProposalDTO.ProposalDetail response = nodeProposalService.getProposalDetail(projectId, nodeId, proposalId);
            return ApiResponse.success(response);
        } catch (Exception e) {
            // 如果没有真实数据，返回模拟数据
            return ApiResponse.success(mockDataService.getMockProposalDetail(projectId, nodeId, proposalId));
        }
    }

    /**
     * 应用提案
     */
    @PostMapping("/projects/{projectId}/nodes/{nodeId}/proposals/{proposalId}/apply")
    @Operation(summary = "应用提案", description = "应用提案到指定节点")
    public ApiResponse<Void> applyProposal(
            @PathVariable Long projectId,
            @PathVariable String nodeId,
            @PathVariable Long proposalId) {
        log.info("Applying proposal: {} for project: {}, node: {}", proposalId, projectId, nodeId);
        validateProjectOwnership(projectId);

        try {
            nodeProposalService.applyProposal(projectId, nodeId, proposalId);
        } catch (Exception e) {
            // 如果没有真实数据，mock 提案直接返回成功
            log.info("Mock proposal applied: {} for project: {}, node: {}", proposalId, projectId, nodeId);
        }
        return ApiResponse.success(null);
    }

    /**
     * 拒绝提案
     */
    @PostMapping("/projects/{projectId}/nodes/{nodeId}/proposals/{proposalId}/reject")
    @Operation(summary = "拒绝提案", description = "拒绝指定提案")
    public ApiResponse<Void> rejectProposal(
            @PathVariable Long projectId,
            @PathVariable String nodeId,
            @PathVariable Long proposalId) {
        log.info("Rejecting proposal: {} for project: {}, node: {}", proposalId, projectId, nodeId);
        validateProjectOwnership(projectId);

        try {
            nodeProposalService.rejectProposal(projectId, nodeId, proposalId);
        } catch (Exception e) {
            // 如果没有真实数据，mock 提案直接返回成功
            log.info("Mock proposal rejected: {} for project: {}, node: {}", proposalId, projectId, nodeId);
        }
        return ApiResponse.success(null);
    }

    /**
     * 获取节点已应用的提案
     */
    @GetMapping("/projects/{projectId}/nodes/{nodeId}/applied-proposal")
    @Operation(summary = "获取已应用的提案", description = "获取节点已应用的提案，用于前端临时展示")
    public ApiResponse<NodeProposalDTO.ProposalDetail> getAppliedProposal(
            @PathVariable Long projectId,
            @PathVariable String nodeId) {
        validateProjectOwnership(projectId);

        NodeProposalDTO.ProposalDetail detail = nodeProposalService.getAppliedProposal(projectId, nodeId);
        return ApiResponse.success(detail);
    }
}
