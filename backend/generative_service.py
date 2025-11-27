import replicate
import os
from dotenv import load_dotenv
import base64
import io

load_dotenv()

class GenerativeService:
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        if not self.api_token:
            print("Warning: REPLICATE_API_TOKEN not found in environment variables.")

    def generate_smile(self, image_base64: str, mask_base64: str, prompt: str) -> str:
        if not self.api_token:
            raise ValueError("Replicate API token is missing. Please set REPLICATE_API_TOKEN in .env file.")

        # Prepare inputs for Replicate
        # Replicate expects file handles or URLs
        # We'll use data URIs
        
        image_uri = f"data:image/png;base64,{image_base64}"
        mask_uri = f"data:image/png;base64,{mask_base64}"

        # Model: stability-ai/stable-diffusion-inpainting
        # Using a specific version hash for stability, or the latest
        model = "stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3"
        
        output = replicate.run(
            model,
            input={
                "prompt": prompt,
                "image": image_uri,
                "mask": mask_uri,
                "num_inference_steps": 25,
                "guidance_scale": 7.5,
                "negative_prompt": "rotten, yellow, bad anatomy, missing teeth, extra teeth, fused teeth, cartoon, 3d render, plastic look, blur, low quality",
                "disable_safety_checker": True
            }
        )

        if output and len(output) > 0:
            # Ensure we return a string (URL)
            return str(output[0])
        else:
            raise ValueError("No output generated from Replicate.")
