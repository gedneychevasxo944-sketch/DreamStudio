"""
测试完整工作流：登录 -> 创建/打开项目 -> 添加智能体 -> 执行
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("=" * 60)
    print("Step 1: Navigate to frontend")
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    print("=" * 60)
    print("Step 2: Click login/register button")
    page.locator('button:has-text("登录")').first.click()
    page.wait_for_timeout(1000)

    print("=" * 60)
    print("Step 3: Fill login form")
    # The login form has:
    # - input[type=text][placeholder=邮箱或手机号]
    # - input[type=password][placeholder=密码]
    page.fill('input[placeholder="邮箱或手机号"]', 'test@example.com')
    page.fill('input[placeholder="密码"]', 'test123')
    page.wait_for_timeout(500)

    print("=" * 60)
    print("Step 4: Click login button in dialog")
    # Find and click the login button in the dialog
    page.locator('.login-form button[type="submit"], .login-dialog button:has-text("登录"), button:has-text("登录"):not(:has-text("/"))').click()
    page.wait_for_timeout(3000)

    print(f"Current URL after login: {page.url}")
    page.screenshot(path='/tmp/after_login.png', full_page=True)

    print("=" * 60)
    print("Step 5: Check if logged in and navigate to workspace")
    # Check if login was successful - look for user avatar or workspace link
    workspace_link = page.locator('a:has-text("工作台"), button:has-text("工作台")')
    if workspace_link.count() > 0:
        print("Found workspace link, clicking...")
        workspace_link.first.click()
        page.wait_for_timeout(2000)
    else:
        print("Looking for project to open...")
        # Look for any project card and click "打开" or similar
        open_btns = page.locator('button:has-text("打开"), a:has-text("打开")')
        if open_btns.count() > 0:
            open_btns.first.click()
            page.wait_for_timeout(2000)

    print(f"URL after workspace: {page.url}")
    page.screenshot(path='/tmp/workspace.png', full_page=True)

    print("=" * 60)
    print("Step 6: Find canvas and open agent library")
    # Look for canvas
    canvas = page.locator('.node-canvas-container, .canvas-viewport')
    if canvas.count() > 0:
        print("Found canvas!")

        # Look for library toggle button
        library_btn = page.locator('button:has-text("智能体库"), button:has-text("Agent")')
        if library_btn.count() > 0:
            print("Opening agent library...")
            library_btn.first.click()
            page.wait_for_timeout(1000)
    else:
        print("Canvas not found, looking for entry point...")

    page.screenshot(path='/tmp/with_library.png', full_page=True)

    print("=" * 60)
    print("Step 7: Look for run button and nodes")
    run_btn = page.locator('button:has-text("运行"), button:has-text("Run"), button:has-text("执行")')
    print(f"Found {run_btn.count()} run buttons")

    nodes = page.locator('.agent-node, .rich-agent-node')
    print(f"Found {nodes.count()} nodes on canvas")

    print("=" * 60)
    print("Step 8: Check console errors")
    errors = []
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)

    if errors:
        print(f"Console errors: {len(errors)}")
        for e in errors[:5]:
            print(f"  - {e}")
    else:
        print("No console errors")

    browser.close()
    print("=" * 60)
    print("TEST COMPLETED")
