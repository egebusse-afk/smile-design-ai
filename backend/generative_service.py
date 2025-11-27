import replicate
import os
from dotenv import load_dotenv
import base64
import io
import requests
import time
import random
from PIL import Image

load_dotenv()

class GenerativeService:
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            print("Warning: REPLICATE_API_TOKEN not found in environment variables.")

    def _run_with_retry(self, model_id, input_data, max_retries=3):
        """
        Runs a Replicate model with exponential backoff retry logic for 429 errors.
        """
        for attempt in range(max_retries):
            try:
                output = replicate.run(model_id, input=input_data)
                return output
            except replicate.exceptions.ReplicateError as e:
                # Check for rate limit error
                if "429" in str(e) and attempt < max_retries - 1:
                    # Exponential backoff: 2s, 4s, 8s + jitter
                    wait_time = (2 ** (attempt + 1)) + random.uniform(0, 1)
                    print(f"Rate limit hit (429) for {model_id}. Retrying in {wait_time:.2f}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                raise e
        return None

    def generate_smile(self, image_base64: str, mask_base64: str, prompt: str) -> str:
        if not self.api_token:
            raise ValueError("Replicate API token is missing. Please set REPLICATE_API_TOKEN in .env file.")

        # Step 1: Inpainting with SDXL
        print("Starting Step 1: SDXL Inpainting...")
        
        input_data_sdxl = {
            "image": f"data:image/png;base64,{image_base64}",
            "mask": f"data:image/png;base64,{mask_base64}",
            "prompt": f"{prompt}, high quality, realistic, 8k, detailed texture, dental photography",
            "negative_prompt": "blur, noise, distortion, low quality, ugly, bad anatomy, extra teeth, missing teeth, cartoon, drawing",
            "num_inference_steps": 30,
            "guidance_scale": 7.5,
            "strength": 0.99
        }

        inpainted_output = self._run_with_retry(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input_data_sdxl
        )

        if not inpainted_output:
             raise ValueError("Inpainting failed to generate output.")
        
        # SDXL returns a list of URLs usually
        if isinstance(inpainted_output, list):
            inpainted_image_url = str(inpainted_output[0])
        else:
            inpainted_image_url = str(inpainted_output)
            
        print(f"Inpainting Complete: {inpainted_image_url}")

        # Step 2: Face Restoration (CodeFormer)
        print("Starting Step 2: Face Restoration...")
        
        # Add a small delay before step 2 to be safe
        time.sleep(1)
        
        try:
            input_data_codeformer = {
                "image": inpainted_image_url,
                "codeformer_fidelity": 0.7,
                "background_enhance": False,
                "face_upsample": True,
                "upscale": 1
            }
            
            restored_output = self._run_with_retry(
                "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
                input_data_codeformer
            )
            
            if restored_output:
                final_url = str(restored_output)
            else:
                print("Restoration returned empty, using inpainted image.")
                final_url = inpainted_image_url
                
        except Exception as e:
            print(f"Restoration failed after retries: {e}")
            final_url = inpainted_image_url

        # Step 3: Post-Processing (Resize to original dimensions)
        try:
            print(f"Downloading result from {final_url}...")
            response = requests.get(final_url)
            response.raise_for_status()
            
            generated_img = Image.open(io.BytesIO(response.content))
            
            # Get original dimensions from input base64
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
