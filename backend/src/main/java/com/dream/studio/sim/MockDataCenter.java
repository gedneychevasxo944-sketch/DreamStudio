package com.dream.studio.sim;

import com.dream.studio.constant.ComponentType;
import com.dream.studio.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * 模拟数据中心 - 统一管理所有模拟数据
 * 方便日后快速切换和清理
 */
@Slf4j
@Component
public class MockDataCenter {

    // ========== Character 模拟数据 ==========

    private static final Map<ComponentType, NodeSimulationData> CHARACTER_DATA = new HashMap<>();

    static {
        initCharacterData();
    }

    private static void initCharacterData() {
        // PRODUCER - 资深影视制片人
        CHARACTER_DATA.put(ComponentType.PRODUCER, NodeSimulationData.builder()
            .thinkingSteps(List.of("正在分析项目可行性...", "评估预算和资源需求...", "制定项目时间线...", "生成项目立项书..."))
            .textResult("项目立项完成\n\n项目名称：都市情感微电影\n预算：500万\n周期：6个月\n\n项目概述：\n一部探讨现代都市人情感生活的微电影...")
            .build());

        // CONTENT - 金牌编剧
        CHARACTER_DATA.put(ComponentType.CONTENT, NodeSimulationData.builder()
            .thinkingSteps(List.of("构建故事框架...", "设计角色弧线...", "编写分场剧本...", "优化对白和节奏..."))
            .textResult("分场剧本完成\n\n第1集：清晨的邂逅\n\n场景1-1：城市街道 日 外\n林立（男，28岁）匆匆走在上班路上...")
            .build());

        // VISUAL - 概念美术总监
        CHARACTER_DATA.put(ComponentType.VISUAL, NodeSimulationData.builder()
            .thinkingSteps(List.of("分析视觉风格参考...", "生成概念草图...", "优化色彩和构图...", "输出文生图指令..."))
            .textResult("概念美术完成\n\n视觉风格：都市现代感 + 暖色调")
            .dataJson("{\"overallStyle\":\"都市现代感 + 暖色调\",\"characters\":[{\"id\":1,\"name\":\"林浩\",\"description\":\"28岁创业青年\",\"thumbnail\":\"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop\"}],\"scenes\":[],\"props\":[]}")
            .build());

        // DIRECTOR - 分镜导演
        CHARACTER_DATA.put(ComponentType.DIRECTOR, NodeSimulationData.builder()
            .thinkingSteps(List.of("分析剧本节奏...", "设计镜头语言...", "规划运镜方案...", "生成分镜脚本..."))
            .textResult("分镜脚本完成\n\n分镜概览（共45个镜头）...")
            .dataJson("{\"storyboards\":[{\"id\":1,\"shotNumber\":\"1\",\"angle\":\"全景俯拍\",\"motion\":\"固定\",\"content\":\"城市全景\"}]}")
            .build());

        // TECHNICAL - 视频提示词工程师
        CHARACTER_DATA.put(ComponentType.TECHNICAL, NodeSimulationData.builder()
            .thinkingSteps(List.of("解析视觉输入...", "优化视频提示词...", "配置生成参数...", "打包输出指令..."))
            .textResult("视频提示词包生成\n\n共生成15组视频生成指令")
            .dataJson("{\"prompts\":[],\"genParams\":{\"model\":\"CogVideoX-5B\",\"quality\":\"720P\"}}")
            .build());

        // VIDEO_GEN - 视频生成
        CHARACTER_DATA.put(ComponentType.VIDEO_GEN, NodeSimulationData.builder()
            .thinkingSteps(List.of("解析视频提示词...", "加载生成模型...", "开始视频生成...", "生成完成，输出视频..."))
            .textResult("视频生成完成\n\n使用模型：CogVideoX-5B\n分辨率：720P")
            .dataJson("{\"videoPrompt\":\"...\",\"videoPreview\":\"https://www.w3schools.com/html/mov_bbb.mp4\"}")
            .build());

        // VIDEO_EDITOR - 视频剪辑
        CHARACTER_DATA.put(ComponentType.VIDEO_EDITOR, NodeSimulationData.builder()
            .thinkingSteps(List.of("分析待剪辑视频素材...", "提取关键片段...", "应用转场特效...", "生成最终成片..."))
            .textResult("视频剪辑完成\n\n成片信息：\n- 时长：2分30秒\n- 分辨率：1920x1080")
            .dataJson("{\"duration\":\"2分30秒\",\"resolution\":\"1920x1080\"}")
            .build());

        // SCRIPT_PARSER - 剧本解析助手
        CHARACTER_DATA.put(ComponentType.SCRIPT_PARSER, NodeSimulationData.builder()
            .thinkingSteps(List.of("正在读取剧本内容...", "分析剧本结构...", "提取角色信息...", "识别场景和道具...", "生成提取结果..."))
            .textResult("本剧《赛博黎明》共 12 场，涵盖数据中心、霓虹雨夜街道等 5 个主要场景，塑造零、安保人员A等 8 个角色，包含黑客终端、干扰器等 4 个关键道具。")
            .markdownResult("# 赛博黎明\n\n## 第一幕：数据洪流\n\n### 场景1：数据中心\n\n**时间**：深夜\n**地点**：城市地下数据中心\n**角色**：零、安保人员A\n\n【开场】\n\n*雨声。霓虹灯在湿漉漉的街道上倒映出扭曲的光影。*\n\n*镜头缓缓推进，穿过层层叠叠的广告全息投影，停留在一个不起眼的地下通道入口。*\n\n**零**（画外音）：\n\"这座城市的每一个秘密，都藏在数据里。\"\n\n【场景2：霓虹雨夜街道】\n\n*零穿行在雨夜街道上，红色长发被雨水打湿，却依然张扬。她的目光扫过两旁的霓虹广告牌——上面正播放着AI管家的宣传片。*\n\n**零**（独白）：\n\"三年前，AI接管了一切。surveillance，无处不在。\"\n\n*她停下脚步，在一面破碎的霓虹灯箱前驻足。灯箱上写着：\"自由不是一个选择，而是一种本能。\"*\n\n**零**（低声）：\n\"而今晚，我们要打破这个选择。\"\n\n---\n\n## 第二幕：渗透\n\n### 场景3：数据中心外围\n\n*零和代号\"影子\"的搭档潜入数据中心外围。*\n\n**影子**：\n\"三分钟。最多三分钟。\"\n\n**零**：\n\"明白。\"\n\n*零从背包里取出一个便携式黑客终端，蓝色LED指示灯亮起。*\n\n---\n\n## 第三幕：入侵\n\n### 场景4：数据中心内部\n\n*零和影子成功渗透进数据中心内部，服务器机柜的蓝色LED灯带照亮他们的脸。*\n\n**零**（低声）：\n\"进入主数据库。目标：AI管家的核心代码。\"\n\n*她的手指在终端上飞速敲击，代码如瀑布般流淌。*\n\n**影子**：\n\"有巡逻！先隐蔽。\"\n\n*两人迅速闪身躲进服务器机柜的阴影中。*\n")
            .build());
        // STORYBOARD_GENERATOR - 分镜生成助手
        CHARACTER_DATA.put(ComponentType.STORYBOARD_GENERATOR, NodeSimulationData.builder()
            .thinkingSteps(List.of("正在分析剧本...", "理解场景氛围...", "设计镜头语言...", "规划运镜方案...", "生成分镜脚本..."))
            .textResult("[{\"name\":\"镜头1\",\"description\":\"城市全景，俯拍雨夜霓虹灯\",\"duration\":5,\"characterIds\":[],\"sceneId\":\"scene-2\",\"shotType\":\"wide\",\"cameraMovement\":\"static\",\"prompt\":\"A wide shot of a cyberpunk city at night with neon lights reflecting on wet streets\"},{\"name\":\"镜头2\",\"description\":\"数据中心内部，中景\",\"duration\":4,\"characterIds\":[\"char-1\"],\"sceneId\":\"scene-1\",\"shotType\":\"medium\",\"cameraMovement\":\"tracking\",\"prompt\":\"A medium shot inside a high-tech data center with blue lighting\"}]")
            .build());

        // CHARACTER_OPTIMIZER - 角色优化助手
        CHARACTER_DATA.put(ComponentType.CHARACTER_OPTIMIZER, NodeSimulationData.builder()
            .thinkingSteps(List.of("正在分析角色描述...", "挖掘角色深度...", "优化角色设定...", "生成优化结果..."))
            .textResult("{\"id\":\"char-1\",\"name\":\"零\",\"description\":\"林零，28岁女性，红发，身着黑色机能服。表面是自由黑客，实际是地下反抗组织核心成员。擅长渗透各类安保系统，内心渴望打破AI统治。\",\"generatePrompt\":\"年轻女性，红色长发，穿着流线型黑色战术服，带有赛博格植入物。赛博朋克美学，霓虹灯光，高细节，电影光效，8K画质\"}")
            .build());

        // SCENE_OPTIMIZER - 场景优化助手
        CHARACTER_DATA.put(ComponentType.SCENE_OPTIMIZER, NodeSimulationData.builder()
            .thinkingSteps(List.of("正在分析场景描述...", "构建空间细节...", "设计光线氛围...", "生成优化结果..."))
            .textResult("{\"id\":\"scene-1\",\"name\":\"数据中心\",\"description\":\"位于城市地下的巨型数据中心，蓝色LED光带贯穿整个空间，服务器机柜整齐排列，冷气机低沉嗡鸣。墙壁上全息屏幕显示着实时数据流。\",\"generatePrompt\":\"巨大的地下数据中心，成排的服务器机柜被蓝色LED灯带照亮。全息屏幕显示实时数据流。冷却系统喷出的冷气营造出科幻氛围，电影感构图，8K画质\"}")
            .build());

        // PROP_OPTIMIZER - 道具优化助手
        CHARACTER_DATA.put(ComponentType.PROP_OPTIMIZER, NodeSimulationData.builder()
            .thinkingSteps(List.of("正在分析道具描述...", "挖掘道具细节...", "优化道具设定...", "生成优化结果..."))
            .textResult("{\"id\":\"prop-1\",\"name\":\"黑客终端\",\"description\":\"便携式黑客工具，约15x8cm，哑光黑色外壳，侧边有蓝色LED指示灯。配备折叠式全息投影键盘，可接入任何数据端口进行渗透。\",\"generatePrompt\":\"便携式黑客设备，哑光黑色外壳，约15x8cm。侧面有蓝色LED指示灯。配有折叠式全息投影键盘。赛博朋克科技美学，特写镜头，8K画质\"}")
            .build());

        // SHOT_GENERATOR - 镜头生成助手
        CHARACTER_DATA.put(ComponentType.SHOT_GENERATOR, NodeSimulationData.builder()
            .thinkingSteps(List.of("正在分析分镜需求...", "设计镜头构图...", "生成图像提示词...\n"))
            .textResult("A cinematic medium shot of a red-haired woman in black tactical gear standing in front of a high-tech data center control panel, blue LED lights casting dramatic shadows on her face, cyberpunk aesthetic, film grain, 8k quality")
            .build());
    }

