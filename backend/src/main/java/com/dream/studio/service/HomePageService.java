package com.dream.studio.service;

import com.dream.studio.dto.ProjectDTO;
import com.dream.studio.dto.TemplateDTO;
import com.dream.studio.entity.Project;
import com.dream.studio.entity.ProjectVersion;
import com.dream.studio.entity.Template;
import com.dream.studio.exception.InvalidOperationException;
import com.dream.studio.exception.ProjectNotFoundException;
import com.dream.studio.exception.TemplateNotFoundException;
import com.dream.studio.exception.VersionNotFoundException;
import com.dream.studio.repository.ProjectRepository;
import com.dream.studio.repository.ProjectVersionRepository;
import com.dream.studio.repository.TemplateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
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
public class HomePageService {

    private final ProjectRepository projectRepository;
    private final ProjectVersionRepository projectVersionRepository;
    private final TemplateRepository templateRepository;
    private final ObjectMapper objectMapper;

    @PostConstruct
    public void initMockData() {
        if (templateRepository.count() == 0) {
            log.info("Initializing mock templates...");
            initializeMockTemplates();
        }
    }

    private void initializeMockTemplates() {
        // 1. 先创建3个项目作为模板来源
        Project project1 = createTemplateProject(1L, "好莱坞工业流水线", "好莱坞官方模板项目");
        Project project2 = createTemplateProject(2L, "极速概念片团队", "极速官方模板项目");
        Project project3 = createTemplateProject(3L, "极简单兵模式", "单兵官方模板项目");

        projectRepository.saveAll(List.of(project1, project2, project3));

        // 2. 再创建模板，关联到这些项目
        List<Template> templates = List.of(
            createTemplate(1L, project1.getId(), "好莱坞工业流水线", "标准五组双子星节点完整流程",
                "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=500&fit=crop",
                "好莱坞,工业流水线", 128),

            createTemplate(2L, project2.getId(), "极速概念片团队", "AI原生工作流，文本直出视频，跳过传统美术",
                "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800&h=500&fit=crop",
                "极速,概念片", 89),

            createTemplate(3L, project3.getId(), "极简单兵模式", "一人成军，AI全栈独立完成",
                "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=500&fit=crop",
                "单兵,简单", 256)
        );

        templateRepository.saveAll(templates);
        log.info("Mock templates initialized: {} templates with {} projects", templates.size(), 3);
    }

    private Project createTemplateProject(Long id, String title, String description) {
        return Project.builder()
                .id(id)
                .title(title)
                .description(description)
                .status("DRAFT")
                .account("system")
                .config("{}")
                .lastResult("{}")
                .currentVersion(1)
                .build();
    }

