"""
基本前端测试 - 简化版
"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to frontend...")
    try:
        page.goto('http://localhost:5173', timeout=60000)
    except Exception as e:
        print(f"Error: {e}")
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
