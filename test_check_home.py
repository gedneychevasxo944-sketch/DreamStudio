"""
诊断首页和登录流程
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to frontend...")
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)

    print("Taking initial screenshot...")
    page.screenshot(path='/tmp/home_initial.png', full_page=True)

    print("\nClicking '登录 / 注册' button...")
    page.locator('button:has-text("登录")').first.click()
    page.wait_for_timeout(2000)

    print("Taking screenshot after clicking login...")
    page.screenshot(path='/tmp/home_after_login_click.png', full_page=True)

    print("\nLooking for dialog/modal content...")
    # Look for any dialog or modal
    dialogs = page.locator('[role="dialog"], .dialog, .modal').all()
    print(f"Found {len(dialogs)} dialogs/modals")

    # Get all visible text content
    body_text = page.locator('body').inner_text()
    print(f"\nBody text (first 500 chars): {body_text[:500]}")

    # Find all inputs in any dialog
    all_inputs = page.locator('input').all()
    print(f"\nAll inputs: {len(all_inputs)}")
    for i, inp in enumerate(all_inputs):
        inp_type = inp.get_attribute('type')
        inp_placeholder = inp.get_attribute('placeholder')
        print(f"  [{i}] type={inp_type}, placeholder={inp_placeholder}")

    browser.close()
    print("\nDone")
