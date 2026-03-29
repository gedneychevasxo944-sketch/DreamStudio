package com.aimanju.controller;

import com.aimanju.dto.ApiResponse;
import com.aimanju.dto.ProjectDTO;
import com.aimanju.dto.TemplateDTO;
import com.aimanju.service.HomePageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "首页模块", description = "项目列表、创建项目、模板管理")
@CrossOrigin(origins = "*")
public class HomePageController {

    private final HomePageService homePageService;

    @GetMapping("/projects")
    @Operation(summary = "获取项目列表", description = "获取用户的所有项目")
    public ApiResponse<ProjectDTO.ListResponse> getProjects(
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", defaultValue = "user_001") String userId) {
        log.info("Getting projects for user: {}", userId);
        ProjectDTO.ListResponse response = homePageService.getProjects(userId);
        return ApiResponse.success(response);
    }

    @PostMapping("/projects")
    @Operation(summary = "创建项目", description = "创建新项目")
    public ApiResponse<ProjectDTO.Response> createProject(
            @Valid @RequestBody ProjectDTO.CreateRequest request,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", defaultValue = "user_001") String userId) {
        log.info("Creating project, userId: {}, title: {}", userId, request.getTitle());
        ProjectDTO.Response response = homePageService.createProject(request, userId);
        return ApiResponse.success("项目创建成功", response);
    }

    @PostMapping("/projects/{id}/fork")
    @Operation(summary = "Fork模板", description = "基于模板创建项目")
    public ApiResponse<ProjectDTO.Response> forkTemplate(
            @PathVariable Long id,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", defaultValue = "user_001") String userId) {
        log.info("Forking template: {}, userId: {}", id, userId);
        ProjectDTO.Response response = homePageService.forkTemplate(id, userId);
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
        log.info("Getting project: {}", id);
        ProjectDTO.Response response = homePageService.getProject(id);
        return ApiResponse.success(response);
    }

    @PostMapping("/projects/{id}/save")
    @Operation(summary = "保存项目", description = "保存项目当前版本")
    public ApiResponse<ProjectDTO.Response> saveProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectDTO.SaveRequest request,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", defaultValue = "user_001") String userId) {
        log.info("Saving project: {}", id);
        ProjectDTO.Response response = homePageService.saveProject(id, request, userId);
        return ApiResponse.success("项目保存成功", response);
    }

    @GetMapping("/projects/{id}/versions")
    @Operation(summary = "获取版本列表", description = "获取项目的所有版本")
    public ApiResponse<ProjectDTO.VersionListResponse> getVersions(@PathVariable Long id) {
        log.info("Getting versions for project: {}", id);
        ProjectDTO.VersionListResponse response = homePageService.getVersions(id);
        return ApiResponse.success(response);
    }

    @GetMapping("/projects/{id}/versions/{v}")
    @Operation(summary = "获取版本详情", description = "获取指定版本的详细信息")
    public ApiResponse<ProjectDTO.VersionResponse> getVersion(
            @PathVariable Long id,
            @PathVariable Integer v) {
        log.info("Getting version {} of project {}", v, id);
        ProjectDTO.VersionResponse response = homePageService.getVersion(id, v);
        return ApiResponse.success(response);
    }

    @PostMapping("/projects/{id}/versions/{v}/restore")
    @Operation(summary = "恢复版本", description = "恢复到指定版本")
    public ApiResponse<ProjectDTO.Response> restoreVersion(
            @PathVariable Long id,
            @PathVariable Integer v,
            @Parameter(hidden = true) @RequestHeader(value = "X-User-Id", defaultValue = "user_001") String userId) {
        log.info("Restoring project {} to version {}", id, v);
        ProjectDTO.Response response = homePageService.restoreVersion(id, v, userId);
        return ApiResponse.success("版本恢复成功", response);
    }

    @DeleteMapping("/projects/{id}/versions/{v}")
    @Operation(summary = "删除版本", description = "删除指定版本")
    public ApiResponse<Void> deleteVersion(
            @PathVariable Long id,
            @PathVariable Integer v) {
        log.info("Deleting version {} of project {}", v, id);
        homePageService.deleteVersion(id, v);
        return ApiResponse.success("版本删除成功", null);
    }
}
