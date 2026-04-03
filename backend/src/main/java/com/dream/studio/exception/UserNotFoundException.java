package com.dream.studio.exception;

/**
 * 用户不存在或未认证异常
 */
public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException() {
        super("用户不存在或未登录");
    }
}