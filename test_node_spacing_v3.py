"""
测试画布节点间隔 - 验证节点不会重叠且有足够间距
"""
from playwright.sync_api import sync_playwright

errors = []

def capture_console(msg):
    if msg.type == 'error':
        errors.append(msg.text)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', capture_console)

    print("1. Navigating to frontend...")
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    print("2. Checking for console errors...")
    critical_errors = [e for e in errors if 'SyntaxError' in e or 'ReferenceError' in e or 'TypeError' in e]
    if critical_errors:
        print(f"CRITICAL ERRORS: {critical_errors}")
        browser.close()
        exit(1)

    print("3. Looking for login button...")
    login_btn = page.locator('button:has-text("登录 / 注册")')
    if login_btn.count() > 0:
        print("Opening login dialog...")
        login_btn.first.click()
        page.wait_for_timeout(1000)

        # Fill login form
        print("4. Filling login form...")
        page.fill('input[placeholder="邮箱或手机号"]', 'test@example.com')
        page.fill('input[placeholder="密码"]', 'test123')
        page.wait_for_timeout(500)

        # Click login button inside dialog
        login_submit = page.locator('.auth-form button[type="submit"]')
        login_submit.click()
        print("5. Waiting for login to complete...")
        page.wait_for_timeout(3000)

        # Wait for any modal to close
        page.wait_for_timeout(1000)

    print("6. Taking screenshot after login...")
    page.screenshot(path='/tmp/after_login_v3.png', full_page=True)

    # 尝试查找节点
    print("\n7. Looking for canvas elements...")
    canvas = page.locator('.canvas-world')
    nodes = page.locator('.agent-node, .rich-agent-node')

    print(f"   Canvas elements: {canvas.count()}")
    print(f"   Node elements: {nodes.count()}")

    # 如果没有节点，尝试加载模板
    if nodes.count() == 0:
        print("\n8. No nodes found, trying to load a template...")

        # 查找"使用模板"按钮
        template_btns = page.locator('button:has-text("使用模板")')
        print(f"   Found {template_btns.count()} template buttons")

        if template_btns.count() > 0:
            try:
                template_btns.first.click(timeout=5000)
                page.wait_for_timeout(3000)
                page.screenshot(path='/tmp/after_template_v3.png', full_page=True)

                # 重新检查节点
                nodes = page.locator('.agent-node, .rich-agent-node')
                canvas = page.locator('.canvas-world')
                print(f"   After template click: {canvas.count()} canvases, {nodes.count()} nodes")
            except Exception as e:
                print(f"   Failed to click template: {e}")

    if nodes.count() > 0:
        # 获取节点位置
        node_positions = []
        for i, node in enumerate(nodes.all()):
            box = node.bounding_box()
            if box:
                node_positions.append({
                    'index': i,
                    'x': box['x'],
                    'y': box['y'],
                    'width': box['width'],
                    'height': box['height']
                })
                print(f"   Node {i}: x={box['x']:.0f}, y={box['y']:.0f}, w={box['width']:.0f}, h={box['height']:.0f}")

        # 检查节点是否有足够间隔
        if len(node_positions) >= 2:
            overlaps = []
            for i in range(len(node_positions)):
                for j in range(i + 1, len(node_positions)):
                    n1 = node_positions[i]
                    n2 = node_positions[j]
                    # 检查是否有水平重叠（同在一行）
                    horizontal_gap = 60  # 最小水平间距
                    vertical_gap = 60    # 最小垂直间距
                    horizontal_overlap = not (n1['x'] + n1['width'] + horizontal_gap < n2['x'] or n2['x'] + n2['width'] + horizontal_gap < n1['x'])
                    vertical_overlap = not (n1['y'] + n1['height'] + vertical_gap < n2['y'] or n2['y'] + n2['height'] + vertical_gap < n1['y'])

                    if horizontal_overlap and vertical_overlap:
                        overlaps.append((i, j))
                        print(f"   OVERLAP: Node {i} and Node {j}")

            if overlaps:
                print(f"\nWARNING: Found {len(overlaps)} overlapping node pairs")
            else:
                print("\nSUCCESS: No overlapping nodes found!")

                # 验证间距是否合理
                for i in range(len(node_positions) - 1):
                    n1 = node_positions[i]
                    n2 = node_positions[i + 1]
                    if n1['y'] == n2['y']:  # 同一行
                        gap = n2['x'] - (n1['x'] + n1['width'])
                        print(f"   Horizontal gap between Node {i} and Node {i+1}: {gap:.0f}px")
                        if gap < 60:
                            print(f"   WARNING: Gap too small (expected >= 60px)")

    print("\nTest completed!")
    browser.close()
