from fastapi import APIRouter, Depends, HTTPException
from backend import schemas, database, auth

router = APIRouter(
    prefix="/api/budget",
    tags=["budget"]
)

@router.get("", response_model=schemas.Budget)
def get_budget(current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    doc_ref = db.collection('users').document(current_user['uid']).collection('budget').document('current')
    doc = doc_ref.get()
    
    if not doc.exists:
        return {"amount": 0, "month": "", "id": "current", "user_id": current_user['uid']}
    
    data = doc.to_dict()
    data['id'] = doc.id
    data['user_id'] = current_user['uid']
    return data

@router.post("", response_model=schemas.Budget)
def set_budget(budget: schemas.BudgetCreate, current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    doc_ref = db.collection('users').document(current_user['uid']).collection('budget').document('current')
    
    data = budget.dict()
    data['user_id'] = current_user['uid']
    
    doc_ref.set(data)
    
    data['id'] = 'current'
    return data
