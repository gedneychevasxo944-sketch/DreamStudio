# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DreamStudio (造梦AI)** - An AI-driven intelligent film production platform. The system uses a node-based visual workflow editor where multi-agent teams collaborate to produce film content from script to final video.

## Tech Stack

- **Frontend**: React 18 + Vite, Framer Motion, Lucide React icons
- **Backend**: Spring Boot 3.2.0, Java 21, JPA/Hibernate with H2 (dev) or MySQL (prod)
- **API Proxy**: Vite proxies `/api` requests to backend at `http://localhost:8080`

## Development Commands

```bash
# Frontend (root)
npm run dev      # Start dev server at localhost:5173
npm run build    # Production build
npm run lint     # ESLint check

# Backend (dream-studio-backend/)
cd dream-studio-backend
mvn spring-boot:run  # Start backend at localhost:8080
mvn test             # Run tests
```

## Architecture

### Frontend Structure

```
src/
├── components/
│   ├── NodeCanvas/           # Core visual workflow editor
│   │   ├── NodeCanvas.jsx   # Main canvas with pan/zoom
│   │   ├── RichAgentNode.jsx # Node component with ports
│   │   ├── NodeConnection.jsx # SVG connection lines
│   │   ├── AgentLibrary.jsx  # Sidebar agent picker
│   │   └── PipelineTemplates.jsx # Template loader
│   ├── Console.jsx          # Left panel - execution logs & chat
│   ├── AssetPanel/          # Right panel - generated assets
│   ├── HomePage.jsx         # Project list & entry point
│   └── SkillMarket/         # Plugin marketplace
├── services/api.js          # All backend API calls
├── constants/ComponentType.js # Node type definitions
└── App.jsx                  # Root component, view routing
```

### Backend Structure

```
dream-studio-backend/
├── controller/              # REST endpoints
│   ├── HomePageController   # Projects CRUD
│   ├── WorkSpaceController  # Workflow execution
│   └── AuthController       # User authentication
├── service/                 # Business logic
├── entity/                  # JPA entities
├── repository/             # Spring Data repositories
└── dto/                    # Data transfer objects
```

### Key Concepts

**Node Types**: producer, content, visual, director, technical, videoGen, videoEditor, and various auditor types. Each node type has inputs, outputs, and generates specific asset types.

**Workflow Execution**: Uses Server-Sent Events (SSE) via `createSSEConnectionForExecution()` in api.js. Events include: `init`, `status`, `thinking`, `result`, `data`, `videos`, `complete`, `error`.

**State Management**: React useState/useCallback in App.jsx manages global state (canvasNodes, canvasConnections, executionLogs, projectVersion). NodeCanvas manages its own node/connection state internally.

## Important Patterns

1. **API Calls**: All backend requests go through `src/services/api.js` which handles auth headers (`Authorization: Bearer {token}` and `X-User-Id`).

2. **Canvas Coordinate System**: Nodes use canvas coordinates (not screen). Transform applied via `translate(${position.x}px, ${position.y}px) scale(${scale})`.

3. **Port-based Connections**: Nodes have input/output ports. Connections are completed by dragging from output port to input port, validated by data type.

4. **Project Versioning**: Projects save to backend with `saveProject()`. Version history fetched via `getVersions()`. Switching versions reloads canvas nodes/connections from `response.data.config`.

5. **Frontend Simulation**: When `projectId` is not set, `simulateRun()` uses local mock data instead of backend execution.

## File: src/services/api.js

This is the single source of truth for all backend communication. Key functions:
- `authApi`: register, login, sendVerifyCode
- `homePageApi`: createProject, getProjects, saveProject, getVersions
- `workSpaceApi`: getAgents, executeWorkflow (SSE), sendMessage

## File: src/constants/ComponentType.js

Defines `COMPONENT_TYPE` and `COMPONENT_INFO` - the canonical list of all agent/node types with their colors, icons, and input/output port definitions.

## File: dream-studio-backend/src/main/resources/application.yml

Backend configuration. H2 in-memory DB for dev (`jdbc:h2:mem:aimanjudb`). Swagger UI available at `/swagger-ui.html`.
