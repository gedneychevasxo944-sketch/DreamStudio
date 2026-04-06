package com.dream.studio.config;

import com.dream.studio.entity.User;
import com.dream.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 数据初始化 - 创建默认管理员账号
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 创建默认管理员账号
        if (!userRepository.existsByAccount("admin")) {
            User admin = User.builder()
                    .account("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .name("管理员")
                    .status(1)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created: admin / admin123");
        } else {
            log.info("Admin user already exists");
        }

        // 创建测试账号
        if (!userRepository.existsByAccount("test")) {
            User test = User.builder()
                    .account("test")
                    .password(passwordEncoder.encode("test123"))
                    .name("测试用户")
                    .status(1)
                    .build();
            userRepository.save(test);
            log.info("Test user created: test / test123");
        }
    }
}
