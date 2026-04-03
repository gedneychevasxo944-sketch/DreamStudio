package com.dream.studio.exception;

/**
 * 账号已被禁用异常 - 返回 401 Unauthorized
 */
public class AccountDisabledException extends RuntimeException {
    public AccountDisabledException(String message) {
        super(message);
    }

    public AccountDisabledException() {
        super("账号已被禁用");
    }
}
