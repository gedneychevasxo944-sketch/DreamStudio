"""
基本前端测试 - 验证无语法错误和基本加载
"""
from playwright.sync_api import sync_playwright

errors = []
warnings = []

def capture_console(msg):
    if msg.type == 'error':
        errors.append(msg.text)
    elif msg.type == 'warning':
        warnings.append(msg.text)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on('console', capture_console)

    print("Navigating to frontend...")
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    print("Page loaded, waiting for app to initialize...")
    page.wait_for_timeout(2000)

    # Check for critical errors
    critical_errors = [e for e in errors if 'SyntaxError' in e or 'ReferenceError' in e or 'TypeError' in e]

    if critical_errors:
        print("CRITICAL ERRORS FOUND:")
        for e in critical_errors:
            print(f"  - {e}")
        browser.close()
        exit(1)

    print(f"Console errors: {len(errors)}")
    print(f"Console warnings: {len(warnings)}")

    # Take a screenshot to verify UI loaded
    page.screenshot(path='/tmp/frontend_test.png', full_page=True)
    print("Screenshot saved to /tmp/frontend_test.png")

    # Check page title or main content
    title = page.title()
    print(f"Page title: {title}")

    # Check if main content is visible
    body_text = page.locator('body').inner_text()
    print(f"Body has content: {len(body_text) > 0}")
    print(f"Body text preview: {body_text[:200]}...")

    browser.close()
    print("\nTest passed!")
