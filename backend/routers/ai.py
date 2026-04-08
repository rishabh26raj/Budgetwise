from fastapi import APIRouter, Depends, HTTPException
from backend import database, auth
from backend.ml_engine import ml_engine, categorize_expense
from datetime import datetime
from typing import Optional

router = APIRouter(
    prefix="/api/ai",
    tags=["ai"]
)


def _get_expenses_for_user(db, uid: str):
    """Helper to load all expenses for a user."""
    expenses_ref = db.collection('users').document(uid).collection('expenses')
    docs = expenses_ref.stream()

    class ExpenseObj:
        def __init__(self, d):
            self.amount = d.get('amount', 0)
            self.category = d.get('category', 'Other')
            self.title = d.get('title', '')
            self.date = d.get('date', '')

    return [ExpenseObj(doc.to_dict()) for doc in docs]


def _get_budget_for_user(db, uid: str):
    """Helper to load budget document."""
    budget_ref = db.collection('users').document(uid).collection('budget').document('current')
    budget_doc = budget_ref.get()
    if budget_doc.exists:
        return budget_doc.to_dict()
    return {"amount": 0, "category_budgets": {}}


# ── Predict Next Month ───────────────────────────────────────────────────────

@router.get("/predict-next-month")
def predict_next_month(current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")

    budget_data = _get_budget_for_user(db, current_user['uid'])
    budget_amount = budget_data.get('amount', 0)

    expenses = _get_expenses_for_user(db, current_user['uid'])
    expense_history = [{"amount": e.amount, "category": e.category} for e in expenses]

    current_month = datetime.now().month
    result = ml_engine.predict_next_month(budget_amount, current_month, expense_history)
    return result


# ── Get Insights ─────────────────────────────────────────────────────────────

@router.get("/get-insights")
def get_insights(current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")

    expenses = _get_expenses_for_user(db, current_user['uid'])
    budget_data = _get_budget_for_user(db, current_user['uid'])
    budget = budget_data.get('amount', 0)

    advanced = ml_engine.get_advanced_insights(expenses, budget)
    anomalies = ml_engine.detect_anomalies(expenses)

    return {
        "insights": advanced["insights"],
        "peer_comparisons": advanced["peer_comparisons"],
        "category_stats": advanced["category_stats"],
        "savings_rate": advanced["savings_rate"],
        "anomalies": anomalies,
    }


# ── Smart Alerts ─────────────────────────────────────────────────────────────

@router.get("/alerts")
def get_alerts(current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")

    expenses = _get_expenses_for_user(db, current_user['uid'])
    budget_data = _get_budget_for_user(db, current_user['uid'])
    total_budget = budget_data.get('amount', 0)
    category_budgets = budget_data.get('category_budgets', {})

    alerts = ml_engine.get_budget_alerts(expenses, total_budget, category_budgets)
    return {"alerts": alerts}


# ── Auto-Categorize ──────────────────────────────────────────────────────────

@router.post("/categorize")
def auto_categorize(
    payload: dict,
    current_user: dict = Depends(auth.get_current_user)
):
    title = payload.get("title", "")
    amount = payload.get("amount")
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    category, confidence = categorize_expense(title, amount)
    return {
        "title": title,
        "suggested_category": category,
        "confidence": confidence
    }


# ── Legacy suggest ───────────────────────────────────────────────────────────

@router.get("/suggest")
def suggest(current_user: dict = Depends(auth.get_current_user)):
    return {
        "suggestions": [
            "Try to save at least 20% of your monthly income.",
            "Track your daily expenses to identify hidden spending patterns.",
            "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
            "Set category budgets to get real-time overspending alerts.",
            "Review your top spending category and see if you can cut 10%.",
        ]
    }
