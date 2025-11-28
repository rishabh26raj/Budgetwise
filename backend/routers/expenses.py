from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
from backend import schemas, database, auth
import pandas as pd
import io
from datetime import datetime

router = APIRouter(
    prefix="/api/expenses",
    tags=["expenses"]
)

@router.post("/upload")
def upload_expenses(file: UploadFile = File(...), current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")
    
    try:
        contents = file.file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        required_columns = ['date', 'category', 'amount', 'title']
        if not all(col in df.columns for col in required_columns):
             df.rename(columns={'Date': 'date', 'Category': 'category', 'Amount': 'amount', 'Description': 'title'}, inplace=True)
        
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_columns}")

        count = 0
        batch = db.batch()
        expenses_ref = db.collection('users').document(current_user['uid']).collection('expenses')

        for _, row in df.iterrows():
            try:
                doc_ref = expenses_ref.document()
                data = {
                    'title': row['title'],
                    'amount': float(row['amount']),
                    'category': row['category'],
                    'date': pd.to_datetime(row['date']).isoformat(),
                    'user_id': current_user['uid']
                }
                batch.set(doc_ref, data)
                count += 1
                if count % 400 == 0: # Firestore batch limit is 500
                    batch.commit()
                    batch = db.batch()
            except Exception:
                continue
        
        if count % 400 != 0:
            batch.commit()
            
        return {"message": f"Successfully imported {count} expenses"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("", response_model=List[schemas.Expense])
def get_expenses(current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    expenses_ref = db.collection('users').document(current_user['uid']).collection('expenses')
    docs = expenses_ref.stream()
    
    expenses = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        expenses.append(data)
        
    # Sort by date desc (in memory for now, or add index in Firestore)
    expenses.sort(key=lambda x: x.get('date') or '', reverse=True)
    return expenses

@router.post("", response_model=schemas.Expense)
def add_expense(expense: schemas.ExpenseCreate, current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    expenses_ref = db.collection('users').document(current_user['uid']).collection('expenses')
    
    data = expense.dict()
    if data.get('date'):
        data['date'] = data['date'].isoformat()
    data['user_id'] = current_user['uid']
    
    update_time, doc_ref = expenses_ref.add(data)
    
    data['id'] = doc_ref.id
    return data

@router.delete("/{expense_id}")
def delete_expense(expense_id: str, current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    doc_ref = db.collection('users').document(current_user['uid']).collection('expenses').document(expense_id)
    doc_ref.delete()
    
    return {"message": "Expense deleted"}
