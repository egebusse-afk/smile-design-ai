from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from image_processing import ImageProcessor
from pydantic import BaseModel

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI(title="Smile Design AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = ImageProcessor()

class MaskResponse(BaseModel):
    mask: str
    image: str
    width: int
    height: int

# Serve static files (Frontend)
# We will mount the 'static' directory which will contain the exported Next.js app
if os.path.exists("static"):
    app.mount("/_next", StaticFiles(directory="static/_next"), name="next")
    # We don't mount "/" directly to avoid conflict with API routes, 
    # instead we serve index.html for root and catch-all

@app.get("/")
async def read_index():
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "Smile Design AI API is running (Frontend not found)"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

from generative_service import GenerativeService

gen_service = GenerativeService()

class GenerateRequest(BaseModel):
    image: str
    mask: str
    prompt: str

@app.post("/generate-mask", response_model=MaskResponse)
async def generate_mask(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = processor.process_image(contents)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import replicate

@app.post("/generate-smile")
async def generate_smile(request: GenerateRequest):
    try:
        # Remove header if present (data:image/png;base64,)
        image_data = request.image.split(",")[1] if "," in request.image else request.image
        mask_data = request.mask.split(",")[1] if "," in request.mask else request.mask
        
        result_url = gen_service.generate_smile(image_data, mask_data, request.prompt)
        return {"image_url": result_url}
    except replicate.exceptions.ReplicateError as e:
        print(f"Replicate API Error: {str(e)}")
        # Pass the actual error message from Replicate to the frontend
        raise HTTPException(status_code=429, detail=str(e))
    except ValueError as e:
        print(f"ValueError in generate_smile: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error in generate_smile: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
