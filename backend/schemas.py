from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ExpenseBase(BaseModel):
    title: str
    amount: float
    category: str
    date: Optional[datetime] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: str
    user_id: str

class BudgetBase(BaseModel):
    amount: float
    month: str

class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: str
    user_id: str

class UserBase(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None

class User(UserBase):
    uid: str
    expenses: List[Expense] = []
    budget: Optional[Budget] = None