    private Template createTemplate(Long id, Long projectId, String name, String description, String coverImage, String tags, Integer useCount) {
        return Template.builder()
                .id(id)
                .projectId(projectId)
                .name(name)
                .description(description)
                .coverImage(coverImage)
                .tags(tags)
                .useCount(useCount)
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectDTO.ListResponse getProjects(String account) {
        log.info("Getting projects for account: {}", account);
        List<Project> projects = projectRepository.findByAccountOrderByUpdatedTimeDesc(account);

        List<ProjectDTO.Response> projectList = projects.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return ProjectDTO.ListResponse.builder()
                .projects(projectList)
                .total((long) projectList.size())
                .build();
    }

    @Transactional
    public ProjectDTO.Response createProject(ProjectDTO.CreateRequest request, String account) {
        log.info("Creating project for account: {}, title: {}", account, request.getTitle());

        Project project = Project.builder()
                .title(request.getTitle())
                .status("DRAFT")
                .account(account)
                .config("{}")
                .lastResult("{}")
                .currentVersion(1)
                .build();

        Project savedProject = projectRepository.save(project);
        return convertToResponse(savedProject);
    }

    @Transactional(readOnly = true)
    public TemplateDTO.ListResponse getTemplates() {
        log.info("Getting templates");
        List<Template> templates = templateRepository.findAll();

        List<TemplateDTO.Response> templateList = templates.stream()
                .map(this::convertToTemplateResponse)
                .collect(Collectors.toList());

        return TemplateDTO.ListResponse.builder()
                .templates(templateList)
                .total((long) templateList.size())
                .build();
    }

    @Transactional
    public ProjectDTO.Response forkTemplate(Long templateId, String account) {
        log.info("Forking template: {} for account: {}", templateId, account);

        Template template = templateRepository.findById(templateId)
                .orElseThrow(() -> new TemplateNotFoundException("Template not found: " + templateId));

        String projectTitle = template.getName() + " - 副本";

        String config = "{}";
        if (template.getProjectId() != null) {
            Project sourceProject = projectRepository.findById(template.getProjectId()).orElse(null);
            if (sourceProject != null) {
                config = sourceProject.getConfig() != null ? sourceProject.getConfig() : "{}";
            }
        }

        Project project = Project.builder()
                .title(projectTitle)
                .description(template.getDescription())
                .status("DRAFT")
                .account(account)
                .coverImage(template.getCoverImage())
                .tags(template.getTags())
                .config(config)
                .lastResult("{}")
                .currentVersion(1)
                .build();

        Project savedProject = projectRepository.save(project);

        template.setUseCount(template.getUseCount() != null ? template.getUseCount() + 1 : 1);
        templateRepository.save(template);

        return convertToResponse(savedProject);
    }

    @Transactional(readOnly = true)
    public ProjectDTO.Response getProject(Long projectId, String account) {
        log.info("Getting project: {} for account: {}", projectId, account);

        Project project = projectRepository.findByIdAndAccount(projectId, account)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found or access denied: " + projectId));

        return convertToResponse(project);
    }

    @Transactional
    public ProjectDTO.Response saveProject(Long projectId, ProjectDTO.SaveRequest request, String account) {
        log.info("Saving project: {} for account: {}", projectId, account);

        Project project = projectRepository.findByIdAndAccount(projectId, account)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found or access denied: " + projectId));

        int newVersion = project.getCurrentVersion() + 1;

        ProjectVersion version = ProjectVersion.builder()
                .projectId(projectId)
                .versionNumber(project.getCurrentVersion())
                .title(project.getTitle())
                .description(project.getDescription())
                .status(project.getStatus())
                .account(project.getAccount())
                .coverImage(project.getCoverImage())
                .tags(project.getTags())
                .config(project.getConfig())
                .lastResult(project.getLastResult())
                .build();
        projectVersionRepository.save(version);

        project.setConfig(request.getConfig());
        project.setLastResult(request.getLastResult());
        if (request.getTitle() != null) {
            project.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getTags() != null) {
            project.setTags(request.getTags());
        }
        if (request.getCoverImage() != null) {
            project.setCoverImage(request.getCoverImage());
        }
        project.setCurrentVersion(newVersion);

        Project savedProject = projectRepository.save(project);
        return convertToResponse(savedProject);
    }

    @Transactional(readOnly = true)
    public ProjectDTO.VersionListResponse getVersions(Long projectId, String account) {
        log.info("Getting versions for project: {} for account: {}", projectId, account);

        // Validate project ownership
        projectRepository.findByIdAndAccount(projectId, account)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found or access denied: " + projectId));

        List<ProjectVersion> versions = projectVersionRepository.findByProjectIdOrderByVersionNumberDesc(projectId);
        
        List<ProjectDTO.VersionResponse> versionList = versions.stream()
                .map(this::convertToVersionResponse)
                .collect(Collectors.toList());
        
        return ProjectDTO.VersionListResponse.builder()
                .versions(versionList)
                .total((long) versionList.size())
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectDTO.VersionResponse getVersion(Long projectId, Integer versionNumber, String account) {
        log.info("Getting version {} of project {} for account: {}", versionNumber, projectId, account);

        // Validate project ownership
        projectRepository.findByIdAndAccount(projectId, account)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found or access denied: " + projectId));

        ProjectVersion version = projectVersionRepository.findByProjectIdAndVersionNumber(projectId, versionNumber)
                .orElseThrow(() -> new VersionNotFoundException("Version not found: " + versionNumber));
        
        return convertToVersionResponse(version);
    }

    @Transactional
    public ProjectDTO.Response restoreVersion(Long projectId, Integer versionNumber, String account) {
        log.info("Restoring project {} to version {} for account: {}", projectId, versionNumber, account);

        Project project = projectRepository.findByIdAndAccount(projectId, account)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found or access denied: " + projectId));

        ProjectVersion version = projectVersionRepository.findByProjectIdAndVersionNumber(projectId, versionNumber)
                .orElseThrow(() -> new VersionNotFoundException("Version not found: " + versionNumber));

        project.setTitle(version.getTitle());
        project.setDescription(version.getDescription());
        project.setStatus(version.getStatus());
        project.setCoverImage(version.getCoverImage());
        project.setTags(version.getTags());
        project.setConfig(version.getConfig());
        project.setLastResult(version.getLastResult());

        Project savedProject = projectRepository.save(project);
        return convertToResponse(savedProject);
    }

    @Transactional
    public void deleteVersion(Long projectId, Integer versionNumber, String account) {
        log.info("Deleting version {} of project {} for account: {}", versionNumber, projectId, account);

        Project project = projectRepository.findByIdAndAccount(projectId, account)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found or access denied: " + projectId));

        if (versionNumber.equals(project.getCurrentVersion())) {
            List<ProjectVersion> versions = projectVersionRepository.findByProjectIdOrderByVersionNumberDesc(projectId);
            if (versions.size() <= 1) {
                throw new InvalidOperationException("Cannot delete the only version");
            }
            ProjectVersion previousVersion = versions.get(1);
            
            project.setTitle(previousVersion.getTitle());
            project.setDescription(previousVersion.getDescription());
            project.setStatus(previousVersion.getStatus());
            project.setCoverImage(previousVersion.getCoverImage());
            project.setTags(previousVersion.getTags());
            project.setConfig(previousVersion.getConfig());
            project.setLastResult(previousVersion.getLastResult());
            project.setCurrentVersion(previousVersion.getVersionNumber());
            projectRepository.save(project);
        }

        projectVersionRepository.deleteByProjectIdAndVersionNumber(projectId, versionNumber);
    }

    @Transactional
    public void deleteProject(Long projectId, String account) {
        log.info("Deleting project: {} for account: {}", projectId, account);

        Project project = projectRepository.findByIdAndAccount(projectId, account)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found or access denied: " + projectId));

        // Delete all versions first
        projectVersionRepository.deleteByProjectId(projectId);

        // Delete the project
        projectRepository.delete(project);
    }

    private ProjectDTO.Response convertToResponse(Project project) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return ProjectDTO.Response.builder()
                .id(project.getId())
                .title(project.getTitle())
                .description(project.getDescription())
                .status(project.getStatus())
                .account(project.getAccount())
                .coverImage(project.getCoverImage())
                .tags(project.getTags())
                .config(project.getConfig())
                .lastResult(project.getLastResult())
                .currentVersion(project.getCurrentVersion())
                .createdTime(project.getCreatedTime() != null ? project.getCreatedTime().format(formatter) : null)
                .updatedTime(project.getUpdatedTime() != null ? project.getUpdatedTime().format(formatter) : null)
                .build();
    }

    private ProjectDTO.VersionResponse convertToVersionResponse(ProjectVersion version) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return ProjectDTO.VersionResponse.builder()
                .id(version.getId())
                .versionNumber(version.getVersionNumber())
                .title(version.getTitle())
                .description(version.getDescription())
                .status(version.getStatus())
                .coverImage(version.getCoverImage())
                .tags(version.getTags())
                .config(version.getConfig())
                .lastResult(version.getLastResult())
                .createdTime(version.getCreatedTime() != null ? version.getCreatedTime().format(formatter) : null)
                .build();
    }

    private TemplateDTO.Response convertToTemplateResponse(Template template) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return TemplateDTO.Response.builder()
                .id(template.getId())
                .projectId(template.getProjectId())
                .name(template.getName())
                .description(template.getDescription())
                .coverImage(template.getCoverImage())
                .tags(template.getTags())
                .useCount(template.getUseCount())
                .createdTime(template.getCreateTime() != null ? template.getCreateTime().format(formatter) : null)
                .build();
    }
}
