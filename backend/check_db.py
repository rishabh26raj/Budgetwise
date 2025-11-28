import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables from .env file
# Try loading from different possible locations
load_dotenv()
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")

print(f"DATABASE_URL found: {'Yes' if DATABASE_URL else 'No'}")

if DATABASE_URL:
    # Fix for postgres:// deprecated in SQLAlchemy 1.4+
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        print("Fixed DATABASE_URL scheme to postgresql://")

    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("Connection successful!")
    except Exception as e:
        print(f"Connection failed: {e}")
else:
    print("Please set DATABASE_URL in .env file")
