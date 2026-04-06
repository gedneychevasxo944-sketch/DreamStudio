"""
基本前端测试 - 简化版
"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    print("Navigating to frontend...")
    try:
        # 使用 IPv6 localhost
        page.goto('http://[::1]:5173', timeout=60000)
    except Exception as e:
        print(f"Error with IPv6: {e}")
        # 尝试 127.0.0.1
        try:
            print("Trying 127.0.0.1...")
            page.goto('http://127.0.0.1:5173', timeout=60000)
        except Exception as e2:
            print(f"Error with 127.0.0.1: {e2}")
            browser.close()
            exit(1)

    print("Page loaded")
    time.sleep(2)

    # Check page content
    print("Taking screenshot...")
    page.screenshot(path='/tmp/test_simple.png', full_page=True)

    body = page.locator('body')
    text = body.inner_text()
    print(f"Page has content: {len(text) > 0}")
    print(f"Content preview: {text[:100]}...")

    browser.close()
    print("Done!")
