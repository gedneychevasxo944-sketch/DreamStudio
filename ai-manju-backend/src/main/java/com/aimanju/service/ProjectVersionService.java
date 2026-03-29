package com.aimanju.service;

import com.aimanju.dto.VersionDTO;
import com.aimanju.entity.ProjectVersion;
import com.aimanju.repository.ProjectVersionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class ProjectVersionService {

    private final ProjectVersionRepository versionRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public VersionDTO.ListResponse getVersions(String projectId) {
        log.info("Getting versions for project: {}", projectId);
        
        Long pid = Long.parseLong(projectId);
        List<ProjectVersion> versions = versionRepository.findByProjectIdOrderByVersionNumberDesc(pid);
        
        List<VersionDTO.Response> versionList = versions.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        
        return VersionDTO.ListResponse.builder()
                .versions(versionList)
                .total(versionList.size())
                .build();
    }

    @Transactional(readOnly = true)
    public VersionDTO.DetailResponse getVersion(String projectId, String versionId) {
        log.info("Getting version: {} for project: {}", versionId, projectId);
        
        Long vid = Long.parseLong(versionId);
        Long pid = Long.parseLong(projectId);
        
        ProjectVersion version = versionRepository.findById(vid)
                .filter(v -> v.getProjectId().equals(pid))
                .orElseThrow(() -> new RuntimeException("Version not found: " + versionId));
        
        return convertToDetailResponse(version);
    }

    @Transactional
    public VersionDTO.Response createVersion(String projectId, VersionDTO.CreateRequest request) {
        log.info("Creating version for project: {}, versionNumber: {}", projectId, request.getVersionNumber());
        
        Long pid = Long.parseLong(projectId);
        
        try {
            // 计算版本号
            long versionCount = versionRepository.findByProjectIdOrderByVersionNumberDesc(pid).size();
            Integer versionNumber = request.getVersionNumber() != null 
                    ? request.getVersionNumber().intValue() 
                    : (int) (versionCount + 1);
            
            ProjectVersion version = ProjectVersion.builder()
                    .projectId(pid)
                    .versionNumber(versionNumber)
                    .description(request.getDescription())
                    .config(objectMapper.writeValueAsString(request))
                    .status("active")
                    .account("system")
                    .build();
            
            ProjectVersion savedVersion = versionRepository.save(version);
            return convertToResponse(savedVersion);
            
        } catch (JsonProcessingException e) {
            log.error("Error serializing version data", e);
            throw new RuntimeException("Failed to create version", e);
        }
    }

    @Transactional
    public void deleteVersion(String projectId, String versionId) {
        log.info("Deleting version: {} for project: {}", versionId, projectId);
        
        Long vid = Long.parseLong(versionId);
        Long pid = Long.parseLong(projectId);
        
        ProjectVersion version = versionRepository.findById(vid)
                .filter(v -> v.getProjectId().equals(pid))
                .orElseThrow(() -> new RuntimeException("Version not found: " + versionId));
        
        versionRepository.delete(version);
    }

    @Transactional
    public VersionDTO.Response setDefaultVersion(String projectId, String versionId) {
        log.info("Setting default version: {} for project: {}", versionId, projectId);
        
        Long vid = Long.parseLong(versionId);
        Long pid = Long.parseLong(projectId);
        
        ProjectVersion version = versionRepository.findById(vid)
                .filter(v -> v.getProjectId().equals(pid))
                .orElseThrow(() -> new RuntimeException("Version not found: " + versionId));
        
        // 这里可以添加设置默认版本的逻辑
        // 由于实体中没有isDefault字段，暂时只返回版本信息
        
        return convertToResponse(version);
    }

    private VersionDTO.Response convertToResponse(ProjectVersion version) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        return VersionDTO.Response.builder()
                .id(version.getId())
                .projectId(version.getProjectId())
                .versionNumber(version.getVersionNumber())
                .description(version.getDescription())
                .isDefault(false) // 实体中没有该字段，默认false
                .createdAt(version.getCreatedTime() != null ? version.getCreatedTime().format(formatter) : null)
                .build();
    }

    private VersionDTO.DetailResponse convertToDetailResponse(ProjectVersion version) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        List<java.util.Map<String, Object>> nodes = List.of();
        List<java.util.Map<String, Object>> connections = List.of();
        
        // 尝试从config中解析nodes和connections
        if (version.getConfig() != null && !version.getConfig().isEmpty()) {
            try {
                java.util.Map<String, Object> configMap = objectMapper.readValue(version.getConfig(), 
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                if (configMap.get("nodes") != null) {
                    nodes = (List<java.util.Map<String, Object>>) configMap.get("nodes");
                }
                if (configMap.get("connections") != null) {
                    connections = (List<java.util.Map<String, Object>>) configMap.get("connections");
                }
            } catch (JsonProcessingException e) {
                log.error("Error parsing version config", e);
            }
        }
        
        return VersionDTO.DetailResponse.builder()
                .id(version.getId())
                .projectId(version.getProjectId())
                .versionNumber(version.getVersionNumber())
                .description(version.getDescription())
                .nodes(nodes)
                .connections(connections)
                .isDefault(false) // 实体中没有该字段，默认false
                .createdAt(version.getCreatedTime() != null ? version.getCreatedTime().format(formatter) : null)
                .build();
    }
}
