package com.dream.studio.exception;

/**
 * 版本不存在异常 - 返回 404 Not Found
 */
public class VersionNotFoundException extends RuntimeException {
    public VersionNotFoundException(String message) {
        super(message);
    }

    public VersionNotFoundException() {
        super("版本不存在");
    }
}
