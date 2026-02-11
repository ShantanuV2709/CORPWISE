import requests
import time
import sys

BASE_URL = "http://localhost:8001"

def print_step(msg):
    print(f"\n🔹 {msg}")

def test_saas_flow():
    company_id = f"test_saas_{int(time.time())}"
    username = f"admin_{int(time.time())}"
    password = "password123"
    
    # 1. Register Company
    print_step(f"Registering company '{company_id}'...")
    payload = {
        "username": username,
        "password": password,
        "company_id": company_id,
        "subscription_tier": "starter" # Uses starter tier
    }
    try:
        res = requests.post(f"{BASE_URL}/auth/admin/signup", json=payload)
        if res.status_code != 200:
            print(f"❌ Registration failed: {res.text}")
            return
        data = res.json()
        print(f"✅ Registered. Company ID: {data['company_id']}")
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return

    # 2. Login (to get confirmed company_id usually, but we have it)
    
    # 3. Generate API Key
    print_step("Generating API Key...")
    headers = {"X-Company-ID": company_id} # Simulating admin panel auth (which uses header for now)
    res = requests.post(f"{BASE_URL}/api-keys/generate?name=TestKey", headers=headers)
    if res.status_code != 200:
        print(f"❌ Key gen failed: {res.text}")
        return
    key_data = res.json()
    raw_key = key_data["key"]
    print(f"✅ Generated Key: {raw_key[:15]}...")

    # 4. Test Chat with API Key
    print_step("Testing Chat with API Key...")
    chat_headers = {
        "X-Company-ID": company_id,
        "X-API-Key": raw_key
    }
    chat_payload = {
        "user_id": "test_user",
        "conversation_id": "test_conv",
        "question": "Hello, are you there?",
        "language": "en"
    }
    res = requests.post(f"{BASE_URL}/chat", json=chat_payload, headers=chat_headers)
    if res.status_code == 200:
        print("✅ Chat with API Key SUCCESS")
    else:
        print(f"❌ Chat with API Key FAILED: {res.status_code} {res.text}")

    # 5. Test Chat with INVALID Key
    print_step("Testing Chat with INVALID Key...")
    bad_headers = {
        "X-Company-ID": company_id,
        "X-API-Key": "sk_corp_INVALID_KEY"
    }
    res = requests.post(f"{BASE_URL}/chat", json=chat_payload, headers=bad_headers)
    if res.status_code == 401:
        print("✅ Blocked Invalid Key (401)")
    else:
        print(f"❌ Failed to block invalid key: {res.status_code}")

    # 6. Delete Company
    # We need a super admin endpoint or helper.
    # Currently `AdminSubscriptionHelpers.delete_company` is internal.
    # Exposing it via API? `admin_routes.py` usually has it.
    # Let's check `backend/app/api/routes/admin_routes.py` (Super Admin).
    # If not exposed, we can't test deletion via API.
    # But we can verify 1-5.
    
    print_step("Test Complete (Deletion skipped as it requires super-admin auth setup)")

if __name__ == "__main__":
    test_saas_flow()
