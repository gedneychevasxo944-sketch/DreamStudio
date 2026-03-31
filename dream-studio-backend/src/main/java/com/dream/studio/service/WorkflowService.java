package com.dream.studio.service;

import com.dream.studio.dto.WorkflowDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowService {

    public WorkflowDTO.ListResponse getWorkflows() {
        log.info("Getting workflow templates");
        return WorkflowDTO.ListResponse.builder()
                .workflows(getMockWorkflows())
                .total(getMockWorkflows().size())
                .build();
    }

    private List<WorkflowDTO.Response> getMockWorkflows() {
        return List.of(
            createHollywoodWorkflow(),
            createRapidWorkflow(),
            createMinimalWorkflow()
        );
    }

    private WorkflowDTO.Response createHollywoodWorkflow() {
        return WorkflowDTO.Response.builder()
                .id("hollywood")
                .name("好莱坞工业流水线")
                .description("标准五节点完整流程")
                .nodes(List.of(
                    WorkflowDTO.Node.builder().type("producer").label("制片组").build(),
                    WorkflowDTO.Node.builder().type("content").label("内容组").build(),
                    WorkflowDTO.Node.builder().type("visual").label("视觉组").build(),
                    WorkflowDTO.Node.builder().type("director").label("导演组").build(),
                    WorkflowDTO.Node.builder().type("technical").label("技术组").build()
                ))
                .connections(List.of(
                    WorkflowDTO.Connection.builder().from("producer").to("content").type("data-flow").build(),
                    WorkflowDTO.Connection.builder().from("content").to("visual").type("data-flow").build(),
                    WorkflowDTO.Connection.builder().from("visual").to("director").type("data-flow").build(),
                    WorkflowDTO.Connection.builder().from("director").to("technical").type("data-flow").build()
                ))
                .build();
    }

    private WorkflowDTO.Response createRapidWorkflow() {
        return WorkflowDTO.Response.builder()
                .id("rapid")
                .name("极速概念片团队")
                .description("AI原生工作流，文本直出视频")
                .nodes(List.of(
                    WorkflowDTO.Node.builder().type("producer").label("AI制片人").build(),
                    WorkflowDTO.Node.builder().type("content").label("AI编剧").build(),
                    WorkflowDTO.Node.builder().type("technical").label("AI提示词工程师").build(),
                    WorkflowDTO.Node.builder().type("videoGen").label("AI视频生成").build()
                ))
                .connections(List.of(
                    WorkflowDTO.Connection.builder().from("producer").to("content").type("data-flow").build(),
                    WorkflowDTO.Connection.builder().from("content").to("technical").type("data-flow").build(),
                    WorkflowDTO.Connection.builder().from("technical").to("videoGen").type("data-flow").build()
                ))
                .build();
    }

    private WorkflowDTO.Response createMinimalWorkflow() {
        return WorkflowDTO.Response.builder()
                .id("minimal")
                .name("极简单兵模式")
                .description("一人成军，AI全栈独立完成")
                .nodes(List.of(
                    WorkflowDTO.Node.builder().type("producer").label("AI制片人").build(),
                    WorkflowDTO.Node.builder().type("videoGen").label("AI视频生成").build()
                ))
                .connections(List.of(
                    WorkflowDTO.Connection.builder().from("producer").to("videoGen").type("data-flow").build()
                ))
                .build();
    }
}
