import requests
import json

# Test the parse-document API
url = "http://localhost:8000/api/parse-document"

# Use the screenshot file
file_path = "/Users/kartik/visa eli/documents/Screenshot 2026-01-30 at 12.54.44 PM.png"

try:
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
        
    print("Status Code:", response.status_code)
    print("\nResponse:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")

