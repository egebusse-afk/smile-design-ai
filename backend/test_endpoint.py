import requests
import base64
from PIL import Image
import io

# Create a dummy image
img = Image.new('RGB', (512, 512), color='red')
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='PNG')
img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
img_uri = f"data:image/png;base64,{img_base64}"

url = "http://localhost:8001/generate-smile"
payload = {
    "image": img_uri,
    "mask": img_uri, # Use same for mask
    "prompt": "perfect white teeth"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
