import replicate
import os
from dotenv import load_dotenv
import json

load_dotenv()

try:
    model = replicate.models.get("stability-ai/stable-diffusion-inpainting")
    version = model.versions.get("95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3")
    
    print("Model Input Schema:")
    # The schema is usually in the 'openapi_schema' property of the version
    if hasattr(version, 'openapi_schema'):
        schema = version.openapi_schema
        # Print the input properties
        inputs = schema.get('components', {}).get('schemas', {}).get('Input', {}).get('properties', {})
        for key, value in inputs.items():
            print(f"- {key}: {value.get('description', 'No description')}")
    else:
        print("No openapi_schema found.")

except Exception as e:
    print(f"Error: {e}")
