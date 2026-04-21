-- =====================================================
-- 造梦后端数据库 DDL 文档
-- 最后更新: 2026-04-22
-- =====================================================

-- =====================================================
-- 1. project (项目表)
-- =====================================================
CREATE TABLE IF NOT EXISTS project (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(256) NOT NULL,
    description TEXT,
    status VARCHAR(32) DEFAULT 'DRAFT',
    account VARCHAR(64) NOT NULL,
    cover_image VARCHAR(1024),
    tags VARCHAR(512),
    config TEXT,                           -- JSON，工作流定义等配置
    last_result TEXT,                     -- JSON，最后一次执行结果
    current_version INTEGER DEFAULT 1,
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_project_account ON project(account);
CREATE INDEX IF NOT EXISTS idx_project_status ON project(status);
CREATE INDEX IF NOT EXISTS idx_project_updated ON project(updated_time DESC);

COMMENT ON TABLE project IS '项目表';
COMMENT ON COLUMN project.config IS '工作流配置JSON';
COMMENT ON COLUMN project.last_result IS '最后执行结果JSON';


-- =====================================================
-- 2. project_version (项目版本表)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_version (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(256),
    description TEXT,
    status VARCHAR(32),
    account VARCHAR(64),
    cover_image VARCHAR(1024),
    tags VARCHAR(512),
    config TEXT,
    last_result TEXT,
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, version_number)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_pv_project ON project_version(project_id);
CREATE INDEX IF NOT EXISTS idx_pv_version ON project_version(project_id, version_number DESC);

COMMENT ON TABLE project_version IS '项目版本表，保存项目历史快照';


-- =====================================================
-- 3. asset (资产表)
-- =====================================================
CREATE TABLE IF NOT EXISTS asset (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    node_id VARCHAR(64),
    node_version_id BIGINT,
    agent_id BIGINT,
    asset_type VARCHAR(32),                -- character|scene|prop|storyboard|video
    asset_role VARCHAR(32),
    title VARCHAR(256),                   -- 资产名称
    uri VARCHAR(1024),                    -- 资产URI
    cover_uri VARCHAR(1024),              -- 缩略图URI
    mime_type VARCHAR(128),
    file_size BIGINT,
    metadata_json TEXT,                   -- JSON，元数据
    is_current BOOLEAN DEFAULT FALSE,
    status VARCHAR(32) DEFAULT 'READY',  -- pending|generated|modified
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_asset_project_node ON asset(project_id, node_id);
CREATE INDEX IF NOT EXISTS idx_asset_project_node_current ON asset(project_id, node_id, is_current);
CREATE INDEX IF NOT EXISTS idx_asset_node_version ON asset(node_version_id);
CREATE INDEX IF NOT EXISTS idx_asset_project_created ON asset(project_id, created_time DESC);

COMMENT ON TABLE asset IS '资产表，存储图片、视频等文件型资产';
COMMENT ON COLUMN asset.asset_type IS '资产类型：character/scene/prop/storyboard/video';
COMMENT ON COLUMN asset.status IS '状态：pending(待生成)/generated(已生成)/modified(已修改)';


-- =====================================================
-- 4. asset_usage (资产使用记录表)
-- =====================================================
CREATE TABLE IF NOT EXISTS asset_usage (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    asset_id BIGINT NOT NULL REFERENCES asset(id) ON DELETE CASCADE,
    used_by_node_id VARCHAR(64),          -- 使用方节点ID
    used_by_stage VARCHAR(32),            -- 使用方阶段
    context JSON,                         -- JSON，引用上下文如 { shotId: "shot-1" }
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_au_asset ON asset_usage(asset_id);
CREATE INDEX IF NOT EXISTS idx_au_project ON asset_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_au_node ON asset_usage(used_by_node_id);

COMMENT ON TABLE asset_usage IS '资产使用记录表，记录资产被谁引用用于影响分析';


-- =====================================================
-- 5. node_version (节点版本表)
-- =====================================================
CREATE TABLE IF NOT EXISTS node_version (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    node_id VARCHAR(64) NOT NULL,
    agent_id BIGINT,
    agent_code VARCHAR(64),
    node_type VARCHAR(64),
    version_no INTEGER,
    version_kind VARCHAR(32),
    source_version_id BIGINT,
    source_execution_id BIGINT,
    source_proposal_id BIGINT,
    is_current BOOLEAN DEFAULT FALSE,
    status VARCHAR(32) DEFAULT 'READY',
    input_snapshot_json TEXT,             -- JSON，输入参数快照
    param_snapshot_json TEXT,             -- JSON，参数快照
    result_text TEXT,                    -- 文本结果
    result_json TEXT,                     -- JSON，结构化结果
    thinking_text TEXT,                   -- AI 思考过程
    revision_reason TEXT,
    diff_summary TEXT,
    upstream_node_ids TEXT,               -- JSON，上游节点及版本信息
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_nv_project_node ON node_version(project_id, node_id);
CREATE INDEX IF NOT EXISTS idx_nv_project_node_current ON node_version(project_id, node_id, is_current);
CREATE INDEX IF NOT EXISTS idx_nv_source_execution ON node_version(source_execution_id);
CREATE INDEX IF NOT EXISTS idx_nv_source_proposal ON node_version(source_proposal_id);

COMMENT ON TABLE node_version IS '节点版本表，表达节点某一时刻的生效结果版本';
COMMENT ON COLUMN node_version.upstream_node_ids IS '上游节点信息JSON：[{"nodeId":"B","versionId":123}]';


-- =====================================================
-- 6. chat_session (对话会话表)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_session (
    id VARCHAR(64) PRIMARY KEY,          -- UUID
    project_id BIGINT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    account VARCHAR(64),
    message_count INTEGER DEFAULT 0,
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_time TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cs_project ON chat_session(project_id);
CREATE INDEX IF NOT EXISTS idx_cs_updated ON chat_session(updated_time DESC);

COMMENT ON TABLE chat_session IS '对话会话表';


-- =====================================================
-- 7. message (消息表)
-- =====================================================
CREATE TABLE IF NOT EXISTS message (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES chat_session(id) ON DELETE CASCADE,
    message_id VARCHAR(64) NOT NULL,      -- UUID
    user_content TEXT,                    -- 用户问题
    user_attachments TEXT,                 -- JSON，用户引用/上传的资产
    thinking TEXT,                         -- AI 思考过程
    assistant_content TEXT,               -- AI 回复内容
    assistant_assets TEXT,                -- JSON，AI 回复的资产
    metadata TEXT,                         -- JSON，元数据
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_msg_session ON message(session_id);
CREATE INDEX IF NOT EXISTS idx_msg_created ON message(created_time);

COMMENT ON TABLE message IS '消息表，一条记录包含用户问题+AI回复';
COMMENT ON COLUMN message.user_content IS '用户问题内容，为空表示系统推送';
COMMENT ON COLUMN message.user_attachments IS '用户上传或引用的资产JSON';


-- =====================================================
-- 8. template (模板表)
-- =====================================================
CREATE TABLE IF NOT EXISTS template (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES project(id) ON DELETE SET NULL,
    name VARCHAR(256) NOT NULL,
    description TEXT,
    cover_image VARCHAR(1024),
    tags VARCHAR(512),
    use_count INTEGER DEFAULT 0,
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_template_project ON template(project_id);

COMMENT ON TABLE template IS '模板表，存储项目模板';


-- =====================================================
-- 9. user (用户表)
-- =====================================================
CREATE TABLE IF NOT EXISTS "user" (
    id BIGSERIAL PRIMARY KEY,
    account VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(256) NOT NULL,
    name VARCHAR(128),
    email VARCHAR(256),
    avatar VARCHAR(1024),
    role VARCHAR(32) DEFAULT 'USER',
    status VARCHAR(32) DEFAULT 'ACTIVE',
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_account ON "user"(account);

COMMENT ON TABLE "user" IS '用户表';


-- =====================================================
-- 10. user_session (用户会话表)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,
    expired_time TIMESTAMP NOT NULL,
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_us_user ON user_session(user_id);
CREATE INDEX IF NOT EXISTS idx_us_session ON user_session(session_id);
CREATE INDEX IF NOT EXISTS idx_us_expired ON user_session(expired_time);

COMMENT ON TABLE user_session IS '用户会话表';


-- =====================================================
-- 更新记录
-- =====================================================
--
-- 2026-04-22:
--   - 初始化 DDL 文档
--   - 按设计文档对齐各表结构
--   - 添加必要的索引
