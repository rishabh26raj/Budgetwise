import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import joblib
import os
import re
from datetime import datetime

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "DatasetFinalCSV.csv")

# ────────────────────────────────────────────────
#  KEYWORD-BASED NLP CATEGORIZER
# ────────────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "Food": [
        "food", "groceries", "grocery", "restaurant", "meal", "breakfast",
        "lunch", "dinner", "snack", "coffee", "tea", "bakery", "pizza",
        "burger", "swiggy", "zomato", "hotel", "dining", "eat", "rice",
        "vegetables", "fruits", "milk", "bread", "eggs"
    ],
    "Rent": [
        "rent", "house", "apartment", "flat", "pg", "hostel", "accommodation",
        "lease", "housing", "room", "maintenance", "society"
    ],
    "Transport": [
        "transport", "travel", "uber", "ola", "cab", "taxi", "bus", "train",
        "metro", "auto", "petrol", "diesel", "fuel", "parking", "toll",
        "flight", "ticket", "commute", "bike", "vehicle"
    ],
    "Shopping": [
        "shopping", "clothes", "dress", "shoes", "bag", "shirt", "pant",
        "jacket", "watch", "accessories", "fashion", "amazon", "flipkart",
        "myntra", "mall", "boutique", "grocery", "market"
    ],
    "Entertainment": [
        "entertainment", "movie", "cinema", "netflix", "spotify", "game",
        "gaming", "concert", "event", "party", "club", "pub", "bar",
        "theatre", "show", "subscription", "ott", "prime", "hotstar"
    ],
    "Health": [
        "health", "medicine", "doctor", "hospital", "pharmacy", "clinic",
        "medical", "dentist", "gym", "fitness", "yoga", "wellness",
        "insurance", "therapy", "healthcare", "lab", "test"
    ],
    "Utilities": [
        "electricity", "water", "gas", "internet", "wifi", "mobile",
        "phone", "bill", "recharge", "broadband", "utility", "connection",
        "subscription", "plan", "dth", "cable"
    ],
    "Education": [
        "education", "school", "college", "tuition", "book", "books",
        "course", "fee", "exam", "study", "library", "stationery",
        "notebook", "pen", "laptop", "computer"
    ],
    "Investment": [
        "investment", "mutual fund", "stocks", "shares", "sip", "fd",
        "savings", "deposit", "insurance premium", "policy", "gold",
        "trading", "crypto"
    ],
    "Other": []
}

def categorize_expense(title: str, amount: float = None) -> tuple[str, float]:
    """
    Keyword-based NLP categorizer.
    Returns (category, confidence_score 0-1).
    """
    title_lower = title.lower()
    words = re.findall(r"\w+", title_lower)

    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        if category == "Other":
            continue
        score = 0
        for kw in keywords:
            if kw in title_lower:
                # Exact word match scores higher
                if kw in words:
                    score += 2
                else:
                    score += 1
        scores[category] = score

    max_score = max(scores.values()) if scores else 0
    if max_score == 0:
        return "Other", 0.3

    best_cat = max(scores, key=scores.get)
    # Confidence heuristic: normalize to 0.5-1.0 range
    confidence = min(0.5 + (max_score * 0.1), 1.0)
    return best_cat, round(confidence, 2)


# ────────────────────────────────────────────────
#  AVERAGE SPENDING PER CATEGORY (from training data)
#  Used for peer comparison insights
# ────────────────────────────────────────────────
CATEGORY_AVERAGES = {
    "Food": 6800,       # ~InitialExpense average from dataset
    "Rent": 2500,
    "Transport": 1300,
    "Shopping": 8000,
    "Entertainment": 6000,
    "Health": 4000,
    "Utilities": 7000,
    "Education": 3000,
    "Other": 5000,
}


