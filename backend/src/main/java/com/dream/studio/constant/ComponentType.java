package com.dream.studio.constant;

public enum ComponentType {
    // 主节点
    ASSISTANT("assistant", "智能助理"),
    PRODUCER("producer", "资深影视制片人"),
    CONTENT("content", "金牌编剧"),
    VISUAL("visual", "概念美术总监"),
    DIRECTOR("director", "分镜导演"),
    TECHNICAL("technical", "视频提示词工程师"),
    VIDEO_GEN("videoGen", "视频生成"),
    VIDEO_EDITOR("videoEditor", "视频剪辑"),

    // AI 创作助手角色
    SCRIPT_PARSER("script_parser", "剧本解析助手"),
    STORYBOARD_GENERATOR("storyboard_generator", "分镜生成助手"),
    CHARACTER_OPTIMIZER("character_optimizer", "角色优化助手"),
    SCENE_OPTIMIZER("scene_optimizer", "场景优化助手"),
    PROP_OPTIMIZER("prop_optimizer", "道具优化助手"),
    SHOT_GENERATOR("shot_generator", "镜头生成助手");

    private final String code;
    private final String name;

    ComponentType(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public static ComponentType fromCode(String code) {
        for (ComponentType type : values()) {
            if (type.code.equals(code)) {
                return type;
            }
        }
        return null;
    }
}
