/**
 * 项目相关类型定义
 */

/**
 * @typedef {Object} Project
 * @property {number} id - 项目ID
 * @property {string} title - 项目标题
 * @property {string} account - 所有者账号
 * @property {number} currentVersion - 当前版本号
 * @property {string} status - 项目状态
 * @property {string} createdTime - 创建时间
 * @property {string} updatedTime - 更新时间
 * @property {string|Object} config - 项目配置（JSON字符串或对象）
 */

/**
 * @typedef {Object} ProjectConfig
 * @property {Node[]} nodes - 节点列表
 * @property {Connection[]} connections - 连接列表
 * @property {Viewport} viewport - 视口配置
 */

/**
 * @typedef {Object} Viewport
 * @property {number} x - 视口X偏移
 * @property {number} y - 视口Y偏移
 * @property {number} zoom - 缩放比例
 */

/**
 * @typedef {Object} Version
 * @property {string|number} id - 版本ID
 * @property {string} name - 版本名称（如 V1.0）
 * @property {number} versionNumber - 版本号
 * @property {string} description - 版本描述
 * @property {string} createdAt - 创建时间
 * @property {boolean} isDefault - 是否为当前版本
 * @property {string|Object} config - 版本配置
 */

/**
 * 工作流相关类型定义
 */

/**
 * @typedef {Object} Node
 * @property {string} id - 节点ID
 * @property {string} type - 节点类型
 * @property {string} name - 节点名称
 * @property {number} x - 节点X坐标
 * @property {number} y - 节点Y坐标
 * @property {string} color - 节点颜色
 * @property {string} icon - 节点图标
 * @property {string} category - 节点分类
 * @property {NodePort[]} inputs - 输入端口
 * @property {NodePort[]} outputs - 输出端口
 * @property {Object} data - 节点数据
 * @property {string} status - 节点状态 (idle|running|completed)
 */

/**
 * @typedef {Object} NodePort
 * @property {string} id - 端口ID
 * @property {string} label - 端口标签
 * @property {string} type - 端口类型 (text|image|document|any)
 */

/**
 * @typedef {Object} Connection
 * @property {string} id - 连接ID
 * @property {string} from - 源节点ID
 * @property {string} fromPort - 源端口ID
 * @property {string} to - 目标节点ID
 * @property {string} toPort - 目标端口ID
 * @property {string} type - 连接类型 (data-flow)
 */

/**
 * @typedef {Object} DAG
 * @property {DAGNode[]} nodes - DAG节点
 * @property {DAGEdge[]} edges - DAG边
 */

/**
 * @typedef {Object} DAGNode
 * @property {string} id - 节点ID
 * @property {string} type - 节点类型
 * @property {Object} config - 节点配置
 */

/**
 * @typedef {Object} DAGEdge
 * @property {string} from - 源节点ID
 * @property {string} to - 目标节点ID
 */

/**
 * 聊天相关类型定义
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string|number} id - 消息ID
 * @property {string} role - 消息角色 (user|assistant)
 * @property {string} content - 消息内容
 * @property {string} timestamp - 时间戳
 * @property {string[]} thinking - 思考过程
 * @property {string} resultType - 结果类型 (text|image|markdown|video)
 * @property {string} result - 结果内容
 */

/**
 * @typedef {Object} SSEEvent
 * @property {string} type - 事件类型 (init|thinking|status|result|complete|error)
 * @property {string} nodeId - 节点ID
 * @property {string} content - 事件内容
 * @property {Object} data - 附加数据
 */

/**
 * 智能体相关类型定义
 */

/**
 * @typedef {Object} Agent
 * @property {string} id - 智能体ID（也是type）
 * @property {string} name - 智能体名称
 * @property {string} category - 智能体分类
 * @property {string} icon - 智能体图标
 * @property {string} color - 智能体颜色
 * @property {NodePort[]} inputs - 输入端口
 * @property {NodePort[]} outputs - 输出端口
 */

/**
 * @typedef {Object} AgentConfig
 * @property {string} initialPrompt - 初始提示词
 * @property {string} selfEvolutionPrompt - 自我进化提示词
 * @property {Object} modelConfig - 模型配置
 * @property {string[]} skills - 技能列表
 */

/**
 * 执行相关类型定义
 */

/**
 * @typedef {Object} ExecutionState
 * @property {number} executionId - 执行ID
 * @property {string} status - 执行状态
 * @property {CompletedNode[]} completedNodes - 已完成节点
 * @property {string[]} pendingNodeIds - 待执行节点ID
 * @property {DAG} dag - 有向无环图
 */

/**
 * @typedef {Object} CompletedNode
 * @property {string} nodeId - 节点ID
 * @property {string} result - 执行结果
 * @property {string[]} thinking - 思考过程
 */

/**
 * API 响应相关类型定义
 */

/**
 * @typedef {Object} ApiResponse
 * @property {number} code - 响应码
 * @property {string} message - 响应消息
 * @property {*} data - 响应数据
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {number} total - 总数
 * @property {number} page - 当前页
 * @property {number} pageSize - 每页大小
 * @property {*} list - 数据列表
 */

export default {};