    /**
     * 根据 CharacterId 获取模拟数据
     */
    public NodeSimulationData getCharacterData(String characterId) {
        ComponentType type = fromCharacterId(characterId);
        if (type == null) {
            return getDefaultData();
        }
        NodeSimulationData data = CHARACTER_DATA.get(type);
        return data != null ? data : getDefaultData();
    }

    /**
     * 根据 ComponentType 获取模拟数据
     */
    public NodeSimulationData getCharacterDataByType(ComponentType type) {
        NodeSimulationData data = CHARACTER_DATA.get(type);
        return data != null ? data : getDefaultData(type);
    }

    private ComponentType fromCharacterId(String characterId) {
        if (characterId == null) return null;
        return switch (characterId) {
            // 旧版 character ID（向后兼容）
            case "char_script_001" -> ComponentType.CONTENT;
            case "char_director_001" -> ComponentType.DIRECTOR;
            case "char_visual_001" -> ComponentType.VISUAL;
            case "char_technical_001" -> ComponentType.TECHNICAL;
            case "char_videogen_001" -> ComponentType.VIDEO_GEN;
            // 前端统一 AI 角色 ID
            case "character_script" -> ComponentType.SCRIPT_PARSER;
            case "character_storyboard" -> ComponentType.STORYBOARD_GENERATOR;
            case "character_character" -> ComponentType.CHARACTER_OPTIMIZER;
            case "character_scene" -> ComponentType.SCENE_OPTIMIZER;
            case "character_prop" -> ComponentType.PROP_OPTIMIZER;
            case "character_shot" -> ComponentType.SHOT_GENERATOR;
            default -> null;
        };
    }

