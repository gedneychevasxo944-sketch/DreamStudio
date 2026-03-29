package com.aimanju.controller;

import com.aimanju.dto.ApiResponse;
import com.aimanju.dto.UserDTO;
import com.aimanju.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "认证模块", description = "用户注册、登录、验证码等接口")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    @Operation(summary = "用户注册", description = "注册新用户账号")
    public ApiResponse<UserDTO.Response> register(@Valid @RequestBody UserDTO.RegisterRequest request) {
        log.info("User register request: {}", request.getAccount());
        UserDTO.Response response = userService.register(request);
        return ApiResponse.success("注册成功", response);
    }

    @PostMapping("/login")
    @Operation(summary = "用户登录", description = "使用账号和密码登录")
    public ApiResponse<UserDTO.LoginResponse> login(@Valid @RequestBody UserDTO.LoginRequest request) {
        log.info("User login request: {}", request.getAccount());
        UserDTO.LoginResponse response = userService.login(request);
        return ApiResponse.success("登录成功", response);
    }

    @PostMapping("/sendVerifyCode")
    @Operation(summary = "发送验证码", description = "向邮箱或手机号发送验证码")
    public ApiResponse<Void> sendVerifyCode(@RequestBody UserDTO.SendVerifyCodeRequest request) {
        log.info("Send verify code request: {}", request.getAccount());
        userService.sendVerifyCode(request.getAccount());
        return ApiResponse.success("验证码已发送", null);
    }
}
