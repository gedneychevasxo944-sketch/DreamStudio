package com.dream.studio.controller;

import com.dream.studio.dto.ApiResponse;
import com.dream.studio.service.AdeptifyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * AI 统一入口 Controller
 * 将 /api/ai/chat 请求转发给 AdeptifyService
 * 内部对接 MockDataCenter（AI 未就绪前使用模拟数据）
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "AI模块", description = "AI 统一对话接口")
@CrossOrigin(origins = "*")
public class AiController {

    private final AdeptifyService adeptifyService;

    /**
     * 统一 AI 对话接口
     * POST /api/ai/chat
     */
    @PostMapping("/ai/chat")
    @Operation(summary = "AI 对话", description = "统一 AI 对话接口，根据 characterId 路由到不同的 AI 角色")
    public ApiResponse<String> chat(@RequestBody ChatRequest request) {
        log.info("AiController.chat - projectId: {}, characterId: {}, message length: {}",
            request.getProjectId(), request.getCharacterId(),
            request.getMessage() != null ? request.getMessage().length() : 0);

        String result = adeptifyService.chatSync(request.getCharacterId(), request.getMessage());
        return ApiResponse.success(result);
    }

    @lombok.Data
    public static class ChatRequest {
        private Long projectId;
        private String characterId;
        private String message;
    }
}
