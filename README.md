# Budgetwise

Budgetwise is a budget tracking application with AI capabilities.

## Prerequisites

- Python 3.8+
- PostgreSQL (Supabase recommended)
- Firebase is Used here

## Setup

1.  **Clone the repository**(if not already done).
2.  **Create a virtual environment**:
    ```bash
    python -m venv venv
    ```
3.  **Activate the virtual environment**:
    - Windows: `venv\Scripts\activate`
    - macOS/Linux: `source venv/bin/activate`
4.  **Install dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```
5.  **Environment Variables**:
    - Create a `.env` file in the root directory.
    - Add your database URL and secret key:
      ```
      DATABASE_URL=postgresql://user:password@host:port/dbname
      SECRET_KEY=your_secret_key (if using SupaBase)
      ```

## Running the Application

1.  **Start the Backend**:
    ```bash
    python run.py
    ```
    The API will be available at `http://127.0.0.1:5000`.

2.  **Frontend**:
    (Instructions for frontend would go here, assuming it's a separate React app)

## API Documentation

Once the server is running, you can access the interactive API docs at:
- Swagger UI: `http://127.0.0.1:5000/docs`
- ReDoc: `http://127.0.0.1:5000/redoc`