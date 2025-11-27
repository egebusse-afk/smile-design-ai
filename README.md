# AI-Powered Autonomous Smile Design

## Overview
This project is an AI-powered smile design platform that allows users to upload photos and visualize aesthetic dental treatments using Generative AI.

## Tech Stack
- **Frontend:** Next.js, Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI, OpenCV, MediaPipe
- **AI:** Replicate (Stable Diffusion + ControlNet)
- **Infrastructure:** Docker

## Getting Started

### Prerequisites
- Docker Desktop
- Node.js & npm
- Python 3.8+

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd "gülüş tasarımı ai"
   ```

2. **Start the application:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)

## Development

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
