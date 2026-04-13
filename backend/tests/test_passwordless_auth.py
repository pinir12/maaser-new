"""
Backend API Tests for Passwordless Auth Features
Tests: Forgot password, Password reset, Magic login, Passwordless signup, Set password via settings
"""
import pytest
import requests
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hebrew-month-view.preview.emergentagent.com')

# Supabase credentials for direct DB access (to read verification codes)
SUPABASE_URL = "https://mznzgekkzbollftoxfma.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bnpnZWtremJvbGxmdG94Zm1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTA4MDE5OCwiZXhwIjoyMDMwNjU2MTk4fQ.GwDiacV8UXB6MJoSECjmZ_fObXB1lIVEJVsYGCdz5Ow"

# Test credentials for verified user
VERIFIED_USER_EMAIL = "test_verified_user@testdomain.com"
VERIFIED_USER_PASSWORD = "TestVerified123!"


def supa_headers():
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }


def generate_test_email():
    """Generate a unique test email"""
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"TEST_pwless_{random_suffix}@testdomain.com"


def get_user_from_db(email):
    """Get user directly from Supabase to read verification_code"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/users",
        params={'email': f'eq.{email.lower()}', 'select': '*', 'limit': '1'},
        headers=supa_headers()
    )
    if response.status_code == 200:
        users = response.json()
        return users[0] if users else None
    return None


def delete_test_user(email):
    """Clean up test user from Supabase"""
    user = get_user_from_db(email)
    if user:
        requests.delete(
            f"{SUPABASE_URL}/rest/v1/users",
            params={'id': f'eq.{user["id"]}'},
            headers=supa_headers()
        )
        print(f"  Cleaned up test user: {email}")


# ============ PASSWORDLESS SIGNUP TESTS ============

class TestPasswordlessSignup:
    """Test passwordless signup (email + name only, no password)"""
    
    @pytest.fixture(autouse=True)
    def setup_and_cleanup(self):
        """Setup and cleanup test user"""
        self.test_email = generate_test_email()
        yield
        delete_test_user(self.test_email)
    
    def test_passwordless_signup_returns_needs_verification(self):
        """POST /api/auth/signup with just {email, name} (no password) creates user and returns needsVerification"""
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": self.test_email,
                "name": "Passwordless Test User",
                "base_currency": "USD"
                # No password field
            }
        )
        assert response.status_code == 200, f"Signup failed: {response.text}"
        data = response.json()
        
        # Should return needsVerification
        assert "needsVerification" in data, f"Expected needsVerification in response: {data}"
        assert data["needsVerification"] == True
        assert "email" in data
        assert data["email"] == self.test_email.lower()
        
        # Should NOT return a token
        assert "token" not in data, "Signup should NOT return token for unverified user"
        
        print(f"✓ Passwordless signup returns needsVerification=true for {self.test_email}")
    
    def test_passwordless_user_has_empty_password_hash(self):
        """Passwordless user should have empty password_hash (not null due to DB constraint)"""
        # Create passwordless user
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": self.test_email,
                "name": "Passwordless Test User",
                "base_currency": "USD"
            }
        )
        assert response.status_code == 200, f"Signup failed: {response.text}"
        
        # Check DB directly
        user = get_user_from_db(self.test_email)
        assert user is not None, "User not created in database"
        
        # password_hash should be empty string (not null)
        assert user.get("password_hash") == '', f"Expected empty password_hash, got: {user.get('password_hash')}"
        print(f"✓ Passwordless user has empty password_hash")
    
    def test_passwordless_user_has_password_false_after_verification(self):
        """After verification, passwordless user should have has_password=false in response"""
        # Create passwordless user
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": self.test_email,
                "name": "Passwordless Test User",
                "base_currency": "USD"
            }
        )
        assert response.status_code == 200, f"Signup failed: {response.text}"
        
        # Get verification code from DB
        user = get_user_from_db(self.test_email)
        verification_code = user.get("verification_code")
        assert verification_code is not None, "No verification code found"
        
        # Verify email
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/verify-email",
            json={"email": self.test_email, "code": verification_code}
        )
        assert verify_response.status_code == 200, f"Verification failed: {verify_response.text}"
        data = verify_response.json()
        
        # Check has_password flag
        assert "user" in data
        assert data["user"].get("has_password") == False, f"Expected has_password=false, got: {data['user'].get('has_password')}"
        print(f"✓ Passwordless user has has_password=false after verification")


# ============ MAGIC LOGIN TESTS ============

class TestMagicLogin:
    """Test magic login (passwordless login via email code)"""
    
    @pytest.fixture(autouse=True)
    def setup_and_cleanup(self):
        """Create a verified passwordless user for testing"""
        self.test_email = generate_test_email()
        
        # Create passwordless user
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": self.test_email,
                "name": "Magic Login Test User",
                "base_currency": "USD"
            }
        )
        assert response.status_code == 200, f"Setup failed: {response.text}"
        
        # Verify the user
        user = get_user_from_db(self.test_email)
        verification_code = user.get("verification_code")
        requests.post(
            f"{BASE_URL}/api/auth/verify-email",
            json={"email": self.test_email, "code": verification_code}
        )
        
        yield
        delete_test_user(self.test_email)
    
    def test_magic_login_sends_code(self):
        """POST /api/auth/magic-login sends code and returns success"""
        # Bypass rate limit by setting verification_expires to past
        user = get_user_from_db(self.test_email)
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/users",
            params={'id': f'eq.{user["id"]}'},
            json={'verification_expires': '2020-01-01T00:00:00Z'},
            headers=supa_headers()
        )
        
        response = requests.post(
            f"{BASE_URL}/api/auth/magic-login",
            json={"email": self.test_email}
        )
        assert response.status_code == 200, f"Magic login request failed: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert data.get("sent") == True or "sent" in data.get("message", "").lower() or "link" in data.get("message", "").lower()
        print(f"✓ Magic login sends code: {data['message']}")
        
        # Verify code was set in DB
        user_after = get_user_from_db(self.test_email)
        assert user_after.get("verification_code") is not None, "No verification code set"
        print(f"✓ Verification code set in DB")
    
    def test_magic_login_verify_with_code(self):
        """POST /api/auth/verify-magic-login with correct code returns token"""
        # Bypass rate limit
        user = get_user_from_db(self.test_email)
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/users",
            params={'id': f'eq.{user["id"]}'},
            json={'verification_expires': '2020-01-01T00:00:00Z'},
            headers=supa_headers()
        )
        
        # Request magic login
        requests.post(
            f"{BASE_URL}/api/auth/magic-login",
            json={"email": self.test_email}
        )
        
        # Get code from DB
        user_after = get_user_from_db(self.test_email)
        code = user_after.get("verification_code")
        assert code is not None, "No verification code found"
        
        # Verify magic login
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-magic-login",
            json={"email": self.test_email, "code": code}
        )
        assert response.status_code == 200, f"Magic login verification failed: {response.text}"
        data = response.json()
        
        assert "token" in data, "Expected token in response"
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        
        assert "user" in data
        assert data["user"]["email"] == self.test_email.lower()
        
        print(f"✓ Magic login verification returns JWT token")
    
    def test_magic_login_wrong_code_fails(self):
        """POST /api/auth/verify-magic-login with wrong code returns error"""
        # Bypass rate limit
        user = get_user_from_db(self.test_email)
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/users",
            params={'id': f'eq.{user["id"]}'},
            json={'verification_expires': '2020-01-01T00:00:00Z'},
            headers=supa_headers()
        )
        
        # Request magic login
        requests.post(
            f"{BASE_URL}/api/auth/magic-login",
            json={"email": self.test_email}
        )
        
        # Try with wrong code
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-magic-login",
            json={"email": self.test_email, "code": "000000"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Wrong magic login code returns error: {data['detail']}")
    
    def test_magic_login_nonexistent_user_returns_success(self):
        """POST /api/auth/magic-login for non-existent user returns success (security)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/magic-login",
            json={"email": "nonexistent_user_xyz@testdomain.com"}
        )
        # Should return 200 with generic message (don't reveal if user exists)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data
        print(f"✓ Non-existent user magic login returns generic success: {data['message']}")


