package com.aimanju.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class WorkflowDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Node {
        private String type;
        private String label;
        private String auditType;
        private String auditLabel;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Connection {
        private String from;
        private String to;
        private String type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private String id;
        private String name;
        private String description;
        private List<Node> nodes;
        private List<Connection> connections;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListResponse {
        private List<Response> workflows;
        private Integer total;
    }
}
