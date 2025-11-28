# Budgetwise

Budgetwise is a modern, AI-powered budget tracking and expense management application designed to help you take control of your finances. It combines a sleek React frontend with a robust FastAPI backend and Firebase for secure data handling.

## Features

*   **Dashboard**: Get a quick overview of your financial health with real-time summaries of your budget, expenses, and remaining balance.
*   **Expense Tracking**: Easily add, edit, and delete expenses. Support for bulk upload via CSV files.
*   **Smart Budgeting**: Set and manage your monthly budgets to stay on track.
*   **AI Insights**:
    *   **Predictions**: Predict your next month's expenses based on historical data using Machine Learning (Random Forest).
    *   **Anomalies**: Automatically detect unusual spending patterns.
    *   **Smart Suggestions**: Get personalized tips to improve your financial habits.
*   **Visual Reports**: Visualize your spending habits with interactive charts and graphs.
*   **AI Chatbot**: Ask questions about your finances and get instant answers.
*   **Secure Authentication**: User signup and login powered by Firebase Authentication.
*   **Responsive Design**: A beautiful, dark-mode enabled UI built with Tailwind CSS and Framer Motion.

## Tech Stack

### Frontend
*   **React 19**: The latest version of the popular UI library.
*   **Vite**: Fast build tool and development server.
*   **Tailwind CSS**: Utility-first CSS framework for styling.
*   **Framer Motion**: For smooth animations and transitions.
*   **Chart.js & React-Chartjs-2**: For data visualization.
*   **Firebase SDK**: For authentication and backend interaction.
*   **Lucide React**: For beautiful icons.

### Backend
*   **FastAPI**: High-performance web framework for building APIs with Python.
*   **Firebase Admin SDK**: For interacting with Firestore database and Authentication.
*   **Scikit-learn**: For machine learning models (expense prediction and anomaly detection).
*   **Pandas & NumPy**: For data processing and analysis.
*   **Uvicorn**: ASGI server for running the application.

## Prerequisites

*   **Node.js** (v18 or higher)
*   **Python** (v3.8 or higher)
*   **Firebase Account**: You need a Firebase project with Firestore and Authentication enabled.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/rishabh26raj/Budgetwise.git
cd Budgetwise
```

### 2. Backend Setup

1.  Navigate to the root directory (where `run.py` is located).
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    *   **Windows**: `venv\Scripts\activate`
    *   **macOS/Linux**: `source venv/bin/activate`
4.  Install dependencies:
    ```bash
    pip install -r backend/requirements.txt
    ```
5.  **Firebase Configuration**:
    *   Place your Firebase Admin SDK service account JSON file in the `backend/` directory and rename it to `serviceAccountKey.json`.
    *   **Note**: This file is sensitive and is ignored by git. Do not commit it.

6.  Run the backend server:
    ```bash
    python run.py
    ```
    The API will be available at `http://127.0.0.1:5000`.

### 3. Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    *   Create a `.env` file in the `frontend` directory.
    *   Add your Firebase configuration keys (from your Firebase project settings):
        ```env
        VITE_FIREBASE_API_KEY=your_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
        VITE_FIREBASE_PROJECT_ID=your_project_id
        VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
        VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
        VITE_FIREBASE_APP_ID=your_app_id
        ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:5173`.

## API Documentation

Once the backend is running, you can explore the API endpoints using the interactive documentation:
*   **Swagger UI**: `http://127.0.0.1:5000/docs`
*   **ReDoc**: `http://127.0.0.1:5000/redoc`

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.