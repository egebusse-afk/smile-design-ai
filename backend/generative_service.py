import replicate
import os
from dotenv import load_dotenv
import base64
import io
import requests
from PIL import Image

load_dotenv()

class GenerativeService:
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            print("Warning: REPLICATE_API_TOKEN not found in environment variables.")

    def generate_smile(self, image_base64: str, mask_base64: str, prompt: str) -> str:
        if not self.api_token:
            raise ValueError("Replicate API token is missing. Please set REPLICATE_API_TOKEN in .env file.")

        image_uri = f"data:image/png;base64,{image_base64}"
        mask_uri = f"data:image/png;base64,{mask_base64}"

        # Step 1: High-Quality Inpainting (SDXL)
        # Using stability-ai/sdxl which supports inpainting
        inpainting_model = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"
        
        print("Starting Step 1: SDXL Inpainting...")
        inpainted_output = replicate.run(
            inpainting_model,
            input={
                "prompt": prompt + ", detailed dental anatomy, translucent enamel, natural occlusion, 8k resolution, photorealistic",
                "image": image_uri,
                "mask": mask_uri,
                "num_inference_steps": 30,
                "guidance_scale": 8.0,
                "negative_prompt": "rotten, yellow, bad anatomy, missing teeth, extra teeth, fused teeth, cartoon, 3d render, plastic look, blur, low quality, distorted",
                "strength": 0.99 
            }
        )

        if not inpainted_output or len(inpainted_output) == 0:
            raise ValueError("Inpainting failed to generate output.")
        
        inpainted_image_url = str(inpainted_output[0])
        print(f"Inpainting Complete: {inpainted_image_url}")

        # Step 2: Face Restoration (CodeFormer)
        # Enhances the details and fixes artifacts
        restoration_model = "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56"
        
        print("Starting Step 2: Face Restoration...")
        restored_output = replicate.run(
            restoration_model,
            input={
                "image": inpainted_image_url,
                "codeformer_fidelity": 0.7, # Balance between restoration and original details
                "background_enhance": False,
                "face_upsample": True,
                "upscale": 1
            }
        )

        if restored_output:
            # CodeFormer returns a direct URL string usually, or a FileOutput
            final_url = str(restored_output)
        else:
            print("Restoration failed, returning inpainted image.")
            final_url = inpainted_image_url

        # Step 3: Post-Processing (Resize to original dimensions)
        # Download the result
        try:
            print(f"Downloading result from {final_url}...")
            response = requests.get(final_url)
            response.raise_for_status()
            
            generated_img = Image.open(io.BytesIO(response.content))
            
            # Get original dimensions from input base64
            # We decode the input image just to get its size
            input_img = Image.open(io.BytesIO(base64.b64decode(image_base64)))
            original_size = input_img.size # (width, height)
            
            print(f"Resizing from {generated_img.size} to {original_size}...")
            generated_img = generated_img.resize(original_size, Image.Resampling.LANCZOS)
            
            # Convert back to base64
            buffer = io.BytesIO()
            generated_img.save(buffer, format="PNG")
            final_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return f"data:image/png;base64,{final_base64}"
            
        except Exception as e:
            print(f"Error in resizing/downloading: {e}")
            # Fallback to URL if resizing fails
            return final_url
