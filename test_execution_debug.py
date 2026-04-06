"""
测试前端执行工作流的完整流程
1. 启动前后端服务器
2. 登录
3. 创建项目
4. 拖拽智能体到画布
5. 点击运行
6. 检查SSE事件是否正常接收
"""

from playwright.sync_api import sync_playwright
import sys
import time

errors = []
warnings = []
sse_events = []

def capture_console(msg):
    if msg.type == 'error':
        errors.append(msg.text)
    elif msg.type == 'warning':
        warnings.append(msg.text)

def capture_sse(msg):
    print(f"[SSE EVENT] type={msg.get('type', 'unknown')}, data={msg}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', capture_console)

    print("=" * 60)
    print("Step 1: Navigating to frontend...")
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    print("Page loaded")

    print("=" * 60)
    print("Step 2: Checking if logged in or needs login...")
    page.wait_for_timeout(1000)

    # Check URL or any login indicators
    current_url = page.url
    print(f"Current URL: {current_url}")

    # Look for login form or main app
    login_button = page.locator('button:has-text("登录"), button:has-text("Login")')
    if login_button.count() > 0:
        print("Login button found, need to login")
        # Try to login with test account
        page.fill('input[type="text"], input[placeholder*="账号"], input[placeholder*="account"]', 'test')
        page.fill('input[type="password"]', 'test123')
        page.click('button:has-text("登录"), button:has-text("Login")')
        page.wait_for_timeout(2000)
    else:
        print("Appears to be logged in already")

    print("=" * 60)
    print("Step 3: Finding project ID...")
    # Get projectId from URL or localStorage
    project_id = None

    # Check if projectId is in URL
    if 'projectId' in page.url:
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(page.url)
        params = parse_qs(parsed.query)
        project_id = params.get('projectId', [None])[0]
        print(f"ProjectId from URL: {project_id}")
    else:
        # Try to create a new project or find existing one
        print("No projectId in URL, looking for project...")

        # Look for "创建项目" or similar button
        create_btn = page.locator('button:has-text("创建项目"), button:has-text("新建项目")')
        if create_btn.count() > 0:
            print("Found create project button")
            create_btn.first.click()
            page.wait_for_timeout(1000)

            # Fill in project title
            title_input = page.locator('input[placeholder*="标题"], input[placeholder*="项目名称"]')
            if title_input.count() > 0:
                title_input.fill(f"测试项目_{int(time.time())}")
                page.wait_for_timeout(500)

            # Click confirm
            confirm_btn = page.locator('button:has-text("确定"), button:has-text("确认"), button:has-text("创建")')
            if confirm_btn.count() > 0:
                confirm_btn.first.click()
                page.wait_for_timeout(2000)

                # Check URL again
                current_url = page.url
                print(f"URL after project creation: {current_url}")
                if 'projectId' in current_url:
                    from urllib.parse import urlparse, parse_qs
                    parsed = urlparse(current_url)
                    params = parse_qs(parsed.query)
                    project_id = params.get('projectId', [None])[0]

    print(f"Final projectId: {project_id}")

    print("=" * 60)
    print("Step 4: Looking for canvas and adding agents...")

    # Look for canvas toolbar or node canvas
    canvas = page.locator('.node-canvas-container, .canvas-viewport')
    if canvas.count() == 0:
        print("Canvas not found, looking for entry point...")
        # Maybe we're on home page, need to navigate to workspace
        workspace_btn = page.locator('button:has-text("工作台"), a:has-text("工作台")')
        if workspace_btn.count() > 0:
            workspace_btn.first.click()
            page.wait_for_timeout(2000)

    # Open agent library
    library_btn = page.locator('button:has-text("智能体库"), button:has-text("Agent Library")')
    if library_btn.count() > 0:
        print("Opening agent library...")
        library_btn.first.click()
        page.wait_for_timeout(1000)

        # Look for agent items to drag
        agent_items = page.locator('.agent-library-item, .agent-item, [data-agent]')
        print(f"Found {agent_items.count()} agents")

        # Try to add at least one agent by clicking
        if agent_items.count() > 0:
            print(f"Clicking first agent: {agent_items.first.inner_text()}")
            agent_items.first.click()
            page.wait_for_timeout(500)

    print("=" * 60)
    print("Step 5: Looking for Run button...")

    # Look for run button
    run_btn = page.locator('button:has-text("运行"), button:has-text("Run"), button:has-text("执行")')
    if run_btn.count() > 0:
        print(f"Found run button, clicking...")
        run_btn.first.click()
        print("Run button clicked")

        # Wait for some time to see if anything happens
        page.wait_for_timeout(3000)

        # Check if any nodes are running
        running_nodes = page.locator('.agent-node.running, .node-running')
        print(f"Running nodes found: {running_nodes.count()}")
    else:
        print("Run button NOT found!")

    print("=" * 60)
    print("Step 6: Checking console for errors...")
    print(f"Console errors: {len(errors)}")
    print(f"Console warnings: {len(warnings)}")

    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  - {e}")

    if warnings:
        print("WARNINGS (first 5):")
        for w in warnings[:5]:
            print(f"  - {w}")

    # Take screenshot
    page.screenshot(path='/tmp/execution_debug.png', full_page=True)
    print("Screenshot saved to /tmp/execution_debug.png")

    browser.close()

    print("=" * 60)
    if errors:
        print("TEST FAILED - Console errors found")
        sys.exit(1)
    else:
        print("TEST COMPLETED")