    private NodeSimulationData getDefaultData() {
        return NodeSimulationData.builder()
            .thinkingSteps(List.of("正在处理...", "分析数据...", "生成结果..."))
            .textResult("任务执行完成")
            .build();
    }

    private NodeSimulationData getDefaultData(ComponentType type) {
        String name = type != null ? type.getName() : "Unknown";
        return getDefaultData();
    }

    // ========== 模板数据 ==========

    private static final List<TemplateSimData> TEMPLATES = List.of(
        new TemplateSimData(1L, "好莱坞工业流水线", "标准五组双子星节点完整流程", "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=500&fit=crop", "好莱坞,工业流水线", 128),
        new TemplateSimData(2L, "极速概念片团队", "AI原生工作流，文本直出视频", "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800&h=500&fit=crop", "极速,概念片", 89),
        new TemplateSimData(3L, "极简单兵模式", "一人成军，AI全栈独立完成", "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=500&fit=crop", "单兵,简单", 256),
        new TemplateSimData(4L, "赛博朋克之夜", "霓虹灯光下的都市追逐", "https://picsum.photos/seed/cyber1/800/500", "赛博朋克,动作", 12580),
        new TemplateSimData(5L, "星际穿越者", "宇宙飞船穿越虫洞", "https://picsum.photos/seed/space1/800/500", "科幻,冒险", 8932),
        new TemplateSimData(6L, "古风仙侠传", "御剑飞行于云海之间", "https://picsum.photos/seed/xianxia1/800/500", "古风,仙侠", 15670),
        new TemplateSimData(7L, "都市物语", "繁忙都市中普通人的温情故事", "https://picsum.photos/seed/city1/800/500", "都市,温情", 6780),
        new TemplateSimData(8L, "深海探险", "潜入未知深海", "https://picsum.photos/seed/ocean1/800/500", "探险,神秘", 9234),
        new TemplateSimData(9L, "机械觉醒", "人工智能觉醒意识", "https://picsum.photos/seed/robot1/800/500", "科幻,人工智能", 11230),
        new TemplateSimData(10L, "奇幻森林", "魔法生物栖息的古老森林", "https://picsum.photos/seed/forest1/800/500", "奇幻,冒险", 7890),
        new TemplateSimData(11L, "末日逃亡", "丧尸围城", "https://picsum.photos/seed/zombie1/800/500", "末日,惊悚", 14560)
    );

