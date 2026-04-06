package com.dream.studio.config;

import com.dream.studio.service.RealUpstreamClient;
import com.dream.studio.service.SimulationUpstreamClient;
import com.dream.studio.service.UpstreamClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 上游服务客户端配置
 * 根据配置选择使用模拟数据或真实上游API
 */
@Configuration
public class UpstreamConfig {

    @Value("${upstream.client:simulation}")
    private String clientType;

    @Bean
    public UpstreamClient upstreamClient() {
        if ("production".equals(clientType)) {
            return new RealUpstreamClient();
        }
        return new SimulationUpstreamClient();
    }
}
