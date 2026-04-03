package com.dream.studio.exception;

/**
 * 账号已存在异常 - 返回 409 Conflict
 */
public class AccountAlreadyExistsException extends RuntimeException {
    public AccountAlreadyExistsException(String message) {
        super(message);
    }

    public AccountAlreadyExistsException() {
        super("账号已存在");
    }
}
