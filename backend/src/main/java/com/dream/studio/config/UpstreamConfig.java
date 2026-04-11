package com.dream.studio.config;

import com.dream.studio.repository.AgentChatRecordRepository;
import com.dream.studio.repository.NodeProposalRepository;
import com.dream.studio.repository.NodeVersionRepository;
import com.dream.studio.service.RealUpstreamClient;
import com.dream.studio.service.SimulationUpstreamClient;
import com.dream.studio.service.UpstreamClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 上游服务客户端配置
 * 根据配置选择使用模拟数据或真实上游API
 */
@Configuration
@RequiredArgsConstructor
public class UpstreamConfig {

    @Value("${upstream.client:simulation}")
    private String clientType;

    private final NodeVersionRepository nodeVersionRepository;
    private final NodeProposalRepository nodeProposalRepository;
    private final AgentChatRecordRepository agentChatRecordRepository;
    private final TransactionTemplate transactionTemplate;

    @Bean
    public UpstreamClient upstreamClient() {
        if ("production".equals(clientType)) {
            return new RealUpstreamClient();
        }
        return new SimulationUpstreamClient(nodeVersionRepository, nodeProposalRepository, agentChatRecordRepository, transactionTemplate);
    }
}
