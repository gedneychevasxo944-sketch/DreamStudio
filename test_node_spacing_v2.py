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
    page.wait_for_timeout(2000)

    print("2. Checking for console errors...")
    critical_errors = [e for e in errors if 'SyntaxError' in e or 'ReferenceError' in e or 'TypeError' in e]
    if critical_errors:
        print(f"CRITICAL ERRORS: {critical_errors}")
        browser.close()
        exit(1)

    print("3. Looking for login button...")
    login_btn = page.locator('button:has-text("登录")')
    if login_btn.count() > 0:
        print("Need to login first...")
        login_btn.first.click()
        page.wait_for_timeout(1000)

        # Fill login form
        page.fill('input[placeholder="邮箱或手机号"]', 'test@example.com')
        page.fill('input[placeholder="密码"]', 'test123')
        page.wait_for_timeout(500)

        # Click login
        page.locator('.auth-form button[type="submit"], button:has-text("登录"):not(:has-text("/"))').click()
        page.wait_for_timeout(3000)

    print("4. Taking screenshot to verify UI loaded...")
    page.screenshot(path='/tmp/node_spacing_v2.png', full_page=True)

    # 尝试查找节点
    print("\n5. Looking for canvas elements...")
    canvas = page.locator('.canvas-world')
    nodes = page.locator('.agent-node, .rich-agent-node')

    print(f"   Canvas elements: {canvas.count()}")
    print(f"   Node elements: {nodes.count()}")

    # 如果没有节点，尝试加载模板
    if nodes.count() == 0:
        print("\n6. No nodes found, trying to load a template...")

        # 查找"使用模板"按钮
        template_btns = page.locator('button:has-text("使用模板"), button:has-text("模板")')
        print(f"   Found {template_btns.count()} template buttons")

        if template_btns.count() > 0:
            template_btns.first.click()
            page.wait_for_timeout(2000)
            page.screenshot(path='/tmp/after_template.png', full_page=True)

            # 重新检查节点
            nodes = page.locator('.agent-node, .rich-agent-node')
            print(f"   After template: {nodes.count()} nodes")

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
                    horizontal_overlap = not (n1['x'] + n1['width'] + 60 < n2['x'] or n2['x'] + n2['width'] + 60 < n1['x'])
                    vertical_overlap = not (n1['y'] + n1['height'] + 60 < n2['y'] or n2['y'] + n2['height'] + 60 < n1['y'])

                    if horizontal_overlap and vertical_overlap:
                        overlaps.append((i, j, n1, n2))
                        print(f"   OVERLAP: Node {i} and Node {j} overlap!")

            if overlaps:
                print(f"\nWARNING: Found {len(overlaps)} overlapping node pairs")
            else:
                print("\nSUCCESS: No overlapping nodes found!")

    print("\nTest completed!")
    browser.close()
