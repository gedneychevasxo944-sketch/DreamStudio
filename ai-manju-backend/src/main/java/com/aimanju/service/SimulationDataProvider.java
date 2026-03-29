package com.aimanju.service;

import com.aimanju.constant.ComponentType;
import com.aimanju.dto.NodeSimulationData;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
public class SimulationDataProvider {

    private static final Map<ComponentType, NodeSimulationData> SIMULATION_DATA_MAP = new HashMap<>();
    private static final Map<String, NodeSimulationData> ASSISTANT_SIMULATION_DATA_MAP = new HashMap<>();

    static {
        initSimulationData();
    }

    public static NodeSimulationData getSimulationDataByType(ComponentType type, String resultType) {
        if (type == ComponentType.ASSISTANT && ASSISTANT_SIMULATION_DATA_MAP.containsKey(resultType)) {
            return ASSISTANT_SIMULATION_DATA_MAP.get(resultType);
        }
        return SIMULATION_DATA_MAP.get(type);
    }

    private static void initSimulationData() {
        // 智能助理 - 文本回复
        ASSISTANT_SIMULATION_DATA_MAP.put("text", NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "正在理解您的问题...",
                "分析问题意图和关键信息...",
                "检索相关知识和信息...",
                "组织回答内容..."
            ))
            .resultType("text")
            .textResult("您好！我是智能助理，可以帮助您解答各类问题。\n\n我可以协助您：\n- 回答专业知识问题\n- 提供创意建议和灵感\n- 协助文档编写和整理\n- 分析和解决技术问题\n\n请问有什么可以帮您的？")
            .build());

        // 智能助理 - Markdown 回复
        NodeSimulationData assistantMarkdown = NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "正在分析您的需求...",
                "整理相关知识点...",
                "构建 Markdown 格式响应..."
            ))
            .resultType("markdown")
            .markdownResult("# 智能助理能力清单\n\n## 主要功能\n\n1. **知识问答** - 回答各领域专业问题\n2. **文案撰写** - 帮助编写文档、报告、邮件\n3. **代码开发** - 协助编程、调试、优化代码\n4. **数据分析** - 分析数据、生成图表\n\n## 使用示例\n\n```javascript\nconst greeting = 'Hello, World!';\nconsole.log(greeting);\n```\n\n> 提示：如有更多问题，请随时提问！")
            .build();
        ASSISTANT_SIMULATION_DATA_MAP.put("markdown", assistantMarkdown);

        // 智能助理 - 图片回复
        NodeSimulationData assistantImage = NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "正在理解图片需求...",
                "搜索相关图片资源...",
                "生成图片展示内容..."
            ))
            .resultType("image")
            .imageResults(List.of(
                "https://picsum.photos/800/400?random=1",
                "https://picsum.photos/800/400?random=2"
            ))
            .build();
        ASSISTANT_SIMULATION_DATA_MAP.put("image", assistantImage);

        // 智能助理 - 视频回复
        NodeSimulationData assistantVideo = NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "正在分析视频需求...",
                "检索视频资源...",
                "生成视频展示内容..."
            ))
            .resultType("video")
            .videoResults(List.of(
                NodeSimulationData.VideoResult.builder()
                    .url("https://www.w3schools.com/html/mov_bbb.mp4")
                    .title("示例视频")
                    .duration(10)
                    .description("这是一个示例视频，展示了视频播放功能。")
                    .build()
            ))
            .build();
        ASSISTANT_SIMULATION_DATA_MAP.put("video", assistantVideo);

        // 资深影视制片人 - result字段存储项目立项书文本
        SIMULATION_DATA_MAP.put(ComponentType.PRODUCER, NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "正在分析项目可行性...",
                "评估预算和资源需求...",
                "制定项目时间线...",
                "生成项目立项书..."
            ))
            .textResult("项目立项完成\n\n项目名称：都市情感微电影\n预算：500万\n周期：6个月\n\n项目概述：\n一部探讨现代都市人情感生活的微电影，讲述三个性格迥异的年轻人在追求梦想的过程中相互碰撞、相互支持的故事。\n\n主要角色：\n1. 林浩（男，28岁）- 创业青年，理想主义者\n2. 陈雨（女，26岁）- 时尚编辑，现实主义者\n3. 张明（男，30岁）- 医生，理性主义者\n\n预算分配：\n- 演员片酬：150万\n- 拍摄设备：80万\n- 场景搭建：100万\n- 后期制作：100万\n- 宣传发行：70万")
            .build());

        // 金牌编剧 - result字段存储剧本文本，按集数-场数格式
        SIMULATION_DATA_MAP.put(ComponentType.CONTENT, NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "构建故事框架...",
                "设计角色弧线...",
                "编写分场剧本...",
                "优化对白和节奏..."
            ))
            .textResult("分场剧本完成\n\n" +
                "第1集：清晨的邂逅\n\n" +
                "场景1-1：城市街道 日 外\n林立（男，28岁）匆匆走在上班路上，手里拿着咖啡，手机响个不停。路人匆匆走过，林立看了眼手表，加快了脚步。\n\n" +
                "场景1-2：写字楼大堂 日 内\n林浩赶到大堂，看到张明已经在等他了，两人相视一笑。\n张明：又迟到了，林总。\n林浩：（苦笑）这不是来了吗。\n\n" +
                "场景1-3：电梯内 日 内\n电梯门关上，里面只有林浩和张明两人。\n张明：听说你最近在创业？\n林浩：是啊，做了一个情感类的新媒体项目。\n\n" +
                "第2集：理想的碰撞\n\n" +
                "场景2-1：咖啡馆 日 内\n陈雨（女，26岁）坐在咖啡馆角落，正在用笔记本电脑处理工作。林浩和张明推门进来。\n张明：陈雨，好久不见！\n陈雨：（抬头）张明？真巧！\n\n" +
                "场景2-2：会议室 日 内\n三人围坐在会议室，桌上摆着各自的项目资料。\n陈雨：所以你们想合作？\n林浩：是的，我们需要专业的策划和执行团队。\n\n（剧本共2集15场，预计时长25分钟）")
            .build());

        // 概念美术总监 - 需要dataJson存储结构化数据
        // characters: [{name, description, thumbnail}]
        // scenes: [{name, description, thumbnail}]
        // props: [{name, description}]
        SIMULATION_DATA_MAP.put(ComponentType.VISUAL, NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "分析视觉风格参考...",
                "生成概念草图...",
                "优化色彩和构图...",
                "输出文生图指令..."
            ))
            .textResult("概念美术完成\n\n视觉风格：都市现代感 + 暖色调\n\n关键场景设计：\n1. 城市街道 - 清晨阳光，冷暖对比\n2. 写字楼 - 现代简约，蓝色调\n3. 咖啡馆 - 暖黄色调，复古元素\n4. 公寓 - 温馨感，家居氛围\n\n色彩方案：\n主色调：#4A90D9（蓝）\n辅色调：#F5A623（暖黄）\n强调色：#D0021B（红）")
            .dataJson("{"
                + "\"overallStyle\":\"都市现代感 + 暖色调\","
                + "\"characters\":["
                + "{\"id\":1,\"name\":\"林浩\",\"description\":\"28岁创业青年，理想主义者，穿着干练\",\"thumbnail\":\"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop\"},"
                + "{\"id\":2,\"name\":\"陈雨\",\"description\":\"26岁时尚编辑，知性优雅\",\"thumbnail\":\"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop\"},"
                + "{\"id\":3,\"name\":\"张明\",\"description\":\"30岁医生，沉稳内敛\",\"thumbnail\":\"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop\"}"
                + "],"
                + "\"scenes\":["
                + "{\"id\":1,\"name\":\"城市街道\",\"description\":\"清晨阳光，冷暖对比\",\"thumbnail\":\"https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=300&fit=crop\"},"
                + "{\"id\":2,\"name\":\"写字楼\",\"description\":\"现代简约，蓝色调\",\"thumbnail\":\"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop\"},"
                + "{\"id\":3,\"name\":\"咖啡馆\",\"description\":\"暖黄色调，复古元素\",\"thumbnail\":\"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop\"},"
                + "{\"id\":4,\"name\":\"公寓\",\"description\":\"温馨感，家居氛围\",\"thumbnail\":\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop\"}"
                + "],"
                + "\"props\":["
                + "{\"id\":1,\"name\":\"咖啡杯\",\"description\":\"林浩手中的咖啡道具\"},"
                + "{\"id\":2,\"name\":\"笔记本电脑\",\"description\":\"办公场景道具\"},"
                + "{\"id\":3,\"name\":\"文件夹\",\"description\":\"会议场景道具\"}"
                + "],"
                + "\"images\":["
                + "\"https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800\","
                + "\"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800\","
                + "\"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800\","
                + "\"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800\""
                + "]"
                + "}")
            .build());

        // 分镜导演 - 需要dataJson存储分镜表格
        // storyboards: [{id, shotNumber, angle, motion, content, duration, thumbnail}]
        SIMULATION_DATA_MAP.put(ComponentType.DIRECTOR, NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "分析剧本节奏...",
                "设计镜头语言...",
                "规划运镜方案...",
                "生成分镜脚本..."
            ))
            .textResult("分镜脚本完成\n\n分镜概览（共45个镜头）：\n\n第一场：城市街道（日）\n- SHOT 1: 广角镜头俯拍城市全景（5秒）\n- SHOT 2: 跟拍林浩行走（8秒，稳定器）\n- SHOT 3: 特写林浩手中的咖啡（3秒）\n- SHOT 4: 手机响起，特写屏幕（2秒）\n- SHOT 5: 林浩接电话表情变化（4秒）\n\n第二场：写字楼大堂（日）\n- SHOT 6: 中景张明等待（6秒）\n- SHOT 7: 林浩进入，两人握手（5秒）\n- SHOT 8: 双人镜头对话（12秒）")
            .dataJson("{"
                + "\"storyboards\":["
                + "{\"id\":1,\"shotNumber\":\"1\",\"angle\":\"全景俯拍\",\"motion\":\"固定\",\"content\":\"城市全景，阳光初升\",\"duration\":5,\"thumbnail\":\"https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=225&fit=crop\"},"
                + "{\"id\":2,\"shotNumber\":\"2\",\"angle\":\"跟拍\",\"motion\":\"移动\",\"content\":\"林浩行走在街道上\",\"duration\":8,\"thumbnail\":\"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop\"},"
                + "{\"id\":3,\"shotNumber\":\"3\",\"angle\":\"特写\",\"motion\":\"固定\",\"content\":\"手中的咖啡杯特写\",\"duration\":3,\"thumbnail\":\"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=225&fit=crop\"},"
                + "{\"id\":4,\"shotNumber\":\"4\",\"angle\":\"特写\",\"motion\":\"固定\",\"content\":\"手机屏幕亮起\",\"duration\":2,\"thumbnail\":\"https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=225&fit=crop\"},"
                + "{\"id\":5,\"shotNumber\":\"5\",\"angle\":\"中景\",\"motion\":\"轻微手持\",\"content\":\"林浩接听电话\",\"duration\":4,\"thumbnail\":\"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=225&fit=crop\"}"
                + "],"
                + "\"images\":["
                + "\"https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800\","
                + "\"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800\""
                + "]"
                + "}")
            .build());

        // 视频提示词工程师 - 需要dataJson存储视频提示词和参数
        // prompts: [{id, shotNumber, prompt, duration, keyframes:[]}]
        // genParams: {model, quality, ratio, duration, genTime}
        SIMULATION_DATA_MAP.put(ComponentType.TECHNICAL, NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "解析视觉输入...",
                "优化视频提示词...",
                "配置生成参数...",
                "打包输出指令..."
            ))
            .textResult("视频提示词包生成\n\n共生成15组视频生成指令\n\n【城市空镜】\nPrompt: A beautiful urban cityscape at sunrise, golden hour lighting, modern skyscrapers, cinematic, 4K\nNegative: blur, low quality, distortion\n\n【人物对话】\nPrompt: Two young professionals having a conversation in a modern office, natural lighting, handheld camera feel, film grain\nNegative: cartoon, anime, artificial")
            .dataJson("{"
                + "\"prompts\":["
                + "{\"id\":1,\"shotNumber\":\"1\",\"prompt\":\"A beautiful urban cityscape at sunrise, golden hour lighting, modern skyscrapers, cinematic, 4K\",\"duration\":\"5\",\"keyframes\":[\"https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop\",\"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=150&fit=crop\"]},"
                + "{\"id\":2,\"shotNumber\":\"2\",\"prompt\":\"Two young professionals having a conversation in a modern office, natural lighting, handheld camera feel, film grain\",\"duration\":\"8\",\"keyframes\":[\"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop\"]},"
                + "{\"id\":3,\"shotNumber\":\"3\",\"prompt\":\"Close-up of a coffee cup with steam rising, warm lighting, shallow depth of field\",\"duration\":\"3\",\"keyframes\":[\"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=150&fit=crop\"]},"
                + "{\"id\":4,\"shotNumber\":\"4\",\"prompt\":\"Smartphone screen lighting up with notification, close-up shot, dark background\",\"duration\":\"2\",\"keyframes\":[\"https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200&h=150&fit=crop\"]},"
                + "{\"id\":5,\"shotNumber\":\"5\",\"prompt\":\"Young man answering phone call, concerned expression, medium shot, office background\",\"duration\":\"4\",\"keyframes\":[\"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=150&fit=crop\"]}"
                + "],"
                + "\"genParams\":{"
                + "\"model\":\"CogVideoX-5B\","
                + "\"quality\":\"720P\","
                + "\"ratio\":\"16:9\","
                + "\"duration\":\"5-10s\","
                + "\"genTime\":\"30分钟\""
                + "}"
                + "}")
            .build());

        // 视频生成 - 需要dataJson存储视频预览信息
        // videoPrompt: 文本
        // genParams: {model, quality, ratio, duration, genTime}
        // videoPreview: URL
        SIMULATION_DATA_MAP.put(ComponentType.VIDEO_GEN, NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "解析视频提示词...",
                "加载生成模型...",
                "开始视频生成...",
                "生成完成，输出视频..."
            ))
            .textResult("视频生成完成\n\n使用模型：CogVideoX-5B\n分辨率：720P\n\n生成结果：\n- urban_sunrise.mp4 - 城市日出空镜（5秒）")
            .dataJson("{"
                + "\"videoPrompt\":\"A beautiful urban cityscape at sunrise, golden hour lighting, modern skyscrapers, cinematic, 4K\","
                + "\"genParams\":{"
                + "\"model\":\"CogVideoX-5B\","
                + "\"quality\":\"720P\","
                + "\"ratio\":\"16:9\","
                + "\"duration\":\"5s\","
                + "\"genTime\":\"30分钟\""
                + "},"
                + "\"videoPreview\":\"https://www.w3schools.com/html/mov_bbb.mp4\""
                + "}")
            .build());

        // 视频剪辑 - 需要dataJson存储剪辑信息
        SIMULATION_DATA_MAP.put(ComponentType.VIDEO_EDITOR, NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "分析待剪辑视频素材...",
                "提取关键片段...",
                "应用转场特效...",
                "生成最终成片..."
            ))
            .textResult("视频剪辑完成\n\n成片信息：\n- 时长：2分30秒\n- 分辨率：1920x1080 (1080P)\n- 帧率：24fps\n- 格式：MP4\n\n剪辑结构：\n00:00-00:15 序幕 - 城市空镜 + 片名\n00:15-00:45 第一幕 - 林浩出场，接到电话\n00:45-01:15 第二幕 - 三人相遇，介绍背景\n01:15-01:45 第三幕 - 情感碰撞，矛盾升级\n01:45-02:15 第四幕 - 内心独白，情感升华\n02:15-02:30 结尾 - 开放式结局")
            .dataJson("{"
                + "\"duration\":\"2分30秒\","
                + "\"resolution\":\"1920x1080\","
                + "\"frameRate\":\"24fps\","
                + "\"format\":\"MP4\","
                + "\"videos\":["
                + "{\"url\":\"https://www.w3schools.com/html/mov_bbb.mp4\",\"title\":\"都市情感微电影 - 成片\",\"duration\":150,\"description\":\"完整成片，可直接发布\"},"
                + "{\"url\":\"https://www.w3schools.com/html/mov_bbb.mp4\",\"title\":\"预告片（30秒）\",\"duration\":30,\"description\":\"用于宣传推广的预告片\"}"
                + "]"
                + "}")
            .build());
    }

    public static NodeSimulationData getSimulationData(ComponentType componentType) {
        NodeSimulationData data = SIMULATION_DATA_MAP.get(componentType);
        if (data == null) {
            log.warn("No simulation data found for component type: {}", componentType);
            return getDefaultSimulationData(componentType);
        }
        return data;
    }

    private static NodeSimulationData getDefaultSimulationData(ComponentType componentType) {
        return NodeSimulationData.builder()
            .thinkingSteps(List.of(
                "正在处理...",
                "分析数据...",
                "生成结果..."
            ))
            .textResult(componentType.getName() + "任务执行完成")
            .build();
    }

    public static boolean hasDataJson(ComponentType componentType) {
        NodeSimulationData data = SIMULATION_DATA_MAP.get(componentType);
        return data != null && data.getDataJson() != null && !data.getDataJson().isEmpty();
    }

    public static boolean hasImageResults(ComponentType componentType) {
        NodeSimulationData data = SIMULATION_DATA_MAP.get(componentType);
        if (data == null) return false;
        if (data.getImageResults() != null && !data.getImageResults().isEmpty()) return true;
        if (data.getDataJson() != null && data.getDataJson().contains("\"images\":")) return true;
        return false;
    }

    public static boolean hasVideoResults(ComponentType componentType) {
        NodeSimulationData data = SIMULATION_DATA_MAP.get(componentType);
        if (data == null) return false;
        if (data.getVideoResults() != null && !data.getVideoResults().isEmpty()) return true;
        if (data.getDataJson() != null && data.getDataJson().contains("\"videos\":")) return true;
        return false;
    }
}
