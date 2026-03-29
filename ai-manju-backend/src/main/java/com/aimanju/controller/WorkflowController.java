package com.aimanju.controller;

import com.aimanju.dto.ApiResponse;
import com.aimanju.dto.WorkflowDTO;
import com.aimanju.service.WorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/workflows")
@RequiredArgsConstructor
@Tag(name = "工作流模块", description = "获取预设流派模板")
@CrossOrigin(origins = "*")
public class WorkflowController {

    private final WorkflowService workflowService;

    @GetMapping
    @Operation(summary = "获取预设流派", description = "获取所有预设的工作流流派模板")
    public ApiResponse<WorkflowDTO.ListResponse> getWorkflows() {
        log.info("Getting workflow templates");
        WorkflowDTO.ListResponse response = workflowService.getWorkflows();
        return ApiResponse.success(response);
    }
}