# ============ FORGOT PASSWORD TESTS ============

class TestForgotPassword:
    """Test forgot password flow"""
    
    def test_forgot_password_sends_code(self):
        """POST /api/auth/forgot-password sends reset code"""
        # Bypass rate limit for verified user
        user = get_user_from_db(VERIFIED_USER_EMAIL)
        if user:
            requests.patch(
                f"{SUPABASE_URL}/rest/v1/users",
                params={'id': f'eq.{user["id"]}'},
                json={'verification_expires': '2020-01-01T00:00:00Z'},
                headers=supa_headers()
            )
        
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": VERIFIED_USER_EMAIL}
        )
        assert response.status_code == 200, f"Forgot password failed: {response.text}"
        data = response.json()
        
        assert "message" in data
        print(f"✓ Forgot password returns success: {data['message']}")
        
        # Verify code was set in DB
        user_after = get_user_from_db(VERIFIED_USER_EMAIL)
        assert user_after.get("verification_code") is not None, "No verification code set"
        print(f"✓ Reset code set in DB")
    
    def test_forgot_password_nonexistent_user_returns_success(self):
        """POST /api/auth/forgot-password for non-existent user returns success (security)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent_user_xyz@testdomain.com"}
        )
        # Should return 200 with generic message (don't reveal if user exists)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data
        print(f"✓ Non-existent user forgot password returns generic success: {data['message']}")


# ============ PASSWORD RESET TESTS ============

class TestPasswordReset:
    """Test password reset flow"""
    
    @pytest.fixture(autouse=True)
    def setup_and_cleanup(self):
        """Create a test user for password reset testing"""
        self.test_email = generate_test_email()
        self.original_password = "OriginalPass123!"
        
        # Create user with password
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": self.test_email,
                "password": self.original_password,
                "name": "Password Reset Test User",
                "base_currency": "USD"
            }
        )
        assert response.status_code == 200, f"Setup failed: {response.text}"
        
        # Verify the user
        user = get_user_from_db(self.test_email)
        verification_code = user.get("verification_code")
        requests.post(
            f"{BASE_URL}/api/auth/verify-email",
            json={"email": self.test_email, "code": verification_code}
        )
        
        yield
        delete_test_user(self.test_email)
    
    def test_reset_password_with_code(self):
        """POST /api/auth/reset-password with code+newPassword sets new password and returns token"""
        # Bypass rate limit
        user = get_user_from_db(self.test_email)
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/users",
            params={'id': f'eq.{user["id"]}'},
            json={'verification_expires': '2020-01-01T00:00:00Z'},
            headers=supa_headers()
        )
        
        # Request password reset
        requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": self.test_email}
        )
        
        # Get code from DB
        user_after = get_user_from_db(self.test_email)
        code = user_after.get("verification_code")
        assert code is not None, "No reset code found"
        
        # Reset password
        new_password = "NewPassword456!"
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "email": self.test_email,
                "code": code,
                "newPassword": new_password
            }
        )
        assert response.status_code == 200, f"Password reset failed: {response.text}"
        data = response.json()
        
        assert "token" in data, "Expected token in response"
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        
        assert "user" in data
        assert data["user"]["email"] == self.test_email.lower()
        
        print(f"✓ Password reset returns JWT token")
    
    def test_can_login_with_new_password_after_reset(self):
        """After password reset, user can login with new password"""
        # Bypass rate limit
        user = get_user_from_db(self.test_email)
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/users",
            params={'id': f'eq.{user["id"]}'},
            json={'verification_expires': '2020-01-01T00:00:00Z'},
            headers=supa_headers()
        )
        
        # Request password reset
        requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": self.test_email}
        )
        
        # Get code and reset password
        user_after = get_user_from_db(self.test_email)
        code = user_after.get("verification_code")
        new_password = "NewPassword789!"
        
        requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "email": self.test_email,
                "code": code,
                "newPassword": new_password
            }
        )
        
        # Try login with new password
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": new_password}
        )
        assert login_response.status_code == 200, f"Login with new password failed: {login_response.text}"
        data = login_response.json()
        
        assert "token" in data, "Expected token in login response"
        print(f"✓ Can login with new password after reset")
    
    def test_reset_password_wrong_code_fails(self):
        """POST /api/auth/reset-password with wrong code returns error"""
        # Bypass rate limit
        user = get_user_from_db(self.test_email)
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/users",
            params={'id': f'eq.{user["id"]}'},
            json={'verification_expires': '2020-01-01T00:00:00Z'},
            headers=supa_headers()
        )
        
        # Request password reset
        requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": self.test_email}
        )
        
        # Try with wrong code
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "email": self.test_email,
                "code": "000000",
                "newPassword": "NewPassword123!"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Wrong reset code returns error: {data['detail']}")
    
    def test_reset_password_short_password_fails(self):
        """POST /api/auth/reset-password with short password returns error"""
        # Bypass rate limit
        user = get_user_from_db(self.test_email)
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/users",
            params={'id': f'eq.{user["id"]}'},
            json={'verification_expires': '2020-01-01T00:00:00Z'},
            headers=supa_headers()
        )
        
        # Request password reset
        requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": self.test_email}
        )
        
        # Get code
        user_after = get_user_from_db(self.test_email)
        code = user_after.get("verification_code")
        
        # Try with short password
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={
                "email": self.test_email,
                "code": code,
                "newPassword": "12345"  # Too short
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "6" in data["detail"] or "character" in data["detail"].lower()
        print(f"✓ Short password returns error: {data['detail']}")


# ============ SET PASSWORD VIA SETTINGS TESTS ============

class TestSetPasswordViaSettings:
    """Test setting password via user settings (for passwordless users)"""
    
    @pytest.fixture(autouse=True)
    def setup_and_cleanup(self):
        """Create a verified passwordless user for testing"""
        self.test_email = generate_test_email()
        
        # Create passwordless user
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": self.test_email,
                "name": "Set Password Test User",
                "base_currency": "USD"
            }
        )
        assert response.status_code == 200, f"Setup failed: {response.text}"
        
        # Verify the user
        user = get_user_from_db(self.test_email)
        verification_code = user.get("verification_code")
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/verify-email",
            json={"email": self.test_email, "code": verification_code}
        )
        self.token = verify_response.json().get("token")
        
        yield
        delete_test_user(self.test_email)
    
    def test_set_password_via_settings(self):
        """PUT /api/user/settings with {new_password} updates password"""
        new_password = "NewSetPassword123!"
        
        response = requests.put(
            f"{BASE_URL}/api/user/settings",
            json={"new_password": new_password},
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert response.status_code == 200, f"Set password failed: {response.text}"
        data = response.json()
        
        # Should return user with has_password=true
        assert data.get("has_password") == True, f"Expected has_password=true, got: {data.get('has_password')}"
        print(f"✓ Set password via settings returns has_password=true")
    
    def test_can_login_after_setting_password(self):
        """After setting password, user can login with password"""
        new_password = "NewSetPassword456!"
        
        # Set password
        requests.put(
            f"{BASE_URL}/api/user/settings",
            json={"new_password": new_password},
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        # Try login with new password
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": self.test_email, "password": new_password}
        )
        assert login_response.status_code == 200, f"Login with set password failed: {login_response.text}"
        data = login_response.json()
        
        assert "token" in data, "Expected token in login response"
        print(f"✓ Can login with password after setting it via settings")
    
    def test_set_password_short_fails(self):
        """PUT /api/user/settings with short password returns error"""
        response = requests.put(
            f"{BASE_URL}/api/user/settings",
            json={"new_password": "12345"},  # Too short
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Short password via settings returns error: {data['detail']}")


# ============ VERIFIED USER LOGIN TESTS ============

class TestVerifiedUserLogin:
    """Test that existing verified users can still login with password normally"""
    
    def test_verified_user_login_with_password(self):
        """POST /api/auth/login - Verified user with password gets JWT token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": VERIFIED_USER_EMAIL, "password": VERIFIED_USER_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        assert "token" in data, "Expected token for verified user"
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        
        assert "user" in data
        assert data["user"]["email"] == VERIFIED_USER_EMAIL
        
        # Should have has_password=true
        assert data["user"].get("has_password") == True, f"Expected has_password=true, got: {data['user'].get('has_password')}"
        
        print(f"✓ Verified user login with password returns JWT token")
        print(f"✓ Verified user has has_password=true")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
