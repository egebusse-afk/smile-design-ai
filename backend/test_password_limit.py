import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.auth import get_password_hash, verify_password

def test_long_password():
    print("Testing long password...")
    
    # Create a password longer than 72 bytes
    long_password = "a" * 100
    print(f"Password length: {len(long_password)}")
    
    try:
        hashed = get_password_hash(long_password)
        print("Hashing successful!")
        print(f"Hash: {hashed}")
        
        is_valid = verify_password(long_password, hashed)
        print(f"Verification result: {is_valid}")
        
        if is_valid:
            print("SUCCESS: Long password handled correctly.")
        else:
            print("FAILURE: Password verification failed.")
            
    except Exception as e:
        print(f"FAILURE: Exception occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_long_password()
