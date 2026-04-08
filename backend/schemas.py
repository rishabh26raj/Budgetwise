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

    class Config:
        from_attributes = True


class BudgetBase(BaseModel):
    amount: float
    month: str
    category_budgets: Optional[Dict[str, float]] = {}


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


class Alert(BaseModel):
    category: str
    level: str          # "warning" | "danger"
    percent: float
    message: str


class CategorySummary(BaseModel):
    category: str
    total: float
    percent_of_total: float
    count: int


class MonthSummary(BaseModel):
    month: str
    total: float
    category_breakdown: Dict[str, float]


class ExpenseSummary(BaseModel):
    total_spent: float
    budget: float
    remaining: float
    savings_rate: float
    monthly_trend: List[MonthSummary]
    category_breakdown: List[CategorySummary]
    this_month_vs_last: float        # percent change


class PredictionResult(BaseModel):
    prediction: float
    lower_bound: float
    upper_bound: float
    trend: str          # "increasing" | "decreasing" | "stable"
    monthly_forecasts: List[Dict[str, Any]]
    message: str


class CategorizeSuggestion(BaseModel):
    title: str
    amount: Optional[float] = None
    suggested_category: str
    confidence: float
