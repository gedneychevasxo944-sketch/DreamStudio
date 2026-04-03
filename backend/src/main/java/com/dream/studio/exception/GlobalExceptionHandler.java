package com.dream.studio.exception;

import com.dream.studio.dto.ApiResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccessDeniedException(AccessDeniedException e) {
        log.warn("Access denied: {}", e.getMessage());
        return ApiResponse.error(403, "没有访问权限，请重新登录");
    }

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleUserNotFoundException(UserNotFoundException e) {
        log.warn("User not found: {}", e.getMessage());
        return ApiResponse.error(401, e.getMessage());
    }

    @ExceptionHandler(ProjectNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleProjectNotFoundException(ProjectNotFoundException e) {
        log.warn("Project not found: {}", e.getMessage());
        return ApiResponse.error(404, e.getMessage());
    }

    @ExceptionHandler(AccountAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleAccountAlreadyExistsException(AccountAlreadyExistsException e) {
        log.warn("Account already exists: {}", e.getMessage());
        return ApiResponse.error(409, e.getMessage());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleInvalidCredentialsException(InvalidCredentialsException e) {
        log.warn("Invalid credentials: {}", e.getMessage());
        return ApiResponse.error(401, e.getMessage());
    }

    @ExceptionHandler(AccountDisabledException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleAccountDisabledException(AccountDisabledException e) {
        log.warn("Account disabled: {}", e.getMessage());
        return ApiResponse.error(401, e.getMessage());
    }

    @ExceptionHandler(TemplateNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleTemplateNotFoundException(TemplateNotFoundException e) {
        log.warn("Template not found: {}", e.getMessage());
        return ApiResponse.error(404, e.getMessage());
    }

    @ExceptionHandler(VersionNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleVersionNotFoundException(VersionNotFoundException e) {
        log.warn("Version not found: {}", e.getMessage());
        return ApiResponse.error(404, e.getMessage());
    }

    @ExceptionHandler(InvalidOperationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleInvalidOperationException(InvalidOperationException e) {
        log.warn("Invalid operation: {}", e.getMessage());
        return ApiResponse.error(400, e.getMessage());
    }

    @ExceptionHandler(RuntimeException.class)
    public ApiResponse<Void> handleRuntimeException(RuntimeException e) {
        String message = e.getMessage();
        log.error("Runtime exception: {}", message, e);
        // 用户未登录相关的错误返回401
        if (message != null && (message.contains("用户未登录") || message.contains("请先打开一个项目"))) {
            return ApiResponse.error(401, message);
        }
        // 认证失败相关返回401
        if (message != null && (message.contains("账号或密码错误") || message.contains("账号已被禁用"))) {
            return ApiResponse.error(401, message);
        }
        // 资源冲突返回409
        if (message != null && message.contains("账号已存在")) {
            return ApiResponse.error(409, message);
        }
        return ApiResponse.error(400, message);
    }

    @ExceptionHandler(ExpiredJwtException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleExpiredJwtException(ExpiredJwtException e) {
        log.warn("JWT token expired: {}", e.getMessage());
        return ApiResponse.error(401, "登录已过期，请重新登录");
    }

    @ExceptionHandler(JwtException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleJwtException(JwtException e) {
        log.warn("JWT exception: {}", e.getMessage());
        return ApiResponse.error(401, "认证失败，请重新登录");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<Void> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse("参数校验失败");
        log.warn("Validation error: {}", message);
        return ApiResponse.error(400, message);
    }

    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleBindException(BindException e) {
        log.warn("Bind error: {}", e.getMessage());
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse("参数校验失败");
        return ApiResponse.error(400, message);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ApiResponse<Void> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("Illegal argument: {}", e.getMessage());
        return ApiResponse.error(400, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception e) {
        log.error("Unexpected exception: {}", e.getMessage(), e);
        return ApiResponse.error(500, "系统异常，请稍后重试");
    }
}
