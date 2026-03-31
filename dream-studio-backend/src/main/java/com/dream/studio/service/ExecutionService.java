package com.dream.studio.service;

import com.dream.studio.dto.DAGDTO;
import com.dream.studio.dto.ExecutionRequest;
import com.dream.studio.dto.ExecutionState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionService {

    private final UpstreamAiClient upstreamAiClient;

    private final Map<Long, ExecutionState> executionStateMap = new ConcurrentHashMap<>();
    private final AtomicLong executionIdCounter = new AtomicLong(1);

    public SseEmitter startExecution(Long projectId, ExecutionRequest request) {
        Long executionId = request.getExecutionId();
        DAGDTO dag = request.getDag();
        Integer projectVersion = request.getProjectVersion();

        if (executionId == null) {
            executionId = executionIdCounter.getAndIncrement();
            log.info("Creating new execution: {} for project: {}, version: {}", executionId, projectId, projectVersion);

            List<String> pendingNodeIds = dag.getNodes() != null
                ? dag.getNodes().stream().map(DAGDTO.DAGNode::getId).collect(Collectors.toList())
                : new ArrayList<>();

            ExecutionState state = ExecutionState.builder()
                .executionId(executionId)
                .status("running")
                .completedNodes(new ArrayList<>())
                .dag(new HashMap<>())
                .pendingNodeIds(pendingNodeIds)
                .build();

            executionStateMap.put(executionId, state);
            request.setExecutionId(executionId);
        } else {
            log.info("Resuming execution: {} for project: {}, version: {}", executionId, projectId, projectVersion);
        }

        return upstreamAiClient.executeAndStream(executionId, projectId, projectVersion, dag, executionStateMap);
    }

    public ExecutionState getExecutionState(Long executionId) {
        return executionStateMap.get(executionId);
    }

    public void updateExecutionState(Long executionId, List<ExecutionState.CompletedNode> completedNodes, List<String> pendingNodeIds) {
        ExecutionState state = executionStateMap.get(executionId);
        if (state != null) {
            state.getCompletedNodes().addAll(completedNodes);
            state.setPendingNodeIds(pendingNodeIds);
        }
    }
}
