import os
import base64
import io
import json
from PIL import Image
from dotenv import load_dotenv
import vertexai
from vertexai.preview.vision_models import ImageGenerationModel
from google.oauth2 import service_account

load_dotenv()

class GenerativeService:
    def __init__(self):
        # Initialize Vertex AI
        self.project_id = "gulus-tasarimi"
        self.location = "us-central1" # Or 'europe-west1' if enabled there
        
        # Load credentials
        # Priority 1: Environment Variable (Production)
        json_creds = os.getenv("GOOGLE_CREDENTIALS_JSON")
        
        # Priority 2: File (Local Development)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        cred_path = os.path.join(base_dir, "service_account.json")
        
        if json_creds:
            try:
                info = json.loads(json_creds)
                self.credentials = service_account.Credentials.from_service_account_info(info)
                vertexai.init(project=self.project_id, location=self.location, credentials=self.credentials)
                print("Vertex AI Initialized from Environment Variable.")
            except Exception as e:
                print(f"Failed to load credentials from ENV: {e}")
                self.model = None
                return
        elif os.path.exists(cred_path):
            self.credentials = service_account.Credentials.from_service_account_file(cred_path)
            vertexai.init(project=self.project_id, location=self.location, credentials=self.credentials)
        else:
            print("Warning: Credentials not found. Vertex AI might fail.")
            # Fallback to default credentials if available
            vertexai.init(project=self.project_id, location=self.location)

        # Load Model (Imagen 3 with fallback to Imagen 2)
        try:
            # Try loading Imagen 3 first (latest and greatest)
            self.model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
            print("Successfully loaded Imagen 3 model.")
        except Exception as e:
            print(f"Failed to load Imagen 3: {e}. Falling back to Imagen 2...")
            try:
                self.model = ImageGenerationModel.from_pretrained("imagegeneration@006") # Imagen 2
                print("Successfully loaded Imagen 2 model.")
            except Exception as e2:
                print(f"Failed to load Imagen 2 model: {e2}")
                self.model = None

    def generate_smile(self, image_base64: str, mask_base64: str, prompt: str, negative_prompt: str = "") -> str:
        if not self.model:
            raise ValueError("Vertex AI Model not initialized.")

        print(f"Generating smile with prompt: {prompt}")

        # Decode images
        image_bytes = base64.b64decode(image_base64)
        mask_bytes = base64.b64decode(mask_base64)
        
        base_image = Image.open(io.BytesIO(image_bytes))
        mask_image = Image.open(io.BytesIO(mask_bytes))

        # Vertex AI expects the mask to be the area to EDIT (white = edit, black = keep).
        # Our mask generation logic (ImageProcessor) produces white for mouth, black for face.
        # So it should be compatible directly.
        
        # Convert to Vertex AI Image format
        from vertexai.preview.vision_models import Image as VertexImage
        
        # Save to temp buffers to create VertexImage objects (sdk requires path or bytes)
        # We can pass bytes directly if supported, but let's be safe with what the SDK expects usually
        # The SDK `edit_image` takes `base_image` and `mask` as `VertexImage` objects.
        
        v_base_image = VertexImage(image_bytes)
        v_mask_image = VertexImage(mask_bytes)

        # Construct the full prompt based on User's request structure
        # The `prompt` argument coming in will be the constructed prompt from main.py
        
        try:
            response = self.model.edit_image(
                base_image=v_base_image,
                mask=v_mask_image,
                prompt=prompt,
                negative_prompt=negative_prompt or "fake, sticker, pasted on, cartoon, illustration, low quality, blur, distorted lips, bad anatomy, extra teeth, metal, braces",
                guidance_scale=20, # Reduced from 60 to prevent artifacts
                number_of_images=1,
                seed=None
            )
            
            if response.images:
                generated_image = response.images[0]
                
                # Convert Vertex Image to PIL
                if hasattr(generated_image, "_image_bytes"):
                    gen_img_pil = Image.open(io.BytesIO(generated_image._image_bytes))
                else:
                    raise ValueError("Generated image does not contain bytes data.")

                # High-Res Blending Logic
                # 1. Resize generated image to match original base_image size (if different)
                if gen_img_pil.size != base_image.size:
                    gen_img_pil = gen_img_pil.resize(base_image.size, Image.LANCZOS)

                # 2. Blur the mask slightly for seamless blending
                # We use the original mask_image (which is black/white)
                # Convert mask to L mode (grayscale)
                mask_pil = mask_image.convert('L')
                
                # 3. Composite: Paste generated teeth onto original image using the mask
                # This ensures the rest of the face (skin, beard, eyes) remains 100% original high-res
                final_image = Image.composite(gen_img_pil, base_image, mask_pil)
                
                # 4. Convert result to base64
                output_buffer = io.BytesIO()
                final_image.save(output_buffer, format="PNG")
                output_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')
                
                return f"data:image/png;base64,{output_base64}"
            else:
                raise ValueError("No images generated by Vertex AI.")
                
        except Exception as e:
            print(f"Vertex AI Generation Error: {e}")
            raise e
