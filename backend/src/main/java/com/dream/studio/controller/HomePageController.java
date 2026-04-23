package com.dream.studio.controller;

import com.dream.studio.dto.ApiResponse;
import com.dream.studio.dto.AgentDTO;
import com.dream.studio.dto.ProjectDTO;
import com.dream.studio.dto.TemplateDTO;
import com.dream.studio.entity.User;
import com.dream.studio.exception.GlobalExceptionHandler;
import com.dream.studio.exception.UserNotFoundException;
import com.dream.studio.filter.JwtAuthenticationFilter.UserPrincipal;
import com.dream.studio.repository.UserRepository;
import com.dream.studio.service.HomePageService;
import com.dream.studio.service.MockDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "首页模块", description = "项目列表、创建项目、模板管理")
@CrossOrigin(origins = "*")
public class HomePageController {

    private final HomePageService homePageService;
    private final UserRepository userRepository;
    private final MockDataService mockDataService;

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
     * 获取当前登录用户的 User 对象
     */
    private User getCurrentUser() {
        String account = getCurrentAccount();
        return userRepository.findByAccount(account)
                .orElseThrow(() -> new UserNotFoundException("用户不存在"));
    }

    @GetMapping("/projects")
    @Operation(summary = "获取项目列表", description = "获取用户的所有项目")
    public ApiResponse<ProjectDTO.ListResponse> getProjects() {
        User currentUser = getCurrentUser();
        log.info("Getting projects for user: {}", currentUser.getAccount());
        ProjectDTO.ListResponse response = homePageService.getProjects(currentUser.getAccount());
        return ApiResponse.success(response);
    }

    @PostMapping("/projects")
    @Operation(summary = "创建项目", description = "创建新项目")
    public ApiResponse<ProjectDTO.Response> createProject(
            @Valid @RequestBody ProjectDTO.CreateRequest request) {
        User currentUser = getCurrentUser();
        log.info("Creating project, userId: {}, title: {}", currentUser.getId(), request.getTitle());
        ProjectDTO.Response response = homePageService.createProject(request, currentUser.getAccount());
        return ApiResponse.success("项目创建成功", response);
    }

    @PostMapping("/projects/{id}/fork")
    @Operation(summary = "Fork模板", description = "基于模板创建项目")
    public ApiResponse<ProjectDTO.Response> forkTemplate(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        log.info("Forking template: {}, userId: {}", id, currentUser.getId());
        ProjectDTO.Response response = homePageService.forkTemplate(id, currentUser.getAccount());
        return ApiResponse.success("基于模板创建项目成功", response);
    }

    @GetMapping("/templates")
    @Operation(summary = "获取模板列表", description = "获取所有演示案例模板")
    public ApiResponse<TemplateDTO.ListResponse> getTemplates() {
        log.info("Getting templates");
        TemplateDTO.ListResponse response = homePageService.getTemplates();
        return ApiResponse.success(response);
    }

    @GetMapping("/projects/{id}")
    @Operation(summary = "获取项目详情", description = "获取指定项目的详细信息")
    public ApiResponse<ProjectDTO.Response> getProject(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        log.info("Getting project: {} for user: {}", id, currentUser.getAccount());
        ProjectDTO.Response response = homePageService.getProject(id, currentUser.getAccount());
        return ApiResponse.success(response);
    }

    @GetMapping("/workspace/agents")
    @Operation(summary = "获取智能体列表", description = "获取所有可用的智能体")
    public ApiResponse<List<AgentDTO.Response>> getAgents() {
        log.info("Getting workspace agents");
        List<AgentDTO.Response> agents = List.of(
            AgentDTO.Response.builder()
                .id(1L).name("资深制片人").agentCode("producer").agentId(1L).agentName("资深制片人")
                .describe("负责项目规划和资源协调").icon("Target").color("#3b82f6")
                .agentTags(List.of("producer", "planning"))
                .build(),
            AgentDTO.Response.builder()
                .id(2L).name("金牌编剧").agentCode("content").agentId(2L).agentName("金牌编剧")
                .describe("负责剧本和内容创作").icon("FileText").color("#8b5cf6")
                .agentTags(List.of("content", "script"))
                .build(),
            AgentDTO.Response.builder()
                .id(3L).name("概念美术").agentCode("visual").agentId(3L).agentName("概念美术")
                .describe("负责视觉风格和概念设计").icon("Image").color("#ec4899")
                .agentTags(List.of("visual", "concept"))
                .build(),
            AgentDTO.Response.builder()
                .id(4L).name("分镜导演").agentCode("director").agentId(4L).agentName("分镜导演")
                .describe("负责镜头设计和分镜规划").icon("Clapperboard").color("#f59e0b")
                .agentTags(List.of("director", "storyboard"))
                .build(),
            AgentDTO.Response.builder()
                .id(5L).name("视频生成").agentCode("videoGen").agentId(5L).agentName("视频生成")
                .describe("负责视频内容生成").icon("Film").color("#10b981")
                .agentTags(List.of("video", "generation"))
                .build()
        );
        return ApiResponse.success(agents);
    }