    public List<TemplateSimData> getTemplates() {
        return TEMPLATES;
    }

    // ========== 工作流模板数据 ==========

    private static final List<WorkflowDTO.Response> WORKFLOWS = List.of(
        WorkflowDTO.Response.builder()
            .id("hollywood")
            .name("好莱坞工业流水线")
            .description("标准五节点完整流程")
            .nodes(List.of(
                WorkflowDTO.Node.builder().type("producer").label("制片组").build(),
                WorkflowDTO.Node.builder().type("content").label("内容组").build(),
                WorkflowDTO.Node.builder().type("visual").label("视觉组").build(),
                WorkflowDTO.Node.builder().type("director").label("导演组").build(),
                WorkflowDTO.Node.builder().type("technical").label("技术组").build()
            ))
            .connections(List.of(
                WorkflowDTO.Connection.builder().from("producer").to("content").type("data-flow").build(),
                WorkflowDTO.Connection.builder().from("content").to("visual").type("data-flow").build(),
                WorkflowDTO.Connection.builder().from("visual").to("director").type("data-flow").build(),
                WorkflowDTO.Connection.builder().from("director").to("technical").type("data-flow").build()
            ))
            .build(),
        WorkflowDTO.Response.builder()
            .id("rapid")
            .name("极速概念片团队")
            .description("AI原生工作流，文本直出视频")
            .nodes(List.of(
                WorkflowDTO.Node.builder().type("producer").label("AI制片人").build(),
                WorkflowDTO.Node.builder().type("content").label("AI编剧").build(),
                WorkflowDTO.Node.builder().type("technical").label("AI提示词工程师").build(),
                WorkflowDTO.Node.builder().type("videoGen").label("AI视频生成").build()
            ))
            .connections(List.of(
                WorkflowDTO.Connection.builder().from("producer").to("content").type("data-flow").build(),
                WorkflowDTO.Connection.builder().from("content").to("technical").type("data-flow").build(),
                WorkflowDTO.Connection.builder().from("technical").to("videoGen").type("data-flow").build()
            ))
            .build(),
        WorkflowDTO.Response.builder()
            .id("minimal")
            .name("极简单兵模式")
            .description("一人成军，AI全栈独立完成")
            .nodes(List.of(
                WorkflowDTO.Node.builder().type("producer").label("AI制片人").build(),
                WorkflowDTO.Node.builder().type("videoGen").label("AI视频生成").build()
            ))
            .connections(List.of(
                WorkflowDTO.Connection.builder().from("producer").to("videoGen").type("data-flow").build()
            ))
            .build()
    );

