from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os
import traceback

from database import engine, init_db, get_db, User, Generation
from auth import get_current_user, create_access_token, get_password_hash, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user_optional
from image_processing import ImageProcessor
from generative_service import GenerativeService
import replicate

# Initialize Database
init_db()

app = FastAPI(title="Smile Design AI API")

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc() # Log to console
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

# ... (CORS setup)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = ImageProcessor()
gen_service = GenerativeService()

# --- Pydantic Models ---
from pydantic import BaseModel, Field
# ...

class UserCreate(BaseModel):
    email: str
    password: str = Field(..., description="Password")
    full_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class GenerateRequest(BaseModel):
    image: str
    mask: str
    prompt: Optional[str] = None # Legacy prompt
    style_prompt: Optional[str] = None # New material selection
    expert_prompt: Optional[str] = None # New expert notes

class GenerationResponse(BaseModel):
    id: int
    image_url: str
    created_at: str

# --- Auth Routes ---

@app.post("/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "full_name": current_user.full_name, "id": current_user.id}

# --- Application Routes ---

@app.post("/generate-mask")
async def generate_mask(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = processor.process_image(contents)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-smile")
async def generate_smile(
    request: GenerateRequest, 
    current_user: Optional[User] = Depends(get_current_user_optional), # Optional auth for now, or enforce it
    db: Session = Depends(get_db)
):
    try:
        # Remove header if present
        image_data = request.image.split(",")[1] if "," in request.image else request.image
        
        mask_data = None
        if request.mask:
            mask_data = request.mask.split(",")[1] if "," in request.mask else request.mask
        
        full_prompt = f"""
Act as an expert dental aesthetician and professional photographer.
Task: Redesign the smile with high-quality porcelain laminate veneers.
1. Camera & Lighting: Macro dental photography, 100mm macro lens, soft studio lighting, 8k resolution, hyperrealistic texture.
2. Teeth Design: Apply {request.style_prompt if request.style_prompt else "natural ivory white veneers with translucent enamel texture"}. Ensure realistic light reflections, slight surface texture (perikymata), and natural optical properties.
3. Lip Harmonization: You MUST adjust the lip structure to fit the new teeth perfectly. Subtly lift the upper lip or reshape the lower lip to create a natural smile line. The teeth must sit naturally behind the lips, not on top of them.
4. Integration: The result must be indistinguishable from a real photo. Blend the new smile seamlessly with the facial expression and beard.
5. Details: {request.expert_prompt if request.expert_prompt else "Perfect anatomical fit, golden ratio proportions, healthy pink gingiva."}
"""
        # If legacy prompt is provided and no new fields, fallback to it (or append it)
        if request.prompt and not request.style_prompt:
             full_prompt += f"\n[ADDITIONAL]: {request.prompt}"

        # print("Sending Prompt to Vertex AI:\n", full_prompt)

        result_url = gen_service.generate_smile(image_data, mask_data, full_prompt)
        
        # Save to history if user is logged in
        if current_user:
            new_gen = Generation(
                user_id=current_user.id,
                original_image_url="[Base64 Data]", # Placeholder
                generated_image_url=result_url, # This is now a base64 string from Vertex AI
                prompt=request.style_prompt or request.prompt or "Custom Design"
            )
            db.add(new_gen)
            db.commit()
            
        return {"image_url": result_url}
        
    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history", response_model=List[GenerationResponse])
async def get_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    generations = db.query(Generation).filter(Generation.user_id == current_user.id).order_by(Generation.created_at.desc()).all()
    return [
        {
            "id": gen.id,
            "image_url": gen.generated_image_url,
            "created_at": gen.created_at.isoformat()
        } 
        for gen in generations
    ]

# --- Static Files ---

if os.path.exists("static"):
    app.mount("/_next", StaticFiles(directory="static/_next"), name="next")

@app.get("/")
async def read_index():
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "Smile Design AI API is running (Frontend not found)"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Catch-all for SPA / Static Pages
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    # 1. Check for exact file match (e.g. favicon.ico, robots.txt)
    file_path = os.path.join("static", full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # 2. Check for .html file (e.g. /login -> static/login.html)
    html_path = os.path.join("static", f"{full_path}.html")
    if os.path.exists(html_path):
        return FileResponse(html_path)
        
    # 3. Check for index.html in directory (e.g. /blog -> static/blog/index.html)
    index_path = os.path.join("static", full_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    # 4. Fallback to index.html (for client-side routing of dynamic paths)
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
        
    return {"message": "Frontend not found"}

