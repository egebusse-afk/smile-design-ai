import cv2
import mediapipe as mp
import numpy as np
import base64

class ImageProcessor:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
        
        # MediaPipe Face Mesh Indices for Inner Lips (Mouth opening)
        # These points define the polygon of the visible teeth area
        self.INNER_LIPS_INDICES = [
            78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, # Upper inner
            324, 318, 402, 317, 14, 87, 178, 88, 95 # Lower inner (reversed to close loop)
        ]

    def process_image(self, image_bytes: bytes) -> dict:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise ValueError("Could not decode image")

        height, width, _ = image.shape
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        results = self.face_mesh.process(rgb_image)
        
        if not results.multi_face_landmarks:
            raise ValueError("No face detected")

        landmarks = results.multi_face_landmarks[0].landmark
        
        # Create a black mask
        mask = np.zeros((height, width), dtype=np.uint8)
        
        # Get coordinates for inner lips
        points = []
        for index in self.INNER_LIPS_INDICES:
            pt = landmarks[index]
            x = int(pt.x * width)
            y = int(pt.y * height)
            points.append([x, y])
            
        points = np.array(points, np.int32)
        points = points.reshape((-1, 1, 2))
        
        # Fill the polygon (mouth area) with white (255)
        # Fill the polygon (mouth area) with white (255)
        cv2.fillPoly(mask, [points], 255)
        
        # Smart Masking Improvements:
        # 1. Dilate the mask to include the lips/gum edges slightly for better blending
        kernel = np.ones((15, 15), np.uint8) # Increased kernel size for better coverage
        mask = cv2.dilate(mask, kernel, iterations=1)
        
        # 2. Blur the edges for soft transition
        mask = cv2.GaussianBlur(mask, (21, 21), 0)
        
        # Encode mask to base64
        _, buffer = cv2.imencode('.png', mask)
        mask_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Encode original image to base64 for convenience
        _, img_buffer = cv2.imencode('.jpg', image)
        image_base64 = base64.b64encode(img_buffer).decode('utf-8')
        
        return {
            "mask": mask_base64,
            "image": image_base64,
            "width": width,
            "height": height
        }
