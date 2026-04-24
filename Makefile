.PHONY: help install dev backend start stop status clean

help: ## 显示帮助信息
	@echo ""
	@echo "DreamStudio 造梦AI"
	@echo ""
	@echo "Usage:"
	@echo "  make install    # 安装前后端依赖"
	@echo "  make dev        # 启动前端开发服务器"
	@echo "  make backend    # 启动后端服务"
	@echo "  make start      # 同时启动前后端"
	@echo "  make stop       # 停止所有服务"
	@echo "  make status     # 查看服务状态"
	@echo "  make clean      # 清理构建产物"
	@echo ""

install: ## 安装前后端依赖
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Frontend dependencies installed."

dev: ## 启动前端开发服务器
	cd frontend && npm run dev

backend: ## 启动后端服务
	cd backend && mvn spring-boot:run

start: ## 同时启动前后端
	@echo "Starting backend..."
	cd backend && mvn spring-boot:run &
	@echo "Backend starting on http://localhost:8080"
	@sleep 3
	@echo "Starting frontend..."
	cd frontend && npm run dev &
	@echo "Frontend starting on http://localhost:5173"

stop: ## 停止所有服务
	@echo "Stopping frontend..."
	@pkill -f "vite" 2>/dev/null || true
	@echo "Stopping backend..."
	@pkill -f "spring-boot:run" 2>/dev/null || true
	@pkill -f "Application" 2>/dev/null || true
	@echo "All services stopped."

status: ## 查看服务状态
	@echo ""
	@echo "Service Status:"
	@echo ""
	@echo "Frontend (Vite):"
	@if pgrep -f "vite" > /dev/null; then \
		echo "  ✅ Running (http://localhost:5173)"; \
	else \
		echo "  ❌ Not running"; \
	fi
	@echo ""
	@echo "Backend (Spring Boot):"
	@if pgrep -f "spring-boot:run\|Application" > /dev/null; then \
		echo "  ✅ Running (http://localhost:8080)"; \
	else \
		echo "  ❌ Not running"; \
	fi
	@echo ""

clean: ## 清理前后端构建产物
	@echo "Cleaning frontend..."
	cd frontend && rm -rf dist node_modules/.vite
	@echo "Cleaning backend..."
	cd backend && mvn clean
	@echo "Done."
