package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 团队数据传输对象
 * 对应上游 API 文档 6.8-6.10
 */
public class TeamDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveRequest {
        private String teamName;
        private String teamDescribe;
        private List<String> tags;
        private DAGDTO dag;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long teamId;
        private String teamName;
        private String teamDescribe;
        private List<String> tags;
        private String createTime;
        private String updateTime;
        private DAGDTO dag;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListResponse {
        private List<Response> list;
        private Integer pageNo;
        private Integer pageSize;
        private Integer total;
    }
}
