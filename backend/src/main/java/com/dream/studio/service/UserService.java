package com.dream.studio.service;

import com.dream.studio.dto.UserDTO;
import com.dream.studio.entity.User;
import com.dream.studio.entity.UserLoginRecord;
import com.dream.studio.repository.UserLoginRecordRepository;
import com.dream.studio.repository.UserRepository;
import com.dream.studio.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserLoginRecordRepository userLoginRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public UserDTO.Response register(UserDTO.RegisterRequest request) {
        log.info("Registering user: {}", request.getAccount());

        if (userRepository.existsByAccount(request.getAccount())) {
            throw new RuntimeException("账号已存在");
        }

        // 密码加密存储
        User user = User.builder()
                .account(request.getAccount())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .status(1)
                .build();

        User savedUser = userRepository.save(user);

        // 生成 JWT token
        String token = jwtUtil.generateToken(savedUser.getAccount(), savedUser.getId());

        return convertToResponse(savedUser, token);
    }

    @Transactional
    public UserDTO.LoginResponse login(UserDTO.LoginRequest request) {
        log.info("User login: {}", request.getAccount());

        User user = userRepository.findByAccount(request.getAccount())
                .orElseThrow(() -> new RuntimeException("账号或密码错误"));

        // 使用 BCrypt 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("账号或密码错误");
        }

        if (user.getStatus() != 1) {
            throw new RuntimeException("账号已被禁用");
        }

        // 记录登录
        UserLoginRecord record = UserLoginRecord.builder()
                .account(user.getAccount())
                .loginIp("127.0.0.1")
                .loginAddress("本地")
                .build();
        userLoginRecordRepository.save(record);

        // 生成 JWT token
        String token = jwtUtil.generateToken(user.getAccount(), user.getId());

        return convertToLoginResponse(user, token);
    }

    @Transactional(readOnly = true)
    public UserDTO.Response getUserInfo(String account) {
        User user = userRepository.findByAccount(account)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 生成新 token
        String token = jwtUtil.generateToken(user.getAccount(), user.getId());

        return convertToResponse(user, token);
    }

    @Transactional
    public UserDTO.Response updateUser(String account, UserDTO.UpdateRequest request) {
        User user = userRepository.findByAccount(account)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }

        User updatedUser = userRepository.save(user);

        // 生成新 token
        String token = jwtUtil.generateToken(updatedUser.getAccount(), updatedUser.getId());

        return convertToResponse(updatedUser, token);
    }

    // TODO: 发送验证码
    public void sendVerifyCode(String account) {
        log.info("Sending verify code to: {}", account);
    }

    private UserDTO.Response convertToResponse(User user, String token) {
        return UserDTO.Response.builder()
                .id(user.getId())
                .account(user.getAccount())
                .name(user.getName())
                .avatar(user.getAvatar())
                .token(token)
                .build();
    }

    private UserDTO.LoginResponse convertToLoginResponse(User user, String token) {
        return UserDTO.LoginResponse.builder()
                .id(user.getId())
                .account(user.getAccount())
                .name(user.getName())
                .avatar(user.getAvatar())
                .token(token)
                .build();
    }
}