    @PostMapping("/projects/{id}/save")
    @Operation(summary = "保存项目", description = "保存项目当前版本")
    public ApiResponse<ProjectDTO.Response> saveProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectDTO.SaveRequest request) {
        User currentUser = getCurrentUser();
        log.info("Saving project: {} for user: {}", id, currentUser.getAccount());
        ProjectDTO.Response response = homePageService.saveProject(id, request, currentUser.getAccount());
        return ApiResponse.success("项目保存成功", response);
    }

    @GetMapping("/projects/{id}/versions")
    @Operation(summary = "获取版本列表", description = "获取项目的所有版本")
    public ApiResponse<ProjectDTO.VersionListResponse> getVersions(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        log.info("Getting versions for project: {} user: {}", id, currentUser.getAccount());
        ProjectDTO.VersionListResponse response = homePageService.getVersions(id, currentUser.getAccount());
        // 如果没有真实数据，返回模拟版本
        if (response.getVersions().isEmpty()) {
            response = mockDataService.getMockVersionsForProject(id);
        }
        return ApiResponse.success(response);
    }

    @GetMapping("/projects/{id}/versions/{v}")
    @Operation(summary = "获取版本详情", description = "获取指定版本的详细信息")
    public ApiResponse<ProjectDTO.VersionResponse> getVersion(
            @PathVariable Long id,
            @PathVariable Integer v) {
        User currentUser = getCurrentUser();
        log.info("Getting version {} of project {} user: {}", v, id, currentUser.getAccount());
        try {
            ProjectDTO.VersionResponse response = homePageService.getVersion(id, v, currentUser.getAccount());
            return ApiResponse.success(response);
        } catch (Exception e) {
            // 如果没有真实数据，返回模拟版本
            log.info("Returning mock version {} for project: {}", v, id);
            return ApiResponse.success(ProjectDTO.VersionResponse.builder()
                    .id((long) v)
                    .versionNumber(v)
                    .title("V" + v + ".0")
                    .description("版本 " + v + " 详情")
                    .createdTime("2026-04-22 10:00:00")
                    .status("COMPLETED")
                    .build());
        }
    }

    @PostMapping("/projects/{id}/versions/{v}/restore")
    @Operation(summary = "恢复版本", description = "恢复到指定版本")
    public ApiResponse<ProjectDTO.Response> restoreVersion(
            @PathVariable Long id,
            @PathVariable Integer v) {
        User currentUser = getCurrentUser();
        log.info("Restoring project {} to version {} user: {}", id, v, currentUser.getAccount());
        ProjectDTO.Response response = homePageService.restoreVersion(id, v, currentUser.getAccount());
        return ApiResponse.success("版本恢复成功", response);
    }

    @DeleteMapping("/projects/{id}/versions/{v}")
    @Operation(summary = "删除版本", description = "删除指定版本")
    public ApiResponse<Void> deleteVersion(
            @PathVariable Long id,
            @PathVariable Integer v) {
        User currentUser = getCurrentUser();
        log.info("Deleting version {} of project {} user: {}", v, id, currentUser.getAccount());
        homePageService.deleteVersion(id, v, currentUser.getAccount());
        return ApiResponse.success("版本删除成功", null);
    }

    @DeleteMapping("/projects/{id}")
    @Operation(summary = "删除项目", description = "删除指定项目")
    public ApiResponse<Void> deleteProject(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        log.info("Deleting project: {} user: {}", id, currentUser.getAccount());
        homePageService.deleteProject(id, currentUser.getAccount());
        return ApiResponse.success("项目删除成功", null);
    }
}
