import os
import base64
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from generative_service import GenerativeService
from image_processing import ImageProcessor

load_dotenv()

def test_pipeline():
    print("Testing Full AI Pipeline...")
    
    # Initialize services
    gen_service = GenerativeService()
    processor = ImageProcessor()
    
    # Load a test image (using one of the user's uploaded images if available, or a placeholder)
    # We'll try to find one in the artifacts dir or just use a dummy if not found, 
    # but the user uploaded images to: /Users/behcetozcan/.gemini/antigravity/brain/9a88b3de-9ea5-40c3-bf97-f56831192a6c/
    
    image_path = "/Users/behcetozcan/.gemini/antigravity/brain/9a88b3de-9ea5-40c3-bf97-f56831192a6c/uploaded_image_0_1764255918137.jpg"
    
    if not os.path.exists(image_path):
        print(f"Test image not found at {image_path}")
        return

    print(f"Loading image from {image_path}...")
    with open(image_path, "rb") as f:
        image_bytes = f.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')

    # 1. Generate Mask (using local processor for now as we haven't fully integrated AI masking yet)
    print("Generating Mask...")
    try:
        mask_result = processor.process_image(image_bytes)
        mask_base64 = mask_result["mask"]
        print("Mask generated successfully.")
    except Exception as e:
        print(f"Mask generation failed: {e}")
        return

    # 2. Generate Smile
    print("Generating Smile with SDXL + CodeFormer...")
    try:
        prompt = "perfect white teeth, natural smile, detailed anatomy"
        result_url = gen_service.generate_smile(image_base64, mask_base64, prompt)
        
        print(f"Success! Result URL/Data: {result_url[:50]}...")
        
        # Save result if it's base64
        if result_url.startswith("data:image"):
            data = result_url.split(",")[1]
            with open("test_result.png", "wb") as f:
                f.write(base64.b64decode(data))
            print("Saved result to test_result.png")
        else:
            print(f"Result is a URL: {result_url}")
            
    except Exception as e:
        print(f"Generation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pipeline()
