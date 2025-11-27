import replicate
import os
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("REPLICATE_API_TOKEN")
print(f"Loaded Token: {token[:5]}...{token[-5:] if token else 'None'}")

try:
    # Try to fetch the model to check auth
    model = replicate.models.get("stability-ai/stable-diffusion-inpainting")
    print("Successfully connected to Replicate API!")
    print(f"Model found: {model.owner}/{model.name}")
    print(f"Latest Version ID: {model.latest_version.id}")
    
    # Create a dummy black image
    from PIL import Image
    import io
    import base64
    
    img = Image.new('RGB', (512, 512), color='black')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
    img_uri = f"data:image/png;base64,{img_base64}"
    
    print("Running test prediction...")
    output = replicate.run(
        f"{model.owner}/{model.name}:{model.latest_version.id}",
        input={
            "prompt": "a smile",
            "image": img_uri,
            "mask": img_uri, # Using same image as mask for dummy test
            "num_inference_steps": 1
        }
    )
    print(f"Prediction success! Output: {output}")

    print(f"Replicate Error: {e}")
except Exception as e:
    print(f"Unexpected Error: {e}")
