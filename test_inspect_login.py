"""
诊断登录页面结构
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to frontend...")
    page.goto('http://localhost:5173')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)

    print("Taking screenshot...")
    page.screenshot(path='/tmp/login_page.png', full_page=True)

    print("Getting page content...")
    content = page.content()

    # Find all input fields
    inputs = page.locator('input').all()
    print(f"\nFound {len(inputs)} input fields:")
    for i, inp in enumerate(inputs):
        inp_type = inp.get_attribute('type')
        inp_placeholder = inp.get_attribute('placeholder')
        inp_name = inp.get_attribute('name')
        print(f"  [{i}] type={inp_type}, placeholder={inp_placeholder}, name={inp_name}")

    # Find all buttons
    buttons = page.locator('button').all()
    print(f"\nFound {len(buttons)} buttons:")
    for i, btn in enumerate(buttons):
        btn_text = btn.inner_text()
        print(f"  [{i}] text={btn_text[:50] if btn_text else 'no text'}")

    # Find form elements
    forms = page.locator('form').all()
    print(f"\nFound {len(forms)} forms")

    browser.close()
    print("\nDone - screenshot saved to /tmp/login_page.png")
