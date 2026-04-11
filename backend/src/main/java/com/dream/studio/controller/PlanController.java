package com.dream.studio.controller;

import com.dream.studio.dto.ApiResponse;
import com.dream.studio.dto.PlanDTO;
import com.dream.studio.dto.TeamDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 规划方案控制器
 * 提供预设的工作流方案供用户选择
 */
@Slf4j
@RestController
@RequestMapping("/v1/plans")
@RequiredArgsConstructor
@Tag(name = "方案模块", description = "预设工作流方案管理")
@CrossOrigin(origins = "*")
public class PlanController {

    /**
     * 获取所有可用方案
     * 这些方案是预设的，用户选择后可以直接创建对应的工作流
     */
    @GetMapping
    @Operation(summary = "获取方案列表", description = "获取所有预设的工作流方案")
    public ApiResponse<PlanDTO.PlanListResponse> getPlans() {
        log.info("Getting all plans");

        List<PlanDTO.PlanItem> plans = List.of(
                // 精品短剧 - 完整链路
                PlanDTO.PlanItem.builder()
                        .id(1L)
                        .name("推荐链路 - 精品短剧")
                        .description("完整链路，覆盖编剧、美术、分镜、视频生成，适合追求品质的精品项目")
                        .mode("director")
                        .estimatedTime("约2小时")
                        .nodes(List.of(
                                PlanDTO.PlanNode.builder().id("producer").name("资深制片人").icon("Target").color("#3b82f6").build(),
                                PlanDTO.PlanNode.builder().id("content").name("金牌编剧").icon("PenTool").color("#06b6d4").build(),
                                PlanDTO.PlanNode.builder().id("visual").name("概念美术").icon("Palette").color("#8b5cf6").build(),
                                PlanDTO.PlanNode.builder().id("director").name("分镜导演").icon("Video").color("#f59e0b").build(),
                                PlanDTO.PlanNode.builder().id("technical").name("提示词工程师").icon("Code").color("#10b981").build(),
                                PlanDTO.PlanNode.builder().id("videoGen").name("视频生成").icon("Play").color("#6366f1").build()
                        ))
                        .edges(List.of(
                                PlanDTO.PlanEdge.builder().from("producer").to("content").build(),
                                PlanDTO.PlanEdge.builder().from("content").to("visual").build(),
                                PlanDTO.PlanEdge.builder().from("visual").to("director").build(),
                                PlanDTO.PlanEdge.builder().from("director").to("technical").build(),
                                PlanDTO.PlanEdge.builder().from("technical").to("videoGen").build()
                        ))
                        .build(),

                // 快速链路 - 粗糙短剧
                PlanDTO.PlanItem.builder()
                        .id(2L)
                        .name("快速链路 - 粗糙短剧")
                        .description("精简链路，编剧到视频一气呵成，适合快速试产和灵感验证")
                        .mode("factory")
                        .estimatedTime("约30分钟")
                        .nodes(List.of(
                                PlanDTO.PlanNode.builder().id("content").name("金牌编剧").icon("PenTool").color("#06b6d4").build(),
                                PlanDTO.PlanNode.builder().id("visual").name("概念美术").icon("Palette").color("#8b5cf6").build(),
                                PlanDTO.PlanNode.builder().id("videoGen").name("视频生成").icon("Play").color("#6366f1").build()
                        ))
                        .edges(List.of(
                                PlanDTO.PlanEdge.builder().from("content").to("visual").build(),
                                PlanDTO.PlanEdge.builder().from("visual").to("videoGen").build()
                        ))
                        .build()
        );

        PlanDTO.PlanListResponse response = PlanDTO.PlanListResponse.builder()
                .plans(plans)
                .total(plans.size())
                .build();

        return ApiResponse.success(response);
    }

    /**
     * 根据ID获取方案详情
     */
    @GetMapping("/{planId}")
    @Operation(summary = "获取方案详情", description = "根据ID获取指定方案的详细信息")
    public ApiResponse<PlanDTO.PlanItem> getPlan(@PathVariable Long planId) {
        log.info("Getting plan: {}", planId);

        PlanDTO.PlanItem plan = getPlans().getData().getPlans().stream()
                .filter(p -> p.getId().equals(planId))
                .findFirst()
                .orElse(null);

        if (plan == null) {
            return ApiResponse.success(null);
        }

        return ApiResponse.success(plan);
    }
}
