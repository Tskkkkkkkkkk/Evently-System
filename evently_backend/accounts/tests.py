from django.test import TestCase

<<<<<<< HEAD
import requests

BASE_URL = "http://127.0.0.1:8000/api"  
ADMIN_EMAIL = "admin@evently.com"
ADMIN_PASS = "Samayra12"

def test_rbac():
 
    print("--- Attempting Admin Login ---")
    login_res = requests.post(f"{BASE_URL}/accounts/login/", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASS
    })
    
    if login_res.status_code != 200:
        print(f"Login Failed: {login_res.json()}")
        return

    token = login_res.json()['access']
    headers = {"Authorization": f"Bearer {token}"}


    print("\n--- Testing Admin Stats (Authorized) ---")
    stats_res = requests.get(f"{BASE_URL}/admin-api/stats/", headers=headers)
    print(f"Status: {stats_res.status_code}")
    if stats_res.status_code == 200:
        print(f"Data: {stats_res.json()}")
    else:
        print(f"Error: {stats_res.json()}")

    print("\n--- Testing Security Logic ---")
    print("If a non-admin tries to access this, your 'IsAdmin' class")
    print("will return False and Django will send a 403 Forbidden.")

if __name__ == "__main__":
    test_rbac()
=======
# Create your tests here.
>>>>>>> 02f52578c9b67241705c932a1541c99ec12516ab
