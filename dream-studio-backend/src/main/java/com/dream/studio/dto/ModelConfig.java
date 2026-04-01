package com.dream.studio.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelConfig {
    private String modelProvider;
    private String modelName;
    private String apiKey;
    private String baseUrl;
    private List<ProviderOption> providerOptions;
    private Map<String, List<String>> modelOptions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderOption {
        private String id;
        private String name;
    }
}
