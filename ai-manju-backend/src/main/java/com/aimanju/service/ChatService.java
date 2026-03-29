package com.aimanju.service;

import com.aimanju.dto.ChatDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final UpstreamAiClient upstreamAiClient;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SseEmitter sendMessageStream(ChatDTO.SendRequest request) {
        SseEmitter emitter = new SseEmitter(300000L);
        log.info("Starting SSE chat for project: {}, agent: {}", request.getProjectId(), request.getAgentId());

        executor.execute(() -> {
            try {
                ChatDTO.MessageResponse response = upstreamAiClient.sendChatMessage(request);

                if (response.getThinkingSteps() != null && !response.getThinkingSteps().isEmpty()) {
                    for (String step : response.getThinkingSteps()) {
                        String stepData = objectMapper.writeValueAsString(new StepData(step));
                        emitter.send(SseEmitter.event()
                            .name("thinking")
                            .data(stepData));
                        Thread.sleep(500);
                    }
                }

                ResultData resultData = new ResultData(
                    response.getResultType() != null ? response.getResultType() : "text",
                    response.getResult() != null ? response.getResult() : "",
                    response.getThinkingSteps(),
                    response.getWorkflowCreated(),
                    response.getWorkflowNodes(),
                    response.getWorkflowEdges()
                );
                emitter.send(SseEmitter.event()
                    .name("result")
                    .data(objectMapper.writeValueAsString(resultData)));

                emitter.complete();
            } catch (IOException e) {
                log.error("SSE error: {}", e.getMessage());
                emitter.completeWithError(e);
            } catch (InterruptedException e) {
                log.error("Thread interrupted: {}", e.getMessage());
                Thread.currentThread().interrupt();
                emitter.complete();
            }
        });

        return emitter;
    }

    public static class StepData {
        private String step;
        public StepData() {}
        public StepData(String step) { this.step = step; }
        public String getStep() { return step; }
        public void setStep(String step) { this.step = step; }
    }

    public static class ResultData {
        private String resultType;
        private String result;
        private List<String> thinkingSteps;
        private Boolean workflowCreated;
        private List<ChatDTO.WorkflowNode> workflowNodes;
        private List<ChatDTO.WorkflowEdge> workflowEdges;
        public ResultData() {}
        public ResultData(String resultType, String result, List<String> thinkingSteps,
                          Boolean workflowCreated, List<ChatDTO.WorkflowNode> workflowNodes,
                          List<ChatDTO.WorkflowEdge> workflowEdges) {
            this.resultType = resultType;
            this.result = result;
            this.thinkingSteps = thinkingSteps;
            this.workflowCreated = workflowCreated;
            this.workflowNodes = workflowNodes;
            this.workflowEdges = workflowEdges;
        }
        public String getResultType() { return resultType; }
        public void setResultType(String resultType) { this.resultType = resultType; }
        public String getResult() { return result; }
        public void setResult(String result) { this.result = result; }
        public List<String> getThinkingSteps() { return thinkingSteps; }
        public void setThinkingSteps(List<String> thinkingSteps) { this.thinkingSteps = thinkingSteps; }
        public Boolean getWorkflowCreated() { return workflowCreated; }
        public void setWorkflowCreated(Boolean workflowCreated) { this.workflowCreated = workflowCreated; }
        public List<ChatDTO.WorkflowNode> getWorkflowNodes() { return workflowNodes; }
        public void setWorkflowNodes(List<ChatDTO.WorkflowNode> workflowNodes) { this.workflowNodes = workflowNodes; }
        public List<ChatDTO.WorkflowEdge> getWorkflowEdges() { return workflowEdges; }
        public void setWorkflowEdges(List<ChatDTO.WorkflowEdge> workflowEdges) { this.workflowEdges = workflowEdges; }
    }

    public ChatDTO.HistoryResponse getChatHistory(Long projectId, Integer version, String agentId) {
        log.info("Getting chat history for project: {}, version: {}, agent: {}", projectId, version, agentId);
        return upstreamAiClient.getChatHistory(projectId, version, agentId);
    }
}
