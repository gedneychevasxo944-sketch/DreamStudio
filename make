#!/bin/bash

# DreamStudio 开发环境启动脚本
#
# 用法:
#   ./make                  # 启动前后端（前台）
#   ./make start            # 启动前后端（前台）
#   ./make back             # 启动前后端（后台）
#   ./make stop             # 停止所有服务
#   ./make restart          # 重启所有服务
#   ./make frontend         # 只启动前端（前台）
#   ./make frontend back    # 只启动前端（后台）
#   ./make backend          # 只启动后端（前台）
#   ./make backend back     # 只启动后端（后台）
#   ./make status           # 查看服务状态
#   ./make --help           # 显示帮助

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 查找进程
find_vite() {
    pgrep -f "vite" 2>/dev/null | head -1
}

find_backend() {
    pgrep -f "AiManjuBackendApplication" 2>/dev/null | head -1
}

# 停止服务
stop_services() {
    echo "🛑 停止服务..."

    # 杀掉前端
    VITE_PIDS=$(pgrep -f "vite" 2>/dev/null || true)
    for pid in $VITE_PIDS; do
        kill -9 $pid 2>/dev/null || true
    done

    # 杀掉后端相关进程
    BACKEND_PIDS=$(pgrep -f "AiManjuBackendApplication" 2>/dev/null || true)
    for pid in $BACKEND_PIDS; do
        kill -9 $pid 2>/dev/null || true
    done
    MAVEN_PIDS=$(pgrep -f "spring-boot:run" 2>/dev/null || true)
    for pid in $MAVEN_PIDS; do
        kill -9 $pid 2>/dev/null || true
    done

    # 等待进程真正停止
    sleep 1

    # 检查是否还有残留
    REMAIN_VITE=$(pgrep -f "vite" 2>/dev/null || true)
    REMAIN_BACKEND=$(pgrep -f "AiManjuBackendApplication" 2>/dev/null || true)
    REMAIN_MAVEN=$(pgrep -f "spring-boot:run" 2>/dev/null || true)

    if [ -z "$REMAIN_VITE" ] && [ -z "$REMAIN_BACKEND" ] && [ -z "$REMAIN_MAVEN" ]; then
        echo "  ✅ 所有服务已停止"
    else
        echo "  ⚠️  部分服务可能未停止"
    fi
}

# 启动前端
start_frontend() {
    local bg_mode="${1:-前台}"
    VITE_PID=$(find_vite)
    if [ -n "$VITE_PID" ]; then
        echo "⚠️  前端已在运行 (PID: $VITE_PID)"
        return
    fi

    echo "🚀 启动前端 (Vite)..."
    cd frontend
    if [ "$bg_mode" = "后台" ]; then
        nohup npm run dev > /dev/null 2>&1 &
    else
        npm run dev &
    fi
    cd ..
    echo "  ✅ 前端已启动 (http://localhost:5173)"
}

# 启动后端
start_backend() {
    local bg_mode="${1:-前台}"
    BACKEND_PID=$(find_backend)
    if [ -n "$BACKEND_PID" ]; then
        echo "⚠️  后端已在运行 (PID: $BACKEND_PID)"
        return
    fi

    # 检查是否需要构建
    if [ ! -f "backend/target/dream-studio-backend-1.0.0.jar" ]; then
        echo "🔨 构建后端..."
        cd backend
        mvn clean package -DskipTests -q
        cd ..
    fi

    echo "🚀 启动后端 (Spring Boot)..."
    cd backend
    if [ "$bg_mode" = "后台" ]; then
        nohup mvn spring-boot:run -q > /dev/null 2>&1 &
    else
        mvn spring-boot:run -q &
    fi
    cd ..
    echo "  ✅ 后端已启动 (http://localhost:8080)"
}

# 查看状态
show_status() {
    VITE_PID=$(find_vite)
    BACKEND_PID=$(pgrep -f "AiManjuBackendApplication" 2>/dev/null | head -1)

    echo "========================================="
    echo "DreamStudio 服务状态"
    echo "========================================="

    if [ -n "$VITE_PID" ]; then
        echo "  前端: ✅ 运行中 (PID: $VITE_PID)"
    else
        echo "  前端: ❌ 未运行"
    fi

    if [ -n "$BACKEND_PID" ]; then
        echo "  后端: ✅ 运行中 (PID: $BACKEND_PID)"
    else
        echo "  后端: ❌ 未运行"
    fi
    echo "========================================="
}

# 主逻辑
case "${1:-start}" in
    --help|-h)
        echo "DreamStudio 开发环境启动脚本"
        echo ""
        echo "用法:"
        echo "  ./make                  # 启动前后端（前台）"
        echo "  ./make start            # 启动前后端（前台）"
        echo "  ./make back             # 启动前后端（后台）"
        echo "  ./make stop             # 停止所有服务"
        echo "  ./make restart          # 重启所有服务"
        echo "  ./make frontend         # 只启动前端（前台）"
        echo "  ./make frontend back    # 只启动前端（后台）"
        echo "  ./make backend          # 只启动后端（前台）"
        echo "  ./make backend back     # 只启动后端（后台）"
        echo "  ./make status           # 查看服务状态"
        echo "  ./make --help           # 显示帮助"
        ;;
    start|back)
        echo "========================================="
        echo "DreamStudio 开发环境启动"
        echo "========================================="

        # 检查前端依赖
        if [ ! -d "frontend/node_modules" ]; then
            echo "📦 安装前端依赖..."
            npm install
        fi

        start_backend
        sleep 3
        start_frontend

        echo ""
        echo "========================================="
        if [ "$1" = "back" ]; then
            echo "✅ 服务已在后台启动"
        else
            echo "✅ 服务已启动"
        fi
        echo "   前端: http://localhost:5173"
        echo "   后端: http://localhost:8080"
        echo "========================================="

        # 前台模式等待信号
        if [ "$1" != "back" ]; then
            echo "按 Ctrl+C 停止服务"
            trap "stop_services; exit 0" SIGINT SIGTERM
            wait
        fi
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_backend
        sleep 3
        start_frontend
        ;;
    frontend)
        if [ "$2" = "back" ]; then
            start_frontend "后台"
        else
            start_frontend
        fi
        ;;
    backend)
        if [ "$2" = "back" ]; then
            start_backend "后台"
        else
            start_backend
        fi
        ;;
    status)
        show_status
        ;;
    *)
        echo "未知参数: $1"
        echo "使用 ./make --help 查看用法"
        exit 1
        ;;
esac
