package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeSimulationData {
    private List<String> thinkingSteps;
    private String textResult;
    private String markdownResult;
    private List<String> imageResults;
    private List<VideoResult> videoResults;
    private String resultType;
    private String dataJson;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoResult {
        private String url;
        private String title;
        private Integer duration;
        private String description;
    }
}
