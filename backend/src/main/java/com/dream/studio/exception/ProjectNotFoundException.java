package com.dream.studio.exception;

/**
 * 项目不存在或无权访问异常
 */
public class ProjectNotFoundException extends RuntimeException {
    public ProjectNotFoundException(String message) {
        super(message);
    }

    public ProjectNotFoundException() {
        super("项目不存在或无权访问");
    }
}