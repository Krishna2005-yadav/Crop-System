"""
Security Utilities for Smart Farming Application
=================================================

This module provides:
- In-memory rate limiting (production should use Redis)
- Input validation functions
- Brute-force protection
- Security headers middleware

Usage:
    from security import rate_limit, validate_email, validate_password
"""

import re
import time
import hmac
from functools import wraps
from collections import defaultdict
from flask import request, jsonify
import threading

# =============================================================================
# RATE LIMITING (In-Memory - Use Redis for production)
# =============================================================================

class RateLimiter:
    """
    Simple in-memory rate limiter. For production, replace with Redis-backed solution.
    
    Usage:
        limiter = RateLimiter()
        
        @limiter.limit("5 per minute")
        def my_endpoint():
            ...
    """
    
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
    
    def _parse_limit(self, limit_string: str) -> tuple:
        """Parse limit string like '5 per minute' into (count, seconds)"""
        parts = limit_string.lower().split()
        count = int(parts[0])
        
        time_map = {
            'second': 1, 'seconds': 1,
            'minute': 60, 'minutes': 60,
            'hour': 3600, 'hours': 3600,
            'day': 86400, 'days': 86400,
        }
        
        # Handle "per" keyword
        time_unit = parts[-1] if parts[-1] in time_map else parts[2] if len(parts) > 2 else 'minute'
        seconds = time_map.get(time_unit, 60)
        
        return count, seconds
    
    def _get_key(self, key_func=None):
        """Get the rate limit key for the current request."""
        if key_func:
            return key_func()
        return request.remote_addr
    
    def _is_limited(self, key: str, max_requests: int, window_seconds: int) -> tuple:
        """Check if the key is rate limited. Returns (is_limited, remaining, reset_time)"""
        now = time.time()
        
        with self.lock:
            # Clean old requests
            self.requests[key] = [t for t in self.requests[key] if t > now - window_seconds]
            
            current_count = len(self.requests[key])
            
            if current_count >= max_requests:
                oldest = min(self.requests[key]) if self.requests[key] else now
                reset_time = int(oldest + window_seconds - now)
                return True, 0, reset_time
            
            # Record this request
            self.requests[key].append(now)
            
            return False, max_requests - current_count - 1, window_seconds
    
    def limit(self, limit_string: str, key_func=None, error_message=None):
        """
        Rate limiting decorator.
        
        Args:
            limit_string: e.g., "5 per minute", "100 per hour"
            key_func: Optional function to get custom key (default: IP address)
            error_message: Custom error message
        """
        max_requests, window_seconds = self._parse_limit(limit_string)
        
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                key = f"{f.__name__}:{self._get_key(key_func)}"
                is_limited, remaining, reset_time = self._is_limited(key, max_requests, window_seconds)
                
                if is_limited:
                    response = jsonify({
                        'error': error_message or 'Too many requests. Please try again later.',
                        'retry_after': reset_time
                    })
                    response.status_code = 429
                    response.headers['Retry-After'] = str(reset_time)
                    response.headers['X-RateLimit-Limit'] = str(max_requests)
                    response.headers['X-RateLimit-Remaining'] = '0'
                    response.headers['X-RateLimit-Reset'] = str(int(time.time() + reset_time))
                    return response
                
                return f(*args, **kwargs)
            return decorated_function
        return decorator

# Global rate limiter instance
rate_limiter = RateLimiter()


# =============================================================================
# INPUT VALIDATION
# =============================================================================

# Email validation regex (RFC 5322 simplified)
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

# Known disposable email domains (expand this list in production)
DISPOSABLE_DOMAINS = {
    'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
    'throwaway.email', 'fakeinbox.com', 'trashmail.com', 'temp-mail.org',
    'getnada.com', 'maildrop.cc', 'discard.email', 'emailondeck.com',
    'mohmal.com', 'yopmail.com', 'sharklasers.com', 'guerrillamail.info'
}


