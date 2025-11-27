# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# Set API URL to empty string for relative paths or specific URL if needed
# Since we serve from same origin, relative paths or empty might work if configured,
# but for static export we usually need the URL. 
# However, since we are proxying/serving from same domain, we can use empty or /api
ENV NEXT_PUBLIC_API_URL="" 
RUN npm run build

# Stage 2: Build Backend & Serve
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/out ./static

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
