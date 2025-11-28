import os
import re

file_path = 'frontend/.env.local'

if not os.path.exists(file_path):
    print("File not found")
    exit(1)

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    line = line.strip()
    if not line:
        continue
        
    # Handle cases where user pasted JS object keys (e.g., apiKey: "...")
    # But based on output, they have VITE_ keys with quotes.
    
    if '=' in line:
        key, value = line.split('=', 1)
        key = key.strip()
        value = value.strip()
        
        # Remove quotes and trailing commas
        value = value.strip('",\' ;')
        
        new_lines.append(f"{key}={value}\n")
    elif ':' in line:
        # Try to map JS object style if present
        key, value = line.split(':', 1)
        key = key.strip()
        value = value.strip().strip('",\' ;')
        
        # Simple mapping
        if key == 'apiKey': new_lines.append(f"VITE_FIREBASE_API_KEY={value}\n")
        elif key == 'authDomain': new_lines.append(f"VITE_FIREBASE_AUTH_DOMAIN={value}\n")
        elif key == 'projectId': new_lines.append(f"VITE_FIREBASE_PROJECT_ID={value}\n")
        elif key == 'storageBucket': new_lines.append(f"VITE_FIREBASE_STORAGE_BUCKET={value}\n")
        elif key == 'messagingSenderId': new_lines.append(f"VITE_FIREBASE_MESSAGING_SENDER_ID={value}\n")
        elif key == 'appId': new_lines.append(f"VITE_FIREBASE_APP_ID={value}\n")

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Cleaned .env.local")
with open(file_path, 'r') as f:
    print(f.read())