def validate_email(email: str) -> tuple:
    """
    Validate email address.
    
    Returns:
        (is_valid: bool, error_message: str or None)
    """
    if not email:
        return False, "Email is required"
    
    if len(email) > 254:
        return False, "Email is too long"
    
    if not EMAIL_REGEX.match(email):
        return False, "Invalid email format"
    
    # Check for disposable domains
    domain = email.split('@')[1].lower()
    if domain in DISPOSABLE_DOMAINS:
        return False, "Disposable email addresses are not allowed"
    
    return True, None


def validate_password(password: str) -> tuple:
    """
    Validate password strength.
    
    Returns:
        (is_valid: bool, error_message: str or None)
    """
    if not password:
        return False, "Password is required"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if len(password) > 128:
        return False, "Password is too long"
    
    # Check for common weak passwords
    COMMON_PASSWORDS = {
        'password', 'password1', '123456', '12345678', 'qwerty',
        'abc123', 'admin', 'letmein', 'welcome', 'monkey'
    }
    if password.lower() in COMMON_PASSWORDS:
        return False, "Password is too common. Please choose a stronger password."
    
    return True, None


def validate_username(username: str) -> tuple:
    """
    Validate username.
    
    Returns:
        (is_valid: bool, error_message: str or None)
    """
    if not username:
        return False, "Username is required"
    
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 30:
        return False, "Username is too long"
    
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, "Username can only contain letters, numbers, and underscores"
    
    return True, None


# =============================================================================
# BRUTE FORCE PROTECTION
# =============================================================================

class BruteForceProtection:
    """
    Tracks failed login attempts and implements progressive lockout.
    
    For production, use Redis with proper TTL handling.
    """
    
    def __init__(self, max_attempts=5, lockout_duration=900):  # 15 minutes
        self.failed_attempts = defaultdict(list)
        self.lockouts = {}
        self.max_attempts = max_attempts
        self.lockout_duration = lockout_duration
        self.lock = threading.Lock()
    
    def record_failure(self, identifier: str):
        """Record a failed login attempt."""
        now = time.time()
        
        with self.lock:
            # Clean old attempts
            self.failed_attempts[identifier] = [
                t for t in self.failed_attempts[identifier]
                if t > now - self.lockout_duration
            ]
            
            self.failed_attempts[identifier].append(now)
            
            # Check if lockout threshold reached
            if len(self.failed_attempts[identifier]) >= self.max_attempts:
                self.lockouts[identifier] = now + self.lockout_duration
    
    def record_success(self, identifier: str):
        """Clear failed attempts after successful login."""
        with self.lock:
            self.failed_attempts.pop(identifier, None)
            self.lockouts.pop(identifier, None)
    
    def is_locked_out(self, identifier: str) -> tuple:
        """
        Check if an identifier is locked out.
        
        Returns:
            (is_locked: bool, seconds_remaining: int)
        """
        now = time.time()
        
        with self.lock:
            if identifier in self.lockouts:
                remaining = int(self.lockouts[identifier] - now)
                if remaining > 0:
                    return True, remaining
                else:
                    # Lockout expired
                    del self.lockouts[identifier]
                    self.failed_attempts.pop(identifier, None)
        
        return False, 0
    
    def get_remaining_attempts(self, identifier: str) -> int:
        """Get the number of remaining login attempts."""
        with self.lock:
            current = len(self.failed_attempts.get(identifier, []))
            return max(0, self.max_attempts - current)


# Global brute force protection instance
brute_force = BruteForceProtection()


# =============================================================================
# SECURE COMPARISON
# =============================================================================

def secure_compare(a: str, b: str) -> bool:
    """
    Constant-time string comparison to prevent timing attacks.
    Use this for comparing tokens, API keys, etc.
    """
    return hmac.compare_digest(a.encode('utf-8'), b.encode('utf-8'))


# =============================================================================
# SECURITY HEADERS MIDDLEWARE
# =============================================================================

def add_security_headers(response):
    """
    Add security headers to responses.
    Call this in Flask's after_request hook.
    """
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Content Security Policy (adjust as needed)
    # response.headers['Content-Security-Policy'] = "default-src 'self'"
    
    return response
