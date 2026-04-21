package com.dream.studio.service;

import com.dream.studio.dto.WorkflowDTO;
import com.dream.studio.sim.MockDataCenter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final MockDataCenter mockDataCenter;

    public WorkflowDTO.ListResponse getWorkflows() {
        log.info("Getting workflow templates");
        List<WorkflowDTO.Response> workflows = mockDataCenter.getWorkflows();
        return WorkflowDTO.ListResponse.builder()
                .workflows(workflows)
                .total(workflows.size())
                .build();
    }
}