package com.aimanju;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@OpenAPIDefinition(
        info = @Info(
                title = "AI Manju Backend API",
                version = "1.0.0",
                description = "AI电影生产工作流平台后端API"
        )
)
public class AiManjuBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiManjuBackendApplication.class, args);
    }
}