# ────────────────────────────────────────────────
#  ML ENGINE
# ────────────────────────────────────────────────
class MLEngine:
    def __init__(self):
        self.model = None              # RandomForest (primary)
        self.trend_model = None        # LinearRegression (trend line)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.monthly_means = {}        # month -> avg total expense (from training data)
        self.load_model()

    # ── Data ────────────────────────────────────
    def load_data(self):
        if not os.path.exists(DATA_PATH):
            print("Dataset not found!")
            return None
        df = pd.read_csv(DATA_PATH)
        return df

    def preprocess(self, df: pd.DataFrame) -> pd.DataFrame:
        month_map = {
            "January": 1, "February": 2, "March": 3, "April": 4,
            "May": 5, "June": 6, "July": 7, "August": 8,
            "September": 9, "October": 10, "November": 11, "December": 12
        }
        df["Month_Num"] = df["Month"].map(month_map)
        df["Total_Expense"] = df["InitialExpense"] + df["AmountOfProduct"]
        df["Budget_Util"] = df["Total_Expense"] / df["Monthly_Budget"].clip(lower=1)
        df["Savings_Rate"] = (df["Monthly_Budget"] - df["Total_Expense"]) / df["Monthly_Budget"].clip(lower=1)
        df["Sin_Month"] = np.sin(2 * np.pi * df["Month_Num"] / 12)
        df["Cos_Month"] = np.cos(2 * np.pi * df["Month_Num"] / 12)

        # Compute per-user rolling 3-month mean
        df = df.sort_values(["User", "Month_Num"])
        df["Rolling_3m"] = (
            df.groupby("User")["Total_Expense"]
            .transform(lambda x: x.rolling(3, min_periods=1).mean())
        )

        # Store monthly averages for peer comparison
        self.monthly_means = df.groupby("Month_Num")["Total_Expense"].mean().to_dict()
        return df

    # ── Training ────────────────────────────────
    def train(self):
        df = self.load_data()
        if df is None:
            return

        df = self.preprocess(df)

        features = [
            "Month_Num", "Monthly_Budget",
            "Sin_Month", "Cos_Month",
            "Rolling_3m", "Budget_Util"
        ]
        X = df[features].fillna(0)
        y = df["Total_Expense"]

        # Primary model — GradientBoosting for better accuracy
        self.model = GradientBoostingRegressor(
            n_estimators=200, max_depth=4, learning_rate=0.08,
            subsample=0.85, random_state=42
        )
        self.model.fit(X, y)

        # Trend model — LinearRegression for forecasting direction
        self.trend_model = LinearRegression()
        monthly_avg = df.groupby("Month_Num")["Total_Expense"].mean().reset_index()
        self.trend_model.fit(monthly_avg[["Month_Num"]], monthly_avg["Total_Expense"])

        self.is_trained = True
        self.save_model()
        print("✅ Model trained and saved (GradientBoosting + LinearRegression trend).")

    def save_model(self):
        payload = {
            "model": self.model,
            "trend_model": self.trend_model,
            "monthly_means": self.monthly_means,
        }
        joblib.dump(payload, MODEL_PATH)

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                payload = joblib.load(MODEL_PATH)
                if isinstance(payload, dict):
                    self.model = payload.get("model")
                    self.trend_model = payload.get("trend_model")
                    self.monthly_means = payload.get("monthly_means", {})
                else:
                    # Legacy plain model
                    self.model = payload
                    self.trend_model = None
                self.is_trained = True
                print("✅ ML model loaded.")
            except Exception as e:
                print(f"Model load failed ({e}), retraining...")
                self.train()
        else:
            print("Model not found, training new one...")
            self.train()

    # ── Prediction ──────────────────────────────
    def predict_next_month(self, budget: float, current_month: int, expense_history: list = None):
        """
        Returns extended prediction result with trend and 3-month forecast.
        """
        if not self.is_trained:
            return {"prediction": 0, "lower_bound": 0, "upper_bound": 0,
                    "trend": "stable", "monthly_forecasts": [], "message": "Model not ready."}

        forecasts = []
        predictions_raw = []

        # Rolling mean seed from history
        if expense_history and len(expense_history) >= 1:
            rolling_seed = np.mean([e["amount"] for e in expense_history[-3:]])
        else:
            rolling_seed = budget * 0.75

        for i in range(1, 4):
            next_month = ((current_month - 1 + i) % 12) + 1
            sin_m = np.sin(2 * np.pi * next_month / 12)
            cos_m = np.cos(2 * np.pi * next_month / 12)
            budget_util = rolling_seed / max(budget, 1)
            X = [[next_month, budget, sin_m, cos_m, rolling_seed, budget_util]]
            pred = self.model.predict(X)[0]
            pred = max(pred, 0)
            predictions_raw.append(pred)

            month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            forecasts.append({
                "month": month_names[next_month - 1],
                "predicted": round(pred, 2),
            })
            rolling_seed = pred  # feed forward

        primary_pred = predictions_raw[0]

        # Trend direction using linear model
        trend = "stable"
        if self.trend_model:
            slope = self.trend_model.coef_[0]
            if slope > 200:
                trend = "increasing"
            elif slope < -200:
                trend = "decreasing"

        # Confidence interval ±12%
        lower = primary_pred * 0.88
        upper = primary_pred * 1.12

        month_names_full = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"]
        next_m_name = month_names_full[((current_month - 1 + 1) % 12)]

        return {
            "prediction": round(primary_pred, 2),
            "lower_bound": round(lower, 2),
            "upper_bound": round(upper, 2),
            "trend": trend,
            "monthly_forecasts": forecasts,
            "message": f"Predicted expense for {next_m_name}: ₹{primary_pred:,.0f} (budget ₹{budget:,.0f})"
        }

    # ── Insights ────────────────────────────────
    def get_insights(self, expenses):
        """Legacy compatibility — simple rule-based insights."""
        insights = []
        if not expenses:
            return ["Add more expenses to get AI insights."]
        total_spent = sum(e.amount for e in expenses)
        categories = {}
        for e in expenses:
            categories[e.category] = categories.get(e.category, 0) + e.amount
        for cat, amount in categories.items():
            if amount > total_spent * 0.3:
                insights.append(
                    f"You are spending a lot on {cat} ({int((amount / total_spent) * 100)}% of total)."
                )
        return insights

    def get_advanced_insights(self, expenses, budget: float = 0):
        """
        Returns rich insights including:
        - Category breakdown
        - Peer comparison (vs dataset averages)
        - Savings analysis
        - Smart tips
        """
        insights = []
        peer_comparisons = []
        category_stats = []

        if not expenses:
            return {
                "insights": ["Add more expenses to get AI insights."],
                "peer_comparisons": [],
                "category_stats": [],
                "savings_rate": 0,
            }

        total_spent = sum(e.amount for e in expenses)
        categories = {}
        for e in expenses:
            cat = e.category or "Other"
            categories[cat] = categories.get(cat, 0) + e.amount

        # Category stats
        for cat, amount in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            pct = round((amount / total_spent) * 100, 1) if total_spent > 0 else 0
            count = sum(1 for e in expenses if e.category == cat)
            category_stats.append({
                "category": cat,
                "total": round(amount, 2),
                "percent_of_total": pct,
                "count": count
            })

        # Insights
        top_cat = max(categories, key=categories.get) if categories else None
        if top_cat:
            insights.append(
                f"Your top spending category is **{top_cat}** at ₹{categories[top_cat]:,.0f} "
                f"({int((categories[top_cat]/total_spent)*100)}% of total)."
            )

        if budget > 0:
            savings_rate = round(((budget - total_spent) / budget) * 100, 1)
            if savings_rate > 20:
                insights.append(f"Great job! You're saving {savings_rate}% of your budget this month. 🎉")
            elif savings_rate > 0:
                insights.append(f"You are saving {savings_rate}% of your budget. Try to reach 20%.")
            else:
                insights.append(f"⚠️ You have exceeded your budget by ₹{abs(budget - total_spent):,.0f}.")
        else:
            savings_rate = 0

        if len(expenses) > 10:
            insights.append(
                f"You've logged {len(expenses)} transactions. Consistent tracking improves accuracy."
            )

        # Peer comparisons
        for cat, amount in categories.items():
            avg = CATEGORY_AVERAGES.get(cat, CATEGORY_AVERAGES["Other"])
            diff_pct = round(((amount - avg) / avg) * 100, 1)
            if diff_pct > 15:
                peer_comparisons.append({
                    "category": cat,
                    "your_spending": round(amount, 2),
                    "avg_spending": avg,
                    "difference_pct": diff_pct,
                    "message": f"You spend {diff_pct}% more on {cat} than the average user."
                })
            elif diff_pct < -15:
                peer_comparisons.append({
                    "category": cat,
                    "your_spending": round(amount, 2),
                    "avg_spending": avg,
                    "difference_pct": diff_pct,
                    "message": f"You spend {abs(diff_pct)}% less on {cat} than the average user. 👍"
                })

        return {
            "insights": insights,
            "peer_comparisons": peer_comparisons,
            "category_stats": category_stats,
            "savings_rate": savings_rate,
        }

    # ── Alerts ──────────────────────────────────
    def get_budget_alerts(self, expenses, total_budget: float, category_budgets: dict = None):
        """
        Returns list of alerts for overspending.
        category_budgets: { "Food": 3000, "Transport": 1500, ... }
        """
        alerts = []
        if not expenses:
            return alerts

        # Overall budget alert
        total_spent = sum(e.amount for e in expenses)
        if total_budget > 0:
            overall_pct = (total_spent / total_budget) * 100
            if overall_pct >= 100:
                alerts.append({
                    "category": "Overall",
                    "level": "danger",
                    "percent": round(overall_pct, 1),
                    "message": f"🚨 You have exceeded your total budget! Spent ₹{total_spent:,.0f} of ₹{total_budget:,.0f}."
                })
            elif overall_pct >= 80:
                alerts.append({
                    "category": "Overall",
                    "level": "warning",
                    "percent": round(overall_pct, 1),
                    "message": f"⚠️ You've used {overall_pct:.0f}% of your monthly budget."
                })

        # Per-category alerts
        if category_budgets:
            cat_totals = {}
            for e in expenses:
                cat = e.category or "Other"
                cat_totals[cat] = cat_totals.get(cat, 0) + e.amount

            for cat, cat_budget in category_budgets.items():
                if cat_budget <= 0:
                    continue
                spent = cat_totals.get(cat, 0)
                pct = (spent / cat_budget) * 100
                if pct >= 100:
                    alerts.append({
                        "category": cat,
                        "level": "danger",
                        "percent": round(pct, 1),
                        "message": f"🚨 {cat} budget exceeded! Spent ₹{spent:,.0f} of ₹{cat_budget:,.0f}."
                    })
                elif pct >= 80:
                    alerts.append({
                        "category": cat,
                        "level": "warning",
                        "percent": round(pct, 1),
                        "message": f"⚠️ You've spent {pct:.0f}% of your {cat} budget (₹{spent:,.0f} / ₹{cat_budget:,.0f})."
                    })

        return alerts

    # ── Anomaly Detection ───────────────────────
    def detect_anomalies(self, expenses):
        if len(expenses) < 5:
            return []
        from sklearn.ensemble import IsolationForest
        data = np.array([e.amount for e in expenses]).reshape(-1, 1)
        clf = IsolationForest(contamination=0.1, random_state=42)
        preds = clf.fit_predict(data)
        anomalies = []
        for i, pred in enumerate(preds):
            if pred == -1:
                anomalies.append(
                    f"Unusual expense detected: {expenses[i].title} — ₹{expenses[i].amount:,.0f}"
                )
        return anomalies


ml_engine = MLEngine()
