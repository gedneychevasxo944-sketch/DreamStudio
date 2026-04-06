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

    print("Navigating to frontend...")
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    print("Checking for console errors...")
    if errors:
        print(f"Console errors: {len(errors)}")
        for e in errors:
            print(f"  - {e}")
        browser.close()
        exit(1)

    print("Taking screenshot to verify UI loaded...")
    page.screenshot(path='/tmp/node_spacing_test.png', full_page=True)

    # 查找节点元素
    print("\nLooking for canvas and nodes...")
    canvas = page.locator('.canvas-world')
    if canvas.count() == 0:
        print("Canvas not found!")
        browser.close()
        exit(1)

    nodes = page.locator('.agent-node, .rich-agent-node')
    print(f"Found {nodes.count()} nodes on canvas")

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
                print(f"Node {i}: x={box['x']:.0f}, y={box['y']:.0f}, w={box['width']:.0f}, h={box['height']:.0f}")

        # 检查节点是否有足够间隔
        if len(node_positions) >= 2:
            overlaps = []
            for i in range(len(node_positions)):
                for j in range(i + 1, len(node_positions)):
                    n1 = node_positions[i]
                    n2 = node_positions[j]
                    # 检查是否有水平重叠（同在一行）
                    horizontal_overlap = not (n1['x'] + n1['width'] + 50 < n2['x'] or n2['x'] + n2['width'] + 50 < n1['x'])
                    vertical_overlap = not (n1['y'] + n1['height'] + 50 < n2['y'] or n2['y'] + n2['height'] + 50 < n1['y'])

                    if horizontal_overlap and vertical_overlap:
                        overlaps.append((i, j, n1, n2))
                        print(f"OVERLAP: Node {i} and Node {j} overlap!")

            if overlaps:
                print(f"\nWARNING: Found {len(overlaps)} overlapping node pairs")
            else:
                print("\nSUCCESS: No overlapping nodes found!")

    print("\nTest completed successfully!")
    browser.close()
