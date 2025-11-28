import firebase_admin
from firebase_admin import credentials, firestore
import os

# Path to service account key
# User must place serviceAccountKey.json in the backend directory
cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase initialized successfully.")
else:
    print("WARNING: serviceAccountKey.json not found. Firebase not initialized.")
    db = None

def get_db():
    return db
