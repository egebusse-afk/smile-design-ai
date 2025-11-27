import bcrypt

def test_bcrypt_direct():
    print("Testing bcrypt directly...")
    
    password = "testpassword"
    long_password = "a" * 100
    
    # 1. Normal password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    print(f"Normal hash: {hashed}")
    
    if bcrypt.checkpw(password.encode('utf-8'), hashed):
        print("Normal verification: SUCCESS")
    else:
        print("Normal verification: FAILURE")

    # 2. Long password (truncated)
    password_bytes = long_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    
    try:
        hashed_long = bcrypt.hashpw(password_bytes, salt)
        print(f"Long hash: {hashed_long}")
        
        if bcrypt.checkpw(password_bytes, hashed_long):
            print("Long verification: SUCCESS")
        else:
            print("Long verification: FAILURE")
            
    except Exception as e:
        print(f"Long password error: {e}")

if __name__ == "__main__":
    test_bcrypt_direct()