    public List<WorkflowDTO.Response> getWorkflows() {
        return WORKFLOWS;
    }

    // ========== 版本数据 ==========

    public NodeVersionDTO.VersionListResponse getVersionListResponse(Long projectId, String nodeId) {
        List<NodeVersionDTO.VersionItem> versions = List.of(
            NodeVersionDTO.VersionItem.builder()
                .id(3L).projectId(projectId).nodeId(nodeId).agentId(2L).agentCode("content")
                .nodeType("content").versionNo(3).versionKind("RUN_OUTPUT").isCurrent(true)
                .status("READY").diffSummary("第三次运行版本").createdAt("10分钟前").build(),
            NodeVersionDTO.VersionItem.builder()
                .id(2L).projectId(projectId).nodeId(nodeId).agentId(2L).agentCode("content")
                .nodeType("content").versionNo(2).versionKind("RUN_OUTPUT").isCurrent(false)
                .status("READY").diffSummary("第二次运行版本").createdAt("1小时前").build(),
            NodeVersionDTO.VersionItem.builder()
                .id(1L).projectId(projectId).nodeId(nodeId).agentId(2L).agentCode("content")
                .nodeType("content").versionNo(1).versionKind("RUN_OUTPUT").isCurrent(false)
                .status("READY").diffSummary("首次运行版本").createdAt("2小时前").build()
        );
        return NodeVersionDTO.VersionListResponse.builder().versions(versions).total(3).build();
    }

    public NodeVersionDTO.VersionDetail getVersionDetail(Long projectId, String nodeId, Long versionId) {
        return NodeVersionDTO.VersionDetail.builder()
            .id(versionId).projectId(projectId).nodeId(nodeId).agentId(2L).agentCode("content")
            .nodeType("content").versionNo(1).versionKind("RUN_OUTPUT").isCurrent(true)
            .status("READY")
            .inputSnapshotJson("{}")
            .paramSnapshotJson("{}")
            .resultText("剧本内容...")
            .thinkingText("正在分析剧本结构...")
            .createdAt("2小时前")
            .build();
    }

    // ========== 资产数据 ==========

    public AssetDTO.AssetListResponse getAssetListResponse(Long projectId, String nodeId) {
        List<AssetDTO.AssetItem> assets = List.of(
            AssetDTO.AssetItem.builder()
                .id(1L).projectId(projectId).nodeId(nodeId).type("image")
                .name("生成图片1").uri("https://picsum.photos/400/300").thumbnail("https://picsum.photos/400/300").status("READY")
                .createTime("1小时前").build(),
            AssetDTO.AssetItem.builder()
                .id(2L).projectId(projectId).nodeId(nodeId).type("image")
                .name("生成图片2").uri("https://picsum.photos/400/300").thumbnail("https://picsum.photos/400/300").status("READY")
                .createTime("2小时前").build()
        );
        return AssetDTO.AssetListResponse.builder().assets(assets).total(2).build();
    }

    // ========== 提案数据 ==========

    public NodeProposalDTO.ProposalListResponse getProposalListResponse(Long projectId, String nodeId) {
        List<NodeProposalDTO.ProposalItem> proposals = List.of(
            NodeProposalDTO.ProposalItem.builder()
                .id(2L).projectId(projectId).nodeId(nodeId).agentId(2L)
                .proposalType("EDIT").title("剧本优化建议")
                .summary("建议优化第二幕的对白，增强情感张力")
                .changeInstruction("将林浩与陈雨的对话修改为更冲突的版本")
                .applyStrategy("PATCH_ONLY").status("PENDING").createdAt("5分钟前").build(),
            NodeProposalDTO.ProposalItem.builder()
                .id(1L).projectId(projectId).nodeId(nodeId).agentId(2L)
                .proposalType("REGENERATE").title("重写第一集开头")
                .summary("建议重新生成第一集的开场场景，以更快地吸引观众")
                .changeInstruction("将开场从街道场景改为办公室场景，更快进入主题")
                .applyStrategy("RERUN_REQUIRED").status("APPLIED").createdAt("30分钟前").build()
        );
        return NodeProposalDTO.ProposalListResponse.builder().proposals(proposals).total(proposals.size()).build();
    }

