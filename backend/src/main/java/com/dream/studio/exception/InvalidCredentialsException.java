package com.dream.studio.exception;

/**
 * 认证失败异常（账号或密码错误）- 返回 401 Unauthorized
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }

    public InvalidCredentialsException() {
        super("账号或密码错误");
    }
}
