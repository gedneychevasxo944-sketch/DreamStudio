package com.dream.studio.exception;

/**
 * 模板不存在异常 - 返回 404 Not Found
 */
public class TemplateNotFoundException extends RuntimeException {
    public TemplateNotFoundException(String message) {
        super(message);
    }

    public TemplateNotFoundException() {
        super("模板不存在");
    }
}