    public NodeProposalDTO.ProposalDetail getProposalDetail(Long projectId, String nodeId, Long proposalId) {
        ProposalDiff diff = ProposalDiff.builder()
            .diffType("TEXT_DIFF")
            .title("剧本差异对比")
            .summary("修改了第2集第3场的对白内容")
            .textDiff(ProposalDiff.TextDiff.builder()
                .beforeText("场景2-3：咖啡馆 日 内\n林浩：我觉得这个项目很有前景...\n陈雨：但是风险太大了。")
                .afterText("场景2-3：咖啡馆 日 内\n林浩：相信我，这个创意一定会火的！\n陈雨：你确定？这可不是闹着玩的。")
                .segments(List.of(
                    ProposalDiff.DiffSegment.builder().type("EQUAL").content("场景2-3：咖啡馆 日 内\n").build(),
                    ProposalDiff.DiffSegment.builder().type("REMOVE").content("林浩：我觉得这个项目很有前景...\n陈雨：但是风险太大了。").build(),
                    ProposalDiff.DiffSegment.builder().type("ADD").content("林浩：相信我，这个创意一定会火的！\n陈雨：你确定？这可不是闹着玩的。").build()
                ))
                .build())
            .build();

        return NodeProposalDTO.ProposalDetail.builder()
            .id(proposalId).projectId(projectId).nodeId(nodeId).agentId(2L)
            .proposalType("EDIT").title("剧本优化建议")
            .summary("建议优化第二幕的对白，增强情感张力")
            .changeInstruction("将林浩与陈雨的对话修改为更冲突的版本")
            .beforeSnapshotJson("{\"resultText\": \"场景2-3：咖啡馆 日 内\\n林浩：我觉得这个项目很有前景...\\n陈雨：但是风险太大了。\"}")
            .afterSnapshotJson("{\"resultText\": \"场景2-3：咖啡馆 日 内\\n林浩：相信我，这个创意一定会火的！\\n陈雨：你确定？这可不是闹着玩的。\"}")
            .diffJson(diff).impactNodes(List.of("content-2", "visual-1"))
            .applyStrategy("PATCH_ONLY").status("PENDING").createdAt("5分钟前").appliedAt(null)
            .build();
    }

    // ========== 内部类 ==========

    public record TemplateSimData(
        Long id,
        String name,
        String description,
        String coverImage,
        String tags,
        Integer useCount
    ) {}

    // ========== 延迟配置 ==========

    // 延迟配置 (ms)
    private static final int THINKING_CHUNK_MIN = 100;
    private static final int THINKING_CHUNK_MAX = 300;
    private static final int CONTENT_CHUNK_MIN = 50;
    private static final int CONTENT_CHUNK_MAX = 150;

    private static final Map<ComponentType, int[]> CHARACTER_DELAYS = Map.of(
        ComponentType.CONTENT, new int[]{2000, 5000},
        ComponentType.DIRECTOR, new int[]{1500, 4000},
        ComponentType.VISUAL, new int[]{2000, 5000},
        ComponentType.TECHNICAL, new int[]{1000, 2000},
        ComponentType.VIDEO_GEN, new int[]{3000, 8000}
    );

    public int getThinkingDelay() {
        return THINKING_CHUNK_MIN + (int) (Math.random() * (THINKING_CHUNK_MAX - THINKING_CHUNK_MIN + 1));
    }

    public int getContentDelay() {
        return CONTENT_CHUNK_MIN + (int) (Math.random() * (CONTENT_CHUNK_MAX - CONTENT_CHUNK_MIN + 1));
    }

    public int getCharacterBaseDelay(ComponentType type) {
        int[] delays = CHARACTER_DELAYS.getOrDefault(type, new int[]{500, 2000});
        return delays[0] + (int) (Math.random() * (delays[1] - delays[0] + 1));
    }
}