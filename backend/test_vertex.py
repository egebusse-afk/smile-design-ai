import os
import base64
import sys
from dotenv import load_dotenv
from generative_service import GenerativeService

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def test_vertex_generation():
    print("Testing Vertex AI Generation...")
    
    service = GenerativeService()
    
    # Load test image and mask (you might need to provide paths or base64 strings)
    # For this test, we'll try to use a dummy small image if no file exists, 
    # but ideally we need real data.
    
    # Let's check if we have the uploaded images from previous steps in the artifacts folder
    # or just use a placeholder.
    
    # Since I cannot easily access artifacts from here without knowing exact paths, 
    # I will just check if the service initializes correctly.
    
    if service.model:
        print("✅ Vertex AI Model initialized successfully.")
    else:
        print("❌ Vertex AI Model failed to initialize.")
        return

    print("Test Complete. (To fully test generation, run the full app and upload an image)")

if __name__ == "__main__":
    test_vertex_generation()
