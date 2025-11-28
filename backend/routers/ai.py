from fastapi import APIRouter, Depends, HTTPException
from backend import database, auth
from backend.ml_engine import ml_engine
from datetime import datetime

router = APIRouter(
    prefix="/api/ai",
    tags=["ai"]
)

@router.get("/predict-next-month")
def predict_next_month(current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    # Get user's budget
    budget_ref = db.collection('users').document(current_user['uid']).collection('budget').document('current')
    budget_doc = budget_ref.get()
    
    budget_amount = 0
    if budget_doc.exists:
        budget_amount = budget_doc.to_dict().get('amount', 0)
    
    current_month = datetime.now().month
    prediction = ml_engine.predict_next_month(budget_amount, current_month)
    
    return {
        "prediction": round(prediction, 2),
        "message": f"Based on your budget of ₹{budget_amount}, we predict your next month's expense."
    }

@router.get("/get-insights")
def get_insights(current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    expenses_ref = db.collection('users').document(current_user['uid']).collection('expenses')
    docs = expenses_ref.stream()
    
    expenses_data = []
    for doc in docs:
        data = doc.to_dict()
        # Create a simple object or dict that ml_engine expects
        # ml_engine expects objects with 'amount' and 'category' attributes
        class ExpenseObj:
            def __init__(self, d):
                self.amount = d.get('amount', 0)
                self.category = d.get('category', '')
                self.title = d.get('title', '')
        
        expenses_data.append(ExpenseObj(data))
        
    insights = ml_engine.get_insights(expenses_data)
    anomalies = ml_engine.detect_anomalies(expenses_data)
    return {"insights": insights, "anomalies": anomalies}

@router.get("/suggest")
def suggest(current_user: dict = Depends(auth.get_current_user)):
    # Placeholder for more advanced suggestions
    return {"suggestions": ["Try to save 10% of your income.", "Track your daily expenses."]}
