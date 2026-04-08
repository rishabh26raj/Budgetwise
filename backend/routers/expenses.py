from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
from backend import schemas, database, auth
from backend.ml_engine import categorize_expense
import pandas as pd
import io
from datetime import datetime, date
from collections import defaultdict

router = APIRouter(
    prefix="/api/expenses",
    tags=["expenses"]
)


# ── Upload CSV ───────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_expenses(
    file: UploadFile = File(...),
    current_user: dict = Depends(auth.get_current_user)
):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV file.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        # Flexible column mapping
        col_map = {}
        for col in df.columns:
            cl = col.lower().strip()
            if cl in ["date"]:
                col_map[col] = "date"
            elif cl in ["category", "type"]:
                col_map[col] = "category"
            elif cl in ["amount", "debit", "credit", "value"]:
                col_map[col] = "amount"
            elif cl in ["title", "description", "narration", "details", "particulars"]:
                col_map[col] = "title"
        df.rename(columns=col_map, inplace=True)

        # Minimum required columns
        required = ['date', 'amount', 'title']
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {required}. Found: {list(df.columns)}"
            )

        count = 0
        batch = db.batch()
        expenses_ref = db.collection('users').document(current_user['uid']).collection('expenses')

        for _, row in df.iterrows():
            try:
                title = str(row['title'])
                amount = abs(float(row['amount']))
                if amount <= 0:
                    continue

                # Auto-categorize if no category column or value is empty
                if 'category' in df.columns and pd.notna(row.get('category')) and str(row['category']).strip():
                    category = str(row['category']).strip()
                else:
                    category, _ = categorize_expense(title, amount)

                doc_ref = expenses_ref.document()
                data = {
                    'title': title,
                    'amount': amount,
                    'category': category,
                    'date': pd.to_datetime(row['date']).isoformat(),
                    'user_id': current_user['uid']
                }
                batch.set(doc_ref, data)
                count += 1

                if count % 400 == 0:
                    batch.commit()
                    batch = db.batch()
            except Exception:
                continue

        if count % 400 != 0:
            batch.commit()

        return {"message": f"Successfully imported {count} expenses"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


# ── Get Expenses ─────────────────────────────────────────────────────────────

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
        if not data.get('user_id'):
            data['user_id'] = current_user['uid']
        expenses.append(data)

    expenses.sort(key=lambda x: x.get('date') or '', reverse=True)
    return expenses


# ── Summary (monthly trend + category breakdown) ─────────────────────────────

@router.get("/summary")
def get_summary(current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")

    expenses_ref = db.collection('users').document(current_user['uid']).collection('expenses')
    docs = expenses_ref.stream()

    all_expenses = [doc.to_dict() for doc in docs]

    # Budget
    budget_doc = db.collection('users').document(current_user['uid']).collection('budget').document('current').get()
    budget = budget_doc.to_dict().get('amount', 0) if budget_doc.exists else 0

    # ── Current month only for budget tracking ───────────────────────────────
    now = datetime.utcnow()
    current_month_key = now.strftime("%Y-%m")

    current_month_expenses = []
    for e in all_expenses:
        try:
            dt = datetime.fromisoformat(e['date']) if e.get('date') else None
            if dt and dt.strftime("%Y-%m") == current_month_key:
                current_month_expenses.append(e)
        except Exception:
            continue

    # Totals — scoped to CURRENT MONTH
    total_spent = round(sum(e.get('amount', 0) for e in current_month_expenses), 2)
    remaining = round(budget - total_spent, 2)
    savings_rate = round(((budget - total_spent) / budget) * 100, 1) if budget > 0 else 0

    # ── Monthly trend (last 6 months, all time for chart) ────────────────────
    monthly = defaultdict(lambda: defaultdict(float))
    for e in all_expenses:
        try:
            dt = datetime.fromisoformat(e['date']) if e.get('date') else None
            if dt:
                key = dt.strftime("%Y-%m")
                monthly[key][e.get('category', 'Other')] += e.get('amount', 0)
        except Exception:
            continue

    sorted_months = sorted(monthly.keys())[-6:]
    month_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    monthly_trend = []
    for m in sorted_months:
        try:
            dt = datetime.strptime(m, "%Y-%m")
            label = f"{month_labels[dt.month - 1]} '{str(dt.year)[2:]}"
        except Exception:
            label = m
        cat_breakdown = dict(monthly[m])
        monthly_trend.append({
            "month": label,
            "total": round(sum(cat_breakdown.values()), 2),
            "category_breakdown": cat_breakdown
        })

    # Current month vs last month
    this_month_total = 0
    last_month_total = 0
    if len(monthly_trend) >= 2:
        this_month_total = monthly_trend[-1]["total"]
        last_month_total = monthly_trend[-2]["total"]
    elif len(monthly_trend) == 1:
        this_month_total = monthly_trend[-1]["total"]

    mom_change = 0.0
    if last_month_total > 0:
        mom_change = round(((this_month_total - last_month_total) / last_month_total) * 100, 1)

    # ── Category breakdown — current month only ───────────────────────────────
    cat_totals = defaultdict(float)
    cat_counts = defaultdict(int)
    for e in current_month_expenses:
        cat = e.get('category', 'Other')
        cat_totals[cat] += e.get('amount', 0)
        cat_counts[cat] += 1

    category_breakdown = []
    for cat, total in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True):
        pct = round((total / total_spent) * 100, 1) if total_spent > 0 else 0
        category_breakdown.append({
            "category": cat,
            "total": round(total, 2),
            "percent_of_total": pct,
            "count": cat_counts[cat]
        })

    return {
        "spent": total_spent,          # current month spent
        "total_spent": total_spent,     # alias for compatibility
        "budget": budget,
        "remaining": remaining,
        "savings_rate": savings_rate,
        "monthly_trend": monthly_trend,
        "category_breakdown": category_breakdown,
        "this_month_vs_last": mom_change,
        "current_month": now.strftime("%B %Y"),
    }



# ── Add Expense ───────────────────────────────────────────────────────────────

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

    # Auto-categorize if category is blank / "Other"
    if not data.get('category') or data['category'].strip() in ('', 'Other'):
        cat, _ = categorize_expense(data['title'], data['amount'])
        data['category'] = cat

    update_time, doc_ref = expenses_ref.add(data)
    data['id'] = doc_ref.id
    return data


# ── Delete Expense ────────────────────────────────────────────────────────────

@router.delete("/{expense_id}")
def delete_expense(expense_id: str, current_user: dict = Depends(auth.get_current_user)):
    db = database.get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")

    doc_ref = (
        db.collection('users')
        .document(current_user['uid'])
        .collection('expenses')
        .document(expense_id)
    )
    doc_ref.delete()
    return {"message": "Expense deleted"}
