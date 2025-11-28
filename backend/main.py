from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, expenses, ai, budget


app = FastAPI(title="Budgetwise API")

# CORS Configuration
origins = [
    "http://localhost:5173", # Vite default port
    "http://localhost:3000", # React default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(budget.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Budgetwise API"}
