package com.dream.studio.controller;

import com.dream.studio.dto.ApiResponse;
import com.dream.studio.dto.TeamDTO;
import com.dream.studio.service.UpstreamClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/v1/teams")
@RequiredArgsConstructor
@Tag(name = "团队模块", description = "团队模板管理")
@CrossOrigin(origins = "*")
public class TeamController {

    private final UpstreamClient upstreamClient;

    // ========== 6.8 保存团队 ==========
    @PostMapping
    @Operation(summary = "保存团队", description = "保存一个团队模板")
    public ApiResponse<TeamSaveResponse> saveTeam(@RequestBody TeamDTO.SaveRequest request) {
        log.info("Saving team: teamName={}", request.getTeamName());
        Long teamId = upstreamClient.saveTeam(request);
        return ApiResponse.success(new TeamSaveResponse(teamId));
    }

    // ========== 6.9 获取团队详情 ==========
    @GetMapping("/{teamId}")
    @Operation(summary = "获取团队详情", description = "根据团队ID查询团队详情")
    public ApiResponse<TeamDTO.Response> getTeam(@PathVariable Long teamId) {
        log.info("Getting team: teamId={}", teamId);
        TeamDTO.Response team = upstreamClient.getTeam(teamId);
        return ApiResponse.success(team);
    }

    // ========== 6.10 搜索团队 ==========
    @PostMapping("/search")
    @Operation(summary = "搜索团队", description = "根据标签查询团队列表，支持分页")
    public ApiResponse<TeamDTO.ListResponse> searchTeams(@RequestBody TeamSearchRequest request) {
        log.info("Searching teams: tags={}, pageNo={}, pageSize={}",
                request.getTags(), request.getPageNo(), request.getPageSize());

        TeamDTO.ListResponse response = upstreamClient.searchTeams(
                request.getTags(),
                request.getPageNo() != null ? request.getPageNo() : 1,
                request.getPageSize() != null ? request.getPageSize() : 10
        );
        return ApiResponse.success(response);
    }

    // ========== 内部请求/响应类 ==========

    @lombok.Data
    public static class TeamSaveResponse {
        private Long teamId;

        public TeamSaveResponse(Long teamId) {
            this.teamId = teamId;
        }
    }

    @lombok.Data
    public static class TeamSearchRequest {
        private java.util.List<String> tags;
        private Integer pageNo;
        private Integer pageSize;
    }
}
