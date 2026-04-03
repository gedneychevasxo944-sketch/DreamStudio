package com.dream.studio.exception;

/**
 * 无效操作异常 - 返回 400 Bad Request
 */
public class InvalidOperationException extends RuntimeException {
    public InvalidOperationException(String message) {
        super(message);
    }

    public InvalidOperationException() {
        super("操作无效");
    }
}
