from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, expenses, ai, budget, reports


app = FastAPI(title="Budgetwise API", version="2.0.0")

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
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
app.include_router(reports.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Budgetwise API v2.0", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}
